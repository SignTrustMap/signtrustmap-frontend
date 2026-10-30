import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import http from 'http';

const BASE_URL = process.env.OPS_URL || 'http://localhost:5174';
const OUTPUT_DIR = path.resolve(process.cwd(), 'screenshots/ops');

// List of all Ops screens with their access roles
const SCREENS = [
  // ── Public Pages ──
  { name: '01-login', path: '/login', role: 'anon', desc: 'Login Screen' },
  { name: '02-not-found-404', path: '/404', role: 'anon', desc: '404 Not Found Page' },

  // ── Admin Pages ──
  { name: '03-dashboard-admin', path: '/', role: 'admin', desc: 'Ops Command Overview (Admin)' },
  { name: '04-users-management', path: '/users', role: 'admin', desc: 'Identity & Access Users' },
  { name: '05-roles-permissions', path: '/roles', role: 'admin', desc: 'Role Governance & RBAC' },
  { name: '06-spatial-data-overrides', path: '/spatial-data', role: 'admin', desc: 'Spatial Data Overrides' },
  { name: '07-admin-escalations', path: '/escalations', role: 'admin', desc: 'Admin Escalations Queue' },
  { name: '08-credit-rules', path: '/credits/rules', role: 'admin', desc: 'Credit Economy Rules' },
  { name: '09-aiops-pipeline', path: '/aiops', role: 'admin', desc: 'AI Pipeline & Model Ops' },
  { name: '10-data-export', path: '/exports', role: 'admin', desc: 'Spatial Data Export' },
  { name: '11-system-settings', path: '/settings', role: 'admin', desc: 'System Configuration' },
  { name: '12-audit-logs', path: '/audit-logs', role: 'admin', desc: 'System Audit Logs' },

  // ── Staff & Shared Pages ──
  { name: '13-dashboard-staff', path: '/', role: 'staff', desc: 'Ops Command Overview (Staff)' },
  { name: '14-traffic-sign-catalog', path: '/catalog', role: 'staff', desc: 'Traffic Sign Catalog' },
  { name: '15-new-sign-proposals', path: '/catalog/new-types', role: 'staff', desc: 'Missing & New Sign Review' },
  { name: '16-credits-approval', path: '/credits/payments', role: 'staff', desc: 'Credits Approval Queue' },
  { name: '17-candidates-queue', path: '/candidates', role: 'staff', desc: 'Survey Candidate Review' },
  { name: '18-interactive-map', path: '/map', role: 'staff', desc: 'Interactive Geospatial Map' },
  { name: '19-tasks-dispatch', path: '/tasks', role: 'staff', desc: 'Tasks & Dispatch Queue' },
  { name: '20-operations-reports', path: '/reports', role: 'staff', desc: 'Operations Reports' },
  { name: '21-forbidden-403', path: '/403', role: 'admin', desc: '403 Forbidden Screen' },
];

function checkServerReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkServerReady(url)) return true;
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

async function createBrowserContext(browser, role) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1.5,
    colorScheme: 'light',
  });

  if (role === 'admin' || role === 'staff') {
    const user = {
      id: `${role}-001`,
      email: `${role}@signtrustmap.site`,
      name: role === 'admin' ? 'Administrator' : 'Operations Staff',
      fullName: role === 'admin' ? 'Administrator' : 'Operations Staff',
      role: role,
      roles: [role],
      initials: role === 'admin' ? 'AD' : 'ST',
    };

    // Pre-seed localStorage before any page script executes
    await context.addInitScript((userData) => {
      window.localStorage.setItem('stm_access_token', 'mock_playwright_capture_token_2026');
      window.localStorage.setItem('stm_ops_user', JSON.stringify(userData));
    }, user);

    // Mock auth profile response so restoreSession() validates successfully
    await context.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    });

    // Mock API calls to return graceful empty responses if backend is offline
    await context.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) return;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], items: [], total: 0 }),
      });
    });
  }

  return context;
}

async function main() {
  console.log('====================================================');
  console.log('🚀 SignTrustMap Ops Screen Capture Runner');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Output Directory: ${OUTPUT_DIR}`);
  console.log('====================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let devServerProcess = null;
  const isServerRunning = await checkServerReady(BASE_URL);

  if (!isServerRunning) {
    console.log(`Ops server not detected on ${BASE_URL}. Launching Vite dev server...`);
    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';
    
    devServerProcess = spawn(npmCmd, ['run', 'dev', '--workspace=ops'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
    });

    devServerProcess.stdout?.on('data', (d) => {
      const line = d.toString();
      if (line.includes('Local:')) {
        console.log(`[DevServer] ${line.trim()}`);
      }
    });

    console.log('Waiting for Ops server to become ready...');
    const ready = await waitForServer(BASE_URL, 30000);
    if (!ready) {
      console.error('❌ Failed to connect to Ops dev server within 30 seconds.');
      if (devServerProcess && devServerProcess.pid) {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', devServerProcess.pid.toString(), '/T', '/F']);
        } else {
          devServerProcess.kill();
        }
      }
      process.exit(1);
    }
    console.log('✅ Ops dev server is up and responding.\n');
  } else {
    console.log('✅ Ops dev server is already running.\n');
  }

  console.log('Launching headless Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
  });

  // Prepare isolated contexts for each role
  const contexts = {
    anon: await createBrowserContext(browser, 'anon'),
    admin: await createBrowserContext(browser, 'admin'),
    staff: await createBrowserContext(browser, 'staff'),
  };

  const capturedResults = [];

  for (let i = 0; i < SCREENS.length; i++) {
    const screen = SCREENS[i];
    const targetUrl = `${BASE_URL}${screen.path}`;
    const progress = `[${i + 1}/${SCREENS.length}]`;
    console.log(`${progress} Capturing ${screen.name} (${screen.desc})...`);

    const context = contexts[screen.role] || contexts.admin;
    const page = await context.newPage();

    try {
      // 1. Navigate
      await page.goto(targetUrl, {
        waitUntil: 'networkidle',
        timeout: 15000,
      }).catch(async () => {
        await page.waitForLoadState('domcontentloaded');
      });

      // 2. Wait for loading fallback spinners to disappear
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 4000 }).catch(() => {});

      // 3. Special handling for Leaflet Maps
      if (screen.path === '/map') {
        await page.waitForSelector('.leaflet-container', { state: 'visible', timeout: 6000 }).catch(() => {});
        await page.waitForTimeout(1500); // Allow tile tiles to rasterize cleanly
      } else {
        await page.waitForTimeout(700); // Allow animations/transitions to settle
      }

      // 4. Take full-page screenshot
      const filename = `${screen.name}.png`;
      const filePath = path.join(OUTPUT_DIR, filename);

      await page.screenshot({
        path: filePath,
        fullPage: true,
      });

      console.log(`   ✓ Saved: ${filePath}`);
      capturedResults.push({ ...screen, status: 'success', file: filename });
    } catch (err) {
      console.error(`   ✗ Error capturing ${screen.name}: ${err.message}`);
      capturedResults.push({ ...screen, status: 'error', error: err.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // If we started the dev server process, shut it down cleanly
  if (devServerProcess) {
    console.log('\nStopping Vite dev server process...');
    if (process.platform === 'win32' && devServerProcess.pid) {
      spawn('taskkill', ['/pid', devServerProcess.pid.toString(), '/T', '/F']);
    } else {
      devServerProcess.kill();
    }
  }

  console.log('\n====================================================');
  console.log('🎉 Ops Screen Capture Run Complete!');
  console.log(`Screens saved in: ${OUTPUT_DIR}`);
  console.log('====================================================\n');

  // Print summary table
  console.log('Summary of Captured Screens:');
  capturedResults.forEach((res) => {
    const icon = res.status === 'success' ? '✅' : '❌';
    console.log(` ${icon} ${res.name.padEnd(28)} | ${res.path.padEnd(20)} | ${res.desc}`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
