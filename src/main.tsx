import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import { getPublicPage } from './marketing/pages';
import { applyPageMetadata } from './marketing/apply-head';
import { appMetadata } from './marketing/seo';
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

const root = document.getElementById('root')!;

async function mount() {
  if (slug) {
    applyPageMetadata(appMetadata);
    createRoot(root).render(
      <React.StrictMode>
        <React.Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
            Loading...
          </div>
        }>
          <ChurchPublicPage slug={slug} />
        </React.Suspense>
      </React.StrictMode>,
    );
    return;
  }

  const page = getPublicPage(window.location.pathname);
  if (page && root.dataset.prerenderedPath === window.location.pathname) {
    // Await the same component rendered at build time before attaching events.
    const { default: Component } = await page.load();
    hydrateRoot(root, <React.StrictMode><App initialPublicPage={{ path: page.path, Component }} /></React.StrictMode>);
    return;
  }

  createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
}

void mount();
