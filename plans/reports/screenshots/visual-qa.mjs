/**
 * Visual QA script for aws-exam-app frontend
 * Uses Puppeteer to take screenshots of key pages
 *
 * Auth store persist key: 'aws-exam-auth'
 * Routes: /login, /register, /dashboard
 * Dev server: http://localhost:5173 (Docker) or http://localhost:3000 (local vite)
 *
 * Run with:
 *   npx puppeteer-cli screenshot ... (if available)
 *   OR: cd plans/reports/screenshots && node --experimental-vm-modules visual-qa.mjs
 *   Requires: npm install puppeteer (in a temp dir)
 */

import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOTS_DIR = __dirname
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

const log = (msg) => console.log(`[visual-qa] ${msg}`)
const warn = (msg) => console.warn(`[visual-qa] WARN: ${msg}`)

async function takeScreenshot(page, filename, label) {
  const filepath = path.join(SCREENSHOTS_DIR, filename)
  await page.screenshot({ path: filepath, fullPage: false })
  log(`✅ Screenshot saved: ${filename} (${label})`)
  return filepath
}

async function run() {
  log(`Launching browser → ${BASE_URL}`)
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })

  const results = {}

  try {
    // ─── 1. Login Page ────────────────────────────────────────────
    log('--- Login Page ---')
    const loginPage = await browser.newPage()
    await loginPage.setViewport({ width: 1280, height: 800 })
    await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 15000 })
    await new Promise(r => setTimeout(r, 500)) // let animations settle
    await takeScreenshot(loginPage, 'login-page.png', 'Login page initial state')
    results.loginPage = true

    // ─── 2. Login Error State ─────────────────────────────────────
    log('--- Login Error State ---')
    await loginPage.type('input[type="email"]', 'wrong@example.com')
    await loginPage.type('input[type="password"]', 'wrongpassword123')
    await loginPage.click('button[type="submit"]')

    // Wait for inline error banner (api rejection or network fail — both show .bg-red-50)
    try {
      await loginPage.waitForSelector('.bg-red-50', { timeout: 8000 })
      log('Inline error banner appeared')
    } catch (_) {
      warn('Inline error banner did not appear within timeout — taking screenshot anyway')
    }
    await new Promise(r => setTimeout(r, 300))
    await takeScreenshot(loginPage, 'login-error.png', 'Login error state')
    results.loginError = true
    await loginPage.close()

    // ─── 3. Register Page ─────────────────────────────────────────
    log('--- Register Page ---')
    const registerPage = await browser.newPage()
    await registerPage.setViewport({ width: 1280, height: 800 })
    await registerPage.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle2', timeout: 15000 })
    await new Promise(r => setTimeout(r, 500))
    await takeScreenshot(registerPage, 'register-page.png', 'Register page')
    results.registerPage = true
    await registerPage.close()

    // ─── 4. Dashboard (with injected auth token) ──────────────────
    log('--- Dashboard Page (injecting auth) ---')
    const dashPage = await browser.newPage()
    await dashPage.setViewport({ width: 1280, height: 800 })

    // Visit /login first to establish the origin context for localStorage
    await dashPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 15000 })

    // Inject auth store state — Zustand persist key: 'aws-exam-auth'
    // User type: { id, email, name, roles: UserRole[] }
    // UserRole = 'student' | 'admin'
    await dashPage.evaluate(() => {
      const authState = {
        state: {
          accessToken: 'fake-token-for-visual-qa',
          refreshToken: 'fake-refresh-for-visual-qa',
          currentUser: {
            id: 1,
            email: 'testuser@example.com',
            name: 'Test User',
            roles: ['student'],
          },
          isAuthenticated: true,
        },
        version: 0,
      }
      localStorage.setItem('aws-exam-auth', JSON.stringify(authState))
    })

    // Navigate to dashboard — ProtectedRoute reads isAuthenticated from persisted store
    await dashPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 15000 })
    await new Promise(r => setTimeout(r, 800)) // wait for React render + store hydration
    await takeScreenshot(dashPage, 'dashboard-page.png', 'Dashboard page')
    results.dashboardPage = true
    await dashPage.close()

  } catch (e) {
    console.error(`[visual-qa] FATAL: ${e.message}`)
    results.error = e.message
  } finally {
    await browser.close()
  }

  // ─── Summary ──────────────────────────────────────────────────
  console.log('')
  log('=== Results ===')
  log(`Login page:    ${results.loginPage    ? '✅' : '❌'}`)
  log(`Login error:   ${results.loginError   ? '✅' : '❌'}`)
  log(`Register page: ${results.registerPage ? '✅' : '❌'}`)
  log(`Dashboard:     ${results.dashboardPage ? '✅' : '❌'}`)
  if (results.error) process.exit(1)
}

run()
