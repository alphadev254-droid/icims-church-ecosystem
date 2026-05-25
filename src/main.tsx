import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const hostname  = window.location.hostname;
const baseDomain = 'churchcentral.church';

const isSubdomain =
  hostname !== baseDomain &&
  hostname !== `www.${baseDomain}` &&
  hostname.endsWith(`.${baseDomain}`);

const slug = isSubdomain
  ? hostname.replace(`.${baseDomain}`, '')
  : null;

// Lazy-load the public church page only when needed
const ChurchPublicPage = React.lazy(() => import('./pages/ChurchPublicPage.tsx'));

// ── PWA: capture beforeinstallprompt BEFORE React mounts (timing trap fix) ──
(window as any).__pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
  console.log('[PWA] beforeinstallprompt captured at top level');
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});
window.addEventListener('appinstalled', () => {
  (window as any).__pwaInstallPrompt = null;
  console.log('[PWA] App installed');
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[PWA] Service worker registered, scope:', reg.scope))
      .catch(err => console.warn('[PWA] Service worker registration failed:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {slug ? (
      <React.Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
          Loading...
        </div>
      }>
        <ChurchPublicPage slug={slug} />
      </React.Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
