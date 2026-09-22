export function isReferrerVerified(referrer: any) {
  return referrer?.status === 'approved';
}
