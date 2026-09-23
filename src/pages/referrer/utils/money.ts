export function money(value: number | string | null | undefined, currency = 'MWK') {
  const amount = Number(value || 0);
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function referrerCurrency(data: any) {
  return String(
    data?.currency ||
    data?.referrer?.market?.currencyCode ||
    data?.ledger?.find((entry: any) => entry?.currency)?.currency ||
    'MWK'
  ).toUpperCase();
}
