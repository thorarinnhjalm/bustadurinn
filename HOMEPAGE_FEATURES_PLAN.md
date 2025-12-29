# 🎯 HOMEPAGE & FEATURES PAGE REDESIGN PLAN

**Goal**: Concise homepage + detailed features page with screenshots for SEO/LLM optimization

---

## 📄 HOMEPAGE (LandingPage.tsx) - MAKE IT CONCISE

### Current Issues:
- Too much content on one page
- Scrolls forever
- Key message gets lost

### New Structure:

```
┌─────────────────────────────────┐
│  HERO                           │
│  - Headline                     │
│  - Subheadline                  │
│  - 3 CTAs (Byrja / Prufa / Sjá) │
│  - Social proof                 │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  3 KEY BENEFITS (Icons)         │
│  - Sanngjarni                   │
│  - Fjármál                      │
│  - Viðhald                      │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  QUICK PREVIEW                  │
│  - "Sjáðu kerfið í vinnslu"     │
│  - Link to /prufa               │
│  - Maybe 1 screenshot           │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  FINAL CTA                      │
│  - Pricing reminder             │
│  - Signup button                │
└─────────────────────────────────┘
```

**Remove**:
- Long feature descriptions
- Multiple screenshots
- Testimonials (move to /um-okkur)
- Detailed explanations

**Keep**:
- Hero with image
- Key value props
- Strong CTAs
- Social proof (brief)

---

## 🎨 FEATURES PAGE (/eiginleikar) - MAKE IT DETAILED

### Current State:
- Basic feature list
- No screenshots
- Minimal content

### New Structure:

```
┌─────────────────────────────────────────┐
│  HERO SECTION                           │
│  - "Allar eiginleikar Bústaðurinn.is"  │
│  - Short overview                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  FEATURE 1: BÓKUNARDAGATAL              │
│  ┌───────────────┬───────────────────┐  │
│  │ Screenshot    │ • Sanngjarni      │  │
│  │ (Calendar UI) │ • Íslensk helgidög│  │
│  │               │ • Sameignarbókun  │  │
│  │               │ • Export/Sync     │  │
│  └───────────────┴───────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  FEATURE 2: HÚSSJÓÐUR                   │
│  ┌───────────────┬───────────────────┐  │
│  │ Screenshot    │ • Rekstraráætlun  │  │
│  │ (Finance UI)  │ • Bókhald         │  │
│  │               │ • Greiðslustöður  │  │
│  │               │ • Útflutningur    │  │
│  └───────────────┴───────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  FEATURE 3: VERKEFNI                    │
│  ┌───────────────┬───────────────────┐  │
│  │ Screenshot    │ • Verkefnalisti   │  │
│  │ (Tasks UI)    │ • Úthlutun        │  │
│  │               │ • Forgangsröðun   │  │
│  │               │ • Tímamörk        │  │
│  └───────────────┴───────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  FEATURE 4: GESTAAÐGANGUR               │
│  • QR kóði með aðgangskóða              │
│  • WiFi upplýsingar                     │
│  • Húsreglur                            │
│  • Neyðarsímanúmer                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  BONUS FEATURES                         │
│  • Veðurvakta (Premium)                 │
│  • Húsvörðurinn AI (Premium)            │
│  • Sjálfvirk innheimta (Payday)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  SEO CONTENT SECTION                    │
│  • Full text descriptions               │
│  • Use cases                            │
│  • Benefits                             │
│  • How it works                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  FAQ SECTION                            │
│  • Common questions                     │
│  • Technical details                    │
│  • Pricing info                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  CTA                                    │
│  • "Tilbúinn að byrja?"                 │
│  • Signup button                        │
└─────────────────────────────────────────┘
```

---

## 📸 SCREENSHOTS NEEDED

### Generate AI screenshots of:
1. **Calendar view** - showing booking grid
2. **Finance dashboard** - showing balance & transactions
3. **Tasks list** - showing todo items
4. **Settings page** - showing WiFi/house rules
5. **Guest access** - showing QR code
6. **Mobile view** - responsive design

### How to generate:
- Use existing UI from `/prufa` mockups
- Add realistic Icelandic data
- Show actual design system
- Generate at 1200x800px
- Save as WebP for performance

---

## 🔍 SEO OPTIMIZATION

### Keywords to target:
- "sumarhús skipulag"
- "fjöleignarhús stjórnun"
- "bókunarkerfi sumarhús"
- "hússjóður hugbúnaður"
- "sameignareignir iceland"

### Content strategy:
1. **H1**: "Bústaðurinn.is - Allt fyrir sumarhúsið á einum stað"
2. **H2 sections** for each feature
3. **Detailed descriptions** (200-300 words each)
4. **Alt text** for all images
5. **Structured data** (JSON-LD)
6. **Internal linking** (to pricing, about, etc.)

### Meta tags:
```html
<title>Eiginleikar - Bústaðurinn.is | Sumarhús & Fjöleignarhús Hugbúnaður</title>
<meta name="description" content="Sjáðu alla eiginleika Bústaðurinn.is: Bókunardagatal með sanngjarni, hússjóður, verkefnastjórnun, stafrænn gestaaðgangur og meira. Hannað fyrir íslenskar þarfir.">
```

---

## 🤖 LLM OPTIMIZATION

### Add structured content blocks:

```typescript
// Add to FeaturesPage.tsx
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Bústaðurinn.is",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "2490",
    "priceCurrency": "ISK"
  },
  "featureList": [
    "Bókunardagatal með sanngjarni",
    "Hússjóður og bókhald",
    "Verkefnastjórnun",
    "Stafrænn gestaaðgangur"
  ]
};
```

### Content format for LLMs:
- Clear headings (H2, H3)
- Bullet points
- Examples and use cases
- Problem → Solution format
- Icelandic with proper grammar

---

## 📝 IMPLEMENTATION PLAN

### Phase 1: Clean up homepage (1-2 hours)
1. Remove detailed feature sections
2. Keep hero + 3 key benefits
3. Add link to "Sjá alla eiginleika →"
4. Simplify footer
5. Test mobile responsive

### Phase 2: Expand features page (3-4 hours)
1. Create detailed feature sections
2. Generate UI screenshots
3. Add SEO content
4. Add structured data
5. Add FAQ section

### Phase 3: SEO & Performance (1 hour)
1. Optimize images (WebP)
2. Add meta tags
3. Add alt text
4. Test page speed
5. Verify mobile friendly

---

## 🎯 TONIGHT'S SCOPE

Given it's 00:53 AM, recommend:

### Option A: Document Only ✅
- Create this plan
- Wait for next session
- Fresh start with clear direction

### Option B: Quick Homepage Cleanup (30 min)
- Remove excess content
- Simplify to 3 sections
- Deploy

### Option C: Full Redesign (3-4 hours)
- Do everything tonight
- Not recommended (it's late)

**Recommendation**: Document now, execute tomorrow when fresh.

---

## 📊 SUCCESS METRICS

After implementation, track:
- Homepage bounce rate (should decrease)
- Features page time on page (should increase)
- Organic search traffic
- Signup conversion rate
- /prufa click-through rate

---

**Created**: 2025-12-29 00:53  
**Status**: Planning phase  
**Priority**: High (SEO & conversion)
