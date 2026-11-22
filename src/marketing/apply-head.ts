import { getHeadTags, type PageMetadata } from './seo';

export function applyPageMetadata(page: PageMetadata) {
  document.head.querySelectorAll('[data-route-meta]').forEach(tag => tag.remove());
  const fragment = document.createDocumentFragment();
  for (const { name, attributes, text } of getHeadTags(page)) {
    const tag = document.createElement(name);
    tag.setAttribute('data-route-meta', '');
    for (const [key, value] of Object.entries(attributes ?? {})) tag.setAttribute(key, value);
    if (text) tag.textContent = text;
    fragment.appendChild(tag);
  }
  document.head.appendChild(fragment);
}
