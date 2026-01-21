/**
 * Performance Monitoring Utilities
 * Track Core Web Vitals and custom performance metrics
 */

import { logger } from './logger';

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
};

/**
 * Get rating based on metric value and thresholds
 */
function getRating(
  value: number,
  thresholds: { good: number; poor: number }
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report metric to analytics (Sentry, GA, etc.)
 */
function reportMetric(metric: PerformanceMetric): void {
  // Log to console in development
  if (import.meta.env.MODE === 'development') {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    logger.debug(`${emoji} ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`);
  }

  // Send to Sentry (if available)
  if (window.Sentry && import.meta.env.VITE_SENTRY_DSN) {
    window.Sentry.metrics.distribution(metric.name, metric.value, {
      tags: { rating: metric.rating },
      unit: 'millisecond',
    });
  }

  // Send to Google Analytics (if available)
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }
}

/**
 * Monitor Largest Contentful Paint (LCP)
 * Measures loading performance - should be < 2.5s
 */
export function observeLCP(): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };

      const value = lastEntry.renderTime || lastEntry.loadTime || 0;
      const metric: PerformanceMetric = {
        name: 'LCP',
        value,
        rating: getRating(value, THRESHOLDS.LCP),
        timestamp: Date.now(),
      };

      reportMetric(metric);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    logger.error('Failed to observe LCP:', e);
  }
}

/**
 * Monitor First Input Delay (FID)
 * Measures interactivity - should be < 100ms
 */
export function observeFID(): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceEntry & { processingStart?: number }) => {
        const value = entry.processingStart ? entry.processingStart - entry.startTime : 0;
        const metric: PerformanceMetric = {
          name: 'FID',
          value,
          rating: getRating(value, THRESHOLDS.FID),
          timestamp: Date.now(),
        };

        reportMetric(metric);
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    logger.error('Failed to observe FID:', e);
  }
}

/**
 * Monitor Cumulative Layout Shift (CLS)
 * Measures visual stability - should be < 0.1
 */
export function observeCLS(): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry: PerformanceEntry & { value?: number; hadRecentInput?: boolean }) => {
        // Only count layout shifts without recent user input
        if (!entry.hadRecentInput && entry.value) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      });

      // Report CLS when page visibility changes or unloads
      if (document.visibilityState === 'hidden') {
        const metric: PerformanceMetric = {
          name: 'CLS',
          value: clsValue,
          rating: getRating(clsValue, THRESHOLDS.CLS),
          timestamp: Date.now(),
        };

        reportMetric(metric);
        observer.disconnect();
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    // Also report on page unload
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        const metric: PerformanceMetric = {
          name: 'CLS',
          value: clsValue,
          rating: getRating(clsValue, THRESHOLDS.CLS),
          timestamp: Date.now(),
        };

        reportMetric(metric);
      }
    }, { once: true });
  } catch (e) {
    logger.error('Failed to observe CLS:', e);
  }
}

/**
 * Monitor Time to First Byte (TTFB)
 * Measures server response time - should be < 800ms
 */
export function measureTTFB(): void {
  if (!('performance' in window) || !performance.timing) return;

  try {
    // Use Navigation Timing API
    const timing = performance.timing;
    const ttfb = timing.responseStart - timing.requestStart;

    if (ttfb > 0) {
      const metric: PerformanceMetric = {
        name: 'TTFB',
        value: ttfb,
        rating: getRating(ttfb, THRESHOLDS.TTFB),
        timestamp: Date.now(),
      };

      reportMetric(metric);
    }
  } catch (e) {
    logger.error('Failed to measure TTFB:', e);
  }
}

/**
 * Monitor First Contentful Paint (FCP)
 * Measures perceived loading speed - should be < 1.8s
 */
export function observeFCP(): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          const metric: PerformanceMetric = {
            name: 'FCP',
            value: entry.startTime,
            rating: getRating(entry.startTime, THRESHOLDS.FCP),
            timestamp: Date.now(),
          };

          reportMetric(metric);
          observer.disconnect();
        }
      });
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    logger.error('Failed to observe FCP:', e);
  }
}

/**
 * Mark a custom performance timing
 */
export function markPerformance(name: string): void {
  if ('performance' in window && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure duration between two marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string): void {
  if ('performance' in window && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);

      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        logger.debug(`⏱️ ${name}: ${Math.round(measure.duration)}ms`);

        // Report to Sentry
        if (window.Sentry && import.meta.env.VITE_SENTRY_DSN) {
          window.Sentry.metrics.distribution(name, measure.duration, {
            unit: 'millisecond',
          });
        }
      }
    } catch (e) {
      logger.error(`Failed to measure ${name}:`, e);
    }
  }
}

/**
 * Initialize all performance observers
 * Call this once when the app starts
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  logger.debug('🚀 Initializing performance monitoring');

  // Observe Core Web Vitals
  observeLCP();
  observeFID();
  observeCLS();
  observeFCP();

  // Measure TTFB on page load
  if (document.readyState === 'complete') {
    measureTTFB();
  } else {
    window.addEventListener('load', measureTTFB);
  }

  // Mark app start
  markPerformance('app-start');
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): Record<string, number> {
  if (!('performance' in window)) return {};

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (!navigation) return {};

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
  };
}

// TypeScript declarations for external APIs
declare global {
  interface Window {
    Sentry?: {
      metrics: {
        distribution: (name: string, value: number, tags?: { tags?: Record<string, string>; unit?: string }) => void;
      };
    };
    gtag?: (...args: any[]) => void;
  }
}
