export function getReferralMinistryName(referral: any): string {
  return referral?.ministryName
    || referral?.ministryAdmin?.ministryName
    || referral?.church?.name
    || 'Ministry';
}

export function formatReferralStatus(status?: string | null): string {
  return String(status || 'registered')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
