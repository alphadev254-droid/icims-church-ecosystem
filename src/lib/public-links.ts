const MAIN_DOMAIN = 'churchcentral.church';

export function getPublicSiteOrigin(subdomain?: string | null) {
  if (!subdomain) return window.location.origin;
  const host = subdomain.includes('.') ? subdomain : `${subdomain}.${MAIN_DOMAIN}`;
  return `https://${host}`;
}

export function buildPublicGivingUrl(campaignId: string, subdomain?: string | null, churchId?: string | null) {
  const url = `${getPublicSiteOrigin(subdomain)}/giving/${campaignId}`;
  return churchId ? `${url}?churchId=${encodeURIComponent(churchId)}` : url;
}

export function buildPublicEventUrl(eventId: string, subdomain?: string | null) {
  return `${getPublicSiteOrigin(subdomain)}/events/${eventId}`;
}

export function buildPublicCheckInUrl(token: string, subdomain?: string | null) {
  return `${getPublicSiteOrigin(subdomain)}/check-in/${token}`;
}
