# Performance Optimization Summary
## Date: 2026-01-21

This document details all performance optimizations implemented for Bústaðurinn.is to achieve faster load times, better Core Web Vitals, and improved user experience.

---

## Summary of Improvements

| Optimization | Status | Impact |
|--------------|--------|--------|
| Font loading optimization | ✅ Complete | Eliminates render-blocking @import |
| Resource hints (DNS prefetch, preconnect) | ✅ Complete | Faster external resource loading |
| Image lazy loading | ✅ Complete | Reduced initial page weight |
| Code splitting | ✅ Complete | 31.6% smaller initial bundle |
| Performance monitoring | ✅ Complete | Track Core Web Vitals |
| Language attribute | ✅ Complete | Improved SEO and accessibility |

---

## 1. Font Loading Optimization ✅

### Problem
Google Fonts were loaded via `@import` in CSS, which blocks rendering until the CSS file is downloaded, parsed, and fonts are fetched.

### Solution
Moved font loading to HTML with resource hints and non-blocking loading.

**Changes Made**:

#### [index.html](../index.html) (lines 12-24):
```html
<!-- Performance: DNS Prefetch & Preconnect for external resources -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://fonts.gstatic.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Performance: Preload critical fonts with font-display swap -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" media="print" onload="this.media='all'" />
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" />
</noscript>
```

#### [src/index.css](../src/index.css) (line 1):
```css
/* BEFORE */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

/* AFTER */
/* Typography - Google Fonts loaded in index.html for better performance */
```

### Benefits
- **Non-blocking**: Fonts load asynchronously, don't block page render
- **Preconnect**: DNS lookup and TCP connection happen early
- **Font-display: swap**: Text visible immediately with fallback font
- **Preload hint**: Browser prioritizes font file download

### Expected Impact
- **FCP improvement**: ~200-500ms faster First Contentful Paint
- **LCP improvement**: Text renders immediately, no FOIT (Flash of Invisible Text)

---

## 2. Resource Hints ✅

### Problem
External resources (Google Analytics, Facebook Pixel, Google Fonts) require DNS lookup, TCP connection, and TLS negotiation, adding latency.

### Solution
Added DNS prefetch and preconnect hints for all external origins.

**Added Resource Hints** ([index.html](../index.html) lines 12-19):
```html
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://fonts.gstatic.com" />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://www.google-analytics.com" />
<link rel="dns-prefetch" href="https://connect.facebook.net" />
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

### How It Works
- **dns-prefetch**: Resolves DNS early (saves ~20-120ms per origin)
- **preconnect**: Establishes full connection including TLS (saves ~100-500ms)

### Expected Impact
- **TTFB improvement**: Faster third-party script loading
- **Analytics load**: Google Analytics and Facebook Pixel load faster

---

## 3. Image Lazy Loading ✅

### Problem
All images loaded immediately on page load, wasting bandwidth for below-the-fold content.

### Solution
Added `loading="lazy"` attribute to all non-critical images.

**Files Modified**:
1. [src/pages/SettingsPage.tsx](../src/pages/SettingsPage.tsx) - House images, gallery, avatars
2. [src/pages/GuestPage.tsx](../src/pages/GuestPage.tsx) - Guest page images
3. [src/pages/FeaturesPage.tsx](../src/pages/FeaturesPage.tsx) - Feature mockups
4. [src/components/GuestPreviewModal.tsx](../src/components/GuestPreviewModal.tsx) - Modal images
5. [src/components/NewsletterPopup.tsx](../src/components/NewsletterPopup.tsx) - Newsletter graphics

**Example Change**:
```tsx
// BEFORE
<img src={house.image_url} alt={house.name} className="..." />

// AFTER
<img loading="lazy" src={house.image_url} alt={house.name} className="..." />
```

**Images NOT Lazy Loaded** (Critical for LCP):
- [src/pages/DashboardPage.tsx](../src/pages/DashboardPage.tsx) - Hero image (above the fold)
- Landing page hero images

### Benefits
- **Reduced initial load**: Only above-the-fold images load immediately
- **Bandwidth savings**: Images load as user scrolls
- **Faster FCP/LCP**: Less content to download initially

### Expected Impact
- **Initial page weight**: ~30-50% reduction
- **LCP improvement**: Hero images load faster (less competition)
- **Mobile savings**: Significant bandwidth reduction on slow connections

---

## 4. Performance Monitoring ✅

### Implementation
Created comprehensive performance monitoring system to track Core Web Vitals and custom metrics.

**New File**: [src/utils/performance.ts](../src/utils/performance.ts)

### Features

#### A. Core Web Vitals Monitoring
- **LCP (Largest Contentful Paint)**: Tracks largest element render time (target: <2.5s)
- **FID (First Input Delay)**: Measures input responsiveness (target: <100ms)
- **CLS (Cumulative Layout Shift)**: Tracks visual stability (target: <0.1)
- **FCP (First Contentful Paint)**: First content render (target: <1.8s)
- **TTFB (Time to First Byte)**: Server response time (target: <800ms)

#### B. Automatic Rating System
Each metric gets rated:
- ✅ **Good**: Meets recommended thresholds
- ⚠️ **Needs Improvement**: Between good and poor
- ❌ **Poor**: Exceeds acceptable limits

#### C. Integration Points
Metrics automatically sent to:
1. **Console** (development mode)
2. **Sentry** (performance monitoring)
3. **Google Analytics** (custom events)

### Usage

**Initialization** ([src/main.tsx](../src/main.tsx) line 94):
```typescript
import { initPerformanceMonitoring, markPerformance } from './utils/performance';

// Initialize all observers
initPerformanceMonitoring();

// Custom marks for React rendering
markPerformance('react-render-start');
// ... render
markPerformance('react-render-end');
```

**Custom Measurements**:
```typescript
import { markPerformance, measurePerformance } from '@/utils/performance';

// Mark start of operation
markPerformance('data-fetch-start');

// ... perform operation

// Mark end and measure
markPerformance('data-fetch-end');
measurePerformance('data-fetch', 'data-fetch-start', 'data-fetch-end');
```

### Dashboard Example

In development console:
```
✅ FCP: 1234ms (good)
✅ LCP: 2156ms (good)
⚠️ FID: 150ms (needs-improvement)
✅ CLS: 0.05 (good)
⏱️ data-fetch: 234ms
```

In Sentry Performance Dashboard:
- View metrics over time
- Identify performance regressions
- Compare across releases

---

## 5. Additional Optimizations ✅

### A. HTML Language Attribute
Changed from `lang="en"` to `lang="is"` ([index.html](../index.html) line 2).

**Benefits**:
- Correct language for Icelandic content
- Better SEO
- Improved screen reader experience

### B. Build Optimization
Already implemented code splitting (from Quick Wins):
- Main bundle: 1,164 kB (was 1,697 kB) - **31.6% reduction**
- Lazy chunks for large pages
- Better caching strategy

---

## Performance Checklist

### Before Optimization:
- ❌ Fonts block rendering with @import
- ❌ No resource hints for external domains
- ❌ All images load immediately
- ❌ No Core Web Vitals tracking
- ❌ Wrong language attribute

### After Optimization:
- ✅ Non-blocking font loading with preconnect
- ✅ DNS prefetch for all external resources
- ✅ Lazy loading for below-the-fold images
- ✅ Comprehensive Core Web Vitals monitoring
- ✅ Correct Icelandic language attribute
- ✅ Code splitting (31.6% smaller bundle)
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ Sentry error tracking

---

## Expected Lighthouse Scores

### Before Optimizations (Estimated):
- **Performance**: 60-70
- **Accessibility**: 85-90
- **Best Practices**: 85-90
- **SEO**: 90-95

### After Optimizations (Target):
- **Performance**: 85-95 ✨
- **Accessibility**: 90-95
- **Best Practices**: 95-100
- **SEO**: 95-100

### Key Metrics (Target):
- **FCP**: <1.8s
- **LCP**: <2.5s
- **FID**: <100ms
- **CLS**: <0.1
- **TTI**: <3.8s
- **Speed Index**: <3.4s

---

## Testing Performance

### 1. Chrome DevTools Lighthouse
```bash
# Open Chrome DevTools
# Navigate to Lighthouse tab
# Select "Performance" + "Desktop" or "Mobile"
# Click "Analyze page load"
```

### 2. WebPageTest
```
https://www.webpagetest.org/
# Test URL: https://bustadurinn.is
# Location: Iceland (closest)
# Browser: Chrome
# Connection: 3G/4G
```

### 3. PageSpeed Insights
```
https://pagespeed.web.dev/
# Enter: https://bustadurinn.is
# Analyze both mobile and desktop
```

### 4. Real User Monitoring (Sentry)
Once deployed with Sentry:
1. Navigate to Sentry Performance dashboard
2. View Core Web Vitals over time
3. Identify slowest pages
4. Track improvements per release

---

## Monitoring in Production

### Daily Checks:
1. **Sentry Performance Dashboard**: Check for regressions
2. **Google Search Console**: Monitor Core Web Vitals
3. **Vercel Analytics**: View real user metrics

### Weekly Analysis:
1. Run Lighthouse audit
2. Check P75 (75th percentile) metrics
3. Identify slowest pages
4. Review error logs for performance issues

### Monthly Review:
1. Compare month-over-month metrics
2. Analyze seasonal patterns
3. Plan additional optimizations
4. Update performance budget

---

## Performance Budget

### Critical Resources:
- **Initial HTML**: <50 KB
- **CSS**: <100 KB (currently 90 KB ✅)
- **JS (main bundle)**: <1.2 MB uncompressed (currently 1.16 MB ✅)
- **JS (gzipped)**: <400 KB (currently 361 KB ✅)

### Metrics Budget:
- **FCP**: <1.8s on 3G
- **LCP**: <2.5s on 3G
- **TTI**: <3.8s on 3G
- **CLS**: <0.1
- **Total Page Weight**: <3 MB initial load

### How to Enforce:
Add to `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        // Already configured via lazy loading
      }
    }
  },
  chunkSizeWarningLimit: 600, // Warn if chunk > 600KB
}
```

---

## Future Optimizations (Optional)

### 1. Advanced Image Optimization
- **WebP/AVIF formats**: Smaller file sizes
- **Responsive images**: `srcset` for different screen sizes
- **Image CDN**: Automatic optimization and caching
- **Blur placeholder**: Low-quality image while loading

### 2. Advanced Loading Strategies
- **Prefetch on hover**: Load chunk when user hovers over link
- **Predictive prefetch**: ML-based prediction of next page
- **Intersection Observer**: Custom lazy loading logic

### 3. Caching Strategies
- **Service Worker**: Cache static assets for offline
- **API response cache**: Cache Firestore queries
- **Stale-while-revalidate**: Show cached content, update in background

### 4. Advanced Monitoring
- **Real User Monitoring (RUM)**: Track actual user experiences
- **Performance budgets**: CI/CD fails if budget exceeded
- **Synthetic monitoring**: Automated Lighthouse runs on deploy
- **Custom metrics**: Track app-specific operations

### 5. Infrastructure
- **CDN for assets**: Serve from edge locations
- **HTTP/3**: Faster connection establishment
- **Brotli compression**: Better than gzip
- **Edge functions**: Move logic closer to users

---

## Troubleshooting

### Poor LCP Score
**Causes**:
- Large hero image not optimized
- Render-blocking resources
- Slow server response (TTFB)

**Solutions**:
- Optimize hero image (WebP, compress)
- Ensure hero image is NOT lazy loaded
- Preload hero image: `<link rel="preload" as="image" href="...">`

### Poor FID Score
**Causes**:
- Heavy JavaScript execution
- Long tasks blocking main thread
- Too much code parsing

**Solutions**:
- Further code splitting
- Use web workers for heavy computation
- Defer non-critical JavaScript

### Poor CLS Score
**Causes**:
- Images without dimensions
- Dynamic content injection
- Web fonts causing layout shift

**Solutions**:
- Add explicit width/height to images
- Reserve space for dynamic content
- Use `font-display: swap` (already done)

### Images Not Lazy Loading
**Check**:
- Browser support (all modern browsers support it)
- Images above the fold (intentionally not lazy)
- Inspect element and verify `loading="lazy"` attribute

---

## Files Modified

### Performance Infrastructure:
1. [src/utils/performance.ts](../src/utils/performance.ts) - **NEW** - Performance monitoring utilities
2. [src/main.tsx](../src/main.tsx) - Initialize performance monitoring
3. [index.html](../index.html) - Font preloading, resource hints, language

### Image Optimization:
4. [src/index.css](../src/index.css) - Remove blocking @import
5. [src/pages/SettingsPage.tsx](../src/pages/SettingsPage.tsx) - Lazy loading
6. [src/pages/GuestPage.tsx](../src/pages/GuestPage.tsx) - Lazy loading
7. [src/pages/FeaturesPage.tsx](../src/pages/FeaturesPage.tsx) - Lazy loading
8. [src/components/GuestPreviewModal.tsx](../src/components/GuestPreviewModal.tsx) - Lazy loading
9. [src/components/NewsletterPopup.tsx](../src/components/NewsletterPopup.tsx) - Lazy loading

---

## Performance Tips for Developers

### 1. When Adding Images
```tsx
// Above the fold (hero, logo) - NO lazy loading
<img src="/hero.jpg" alt="Hero" />

// Below the fold - YES lazy loading
<img loading="lazy" src="/feature.jpg" alt="Feature" />

// Always include width/height to prevent CLS
<img loading="lazy" width={800} height={600} src="/..." alt="..." />
```

### 2. When Adding External Scripts
```html
<!-- Add DNS prefetch -->
<link rel="dns-prefetch" href="https://example.com" />

<!-- Use async or defer -->
<script async src="https://example.com/script.js"></script>
```

### 3. When Adding Heavy Components
```tsx
// Lazy load large components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Use with Suspense
<Suspense fallback={<Loader />}>
  <HeavyComponent />
</Suspense>
```

### 4. When Fetching Data
```tsx
// Mark performance
markPerformance('fetch-houses-start');

const houses = await fetchHouses();

markPerformance('fetch-houses-end');
measurePerformance('fetch-houses', 'fetch-houses-start', 'fetch-houses-end');
```

---

## Resources

- [Web.dev Performance Guide](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Font Optimization](https://web.dev/font-best-practices/)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-21
**Author**: Claude (Anthropic)
**Implementation Time**: ~2 hours
**Expected Performance Gain**: 20-30% improvement in load times
