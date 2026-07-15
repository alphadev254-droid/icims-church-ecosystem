const MAIN_DOMAIN = 'churchcentral.church';

export function getPublicSiteOrigin(subdomain?: string | null) {
  if (!subdomain) return window.location.origin;
  const host = subdomain.includes('.') ? subdomain : `${subdomain}.${MAIN_DOMAIN}`;
  return `https://${host}`;
}

export function buildPublicGivingUrl(campaignId: string, subdomain?: string | null, churchIds?: string | string[] | null) {
  const url = `${getPublicSiteOrigin(subdomain)}/giving/${campaignId}`;
  const ids = (Array.isArray(churchIds) ? churchIds : churchIds ? [churchIds] : [])
    .map(id => id.trim())
    .filter(Boolean);

  if (ids.length === 0) return url;
  if (ids.length === 1) return `${url}?churchId=${encodeURIComponent(ids[0])}`;
  return `${url}?churchIds=${encodeURIComponent(ids.join(','))}`;
}

export function buildPublicEventUrl(eventId: string, subdomain?: string | null) {
  return `${getPublicSiteOrigin(subdomain)}/events/${eventId}`;
}

export function buildPublicCheckInUrl(token: string, subdomain?: string | null) {
  return `${getPublicSiteOrigin(subdomain)}/check-in/${token}`;
}
