import type { ServiceTime } from './types';

const STATIC_BASE =
  (import.meta.env.VITE_STATIC_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string)?.replace('/api', '');

export function resolveImg(url?: string): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${STATIC_BASE}${url}`;
}

export function parseServiceTimes(json?: string): ServiceTime[] {
  if (!json) return [];
  try { return JSON.parse(json) as ServiceTime[]; } catch { return []; }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}
