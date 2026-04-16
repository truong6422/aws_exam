"""
Parallel headless scraper — runs N workers simultaneously, each handling a page range.
Each worker has its own browser context + session cookies.

Usage:
    python scripts/parallel-scraper.py                    # 4 workers, pages 1-80 (400 questions)
    python scripts/parallel-scraper.py --start 1 --end 204 --workers 4   # full scrape
    python scripts/parallel-scraper.py --fix-missing      # re-scrape pages missing answers
"""

import asyncio
from playwright.async_api import async_playwright
import json, os, sys, random, argparse, time
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CREDENTIALS_FILE = PROJECT_ROOT / '.credentials'
OUTPUT_FILE = PROJECT_ROOT / 'scraped-questions.json'
SESSION_FILE = PROJECT_ROOT / '.browser-session.json'

EXAM_URL = 'https://www.examprepper.co/exam/32/'
EXAM_TITLE = 'AWS Certified Solutions Architect - Associate SAA-C03'
TOTAL_PAGES = 204
QUESTIONS_PER_PAGE = 5

# Delays (seconds) — longer to avoid rate limiting
PAGE_DELAY_MIN = 8
PAGE_DELAY_MAX = 15

EMAIL = PASSWORD = ''
with open(CREDENTIALS_FILE) as f:
    for line in f:
        if line.startswith('EXAMPREPPER_EMAIL='):
            EMAIL = line.split('=', 1)[1].strip()
        elif line.startswith('EXAMPREPPER_PASSWORD='):
            PASSWORD = line.split('=', 1)[1].strip()

# Lock for writing to shared output file
_write_lock = asyncio.Lock()

# ── JS Extraction ─────────────────────────────────────────────────────────────

EXTRACT_JS = r"""() => {
    const items = document.querySelectorAll('.chakra-accordion__item');
    const result = [];
    items.forEach((item) => {
        const btnEl = item.querySelector('.chakra-accordion__button');
        const txt = btnEl ? btnEl.innerText : '';
        const qm = txt.match(/Question\s+(\d+)/);
        const qNum = qm ? parseInt(qm[1]) : null;
        const panel = item.querySelector('.chakra-accordion__panel');
        if (!panel) return;
        const qParas = panel.querySelectorAll('.css-naa3lg p');
        const questionText = Array.from(qParas).map(p => p.innerText.trim()).join('\n\n');
        const optContainer = panel.querySelector('.css-j7qwjs');
        const optRows = optContainer
            ? Array.from(optContainer.querySelectorAll(':scope > .chakra-stack'))
            : [];
        const options = [];
        const correctAnswers = [];
        optRows.forEach(row => {
            const labelEl = row.querySelector('.css-1fdcwt3 p');
            const textEl = row.querySelector('.chakra-stack.css-cba290');
            if (!labelEl) return;
            const label = labelEl.innerText.replace('.', '').trim();
            if (!label.match(/^[A-E]$/)) return;
            const text = textEl ? textEl.innerText.trim() : '';
            options.push({ label, text });
            const borderColor = getComputedStyle(row).borderColor;
            const bgColor = getComputedStyle(row).backgroundColor;
            const isGreen = (c) => c && (
                c.includes('104, 211') || c.includes('72, 187') ||
                c.includes('56, 161') || c.includes('green')
            );
            if (isGreen(borderColor) || isGreen(bgColor)) correctAnswers.push(label);
        });
        result.push({
            id: qNum,
            question: questionText,
            options,
            correct_answer: correctAnswers.length > 0 ? correctAnswers.join(',') : null
        });
    });
    return result;
}"""

# ── File I/O ──────────────────────────────────────────────────────────────────

def load_existing():
    if not OUTPUT_FILE.exists():
        return {}, {}
    with open(OUTPUT_FILE) as f:
        data = json.load(f)
    qs = data.get('questions', [])
    by_id = {q['id']: q for q in qs if q.get('id')}
    return data, by_id


async def merge_and_save(new_questions: list):
    """Thread-safe merge of new questions into output file."""
    async with _write_lock:
        data, by_id = load_existing()
        added = 0
        for q in new_questions:
            qid = q.get('id')
            if qid and (qid not in by_id or not by_id[qid].get('correct_answer')):
                by_id[qid] = q
                added += 1
        all_qs = sorted(by_id.values(), key=lambda q: q.get('id') or 0)
        last_page = max((q.get('id', 0) for q in all_qs), default=0)
        last_page = ((last_page - 1) // QUESTIONS_PER_PAGE) + 1 if last_page else 0
        payload = {
            'source': EXAM_URL,
            'title': EXAM_TITLE,
            'total': len(all_qs),
            'last_page': last_page,
            'questions': all_qs,
        }
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        return added, len(all_qs)

# ── Auth ──────────────────────────────────────────────────────────────────────

async def handle_google(p, worker_id):
    try:
        await p.wait_for_url('**/accounts.google.com/**', timeout=15000)
    except Exception:
        pass
    await p.wait_for_load_state('domcontentloaded')
    await asyncio.sleep(2)
    inp = await p.query_selector('input[type="email"]')
    if inp:
        await inp.fill(EMAIL)
        await asyncio.sleep(0.5)
        btn = (await p.query_selector('#identifierNext button')
               or await p.query_selector('button:has-text("Next")'))
        if btn:
            await btn.click()
        else:
            await p.keyboard.press('Enter')
        await asyncio.sleep(3)
    pwd = await p.query_selector('input[type="password"]')
    if pwd:
        await pwd.fill(PASSWORD)
        await asyncio.sleep(0.5)
        btn = (await p.query_selector('#passwordNext button')
               or await p.query_selector('button:has-text("Next")'))
        if btn:
            await btn.click()
        else:
            await p.keyboard.press('Enter')
        await asyncio.sleep(5)
    print(f'  [W{worker_id}] Google auth submitted')


async def do_login(ctx, page, worker_id):
    print(f'  [W{worker_id}] Logging in...')
    await page.goto('https://www.examprepper.co/login', wait_until='networkidle')
    await asyncio.sleep(3)

    if 'examprepper.co/exam' in page.url:
        print(f'  [W{worker_id}] Already logged in')
        return

    # Wait out Vercel checkpoint if needed
    btn_count = len(await page.query_selector_all('button'))
    if btn_count == 0:
        print(f'  [W{worker_id}] Vercel checkpoint, waiting 20s...')
        await asyncio.sleep(20)
        await page.reload(wait_until='networkidle')
        await asyncio.sleep(3)

    async def find_google_btn():
        for b in await page.query_selector_all('button'):
            try:
                if 'google' in (await b.inner_text()).strip().lower():
                    return b
            except Exception:
                pass
        return None

    btn = await find_google_btn()
    if not btn:
        for b in await page.query_selector_all('button'):
            try:
                text = (await b.inner_text()).strip().lower()
                if text in ('sign in', 'login', 'log in'):
                    await b.click()
                    await asyncio.sleep(2)
                    break
            except Exception:
                pass
        btn = await find_google_btn()

    if not btn:
        raise Exception(f'[W{worker_id}] Google button not found')

    try:
        async with ctx.expect_page(timeout=8000) as pi:
            await btn.click()
        popup = await pi.value
        await handle_google(popup, worker_id)
        try:
            await popup.wait_for_event('close', timeout=30000)
        except Exception:
            pass
    except Exception:
        await asyncio.sleep(2)
        if 'accounts.google.com' in page.url:
            await handle_google(page, worker_id)
        else:
            try:
                await page.wait_for_url('**/accounts.google.com/**', timeout=15000)
                await handle_google(page, worker_id)
            except Exception:
                pass

    try:
        await page.wait_for_url('**/examprepper.co/**', timeout=30000)
    except Exception:
        pass
    await asyncio.sleep(2)
    print(f'  [W{worker_id}] Logged in: {page.url}')

# ── Page Scraping ─────────────────────────────────────────────────────────────

async def scrape_one_page(page, pnum):
    await page.goto(f'{EXAM_URL}{pnum}', wait_until='networkidle', timeout=30000)
    await asyncio.sleep(2)

    if 'login' in page.url or 'signin' in page.url:
        return None  # session expired

    # Expand accordion
    for b in await page.query_selector_all('.chakra-accordion__button'):
        try:
            if await b.get_attribute('aria-expanded') != 'true':
                await b.click()
                await asyncio.sleep(0.5)
        except Exception:
            pass
    await asyncio.sleep(0.5)

    # Click Show Answer
    show_btns = []
    for b in await page.query_selector_all('button'):
        try:
            if 'show answer' in (await b.inner_text()).strip().lower():
                show_btns.append(b)
        except Exception:
            pass
    for b in show_btns:
        try:
            await b.click()
            await asyncio.sleep(0.5)
        except Exception:
            pass
    await asyncio.sleep(1.5)

    return await page.evaluate(EXTRACT_JS)

# ── Worker ────────────────────────────────────────────────────────────────────

async def worker(worker_id: int, pages: list, pw, existing_ids: set):
    """One browser instance handling a range of pages."""
    # Stagger worker startup to avoid simultaneous login requests
    await asyncio.sleep(worker_id * 5)

    print(f'[W{worker_id}] Starting: pages {pages[0]}-{pages[-1]} ({len(pages)} pages)')

    browser = await pw.chromium.launch(
        headless=True,
        args=['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    )

    storage_state = str(SESSION_FILE) if SESSION_FILE.exists() else None
    ctx = await browser.new_context(
        user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport={'width': 1280, 'height': 900},
        storage_state=storage_state,
    )
    await ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
    page = await ctx.new_page()

    # Verify or establish session
    await page.goto(f'{EXAM_URL}{pages[0]}', wait_until='networkidle')
    await asyncio.sleep(2)
    if 'login' in page.url or 'signin' in page.url:
        await do_login(ctx, page, worker_id)
        # Save updated session (only first worker saves to avoid race)
        if worker_id == 0:
            await ctx.storage_state(path=str(SESSION_FILE))
    else:
        print(f'[W{worker_id}] Session valid, starting scrape...')

    scraped_batch = []
    total = len(pages)

    for i, pnum in enumerate(pages):
        try:
            qs = await scrape_one_page(page, pnum)

            if qs is None:
                print(f'[W{worker_id}] [{i+1}/{total}] Page {pnum}: session expired, re-logging in...')
                await do_login(ctx, page, worker_id)
                qs = await scrape_one_page(page, pnum)

            if qs is None:
                print(f'[W{worker_id}] [{i+1}/{total}] Page {pnum}: SKIP')
                continue

            # Only keep questions not already in file (with correct answers)
            new_qs = [q for q in qs if q.get('id') and q['id'] not in existing_ids]
            scraped_batch.extend(new_qs)

            answers = sum(1 for q in qs if q.get('correct_answer'))
            print(f'[W{worker_id}] [{i+1}/{total}] Page {pnum}: {len(qs)} questions, {answers} answers')

            # Save every 5 pages
            if (i + 1) % 5 == 0 and scraped_batch:
                added, total_saved = await merge_and_save(scraped_batch)
                scraped_batch = []
                print(f'[W{worker_id}] Checkpoint: +{added} new → {total_saved} total')

        except Exception as e:
            print(f'[W{worker_id}] [{i+1}/{total}] Page {pnum}: ERROR {e}')
            await asyncio.sleep(10)

        await asyncio.sleep(random.uniform(PAGE_DELAY_MIN, PAGE_DELAY_MAX))

    # Final save for remaining batch
    if scraped_batch:
        added, total_saved = await merge_and_save(scraped_batch)
        print(f'[W{worker_id}] Final save: +{added} new → {total_saved} total')

    await browser.close()
    print(f'[W{worker_id}] Done.')

# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', type=int, default=1)
    parser.add_argument('--end', type=int, default=80)
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--fix-missing', action='store_true',
                        help='Re-scrape pages for questions missing correct_answer')
    args = parser.parse_args()

    data, by_id = load_existing()

    if args.fix_missing:
        no_answer_ids = [qid for qid, q in by_id.items() if not q.get('correct_answer')]
        if not no_answer_ids:
            print('No missing answers found!')
            return
        # Derive pages to scrape from missing IDs
        pages_needed = sorted({((qid - 1) // QUESTIONS_PER_PAGE) + 1 for qid in no_answer_ids})
        # Clear bad records so they get replaced
        clean_ids = {qid for qid, q in by_id.items() if q.get('correct_answer')}
        print(f'Fix-missing: {len(no_answer_ids)} questions across {len(pages_needed)} pages')
        print(f'Keeping {len(clean_ids)} clean questions')
        # Rewrite file with only clean questions
        clean_qs = sorted([q for q in by_id.values() if q.get('correct_answer')],
                          key=lambda q: q.get('id') or 0)
        payload = {
            'source': EXAM_URL, 'title': EXAM_TITLE,
            'total': len(clean_qs), 'last_page': 0, 'questions': clean_qs
        }
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        existing_ids = clean_ids
        all_pages = pages_needed
    else:
        # Normal mode: scrape page range, skip already-scraped IDs with correct answers
        existing_ids = {qid for qid, q in by_id.items() if q.get('correct_answer')}
        all_pages = list(range(args.start, args.end + 1))
        print(f'Scraping pages {args.start}-{args.end} ({len(all_pages)} pages), {args.workers} workers')
        print(f'Already have {len(existing_ids)} questions with correct answers (will skip)')

    # Split pages across workers
    n = args.workers
    chunks = [all_pages[i::n] for i in range(n)]
    chunks = [c for c in chunks if c]  # remove empty

    print(f'Workers: {len(chunks)}, pages per worker: {[len(c) for c in chunks]}')

    async with async_playwright() as pw:
        tasks = [worker(i, chunk, pw, existing_ids) for i, chunk in enumerate(chunks)]
        await asyncio.gather(*tasks)

    # Final report
    data, by_id = load_existing()
    qs = list(by_id.values())
    no_answer = [q['id'] for q in qs if not q.get('correct_answer')]
    print(f'\n=== Done ===')
    print(f'Total: {len(qs)} questions')
    print(f'With correct_answer: {len(qs) - len(no_answer)}')
    print(f'Missing correct_answer: {len(no_answer)}')
    if no_answer:
        print(f'Run with --fix-missing to re-scrape those pages')


if __name__ == '__main__':
    asyncio.run(main())
