# SEO + GEO Backlog — Bústaðurinn.is
_Generated 2026-07-01 from GSC (last 3 months) + codebase. Each item carries the evidence that justifies it and the file(s) it touches. Effort: S = minutes, M = hours, L = days._

## P0 — blockers found 2026-07-24 (all done)

These were not in the 2026-07-01 pass and outranked everything below it.

- [x] **Static `index.html` meta/canonical duplicated on every route** — _why:_ `react-helmet-async` only removes tags carrying `data-rh`; the static tags had none, so every page served **two** descriptions and **two** canonicals, the static one always `https://www.bustadurinn.is/`. Every page was announcing itself as a duplicate of the homepage — the most likely single cause of the handbook cluster sitting at pos 20–50 with 0 clicks. _done 2026-07-24:_ marked the Helmet-managed static tags `data-rh="true"` in [index.html](index.html) (kept as no-JS fallback, now replaced on render). Also fixed non-www og/twitter image URLs, `property="twitter:image"` → `name=`, added `og:locale`.
- [x] **Fabricated `aggregateRating` served to crawlers** — _why:_ homepage `SoftwareApplication` emitted `ratingValue: "5"`, `ratingCount: "1"` because reviews only load `if (isAuthenticated)` and crawlers never are. Violates Google's review-snippet policy (manual-action risk). _done 2026-07-24:_ removed from [src/pages/LandingPage.tsx](src/pages/LandingPage.tsx); added `url` + `offers.availability`. Restore only if real reviews are fetched for logged-out visitors.
- [x] **`/personuvernd` + `/skilmalar` in sitemap with no meta** — _why:_ submitted for indexing while inheriting the homepage title and canonical. _done 2026-07-24:_ added `SEO` with explicit canonicals ([PrivacyPage](src/pages/PrivacyPage.tsx), [TermsPage](src/pages/TermsPage.tsx)); `/privacy` renders the same component so it canonicalises to `/personuvernd`.
- [x] **`/sentry-example-page` crawlable and indexable** — _done 2026-07-24:_ `noIndex` added.

## Quick wins (high impact / low effort)

- [ ] **Rewrite `/eiginleikar` title + description for intent + CTR** — _why:_ pos 8.2, 45 impressions, **0 clicks** (highest-impression zero-click page). _effort:_ S · _files:_ [src/pages/FeaturesPage.tsx](src/pages/FeaturesPage.tsx) (`SEO` props)
- [ ] **Rewrite `/handbok` + `/handbok/bokunarkerfi` titles to match informational intent** — _why:_ combined ~60 impressions at pos 7.7 / 20.8, 0 clicks; snippet doesn't answer the query. _effort:_ S · _files:_ [src/pages/HandbokPage.tsx](src/pages/HandbokPage.tsx), [src/pages/handbok/BokunarkerfiPage.tsx](src/pages/handbok/BokunarkerfiPage.tsx)
- [ ] **Add answer-first opening sentence to each `/handbok/*` page** — _why:_ GEO — models cite self-contained statements; handbook pages are the citation targets. _effort:_ S–M · _files:_ `src/pages/handbok/*`
- [x] **Wire `generate-sitemap` into the build; refresh stale `lastmod`** — _why:_ every `sitemap.xml` `lastmod` was `2026-05-02` and hand-maintained (drift risk). _effort:_ S · _done 2026-07-01:_ added `"prebuild": "node scripts/generate-sitemap.js"` to `package.json` (runs automatically before every `vite build`) and regenerated `public/sitemap.xml` with today's date.
- [x] **Internal-link `/eiginleikar` → `/handbok/*` pages with descriptive Icelandic anchors** — _why:_ handbook (the "SEO goldmine") was **not linked from the landing or features page at all** — orphaned from the two highest-authority pages. Funnels authority to striking-distance handbook pages (`bókunarkerfi` at pos 37). _effort:_ S · _done 2026-07-01:_ added "Læra meira í handbókinni" section to [src/pages/FeaturesPage.tsx](src/pages/FeaturesPage.tsx). _Still TODO:_ add a handbook link to [src/pages/LandingPage.tsx](src/pages/LandingPage.tsx).

> ~~Compress/resize the hero image~~ — **DROPPED after verification.** The report inferred `hero_summer_house.webp` (884 KB) was the LCP asset, but grep shows it's only referenced by the internal `public/logo-generator.html` tool — the real landing hero is a CSS gradient + phone mockup with no heavy image. No LCP problem here; the file is essentially an orphan.

## Strategic bets (high impact / higher effort)

- [ ] **Prerender marketing + handbook routes (build-time SSG)** — _why:_ SPA is client-rendered; AI crawlers (GPTBot/PerplexityBot/ClaudeBot) largely don't run JS, so all per-page content + JSON-LD is invisible to them despite `llms.txt`. Single highest GEO lever. _effort:_ L · _files:_ [vite.config.ts](vite.config.ts), [vercel.json](vercel.json), build pipeline
- [ ] **Strengthen `/handbok/bokunarkerfi` to own "bókunarkerfi"** — _why:_ core product term at pos 36.8; you should rank page 1. Deepen content + internal links + FAQ schema. _effort:_ M · _files:_ [src/pages/handbok/BokunarkerfiPage.tsx](src/pages/handbok/BokunarkerfiPage.tsx)
- [ ] **Create finance/ops long-tail content** (`sumarhúsatrygging`, `hár rafmagnsreikningur`, `hússjóður` math, `íbúðasparnaður`) — _why:_ real queries already surfacing (pos 20–35), low competition, high topical fit, best realistic organic-growth path. _effort:_ M · _files:_ new `src/pages/handbok/*` or expand [FjarmalPage](src/pages/handbok/) 
- [ ] **Add `FAQPage` / `HowTo` JSON-LD to handbook pages** — _why:_ Product-snippet appearance already fired once; structured data earns rich results and reinforces entities for GEO. Pattern already exists in `SEO.tsx`. _effort:_ M · _files:_ `src/pages/handbok/*`, [src/components/SEO.tsx](src/components/SEO.tsx)

## Watchlist / later (low priority or hypotheses to validate)

- [ ] **Don't over-invest in generic `bústaður`/`bústaðir`** — _why:_ pos 5–8 already, but 116+53 impr at ~1–6% CTR; intent is mostly rent/buy a cottage, not manage a shared one. Monitor, don't chase. _effort:_ — 
- [ ] **International impressions are noise** — _why:_ ~98% of clicks are Iceland; non-IS impressions convert 0. Keep targeting `is`. _effort:_ —
- [ ] **Regenerate `llms.txt` when handbook content changes** — _why:_ keep the AI-facing summary in sync with the site. _effort:_ S · _files:_ [public/llms.txt](public/llms.txt)
- [ ] **Re-pull GSC in 4–6 weeks** — _why:_ current data (6 clicks) is too thin for statistical conclusions; validate that `/eiginleikar` + `/handbok/*` CTR moves off 0%. _effort:_ —

---
_Priority order within each section is top-to-bottom. Start with the two title rewrites and the hero image — smallest effort, clearest evidence._
