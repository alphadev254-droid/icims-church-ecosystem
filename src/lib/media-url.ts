const configuredStaticBase = (import.meta.env.VITE_STATIC_URL as string | undefined)?.trim();
const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const MEDIA_BASE_URL = (configuredStaticBase || apiBase?.replace(/\/api\/?$/, '') || 'http://localhost:5000')
  .replace(/["']/g, '')
  .replace(/\/+$/, '');

export function resolveMediaUrl(url?: string | null) {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return `${MEDIA_BASE_URL}/${url.replace(/^\/+/, '')}`;
}
