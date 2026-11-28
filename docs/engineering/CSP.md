# Content-Security-Policy

Status: the enforcing policy is weak; a strict policy runs in report-only mode to collect data. Both are set in the global `/(.*)` header block of `vercel.json`.

## What is enforced today, and why it is weak

`Content-Security-Policy` has `script-src 'self' 'unsafe-inline' 'unsafe-eval'` plus a host allowlist (Google, Facebook, umsognin.is, vercel.live). `'unsafe-inline'` lets any injected `<script>` or `onclick=` run, `'unsafe-eval'` allows `eval`/`new Function`, and the allowlisted hosts (for example `apis.google.com`, `www.gstatic.com`) serve JSONP/AngularJS-style endpoints. Net effect: almost no protection against script injection. The non-script directives (`frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action`, `connect-src`, ...) are useful and stay as they are. `style-src 'unsafe-inline'` is also still there; removing inline styles is a separate, lower-value project (React `style=` attributes, third-party widgets) and is not part of this step.

Nobody knows which part of the app depends on the loose settings, so the enforcing header is deliberately NOT touched until reports exist.

## The report-only policy

`Content-Security-Policy-Report-Only` is identical to the enforcing policy except:

- `script-src 'self' 'report-sample' <sha256 hashes of the inline scripts> <same host allowlist>`: no `'unsafe-inline'`, no `'unsafe-eval'`.
- `script-src-attr 'none'` (no inline event handler attributes), `object-src 'none'`, `base-uri 'self'`.
- `report-uri /api/csp-report; report-to csp-endpoint`, with `Reporting-Endpoints: csp-endpoint="/api/csp-report"` as a second header. Chromium uses `report-to` (JSON `application/reports+json`); Firefox/Safari use `report-uri` (`application/csp-report`).
- No `'strict-dynamic'` on purpose: it makes browsers ignore the host allowlist, which would make the result incomparable with the enforcing policy and inconsistent across browsers. This is a measuring step.

Inline scripts are all in `index.html` (and so in `dist/app-shell.html` and every prerendered page; the text is byte-identical everywhere, so the hashes are stable): analytics-privacy helpers, Google Analytics bootstrap, Meta Pixel snippet, the Facebook in-app-browser fix, the umsognin.is widget loader. JSON-LD blocks (`type="application/ld+json"`) are data and not subject to CSP.

## Reading reports

`api/csp-report.ts` accepts POSTs without auth, rate-limits per IP (60/hour, dropped silently when exceeded or when Upstash is down), and writes one log line per violation, nothing else (no Firestore, no IP, no user agent beyond Chrome/Safari/Firefox/Edge/other):

```
csp-violation {"directive":"script-src-elem","blocked":"https://x.example/a.js","document":"https://www.bustadurinn.is/login","browser":"Chrome",...}
```

URLs are reduced to origin + path; `/guest/<token>` is logged as `/guest/[token]`, `/join...` as `/join/[redacted]`, query strings and fragments are always dropped; `sample` is kept (80 chars) only for `inline`/`eval` violations; extension and `about:`/`blob:` noise is dropped.

Find them with `vercel logs <deployment-or-domain> --query csp-violation` (or the Vercel dashboard: Logs, search `csp-violation`, filter on `/api/csp-report`). Group by `directive` + `blocked` and ignore single occurrences from one browser family: those are usually extensions.

## Expected violations

From reading the code (`index.html`, `src/`), before any real data:

| Source | Likely report | Verdict |
|---|---|---|
| `onload="this.media='all'"` on the Google Fonts `<link>` in `index.html` | `script-src-attr`, blocked `inline` (was seen in the local run on every page) | fixed: the inline handler, the `media="print"` trick, the `rel="preload"` hint and the `<noscript>` duplicate are gone. The fonts are a plain `<link rel="stylesheet">` (the URL has `display=swap`, so text shows in fallback fonts first) with the `preconnect` hints kept. Nothing needs allowing in the policy, and an enforced policy no longer leaves the stylesheet stuck on `print` |
| Inline scripts of `index.html` (GA, Pixel, helpers, FB IAB fix, umsognin loader) | none while hashes match | expected, needs allowlisting (done by hash; `verify-dist` guards drift) |
| `gtag.js` from googletagmanager.com, injected on `load` | none (host allowed); may fetch more scripts from the same hosts | expected, needs allowlisting (host) |
| Meta Pixel `fbevents.js`, may inject further code and `eval`-like helpers | `script-src` `eval` or other `connect.facebook.net` paths | unknown: check reports; Pixel is the main candidate for `unsafe-eval` |
| umsognin.is `widget.js` (desktop only) | likely `inline` style or script injected by the widget, or extra hosts | unknown: check reports |
| Firebase Auth popup (`signInWithPopup`): loads `apis.google.com/js/api.js`, an iframe on `bustadurinn-599f2.firebaseapp.com/__/auth/iframe` and `accounts.google.com` | script from `apis.google.com`/`www.gstatic.com` (allowed); Google's loader can add inline or `eval` | unknown: check reports (sign-in is the highest-risk flow) |
| Google Maps (`maps.googleapis.com`, address search in `OnboardingPage.tsx`) | Maps JS uses blob/worker scripts and inline styles; historically needs `blob:` in `worker-src` (present) | unknown: check reports |
| Sentry (`@sentry/react`, bundled, sends to `*.ingest.sentry.io`) | none for scripts; replay/worker use `blob:` workers if enabled | expected, needs allowlisting only if reports show it |
| vite-plugin-pwa / service worker | registration is in `src/main.tsx` (external file), no inline snippet in the HTML | expected: no violation |
| react-big-calendar | CSS only, inline styles (`style-src` still `'unsafe-inline'`) | expected: no script violation |
| `vercel.live` (feedback/toolbar on previews) | script from `vercel.live` (allowed); preview deployments only | expected, needs allowlisting (already) |
| Browser extensions, injected translators | `chrome-extension:` etc. are dropped server-side; others (`inline`/`eval` from extensions) remain | expected, ignore: low-count, single browser |
| Any `eval`/`new Function` in the bundle or dependencies | `script-src` `eval`, with `sample` | unknown: check reports (none found in `src/`) |

Local Playwright run of the built site (all third parties blocked) saw only the `script-src-attr` font-onload violation on `/`, `/login` and `/eiginleikar` (since fixed, see the first row of the table above).

## Tightening procedure

1. Deploy and collect about a week of reports, covering a sign-in with Google and Facebook, an address search, and a desktop and a mobile visit.
2. For each distinct `directive` + `blocked` pair decide: allow (add a hash or a host, as narrow as possible) or fix the code (remove the inline handler, the `eval`, the dependency).
3. When the list is empty or accepted, move the report-only policy into `Content-Security-Policy` (keep `report-uri`/`report-to` on it so regressions are still reported).
4. Keep a new report-only header one step stricter (for example `style-src` without `'unsafe-inline'`, then `'strict-dynamic'` with a nonce/hash-only policy) and repeat.

## Rule: editing an inline script in `index.html`

Any change to an inline `<script>` in `index.html` changes its hash. `node scripts/verify-dist.js` (run by CI after the build) fails and prints the file, the first 60 characters of the script and the `'sha256-...'` value to add to `script-src` of `Content-Security-Policy-Report-Only` in `vercel.json`. `node scripts/csp-hashes.js [dist] [--header]` lists all hashes. Remove hashes of scripts that no longer exist. When the policy moves to enforcing, the same hash list goes into the enforcing header.

Header size: the report-only value is about 1.8 KB, comfortably below the ~3.5 KB practical limit; each additional hash adds ~60 bytes.
