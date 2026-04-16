"""
Verify 10 questions (pages 1-2): check options A-D and correct answer via green highlight.
Saves browser session state to .browser-session.json to bypass Vercel checkpoint on re-runs.
"""
import asyncio
from playwright.async_api import async_playwright
import json, os

CREDS = os.path.join(os.path.dirname(__file__), '..', '.credentials')
SESSION_FILE = os.path.join(os.path.dirname(__file__), '..', '.browser-session.json')
EMAIL = PASSWORD = ''
with open(CREDS) as f:
    for line in f:
        if line.startswith('EXAMPREPPER_EMAIL='):
            EMAIL = line.split('=', 1)[1].strip()
        elif line.startswith('EXAMPREPPER_PASSWORD='):
            PASSWORD = line.split('=', 1)[1].strip()

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
            // Green border = correct answer: rgb(104, 211, 145)
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


async def login(ctx, page):
    await page.goto('https://www.examprepper.co/login', wait_until='networkidle')
    await asyncio.sleep(2)

    current = page.url
    if 'examprepper.co/exam' in current or 'examprepper.co/exams' in current:
        print(f'Already logged in: {current}')
        return

    # Check if Vercel checkpoint is blocking (very few DOM elements)
    btn_count = len(await page.query_selector_all('button'))
    link_count = len(await page.query_selector_all('a'))
    print(f'Login page: {btn_count} buttons, {link_count} links, url={page.url}')
    if btn_count == 0 and link_count <= 2:
        print('WARNING: Vercel checkpoint detected — page content missing.')
        print('Waiting 10s for it to clear...')
        await asyncio.sleep(10)
        await page.reload(wait_until='networkidle')
        await asyncio.sleep(3)
        btn_count = len(await page.query_selector_all('button'))
        print(f'After reload: {btn_count} buttons')

    async def find_google_btn():
        for b in await page.query_selector_all('button'):
            try:
                text = (await b.inner_text()).strip()
                if 'google' in text.lower():
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
        all_btns = []
        for b in await page.query_selector_all('button'):
            try:
                all_btns.append(await b.inner_text())
            except Exception:
                pass
        raise Exception(f'Google button not found. Buttons: {all_btns}')

    print('Found Google button, clicking...')
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
    print(f'Logged in: {page.url}')


async def scrape_page(page, pnum):
    await page.goto(f'https://www.examprepper.co/exam/32/{pnum}', wait_until='networkidle')
    await asyncio.sleep(3)

    # Check session expired
    if 'login' in page.url or 'signin' in page.url:
        return None  # signal re-login needed

    # Expand all accordion items
    acc_buttons = await page.query_selector_all('.chakra-accordion__button')
    for b in acc_buttons:
        try:
            aria = await b.get_attribute('aria-expanded')
            if aria != 'true':
                await b.click()
                await asyncio.sleep(0.8)
        except Exception:
            pass
    await asyncio.sleep(1)

    # Click all Show Answer buttons
    show_btns = []
    for b in await page.query_selector_all('button'):
        try:
            if 'show answer' in (await b.inner_text()).strip().lower():
                show_btns.append(b)
        except Exception:
            pass
    print(f'Page {pnum}: {len(show_btns)} Show Answer buttons')
    for b in show_btns:
        try:
            await b.click()
            await asyncio.sleep(0.8)
        except Exception:
            pass
    await asyncio.sleep(2)

    return await page.evaluate(EXTRACT_JS)


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=False,
            args=['--disable-blink-features=AutomationControlled'],
        )

        # Load saved session if exists
        storage_state = SESSION_FILE if os.path.exists(SESSION_FILE) else None
        if storage_state:
            print(f'Loading saved session from {SESSION_FILE}')
        else:
            print('No saved session, will login fresh')

        ctx = await browser.new_context(
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 900},
            storage_state=storage_state,
        )
        await ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
        page = await ctx.new_page()

        # Check if already logged in with saved session
        await page.goto('https://www.examprepper.co/exam/32/1', wait_until='networkidle')
        await asyncio.sleep(2)

        if 'login' in page.url or 'signin' in page.url or len(await page.query_selector_all('.chakra-accordion__item')) == 0:
            print('Not logged in, performing login...')
            await login(ctx, page)
            # Save session state for future runs
            await ctx.storage_state(path=SESSION_FILE)
            print(f'Session saved to {SESSION_FILE}')
            # Navigate back to start
            await page.goto('https://www.examprepper.co/exam/32/1', wait_until='networkidle')
            await asyncio.sleep(2)
        else:
            print(f'Session valid, at: {page.url}')

        all_qs = []
        for pnum in range(1, 3):
            qs = await scrape_page(page, pnum)
            if qs is None:
                print(f'Page {pnum}: session expired, re-logging in...')
                await login(ctx, page)
                await ctx.storage_state(path=SESSION_FILE)
                qs = await scrape_page(page, pnum)
            if qs:
                all_qs.extend(qs)
                print(f'Page {pnum}: {len(qs)} questions extracted')
            await asyncio.sleep(2)

        # Validate
        print()
        all_ok = True
        for q in all_qs:
            labels = [o['label'] for o in q['options']]
            good = 'A' in labels and 'B' in labels and bool(q['correct_answer'])
            if not good:
                all_ok = False
            status = 'OK' if good else 'FAIL'
            print(f"Q{q['id']:>3}: opts={labels} correct={q['correct_answer']} [{status}]")

        print(f"\n{'ALL COMPLETE ✓' if all_ok else 'ISSUES FOUND ✗'} — {len(all_qs)} questions checked")
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
