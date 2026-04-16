"""
Batch scraper for examprepper.co exam questions.
- Processes pages in batches of 20 (100 questions) with delays between batches
- Saves session state to .browser-session.json to bypass Vercel checkpoint
- Checkpoints every 5 pages; skips already-scraped question IDs
- After full run, reports missing question IDs

Usage:
    python scripts/batch-scraper.py              # scrape all
    python scripts/batch-scraper.py --fix-missing # re-scrape only pages with missing answers
"""

import asyncio
from playwright.async_api import async_playwright
import json
import os
import sys
import random
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CREDENTIALS_FILE = os.path.join(PROJECT_ROOT, '.credentials')
OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'scraped-questions.json')
SESSION_FILE = os.path.join(PROJECT_ROOT, '.browser-session.json')

EXAM_URL = 'https://www.examprepper.co/exam/32/'
EXAM_TITLE = 'AWS Certified Solutions Architect - Associate SAA-C03'
TOTAL_PAGES = 204
QUESTIONS_PER_PAGE = 5
BATCH_SIZE = 20          # pages per batch = 100 questions
BATCH_DELAY_MIN = 30     # seconds to wait between batches
BATCH_DELAY_MAX = 60
PAGE_DELAY_MIN = 3
PAGE_DELAY_MAX = 7

EMAIL = PASSWORD = ''
with open(CREDENTIALS_FILE) as f:
    for line in f:
        if line.startswith('EXAMPREPPER_EMAIL='):
            EMAIL = line.split('=', 1)[1].strip()
        elif line.startswith('EXAMPREPPER_PASSWORD='):
            PASSWORD = line.split('=', 1)[1].strip()


# ── JS Extraction (green border detection) ────────────────────────────────────

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


# ── Checkpoint I/O ────────────────────────────────────────────────────────────

def load_checkpoint():
    if not os.path.exists(OUTPUT_FILE):
        return [], set(), 1
    with open(OUTPUT_FILE) as f:
        data = json.load(f)
    questions = data.get('questions', data) if isinstance(data, dict) else data
    if not questions:
        return [], set(), 1
    existing_ids = {q['id'] for q in questions if q.get('id')}
    last_page = data.get('last_page', 0) if isinstance(data, dict) else 0
    start_page = max(1, last_page) if last_page > 0 else 1
    print(f'Checkpoint: {len(questions)} questions, last_page={last_page}, resuming from page {start_page}')
    return questions, existing_ids, start_page


def save_checkpoint(questions, last_page):
    questions_sorted = sorted(questions, key=lambda q: q.get('id') or 0)
    payload = {
        'source': EXAM_URL,
        'title': EXAM_TITLE,
        'total': len(questions_sorted),
        'last_page': last_page,
        'questions': questions_sorted,
    }
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)


def report_missing(questions):
    all_ids = {q['id'] for q in questions if q.get('id')}
    expected = set(range(1, TOTAL_PAGES * QUESTIONS_PER_PAGE + 1))
    missing_ids = sorted(expected - all_ids)
    no_answer = sorted([q['id'] for q in questions if not q.get('correct_answer')])
    print(f'\n=== Missing Report ===')
    print(f'Total scraped: {len(questions)}')
    print(f'Missing question IDs (not scraped): {len(missing_ids)}')
    if missing_ids[:30]:
        print(f'  First 30: {missing_ids[:30]}')
    print(f'Questions with no correct_answer: {len(no_answer)}')
    if no_answer[:30]:
        print(f'  First 30: {no_answer[:30]}')
    return missing_ids, no_answer


def pages_for_ids(question_ids):
    """Convert question IDs to page numbers (5 questions per page)."""
    pages = set()
    for qid in question_ids:
        page = ((qid - 1) // QUESTIONS_PER_PAGE) + 1
        pages.add(page)
    return sorted(pages)


# ── Browser Auth ──────────────────────────────────────────────────────────────

async def handle_google(p):
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


async def do_login(ctx, page):
    await page.goto('https://www.examprepper.co/login', wait_until='networkidle')
    await asyncio.sleep(3)

    if 'examprepper.co/exam' in page.url:
        print('  Already logged in')
        return

    btn_count = len(await page.query_selector_all('button'))
    if btn_count == 0:
        print('  Vercel checkpoint, waiting 15s...')
        await asyncio.sleep(15)
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
        raise Exception('Google button not found on login page')

    print('  Clicking Google sign-in...')
    try:
        async with ctx.expect_page(timeout=8000) as pi:
            await btn.click()
        popup = await pi.value
        await handle_google(popup)
        try:
            await popup.wait_for_event('close', timeout=30000)
        except Exception:
            pass
    except Exception:
        await asyncio.sleep(2)
        if 'accounts.google.com' in page.url:
            await handle_google(page)
        else:
            try:
                await page.wait_for_url('**/accounts.google.com/**', timeout=15000)
                await handle_google(page)
            except Exception:
                pass

    try:
        await page.wait_for_url('**/examprepper.co/**', timeout=30000)
    except Exception:
        pass
    await asyncio.sleep(2)
    print(f'  Logged in: {page.url}')


# ── Page Scraping ─────────────────────────────────────────────────────────────

async def scrape_page(page, ctx, pnum):
    url = f'{EXAM_URL}{pnum}'
    await page.goto(url, wait_until='networkidle', timeout=30000)
    await asyncio.sleep(2)

    if 'login' in page.url or 'signin' in page.url:
        return None  # need re-login

    # Expand all accordion items
    for b in await page.query_selector_all('.chakra-accordion__button'):
        try:
            if await b.get_attribute('aria-expanded') != 'true':
                await b.click()
                await asyncio.sleep(0.6)
        except Exception:
            pass
    await asyncio.sleep(0.5)

    # Click all Show Answer buttons
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
            await asyncio.sleep(0.6)
        except Exception:
            pass
    await asyncio.sleep(1.5)

    return await page.evaluate(EXTRACT_JS)


# ── Main Scraping Loop ────────────────────────────────────────────────────────

async def run_scraper(pages_to_scrape, fix_missing_mode=False):
    all_questions, existing_ids, _ = load_checkpoint()

    # In fix-missing mode, allow re-scraping existing IDs
    if fix_missing_mode:
        existing_ids = set()

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=False,
            args=['--disable-blink-features=AutomationControlled'],
        )

        storage_state = SESSION_FILE if os.path.exists(SESSION_FILE) else None
        if storage_state:
            print(f'Loading saved session from {SESSION_FILE}')
        else:
            print('No saved session found, will login fresh')

        ctx = await browser.new_context(
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 900},
            storage_state=storage_state,
        )
        await ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
        page = await ctx.new_page()

        # Verify session
        test_page = pages_to_scrape[0] if pages_to_scrape else 1
        await page.goto(f'{EXAM_URL}{test_page}', wait_until='networkidle')
        await asyncio.sleep(2)

        if 'login' in page.url or 'signin' in page.url:
            print('Session invalid, logging in...')
            await do_login(ctx, page)
            await ctx.storage_state(path=SESSION_FILE)
            print(f'Session saved to {SESSION_FILE}')
        else:
            print(f'Session valid: {page.url}')

        total_pages = len(pages_to_scrape)
        processed = 0

        for batch_start in range(0, total_pages, BATCH_SIZE):
            batch = pages_to_scrape[batch_start:batch_start + BATCH_SIZE]
            batch_num = batch_start // BATCH_SIZE + 1
            total_batches = (total_pages + BATCH_SIZE - 1) // BATCH_SIZE
            print(f'\n=== Batch {batch_num}/{total_batches}: pages {batch[0]}-{batch[-1]} ===')

            for pnum in batch:
                print(f'  [{processed+1}/{total_pages}] Page {pnum}', end=' ... ')
                sys.stdout.flush()

                try:
                    qs = await scrape_page(page, ctx, pnum)

                    if qs is None:
                        print('session expired, re-logging in...')
                        await do_login(ctx, page)
                        await ctx.storage_state(path=SESSION_FILE)
                        qs = await scrape_page(page, ctx, pnum)

                    if qs is None:
                        print('SKIP (still failing after re-login)')
                        processed += 1
                        continue

                    new_count = 0
                    for q in qs:
                        if q.get('id') and q['id'] not in existing_ids:
                            all_questions.append(q)
                            existing_ids.add(q['id'])
                            new_count += 1
                        elif fix_missing_mode and q.get('id'):
                            # Replace existing question with fresh data
                            all_questions = [x for x in all_questions if x.get('id') != q['id']]
                            all_questions.append(q)
                            new_count += 1

                    answers_found = sum(1 for q in qs if q.get('correct_answer'))
                    print(f'{len(qs)} questions, {answers_found} with answers, {new_count} new')

                except Exception as e:
                    print(f'ERROR: {e}')
                    await asyncio.sleep(5)

                processed += 1
                await asyncio.sleep(random.uniform(PAGE_DELAY_MIN, PAGE_DELAY_MAX))

                # Save checkpoint every 5 pages
                if processed % 5 == 0:
                    save_checkpoint(all_questions, batch[-1])
                    print(f'  [checkpoint] {len(all_questions)} questions saved')

            # Save after each batch
            last_page = batch[-1]
            save_checkpoint(all_questions, last_page)
            print(f'\nBatch {batch_num} done. Total: {len(all_questions)} questions. Checkpoint saved.')

            # Delay between batches (not after the last one)
            if batch_start + BATCH_SIZE < total_pages:
                delay = random.uniform(BATCH_DELAY_MIN, BATCH_DELAY_MAX)
                print(f'Waiting {delay:.0f}s before next batch...')
                await asyncio.sleep(delay)

        save_checkpoint(all_questions, pages_to_scrape[-1] if pages_to_scrape else 0)
        print(f'\nDone! {len(all_questions)} questions saved to {OUTPUT_FILE}')
        await browser.close()
        return all_questions


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fix-missing', action='store_true',
                        help='Re-scrape pages for questions missing correct_answer')
    args = parser.parse_args()

    if args.fix_missing:
        # Load current data and find pages needing re-scrape
        all_qs, _, _ = load_checkpoint()
        _, no_answer = report_missing(all_qs)
        if not no_answer:
            print('No missing answers found!')
            return
        pages = pages_for_ids(no_answer)
        print(f'\nRe-scraping {len(pages)} pages for {len(no_answer)} questions missing answers...')
        all_qs = await run_scraper(pages, fix_missing_mode=True)
    else:
        # Normal mode: scrape from last checkpoint
        _, _, start_page = load_checkpoint()
        pages = list(range(start_page, TOTAL_PAGES + 1))
        if not pages:
            print('All pages already scraped!')
            all_qs, _, _ = load_checkpoint()
        else:
            print(f'Scraping pages {pages[0]} to {pages[-1]} ({len(pages)} pages)...')
            all_qs = await run_scraper(pages)

    # Final report
    report_missing(all_qs)


if __name__ == '__main__':
    asyncio.run(main())
