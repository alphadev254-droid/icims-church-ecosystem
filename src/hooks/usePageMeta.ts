import { useEffect } from 'react';

interface PageMetaOptions {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
}

export function usePageMeta({ title, description, canonical, ogImage = 'https://churchcentral.church/about.png' }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = `${title} | ICIMS`;

    document.title = fullTitle;

    const set = (selector: string, attr: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrValue] = selector.replace('meta[', '').replace(']', '').split('="');
        el.setAttribute(attrName, attrValue.replace('"', ''));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Primary
    set('meta[name="description"]', 'content', description);
    setLink('canonical', canonical);

    // Open Graph
    set('meta[property="og:title"]', 'content', fullTitle);
    set('meta[property="og:description"]', 'content', description);
    set('meta[property="og:url"]', 'content', canonical);
    set('meta[property="og:image"]', 'content', ogImage);

    // Twitter
    set('meta[name="twitter:title"]', 'content', fullTitle);
    set('meta[name="twitter:description"]', 'content', description);
    set('meta[name="twitter:url"]', 'content', canonical);
    set('meta[name="twitter:image"]', 'content', ogImage);
  }, [title, description, canonical, ogImage]);
}
