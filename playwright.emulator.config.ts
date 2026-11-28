/**
 * Playwright config for the emulator-backed e2e suite (tests/e2e-emulator).
 *
 * Runs the real app in Chromium against the Firebase emulators (real
 * firestore.rules / storage.rules) with every /api call mocked. Nothing here
 * talks to the production Firebase project or the production API.
 *
 * Three commands (three terminals, from the repo root; the proxy vars must be
 * unset for the emulators, they break emulator-to-emulator calls):
 *
 *   1. env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u GLOBAL_AGENT_HTTP_PROXY -u GLOBAL_AGENT_HTTPS_PROXY \
 *        npx firebase emulators:start --only auth,firestore,storage --project demo-bustadurinn
 *   2. VITE_USE_EMULATORS=true npx vite --port 5197 --host 127.0.0.1
 *   3. npm run test:e2e:emulator          (add `-- -g "finance"` to filter)
 *
 * Projects: `desktop` (1280x800) runs every spec; `mobile` (390x844) runs the
 * specs/tests tagged @mobile.
 * Chromium: set PW_CHROMIUM_PATH if the browser pinned by @playwright/test is
 * not installed (e.g. /opt/pw-browsers/chromium).
 */
import { defineConfig, chromium } from '@playwright/test';
import { existsSync } from 'node:fs';

// Use the browser pinned by @playwright/test when installed, else a preinstalled Chromium.
const candidates = [process.env.PW_CHROMIUM_PATH, chromium.executablePath(), '/opt/pw-browsers/chromium'];
const executablePath = candidates.find((p): p is string => !!p && existsSync(p));

const launchOptions = executablePath ? { executablePath, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] };

export default defineConfig({
  testDir: './tests/e2e-emulator',
  outputDir: './test-results-emulator',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5197',
    trace: 'off',
    screenshot: 'only-on-failure',
    locale: 'is-IS',
    timezoneId: 'Atlantic/Reykjavik',
    launchOptions,
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      grep: /@mobile/,
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
        // Android UA so UA-sniffing UI (the add-to-home-screen prompt) shows up as on a real phone.
        userAgent:
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      },
    },
  ],
});
