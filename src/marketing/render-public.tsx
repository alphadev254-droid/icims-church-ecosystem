import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import type { PropsWithChildren } from 'react';
import App from '@/App';
import NotFound from '@/pages/NotFound';
import { getPublicPage, publicPages, getRouteMetadata } from './pages';
import { appMetadata, getHeadTags, notFoundMetadata, SITE_ORIGIN, type PageMetadata } from './seo';

export { publicPages, SITE_ORIGIN };

function renderHead(page: PageMetadata) {
  return getHeadTags(page).map(({ name: Element, attributes, text }) => (
    Element === 'script'
      ? renderToStaticMarkup(<script data-route-meta="" {...attributes} dangerouslySetInnerHTML={{ __html: text ?? '' }} />)
      : renderToStaticMarkup(<Element data-route-meta="" {...attributes}>{text}</Element>)
  )).join('\n    ');
}

export async function renderPublicPage(path: string) {
  const page = getPublicPage(path);
  if (!page) throw new Error(`Unknown public page: ${path}`);
  const { default: Component } = await page.load();
  const Router = ({ children }: PropsWithChildren) => <StaticRouter location={path}>{children}</StaticRouter>;
  return {
    head: renderHead(page),
    body: renderToString(<App Router={Router} initialPublicPage={{ path, Component }} />),
  };
}

export function renderShells() {
  return {
    app: renderHead(appMetadata),
    privateApp: renderHead(getRouteMetadata('/dashboard')),
    notFound: {
      head: renderHead(notFoundMetadata),
      body: renderToStaticMarkup(<StaticRouter location="/404"><NotFound /></StaticRouter>),
    },
  };
}
