import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

// Handle dynamic chunk loading errors (e.g. after a new build has been deployed)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload chunk error detected, reloading to fetch latest assets...', event);
  window.location.reload();
});

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let isRefreshing = false;

  // Reload page when new Service Worker takes control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isRefreshing) {
      isRefreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // If a new worker is waiting, tell it to take over
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error('SW registration failed: ', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
