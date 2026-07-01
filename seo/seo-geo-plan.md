# SEO + GEO Revision — Bústaðurinn.is
_Data window: last 3 months (2026-03-30 → 2026-06-29, GSC "Last 3 months", Web) · Generated: 2026-07-01_

## 1. Current state

**Architecture & rendering.** React 19 SPA built with Vite (SWC), deployed on Vercel with an SPA fallback (all non-`/api` routes → `index.html`). Per-page metadata is handled well via `react-helmet-async` through a shared [`SEO.tsx`](src/components/SEO.tsx) component: dynamic `<title>`, description, keywords, canonical (trailing-slash-normalized), Open Graph, Twitter cards, `lang="is"`, an **Organization JSON-LD on every page**, plus page-specific structured data on the Landing, Features, FAQ, Handbook, and Providers pages. `sitemap.xml` (16 URLs), `robots.txt`, `llms.txt` + `llms-full.txt` all exist. **This is a genuinely strong on-page foundation — better than most sites at this stage.**

The one structural constraint: **content is client-rendered.** Helmet injects tags after the JS bundle executes. Googlebot renders JS and will mostly see it, but the AI crawlers you're courting with `llms.txt` (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) frequently **do not execute JavaScript** — so to them, every route currently returns the same near-empty `index.html` shell, and the per-page JSON-LD + body content is invisible. This quietly caps GEO no matter how good the `llms.txt` is. Fixing it (prerendering the marketing/handbook routes) is the single highest-leverage move on this list.

**GSC headline (3 months).**
- Total clicks: **6** · Total impressions (Queries view): **231** · Site CTR: 2.6% · Avg position: **27.4**
- Pages view shows ~700+ impressions and 40 clicks — the gap is normal: GSC **hides anonymized/rare queries**, so at this volume most query-level data is withheld. Trust the Pages view for magnitude, Queries for direction.
- Geography: **71% of impressions and ~98% of clicks are Iceland** (40 of ~41 clicks). International impressions are mostly noise (0 clicks). Correct target market.
- Devices: **Mobile leads** — 369 impr / 6.78% CTR / pos 5.8, ahead of Desktop (289 / 5.54% / 9.42). Mobile-first is working.
- Trend: impressions ticking up late June (29 on 2026-06-29) but clicks still ~0/day. This is a **foundation-building phase, not an optimization phase** — treat the numbers as directional, not statistically meaningful.

**What's working:** homepage (`/`) earns 30 clicks at 6.2% CTR, pos 6.7 — your strongest asset. `/um-okkur`, `/verktakar`, `/torgid`, `/spurt-og-svarad` all convert impressions to clicks. Brand query `bústaðurinn` sits at pos 2.7, 33% CTR.

**What's leaking:** the **handbook cluster** (`/handbok`, `/handbok/bokunarkerfi`, `/handbok/uppsetning`, `/handbok/fjarmal`, `/handbok/vidhald`) and `/eiginleikar` collectively pull impressions at decent positions (5–8) but convert **0 clicks**. That's a snippet/intent-match problem, not a ranking problem — the content ranks but the titles aren't earning the click, or it's ranking for queries the snippet doesn't answer.

## 2. Keyword landscape

Because query data is sparse, treat this as *seeds to build on*, not a complete map. Cluster by intent:

| Cluster | Example queries (current pos) | Intent | Target URL | Status |
|---|---|---|---|---|
| **Brand** | bústaðurinn (2.7), bustadurinn | Navigational | `/` | ✅ Owned |
| **Generic "cottage"** | bústaður (6.4), bústaðir (8.0), bústað (5.2) | Ambiguous / low-intent | `/` | ⚠️ Ranks, but these are generic dictionary words (real-estate/rental intent, not software) — low conversion, don't over-invest |
| **Booking system** | bókunarkerfi (36.8), bókunardagatal | Commercial | `/handbok/bokunarkerfi`, `/eiginleikar` | 🔧 Ranks poorly (p37) — should own this |
| **Shared-house admin** | utanumhald (9.0), sameiginlegur reikningur (10.0), verkefnalisti (8.0) | Informational→commercial | `/handbok/*`, `/eiginleikar` | 🔧 Near-miss, weak CTR |
| **House manual / ops** | handbók hússins (15.7) | Informational | `/handbok` | 🔧 Content gap on the specific phrase |
| **Cost/finance** | hár rafmagnsreikningur (31), íbúðasparnaður (35), sumarhúsatrygging (20) | Informational | `/handbok/fjarmal` (+ new content) | 🕳️ Content gap |
| **Security** | öryggiskerfi sumarbústaður (42) | Informational | — | 🕳️ Content gap |

**Keyword → URL priorities:**
- `bókunarkerfi` / `bókunardagatal` → make `/handbok/bokunarkerfi` and `/eiginleikar` unambiguously the best Icelandic answer for "booking system for shared houses." Currently underranking.
- The **finance & ops long-tail** (`sameiginlegur reikningur`, `hár rafmagnsreikningur`, `sumarhúsatrygging`, `hússjóður`) is your realistic organic-growth path — low competition, high topical fit, and the handbook format already suits it.
- Do **not** chase generic `bústaður`/`bústaðir` — you already rank there by luck of the domain name, but the intent is mostly people looking to *rent/buy* a cottage, not manage a shared one. Low ROI.

## 3. Opportunities

**Striking-distance (real signal, worth acting on):**
- `bókunarkerfi` — pos 36.8, 14 impr, targets a core product term but ranks on page 4. Strengthen `/handbok/bokunarkerfi` + internal-link it from `/eiginleikar` and `/`.
- `utanumhald` (pos 9), `verkefnalisti is` (pos 8), `sameiginlegur reikningur` (pos 10) — all page-1-adjacent, all 0 CTR. Small on-page + snippet work can move these.

**CTR wins (rank fine, snippet doesn't earn the click):**
- `/eiginleikar` — pos 8.2, 45 impr, **0 clicks**. Highest-impression zero-click page. Title/description rewrite is a clear quick win.
- `/handbok` and `/handbok/bokunarkerfi` (pos 20.8) — 0 clicks on 60 combined impressions. Rewrite titles to match informational intent ("Hvernig virkar bókunarkerfi fyrir sumarhús í sameign?").
- `bústaður` — pos 6.4, 116 impr, 0.9% CTR. Even a small CTR lift here is meaningful volume, *if* you can make the homepage snippet speak to the shared-cottage intent.

**Content gaps (new pages / sections):**
- Finance long-tail: a `/handbok/fjarmal` expansion or sub-articles on `sumarhúsatrygging`, `hár rafmagnsreikningur`, `hússjóður` math, `íbúðasparnaður`.
- Security: `öryggiskerfi fyrir sumarbústað` — an informational piece.
- These fit the existing handbook pattern, so they're cheap to add and each targets a real (if small) query already surfacing.

**Cleanup / cannibalization:** none material yet — the URL structure is clean and non-overlapping. Good.

## 4. Architecture recommendations

### SEO
1. **Titles/descriptions are dynamic already — use that.** Give `/eiginleikar` and each `/handbok/*` page an intent-matched, benefit-led title + description (they're currently under-converting). This is a `SEO.tsx` prop change per page, minutes of work. *(Quick win.)*
2. **`sitemap.xml` `lastmod` is stale** (all `2026-05-02`) and hand-maintained — drift risk. Generate it at build time (there's already a `generate-sitemap` script — wire it into the build). *(Quick win.)*
3. **Internal linking** — link `/eiginleikar` and `/` to the relevant `/handbok/*` pages with descriptive Icelandic anchors ("bókunarkerfi", "hússjóður"), to funnel authority to the striking-distance handbook pages.
4. **Core Web Vitals** — hero image `hero_summer_house.webp` is 884 KB; that's heavy for an LCP asset on a mobile-first audience. Serve a resized/compressed hero. *(Quick win.)*

### GEO
1. **Prerender the marketing + handbook routes (the big one).** Add build-time prerendering (e.g. `vite-plugin-prerender`/`puppeteer-prerender`, `react-snap`, or a Vercel prerender step) for `/`, `/eiginleikar`, `/handbok`, `/handbok/*`, `/spurt-og-svarad`, `/um-okkur`, `/verktakar`. This puts your content **and** the JSON-LD into the initial HTML so GPTBot/PerplexityBot/ClaudeBot actually see it. Until this ships, your `llms.txt` is doing most of the GEO heavy lifting alone. *(Strategic bet — highest GEO leverage.)*
2. **Answer-first content on handbook pages** — open each `/handbok/*` page with a direct, quotable one-sentence answer ("Bókunarkerfi fyrir sumarhús í sameign lætur meðeigendur bóka helgar eftir sanngirnisreglu…"). Models cite self-contained statements.
3. **Add `FAQPage` and `HowTo` JSON-LD** to the handbook pages (you already have the pattern in `SEO.tsx`'s `structuredData` prop). Product-snippet appearance is already firing once — lean into it.
4. **Keep `llms.txt` fresh** — regenerate it when handbook content changes so the AI-facing summary matches the site.

## 5. Measurement

Re-pull GSC in ~4–6 weeks and watch:
- `/eiginleikar` and `/handbok/*` — **CTR should move off 0%** after the title/description rewrites (fastest signal).
- `bókunarkerfi` — position should climb from ~37 toward page 1–2 after content + internal-linking work.
- Post-prerender: watch for **new referral traffic from AI engines** (Perplexity/ChatGPT referrers in analytics) and more pages getting `Product`/`FAQ` rich-result impressions in the Search-appearance report.
- Overall: non-branded impressions in Iceland trending up is the real health metric — branded (`bústaðurinn`) clicks are demand you already have.

---
_Full tactic definitions, thresholds, and checklists: `~/.claude/skills/seo-geo-revision/references/seo-geo-tactics.md`. Raw analysis: run `analyze_gsc.py` on the GSC export._
