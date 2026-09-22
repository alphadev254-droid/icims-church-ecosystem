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

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .catch((error) => console.warn('[PWA] Could not register service worker:', error));
  }
});

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
