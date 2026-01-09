import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { logger } from './utils/logger';
import './index.css'
import App from './App.tsx'

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
