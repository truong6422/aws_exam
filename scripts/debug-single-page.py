"""
Debug scraper: scrape exactly 1 page, print raw extraction results.
Goal: verify options A-D and correct_answer are all captured.

Usage: python scripts/debug-single-page.py [page_number]
"""

import asyncio
from playwright.async_api import async_playwright
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CREDENTIALS_FILE = os.path.join(PROJECT_ROOT, ".credentials")
EXAM_URL = "https://www.examprepper.co/exam/32/"

EMAIL = PASSWORD = ""
with open(CREDENTIALS_FILE) as f:
    for line in f:
        if line.startswith("EXAMPREPPER_EMAIL="):
            EMAIL = line.split("=", 1)[1].strip()
        elif line.startswith("EXAMPREPPER_PASSWORD="):
            PASSWORD = line.split("=", 1)[1].strip()

PAGE_NUM = int(sys.argv[1]) if len(sys.argv) > 1 else 1


async def handle_google_auth(p):
    await p.wait_for_load_state("domcontentloaded")
    await asyncio.sleep(2)
    email_input = await p.query_selector('input[type="email"]')
    if email_input:
        await email_input.fill(EMAIL)
        await asyncio.sleep(0.5)
        btn = await p.query_selector("#identifierNext button") or await p.query_selector('button:has-text("Next")')
        if btn:
            await btn.click()
        else:
            await p.keyboard.press("Enter")
        await asyncio.sleep(3)
    pwd = await p.query_selector('input[type="password"]')
    if pwd:
        await pwd.fill(PASSWORD)
        await asyncio.sleep(0.5)
        btn = await p.query_selector("#passwordNext button") or await p.query_selector('button:has-text("Next")')
        if btn:
            await btn.click()
        else:
            await p.keyboard.press("Enter")
        await asyncio.sleep(5)


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False, args=["--disable-blink-features=AutomationControlled"])
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = await context.new_page()

        # Login
        print("Logging in...")
        await page.goto("https://www.examprepper.co/login", wait_until="networkidle")
        await asyncio.sleep(2)

        google_btn = (
            await page.query_selector("button:has-text('Sign in with Google')")
            or await page.query_selector("button:has-text('Continue with Google')")
        )
        if not google_btn:
            for btn in await page.query_selector_all("button"):
                if "google" in (await btn.inner_text()).lower():
                    google_btn = btn
                    break

        try:
            async with context.expect_page(timeout=8000) as popup_info:
                await google_btn.click()
            popup = await popup_info.value
            await handle_google_auth(popup)
            try:
                await popup.wait_for_event("close", timeout=30000)
            except Exception:
                pass
        except Exception as e:
            print(f"No popup: {e}, trying redirect...")
            await asyncio.sleep(2)
            if "accounts.google.com" in page.url:
                await handle_google_auth(page)
            else:
                await page.wait_for_url("**/accounts.google.com/**", timeout=15000)
                await handle_google_auth(page)

        try:
            await page.wait_for_url("**/examprepper.co/**", timeout=30000)
        except Exception:
            pass
        await asyncio.sleep(2)
        print(f"Logged in, URL: {page.url}")

        # Navigate to target page
        url = f"{EXAM_URL}{PAGE_NUM}"
        print(f"\nNavigating to: {url}")
        await page.goto(url, wait_until="networkidle")
        await asyncio.sleep(2)

        # Click all Show Answer buttons
        clicked = 0
        for btn in await page.query_selector_all("button"):
            try:
                if "Show Answer" in await btn.inner_text():
                    await btn.click()
                    await asyncio.sleep(0.4)
                    clicked += 1
            except Exception:
                pass
        print(f"Clicked {clicked} Show Answer buttons")
        await asyncio.sleep(1)

        # Dump raw HTML of first accordion item for inspection
        first_item = await page.query_selector(".chakra-accordion__item")
        if first_item:
            html = await first_item.inner_html()
            print("\n=== FIRST ACCORDION ITEM HTML (truncated to 3000 chars) ===")
            print(html[:3000])
            print("=== END ===\n")

        # Extract with broad selectors and print everything found
        result = await page.evaluate("""() => {
            const items = document.querySelectorAll('.chakra-accordion__item');
            const out = [];
            items.forEach((item, idx) => {
                const panel = item.querySelector('.chakra-accordion__panel');
                if (!panel) return;

                // Question text — try multiple selectors
                const qText1 = Array.from(panel.querySelectorAll('.css-naa3lg p')).map(p => p.innerText.trim()).join('\\n');
                const qText2 = Array.from(panel.querySelectorAll('p')).slice(0, 3).map(p => p.innerText.trim()).join('\\n');

                // All option rows — try multiple selectors
                const optRows1 = Array.from(panel.querySelectorAll('.css-j7qwjs .chakra-stack.css-1hd35cf'));
                const optRows2 = Array.from(panel.querySelectorAll('.chakra-radio-group .chakra-stack'));
                const optRows3 = Array.from(panel.querySelectorAll('[class*="chakra-stack"]')).filter(el => {
                    const text = el.innerText;
                    return /^[A-E][\\.\\s]/.test(text.trim());
                });

                // Full panel text for correct answer
                const panelText = panel.innerText;
                const m = panelText.match(/Correct\\s+Answer[:\\s]+([A-E](?:[,\\s]+[A-E])*)/i);

                const btnEl = item.querySelector('.chakra-accordion__button');
                const qNum = (btnEl?.innerText.match(/Question\\s+(\\d+)/) || [])[1];

                out.push({
                    question_num: qNum,
                    q_selector1_count: optRows1.length,
                    q_selector2_count: optRows2.length,
                    q_selector3_count: optRows3.length,
                    question_text_preview: qText1.substring(0, 80) || qText2.substring(0, 80),
                    options_raw: optRows1.map(r => r.innerText.trim().substring(0, 60)),
                    correct_answer_match: m ? m[0] : null,
                    panel_text_preview: panelText.substring(0, 200),
                });
            });
            return out;
        }""")

        print(f"Found {len(result)} questions on page {PAGE_NUM}:\n")
        for q in result:
            print(f"Q{q['question_num']}: opts_sel1={q['q_selector1_count']} sel2={q['q_selector2_count']} sel3={q['q_selector3_count']}")
            print(f"  Text: {q['question_text_preview']}")
            print(f"  Options: {q['options_raw']}")
            print(f"  Correct: {q['correct_answer_match']}")
            print()

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
