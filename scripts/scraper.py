"""
Fast single-session headless scraper.
- 1 browser, 1 login, sequential pages
- Headless mode - no manual login needed
- Uses Firebase refreshToken from Chrome IndexedDB to inject auth directly
- 3-6s delay between pages (accordion + show answer clicks already add ~5s naturally)
- Checkpoint every 10 pages
- Skips pages whose questions already have correct_answer

Usage:
    python scripts/scraper.py                            # scrape all 204 pages (headless)
    python scripts/scraper.py --start 1 --end 20         # scrape specific range (first 100 questions)
    python scripts/scraper.py --fix-missing              # re-scrape pages with missing answers
    python scripts/scraper.py --output questions-raw.json  # save to custom file
"""

import asyncio
from playwright.async_api import async_playwright
import json, os, sys, random, argparse, requests, time
from pathlib import Path

ROOT = Path(__file__).parent.parent

EXAM_URL = 'https://www.examprepper.co/exam/32/'
TITLE = 'AWS Certified Solutions Architect - Associate SAA-C03'
TOTAL_PAGES = 204
PER_PAGE = 5

# Firebase project config (from examprepper.co source)
FIREBASE_API_KEY = 'AIzaSyDRQMYReArVrXIVRXyFr-_xZNFsqXV1Skc'
FIREBASE_APP_NAME = '[DEFAULT]'

# Firebase refresh token extracted from Chrome IndexedDB
FIREBASE_REFRESH_TOKEN = 'AMf-vBygaS_cmy6FwQa2iEUPMJo8CHdXfarwjLgE4akKvHmeoqvNZCDixEO-TKHppD0D32dJixisnCBhuv64N0we0Nl3guHkz2ALU0JCmiqua6fAWc2PG2TdDRQYpQsE8PkyKavQRhbars1cmDAh-F3W6x-0yj30rjOUJx08K9Fsx1bMX-hN3_5aBnGKN72ygnLSfoi5TYewSKFuMJzwTpGZyuAzgC2HTzC10oLCTtvgg9kzDxmf-Fo_qLhaI8WbFYK-Kqqb16PaLG-hflNfc0TE0rjzo_v-oyv-POxBxn0CzNGCxp9fjyEpuo0pvt0S9yOHtvBzw_UnBH4tBcS3151duB3kDTp7lw_DRqw_jldaewiEHgeQps0AQhuBnJaX6xdU0-o9Qzo8XnAoBnS_XivpfLl-H2VhNFr8EbRu8yvkCsRammMIFK2ULqTsqbJxa2oFcpQXJ6Y8'

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
            options.push({ label, text: textEl ? textEl.innerText.trim() : '' });
            const bc = getComputedStyle(row).borderColor;
            const bg = getComputedStyle(row).backgroundColor;
            const isGreen = c => c && (c.includes('104, 211') || c.includes('72, 187') || c.includes('56, 161') || c.includes('green'));
            if (isGreen(bc) || isGreen(bg)) correctAnswers.push(label);
        });
        result.push({ id: qNum, question: questionText, options, correct_answer: correctAnswers.join(',') || null });
    });
    return result;
}"""


def refresh_firebase_token(refresh_token):
    """Exchange Firebase refresh token for a fresh access token."""
    resp = requests.post(
        f'https://securetoken.googleapis.com/v1/token?key={FIREBASE_API_KEY}',
        json={'grant_type': 'refresh_token', 'refresh_token': refresh_token},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    return {
        'access_token': data['access_token'],
        'refresh_token': data['refresh_token'],
        'user_id': data['user_id'],
        'expires_in': int(data['expires_in']),
        'expiration_time': int(time.time() * 1000) + int(data['expires_in']) * 1000,
    }


def get_user_info(access_token):
    """Get user profile from Firebase."""
    resp = requests.post(
        f'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}',
        json={'idToken': access_token},
        timeout=15,
    )
    resp.raise_for_status()
    users = resp.json().get('users', [])
    return users[0] if users else {}


def load(output):
    if not output.exists():
        return {}, set()
    with open(output) as f:
        data = json.load(f)
    qs = data.get('questions', [])
    by_id = {q['id']: q for q in qs if q.get('id')}
    return by_id, {qid for qid, q in by_id.items() if q.get('correct_answer')}


def save(by_id, output):
    qs = sorted(by_id.values(), key=lambda q: q.get('id') or 0)
    with open(output, 'w') as f:
        json.dump({'source': EXAM_URL, 'title': TITLE, 'total': len(qs),
                   'last_page': 0, 'questions': qs}, f, indent=2, ensure_ascii=False)
    return len(qs)


async def inject_firebase_auth(page, token_data, user_info, refresh_token):
    """Inject Firebase auth into the page's IndexedDB (firebaseLocalStorageDb)."""
    auth_user = {
        'uid': user_info.get('localId', token_data['user_id']),
        'email': user_info.get('email', ''),
        'emailVerified': user_info.get('emailVerified', True),
        'displayName': user_info.get('displayName', ''),
        'isAnonymous': False,
        'photoURL': user_info.get('photoUrl', ''),
        'phoneNumber': None,
        'tenantId': None,
        'providerData': [{
            'providerId': 'google.com',
            'uid': user_info.get('providerUserInfo', [{}])[0].get('rawId', '') if user_info.get('providerUserInfo') else '',
            'displayName': user_info.get('displayName', ''),
            'email': user_info.get('email', ''),
            'phoneNumber': None,
            'photoURL': user_info.get('photoUrl', ''),
        }],
        'stsTokenManager': {
            'refreshToken': refresh_token,
            'accessToken': token_data['access_token'],
            'expirationTime': token_data['expiration_time'],
        },
        '_redirectEventId': None,
        'createdAt': user_info.get('createdAt', str(int(time.time() * 1000))),
        'lastLoginAt': user_info.get('lastLoginAt', str(int(time.time() * 1000))),
        'apiKey': FIREBASE_API_KEY,
        'appName': FIREBASE_APP_NAME,
    }

    idb_key = f'firebase:authUser:{FIREBASE_API_KEY}:{FIREBASE_APP_NAME}'

    inject_script = f"""
    async () => {{
        const key = {json.dumps(idb_key)};
        const value = {json.dumps(auth_user)};

        await new Promise((resolve, reject) => {{
            const req = indexedDB.open('firebaseLocalStorageDb', 1);
            req.onupgradeneeded = (e) => {{
                const db = e.target.result;
                if (!db.objectStoreNames.contains('firebaseLocalStorage')) {{
                    db.createObjectStore('firebaseLocalStorage', {{ keyPath: 'fbase_key' }});
                }}
            }};
            req.onsuccess = (e) => {{
                const db = e.target.result;
                const tx = db.transaction('firebaseLocalStorage', 'readwrite');
                const store = tx.objectStore('firebaseLocalStorage');
                store.put({{ fbase_key: key, value: value }});
                tx.oncomplete = () => resolve();
                tx.onerror = (err) => reject(err);
            }};
            req.onerror = (err) => reject(err);
        }});
        return 'ok';
    }}
    """
    result = await page.evaluate(inject_script)
    return result == 'ok'


async def scrape_page(page, pnum, token_data, user_info, refresh_token, exam_url=EXAM_URL):
    url = f'{exam_url}{pnum}'
    await page.goto(url, wait_until='networkidle', timeout=30000)
    await asyncio.sleep(2)

    # If redirected to login, inject auth and reload
    if 'login' in page.url or 'signin' in page.url or page.url == 'https://www.examprepper.co/':
        print(f'    not authed, injecting firebase auth...')
        # Navigate to examprepper first to set origin for IndexedDB
        if 'examprepper.co' not in page.url:
            await page.goto('https://www.examprepper.co/', wait_until='domcontentloaded', timeout=20000)
            await asyncio.sleep(1)
        ok = await inject_firebase_auth(page, token_data, user_info, refresh_token)
        if ok:
            await page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(3)
        if 'login' in page.url or 'signin' in page.url:
            return None

    # Expand all accordion items
    for b in await page.query_selector_all('.chakra-accordion__button'):
        try:
            if await b.get_attribute('aria-expanded') != 'true':
                await b.click(); await asyncio.sleep(0.4)
        except Exception:
            pass
    await asyncio.sleep(0.3)

    # Click all "Show Answer" buttons
    show_btns = []
    for b in await page.query_selector_all('button'):
        try:
            if 'show answer' in (await b.inner_text()).lower():
                show_btns.append(b)
        except Exception:
            pass
    for b in show_btns:
        try:
            await b.click(); await asyncio.sleep(0.4)
        except Exception:
            pass
    await asyncio.sleep(1)

    return await page.evaluate(EXTRACT_JS)


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', type=int, default=1)
    parser.add_argument('--end', type=int, default=None)
    parser.add_argument('--pages', type=str, default=None, help='Comma-separated list of specific pages, e.g. 5,6,12,28')
    parser.add_argument('--fix-missing', action='store_true')
    parser.add_argument('--output', type=str, default=None, help='Output file path')
    parser.add_argument('--exam-id', type=int, default=None, help='Exam ID on examprepper.co (e.g. 20 for CLF-C02)')
    parser.add_argument('--total-pages', type=int, default=None, help='Total pages for this exam')
    args = parser.parse_args()

    exam_id = args.exam_id or 32
    exam_url = f'https://www.examprepper.co/exam/{exam_id}/'
    total_pages = args.total_pages or (TOTAL_PAGES if exam_id == 32 else 100)
    end_page = args.end or total_pages

    OUTPUT = Path(args.output) if args.output else ROOT / 'scraped-questions.json'

    # Get fresh Firebase token
    print('Getting fresh Firebase token...')
    try:
        token_data = refresh_firebase_token(FIREBASE_REFRESH_TOKEN)
        print(f'Token OK, expires in {token_data["expires_in"]}s')
    except Exception as e:
        print(f'ERROR: Failed to refresh token: {e}')
        sys.exit(1)

    user_info = get_user_info(token_data['access_token'])
    print(f'User: {user_info.get("email", "unknown")}')

    by_id, done_ids = load(OUTPUT)

    if args.fix_missing:
        missing = [qid for qid, q in by_id.items() if not q.get('correct_answer')]
        if not missing:
            print('No missing answers!'); return
        pages = sorted({((qid - 1) // PER_PAGE) + 1 for qid in missing})
        for qid in missing:
            del by_id[qid]
        done_ids = {qid for qid, q in by_id.items() if q.get('correct_answer')}
        print(f'Fix-missing: {len(missing)} questions across {len(pages)} pages')
    elif args.pages:
        pages = sorted(int(p.strip()) for p in args.pages.split(',') if p.strip())
        print(f'Scraping {len(pages)} specific pages: {pages}')
        print(f'Already have {len(done_ids)} clean questions (will skip)')
    else:
        pages = list(range(args.start, end_page + 1))
        print(f'Scraping pages {args.start}-{end_page} ({len(pages)} pages)')
        print(f'Already have {len(done_ids)} clean questions (will skip)')

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled', '--no-sandbox'],
        )
        ctx = await browser.new_context(
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 900},
        )
        await ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
        page = await ctx.new_page()

        # Inject auth on the examprepper origin before any navigation
        print('Injecting Firebase auth...')
        await page.goto('https://www.examprepper.co/', wait_until='networkidle', timeout=30000)
        await asyncio.sleep(3)
        ok = await inject_firebase_auth(page, token_data, user_info, FIREBASE_REFRESH_TOKEN)
        print(f'Auth injected: {ok}')

        # Verify: navigate to exam page 1
        print('Verifying auth...')
        await page.goto(exam_url + '1', wait_until='networkidle', timeout=30000)
        await asyncio.sleep(3)
        print(f'After nav: {page.url}')
        if 'login' in page.url or 'signin' in page.url or page.url.rstrip('/') == 'https://www.examprepper.co':
            print('Auth verification failed — page did not load exam content')
            # Try reloading after short wait (Firebase may need to pick up IDB)
            await asyncio.sleep(3)
            await page.reload(wait_until='networkidle')
            await asyncio.sleep(3)
            print(f'After reload: {page.url}')
            if 'login' in page.url or 'signin' in page.url:
                print('Still not authenticated. Exiting.')
                await browser.close()
                return

        print(f'Auth OK: {page.url}')

        total = len(pages)
        consecutive_empty = 0
        for i, pnum in enumerate(pages):
            # Skip if all questions on this page already complete
            page_ids = set(range((pnum - 1) * PER_PAGE + 1, pnum * PER_PAGE + 1))
            if page_ids.issubset(done_ids):
                print(f'[{i+1}/{total}] Page {pnum}: already complete, skip')
                continue

            # Re-fresh token if close to expiry (< 5 min left)
            if time.time() * 1000 > token_data['expiration_time'] - 300000:
                print('  Refreshing token...')
                try:
                    token_data = refresh_firebase_token(token_data['refresh_token'])
                    user_info = get_user_info(token_data['access_token'])
                    print(f'  Token refreshed, expires in {token_data["expires_in"]}s')
                except Exception as e:
                    print(f'  WARNING: Token refresh failed: {e}')

            print(f'[{i+1}/{total}] Page {pnum}', end=' ... ', flush=True)
            try:
                qs = await scrape_page(page, pnum, token_data, user_info, FIREBASE_REFRESH_TOKEN, exam_url)
                if qs is None:
                    print('auth failed — skipping page')
                    continue

                if not qs:
                    print('0 questions (page may be empty)')
                    consecutive_empty += 1
                    if consecutive_empty >= 5:
                        print(f'  → 5 consecutive empty pages, stopping early at page {pnum}')
                        break
                    continue

                consecutive_empty = 0

                added = 0
                for q in qs:
                    qid = q.get('id')
                    if qid and qid not in done_ids:
                        by_id[qid] = q
                        done_ids.add(qid)
                        added += 1

                answers = sum(1 for q in qs if q.get('correct_answer'))
                print(f'{len(qs)} questions, {answers} with answers, +{added} new')

                if (i + 1) % 10 == 0:
                    n = save(by_id, OUTPUT)
                    print(f'  → checkpoint: {n} total saved')

            except Exception as e:
                print(f'ERROR: {e}')
                await asyncio.sleep(8)

            await asyncio.sleep(random.uniform(3, 6))

        n = save(by_id, OUTPUT)
        print(f'\nDone! {n} questions saved to {OUTPUT}')

        no_ans = [qid for qid, q in by_id.items() if not q.get('correct_answer')]
        print(f'With correct_answer: {n - len(no_ans)}/{n}')
        if no_ans:
            print(f'Missing answers: {len(no_ans)} → run --fix-missing')

        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
