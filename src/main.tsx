import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react';
import { logger } from './utils/logger';
import './index.css'
import App from './App.tsx'

// Initialize Sentry
// Initialize Sentry only if DSN is present
const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn: dsn,
    environment: import.meta.env.MODE,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: false, // Changed to false for privacy compliance
    integrations: [
      Sentry.browserTracingIntegration({
        traceFetch: true,
        traceXHR: true,
        enableLongTask: true,
        enableInp: true,
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.feedbackIntegration({
        colorScheme: 'light',
        autoInject: false, // Don't auto-inject, we have our own feedback widget
      }),
      Sentry.captureConsoleIntegration({
        levels: ['error', 'assert'],
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% if an error occurs
    // Ignore common non-critical errors
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'Load failed',
      /Extension context invalidated/,
      /chrome-extension:/,
      /moz-extension:/,
    ],
    // Add release information if available
    release: import.meta.env.VITE_SENTRY_RELEASE,
    // Breadcrumb configuration
    beforeBreadcrumb(breadcrumb) {
      // Don't send console logs as breadcrumbs to reduce noise
      if (breadcrumb.category === 'console' && breadcrumb.level !== 'error') {
        return null;
      }
      return breadcrumb;
    },
    // Event filtering and sanitization
    beforeSend(event) {
      // Don't send events in development unless explicitly testing
      if (import.meta.env.MODE === 'development' && !window.location.pathname.includes('sentry-test')) {
        return null;
      }

      // Add user context if available (non-PII)
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          event.user = {
            id: user.uid,
            // Don't include email or other PII
          };
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      return event;
    },
  });

  logger.debug('Sentry initialized', { environment: import.meta.env.MODE });
}

// Force deploy check
// Register Service Worker for Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(reg => logger.debug('SW registered:', reg))
      .catch(err => logger.warn('SW registration failed:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
