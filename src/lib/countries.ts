export interface CountryOption {
  id?: string;
  name: string;
  iso2?: string;
  iso3?: string | null;
  phoneCode?: string | null;
  currencyCode?: string | null;
  pricingMarket?: {
    code: string;
    name: string;
    currencyCode: string;
    packageGateway: string;
  };
}

export const FALLBACK_COUNTRIES: CountryOption[] = [
  { name: 'Malawi', iso2: 'MW', phoneCode: '+265', currencyCode: 'MWK' },
  { name: 'Kenya', iso2: 'KE', phoneCode: '+254', currencyCode: 'KES' },
  { name: 'Ghana', iso2: 'GH', phoneCode: '+233', currencyCode: 'GHS' },
  { name: 'Nigeria', iso2: 'NG', phoneCode: '+234', currencyCode: 'NGN' },
  { name: 'South Africa', iso2: 'ZA', phoneCode: '+27', currencyCode: 'ZAR' },
  { name: 'Tanzania', iso2: 'TZ', phoneCode: '+255', currencyCode: 'TZS' },
  { name: 'Uganda', iso2: 'UG', phoneCode: '+256', currencyCode: 'UGX' },
  { name: 'Rwanda', iso2: 'RW', phoneCode: '+250', currencyCode: 'RWF' },
  { name: 'Zambia', iso2: 'ZM', phoneCode: '+260', currencyCode: 'ZMW' },
  { name: 'Zimbabwe', iso2: 'ZW', phoneCode: '+263', currencyCode: 'USD' },
  { name: 'United States', iso2: 'US', phoneCode: '+1', currencyCode: 'USD' },
  { name: 'United Kingdom', iso2: 'GB', phoneCode: '+44', currencyCode: 'GBP' },
];

export function phonePlaceholderForCountry(country?: CountryOption | null) {
  if (country?.phoneCode) return `${country.phoneCode}...`;
  if (country?.name === 'Malawi') return '+265...';
  if (country?.name === 'Kenya') return '+254...';
  return 'Include country code';
}
