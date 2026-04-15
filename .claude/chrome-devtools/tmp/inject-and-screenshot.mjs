import { getBrowser, getPage, disconnectBrowser, outputJSON } from '/home/truong/.claude/skills/chrome-devtools/scripts/lib/browser.js';

const SS_DIR = '/home/truong/project/aws-exam-app/.claude/chrome-devtools/screenshots/theme-orange-v1';

async function run() {
  const browser = await getBrowser();
  const page = await getPage(browser);

  // Inject auth state before navigating to protected routes
  const authState = JSON.stringify({
    state: {
      accessToken: 'fake-token-for-ui-test',
      refreshToken: 'fake-refresh',
      isAuthenticated: true,
      currentUser: { id: 1, email: 'admin@test.com', name: 'Admin', is_staff: true }
    },
    version: 0
  });

  // Navigate to app origin first
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.evaluate((state) => {
    localStorage.setItem('aws-exam-auth', state);
  }, authState);

  // Dashboard
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: `${SS_DIR}/dashboard.png`, fullPage: true });

  // Admin
  await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: `${SS_DIR}/admin.png`, fullPage: true });

  outputJSON({ success: true, screenshots: ['dashboard.png', 'admin.png'] });
  await disconnectBrowser();
}

run().catch(e => { console.error(JSON.stringify({ success: false, error: e.message })); process.exit(1); });
