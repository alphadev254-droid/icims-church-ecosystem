export const SITE_ORIGIN = 'https://churchcentral.church';
export const SITE_NAME = 'ICIMS';
export const SITE_DESCRIPTION = 'ICIMS is church management software for member and children’s records, ministry calendars, QR check-in, giving, events, bookings and discipleship.';

export interface PageMetadata {
  title: string;
  description: string;
  path?: string;
  index?: boolean;
  breadcrumb?: { title: string; path: string };
  label?: string;
}

export const appMetadata: PageMetadata = { title: SITE_NAME, description: SITE_DESCRIPTION };
export const notFoundMetadata: PageMetadata = {
  title: 'Page not found | ICIMS',
  description: 'This Church Central page could not be found.',
  index: false,
};

function structuredData(page: PageMetadata, path: string) {
  if (path === '/') {
    const siteId = `${SITE_ORIGIN}/#website`;
    const organizationId = `${SITE_ORIGIN}/#organization`;
    const softwareId = `${SITE_ORIGIN}/#software`;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': siteId, name: SITE_NAME, alternateName: 'Church Central', url: `${SITE_ORIGIN}/`, publisher: { '@id': organizationId } },
        { '@type': 'Organization', '@id': organizationId, name: SITE_NAME, url: `${SITE_ORIGIN}/`, logo: `${SITE_ORIGIN}/logo512.png`, email: 'support@churchcentral.church' },
        { '@type': 'WebApplication', '@id': softwareId, name: SITE_NAME, url: `${SITE_ORIGIN}/`, description: SITE_DESCRIPTION, applicationCategory: 'BusinessApplication', operatingSystem: 'Web browser', publisher: { '@id': organizationId } },
      ],
    };
  }

  const trail = [{ title: 'Home', path: '/' }, ...(page.breadcrumb ? [page.breadcrumb] : [])];
  trail.push({ title: page.label ?? page.title, path });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(({ title, path }, index) => ({
      '@type': 'ListItem', position: index + 1, name: title, item: `${SITE_ORIGIN}${path}`,
    })),
  };
}

interface HeadTag {
  name: 'title' | 'meta' | 'link' | 'script';
  attributes?: Record<string, string>;
  text?: string;
}

export function getHeadTags(page: PageMetadata): HeadTag[] {
  const meta = (name: string, content: string): HeadTag => ({ name: 'meta', attributes: { name, content } });
  const og = (property: string, content: string): HeadTag => ({ name: 'meta', attributes: { property: `og:${property}`, content } });
  const tags: HeadTag[] = [{ name: 'title', text: page.title }, meta('description', page.description)];
  if (page.index === false) tags.push(meta('robots', 'noindex, follow'));
  if (!page.path) return tags;

  const url = `${SITE_ORIGIN}${page.path}`;
  const image = `${SITE_ORIGIN}/og-image.png`;
  tags.push(
    { name: 'link', attributes: { rel: 'canonical', href: url } },
    og('type', 'website'), og('site_name', SITE_NAME), og('url', url),
    og('title', page.title), og('description', page.description), og('image', image),
    og('image:width', '1200'), og('image:height', '630'),
    og('image:alt', 'ICIMS church management software'),
    meta('twitter:card', 'summary_large_image'), meta('twitter:title', page.title),
    meta('twitter:description', page.description), meta('twitter:image', image),
    meta('twitter:image:alt', 'ICIMS church management software'),
  );
  if (page.index !== false) tags.push({
    name: 'script', attributes: { type: 'application/ld+json' },
    text: JSON.stringify(structuredData(page, page.path)).replace(/</g, '\\u003c'),
  });
  return tags;
}
