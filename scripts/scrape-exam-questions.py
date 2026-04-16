"""
Scrape exam questions from examprepper.co using Playwright.

Usage:
    python scripts/scrape-exam-questions.py

Output:
    scraped-questions.json (in project root)

Credentials are read from .credentials file in the project root.
"""

import asyncio
from playwright.async_api import async_playwright
import json
import re
import random
import os
import sys

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CREDENTIALS_FILE = os.path.join(PROJECT_ROOT, ".credentials")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "scraped-questions.json")
EXAM_URL = "https://www.examprepper.co/exam/32/"
EXAM_TITLE = "AWS Certified Solutions Architect - Associate SAA-C03"


def load_credentials() -> tuple[str, str]:
    if not os.path.exists(CREDENTIALS_FILE):
        raise FileNotFoundError(f"Credentials file not found: {CREDENTIALS_FILE}")
    email = password = ""
    with open(CREDENTIALS_FILE) as f:
        for line in f:
            line = line.strip()
            if line.startswith("EXAMPREPPER_EMAIL="):
                email = line.split("=", 1)[1]
            elif line.startswith("EXAMPREPPER_PASSWORD="):
                password = line.split("=", 1)[1]
    if not email or not password:
        raise ValueError("EXAMPREPPER_EMAIL or EXAMPREPPER_PASSWORD missing in .credentials")
    return email, password


def load_checkpoint() -> tuple[list, set, int]:
    """Returns (questions_list, existing_ids_set, start_page)."""
    if not os.path.exists(OUTPUT_FILE):
        return [], set(), 1
    with open(OUTPUT_FILE) as f:
        data = json.load(f)
    questions = data.get("questions", data) if isinstance(data, dict) else data
    if not questions:
        return [], set(), 1
    existing_ids = {q["id"] for q in questions if q.get("id")}
    # Resume from the last_page tracked in the checkpoint, minus 1 to be safe
    last_page = data.get("last_page", 0) if isinstance(data, dict) else 0
    start_page = max(1, last_page - 1) if last_page > 0 else 1
    print(f"Resuming: {len(questions)} questions, last_page={last_page}, start_page={start_page}")
    return questions, existing_ids, start_page


def save_output(questions: list, last_page: int = 0) -> None:
    questions.sort(key=lambda q: q.get("id") or 0)
    payload = {
        "source": EXAM_URL,
        "title": EXAM_TITLE,
        "total": len(questions),
        "last_page": last_page,
        "questions": questions,
    }
    with open(OUTPUT_FILE, "w") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)


# ── Google OAuth ──────────────────────────────────────────────────────────────

async def handle_google_auth(p, email: str, password: str) -> None:
    """Fill email + password on a Google auth page."""
    await p.wait_for_load_state("domcontentloaded")
    await asyncio.sleep(2)
    print(f"  Google auth page: {p.url[:80]}")

    email_input = await p.query_selector('input[type="email"]')
    if email_input:
        await email_input.fill(email)
        await asyncio.sleep(0.5)
        next_btn = (
            await p.query_selector("#identifierNext button")
            or await p.query_selector('button:has-text("Next")')
        )
        if next_btn:
            await next_btn.click()
        else:
            await p.keyboard.press("Enter")
        await asyncio.sleep(3)

    pwd_input = await p.query_selector('input[type="password"]')
    if pwd_input:
        await pwd_input.fill(password)
        await asyncio.sleep(0.5)
        next_btn = (
            await p.query_selector("#passwordNext button")
            or await p.query_selector('button:has-text("Next")')
        )
        if next_btn:
            await next_btn.click()
        else:
            await p.keyboard.press("Enter")
        await asyncio.sleep(5)
    else:
        # Account picker — click the matching account
        for item in await p.query_selector_all("[data-identifier]"):
            identifier = await item.get_attribute("data-identifier")
            if identifier and email in identifier:
                await item.click()
                await asyncio.sleep(3)
                break

    print("  Google auth submitted")


async def login(page, context, email: str, password: str) -> None:
    print("Navigating to login page...")
    await page.goto("https://www.examprepper.co/login", wait_until="networkidle")
    await asyncio.sleep(2)

    # Locate Google button — try CSS/text selectors first, then iterate
    google_btn = (
        await page.query_selector("button:has-text('Sign in with Google')")
        or await page.query_selector("button:has-text('Continue with Google')")
        or await page.query_selector("text=Sign in with Google")
        or await page.query_selector("text=Continue with Google")
    )
    if not google_btn:
        for btn in await page.query_selector_all("button"):
            try:
                text = (await btn.inner_text()).strip().lower()
                if "google" in text:
                    google_btn = btn
                    break
            except Exception:
                pass

    if not google_btn:
        await page.screenshot(path="/tmp/login-debug.png")
        buttons = [await b.inner_text() for b in await page.query_selector_all("button")]
        raise Exception(f"Google button not found. Buttons: {buttons}")

    print("Clicking Google sign-in...")

    # Try popup first, fall back to redirect
    popup_page = None
    try:
        async with context.expect_page(timeout=8000) as popup_info:
            await google_btn.click()
        popup_page = await popup_info.value
        print("  Popup detected")
        await handle_google_auth(popup_page, email, password)
        # Wait for popup to close
        try:
            await popup_page.wait_for_event("close", timeout=30000)
        except Exception:
            pass
    except Exception as e:
        print(f"  No popup ({type(e).__name__}), handling redirect flow...")
        # May have already clicked; wait for navigation
        await asyncio.sleep(2)
        if "accounts.google.com" in page.url:
            await handle_google_auth(page, email, password)
        else:
            try:
                await page.wait_for_url("**/accounts.google.com/**", timeout=15000)
                await handle_google_auth(page, email, password)
            except Exception as e2:
                await page.screenshot(path="/tmp/after-google-click.png")
                raise Exception(f"Cannot reach Google auth page: {e2}")

    print("Waiting for examprepper redirect after login...")
    try:
        await page.wait_for_url("**/examprepper.co/**", timeout=30000)
    except Exception:
        pass
    await asyncio.sleep(3)
    print(f"Post-login URL: {page.url}")


# ── Question Extraction ───────────────────────────────────────────────────────

async def click_show_answers(page) -> int:
    clicked = 0
    for btn in await page.query_selector_all("button.chakra-button"):
        try:
            if "Show Answer" in await btn.inner_text():
                await btn.click()
                await asyncio.sleep(0.3)
                clicked += 1
        except Exception:
            pass
    return clicked


async def extract_questions(page) -> list:
    return await page.evaluate("""() => {
        const items = document.querySelectorAll('.chakra-accordion__item');
        const result = [];
        items.forEach((item) => {
            const btnEl = item.querySelector('.chakra-accordion__button');
            const txt = btnEl ? btnEl.innerText : '';
            const qm = txt.match(/Question\\s+(\\d+)/);
            const qNum = qm ? parseInt(qm[1]) : null;
            const panel = item.querySelector('.chakra-accordion__panel');
            if (!panel) return;
            const qParas = panel.querySelectorAll('.css-naa3lg p');
            const questionText = Array.from(qParas).map(p => p.innerText.trim()).join('\\n\\n');
            // Option A uses a different class (css-jjzrip) vs B/C/D (css-1hd35cf)
            // Select all direct children of .css-j7qwjs that are chakra-stack rows
            const optContainer = panel.querySelector('.css-j7qwjs');
            const optRows = optContainer
                ? Array.from(optContainer.querySelectorAll(':scope > .chakra-stack'))
                : [];
            const options = [];
            optRows.forEach(row => {
                const labelEl = row.querySelector('.css-1fdcwt3 p');
                const textEl = row.querySelector('.chakra-stack.css-cba290');
                if (!labelEl) return;
                const label = labelEl.innerText.replace('.', '').trim();
                if (!label.match(/^[A-E]$/)) return;
                options.push({
                    label,
                    text: textEl ? textEl.innerText.trim() : ''
                });
            });
            const panelText = panel.innerText;
            let correctAnswer = null, explanation = '';
            // Matches: "Correct answer A", "Correct Answer: A,B", "Correct Answer A, B"
            const m = panelText.match(/Correct\\s+[Aa]nswer[:\\s]+([A-E](?:[,\\s]+[A-E])*)/i);
            if (m) {
                correctAnswer = m[1].trim();
                explanation = panelText.substring(panelText.indexOf(m[0]) + m[0].length).trim();
            }
            result.push({
                id: qNum,
                question: questionText,
                options,
                correct_answer: correctAnswer,
                explanation
            });
        });
        return result;
    }""")


# ── Main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    email, password = load_credentials()
    all_questions, existing_ids, start_page = load_checkpoint()

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
        )
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        page = await context.new_page()
        await login(page, context, email, password)

        # Determine total pages
        total_pages = 204
        print("Navigating to exam page 1 to detect total pages...")
        await page.goto(f"{EXAM_URL}1", wait_until="networkidle")
        await asyncio.sleep(3)

        try:
            last_btn = (
                await page.query_selector('button[aria-label="Last"]')
                or await page.query_selector("button:has-text('Last')")
            )
            if last_btn:
                await last_btn.click()
                await asyncio.sleep(3)
                m = re.search(r"/exam/\d+/(\d+)", page.url)
                if m:
                    total_pages = int(m.group(1))
        except Exception as e:
            print(f"Could not detect total pages ({e}), defaulting to {total_pages}")

        print(f"Total pages: {total_pages} | Scraping from page {start_page}")

        for page_num in range(start_page, total_pages + 1):
            url = f"{EXAM_URL}{page_num}"
            print(f"[{page_num}/{total_pages}] {url}", end=" ... ")
            sys.stdout.flush()

            try:
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(2)

                # Re-login if redirected
                if "login" in page.url or "signin" in page.url:
                    print("\n  Session expired — re-logging in...")
                    await login(page, context, email, password)
                    await page.goto(url, wait_until="networkidle", timeout=30000)
                    await asyncio.sleep(2)

                clicked = await click_show_answers(page)
                if clicked:
                    await asyncio.sleep(1)

                questions = await extract_questions(page)
                new_count = 0
                for q in questions:
                    if q.get("id") and q["id"] not in existing_ids:
                        all_questions.append(q)
                        existing_ids.add(q["id"])
                        new_count += 1

                print(f"{len(questions)} found, {new_count} new | total={len(all_questions)}")

                if page_num % 5 == 0:
                    save_output(all_questions, page_num)
                    print(f"  ✓ Checkpoint saved ({len(all_questions)} questions)")

            except Exception as e:
                print(f"\n  ERROR: {e}")
                await asyncio.sleep(5)
                continue

            await asyncio.sleep(random.uniform(3, 6))

        save_output(all_questions, total_pages)
        print(f"\nDone! {len(all_questions)} questions → {OUTPUT_FILE}")
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
