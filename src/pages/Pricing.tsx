import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import apiClient from '@/lib/api-client';
import pricingHero from '@/assets/prices.png';

interface PkgFeature {
  name: string;
  displayName: string;
  category: string;
}

interface Package {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxChurches?: number | null;
  maxMembers?: number | null;
  maxEvents?: number | null;
  maxGivings?: number | null;
  maxCells?: number | null;
  features: PkgFeature[];
}

interface Feature {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
}

interface Rates {
  kesRate: number;
  mwkRate: number;
  kenyaDiscount: number;
  malawiDiscount: number;
}

type Country = 'Kenya' | 'Malawi';

function fmtCurrency(usd: number, country: Country, rates: Rates) {
  if (country === 'Kenya') {
    const val = Math.round(usd * rates.kesRate * rates.kenyaDiscount);
    return `KES ${val.toLocaleString()}`;
  }
  const val = Math.round(usd * rates.mwkRate * rates.malawiDiscount);
  return `MWK ${val.toLocaleString()}`;
}

function limitLabel(v: number | null | undefined) {
  if (v == null) return '∞';
  if (v >= 999999) return 'Unlimited';
  return v.toLocaleString();
}

const ACCENT: Record<string, string> = {
  basic:    'border-slate-300 dark:border-slate-600',
  standard: 'border-blue-400 dark:border-blue-500',
  premium:  'border-accent',
};
const BADGE: Record<string, string> = {
  basic:    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  premium:  'bg-accent/20 text-accent',
};

const inView = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

export default function PricingPage() {
  usePageMeta({
    title: 'Pricing — ICIMS',
    description: 'Simple, transparent pricing for every ministry size. Choose the plan that fits your church.',
    canonical: 'https://churchcentral.church/pricing',
  });

  const [country, setCountry] = useState<Country>('Kenya');

  const { data: packages = [], isLoading } = useQuery<Package[]>({
    queryKey: ['public-packages'],
    queryFn: async () => { const { data } = await apiClient.get('/packages'); return data.data; },
    staleTime: 5 * 60_000,
  });

  const { data: allFeatures = [] } = useQuery<Feature[]>({
    queryKey: ['public-features'],
    queryFn: async () => { const { data } = await apiClient.get('/packages/features'); return data.data; },
    staleTime: 5 * 60_000,
  });

  const { data: rates } = useQuery<Rates>({
    queryKey: ['public-rates'],
    queryFn: async () => { const { data } = await apiClient.get('/packages/rates'); return data.data; },
    staleTime: 60 * 60_000,
  });

  // Default rates if not loaded yet
  const r: Rates = rates ?? { kesRate: 129, mwkRate: 1730, kenyaDiscount: 1, malawiDiscount: 0.5 };

  // Only non-limit features for comparison table
  const displayFeatures = allFeatures.filter(f => f.category !== 'limit');

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO with background image ──────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={pricingHero}
            alt="Church congregation"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="container relative z-10 py-28 md:py-36 text-center max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-4">Pricing</p>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
              Simple, honest pricing.
            </h1>
            <p className="text-white/65 text-lg leading-relaxed mb-8">
              No hidden fees. No surprises. Pick the plan that fits your ministry and scale as you grow.
            </p>
            <div className="flex flex-wrap justify-center gap-5 text-sm text-white/60">
              {['Affordable Prices', 'Dedicated support', 'Full feature access'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── COUNTRY TOGGLE + CARDS ──────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="container">

          {/* Country toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-1 bg-background border border-border rounded-xl p-1 shadow-sm">
              <p className="text-xs text-muted-foreground px-3">Pricing for:</p>
              {(['Kenya', 'Malawi'] as Country[]).map(c => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    country === c
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c === 'Kenya' ? '🇰🇪' : '🇲🇼'} {c}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {packages.map((pkg, i) => {
                const isPremium = pkg.name === 'premium';
                const monthly = fmtCurrency(pkg.priceMonthly, country, r);
                const yearly  = fmtCurrency(pkg.priceYearly,  country, r);
                const saving  = pkg.priceMonthly > 0
                  ? Math.round((1 - pkg.priceYearly / (pkg.priceMonthly * 12)) * 100)
                  : 0;

                return (
                  <motion.div
                    key={pkg.id}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={inView}
                    className={`relative flex flex-col rounded-2xl border-2 bg-card overflow-hidden transition-transform ${
                      ACCENT[pkg.name] ?? 'border-border'
                    } ${isPremium ? 'shadow-xl scale-[1.02]' : ''}`}
                  >
                    {isPremium && (
                      <div className="bg-accent text-accent-foreground text-xs font-semibold text-center py-1.5 tracking-wide uppercase">
                        Most Popular
                      </div>
                    )}

                    <div className="p-7 flex-1 flex flex-col">
                      {/* Header */}
                      <div className="mb-6">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${BADGE[pkg.name] ?? ''}`}>
                          {pkg.displayName}
                        </span>
                        {pkg.description && (
                          <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                        )}
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-4xl font-bold text-foreground">{monthly}</span>
                          <span className="text-muted-foreground text-sm">/mo</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {yearly}/yr
                          {saving > 0 && <span className="ml-1.5 text-accent font-medium">· Save {saving}%</span>}
                        </p>
                      </div>

                      {/* Limits */}
                      <div className="border border-border rounded-xl p-4 bg-muted/30 mb-5 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Limits</p>
                        {[
                          { label: 'Churches',  value: pkg.maxChurches },
                          { label: 'Members',   value: pkg.maxMembers },
                          { label: 'Events/mo', value: pkg.maxEvents },
                          { label: 'Campaigns', value: pkg.maxGivings },
                          { label: 'Cells',     value: pkg.maxCells },
                        ].filter(l => l.value !== undefined).map(l => (
                          <div key={l.label} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{l.label}</span>
                            <span className="font-bold">{limitLabel(l.value)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Features */}
                      <div className="space-y-2 flex-1 mb-6">
                        {pkg.features.slice(0, 8).map(f => (
                          <div key={f.name} className="flex items-center gap-2 text-sm">
                            <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                            <span className="text-foreground">{f.displayName}</span>
                          </div>
                        ))}
                        {pkg.features.length > 8 && (
                          <p className="text-xs text-muted-foreground pl-5">+{pkg.features.length - 8} more features</p>
                        )}
                      </div>

                      {/* CTA */}
                      <Link to="/register">
                        <Button
                          className={`w-full h-11 gap-2 ${isPremium ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                          variant={isPremium ? 'default' : 'outline'}
                        >
                          Get started <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURE COMPARISON TABLE ────────────────────────────────────── */}
      {!isLoading && packages.length > 0 && displayFeatures.length > 0 && (
        <section className="py-20 bg-background border-t border-border">
          <div className="container">
            <div className="max-w-xl mb-12">
              <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Compare plans</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Everything side by side.
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-5 py-4 font-semibold text-foreground">Feature</th>
                    <th className="text-left px-5 py-4 font-semibold text-muted-foreground text-xs hidden md:table-cell">Description</th>
                    {packages.map(pkg => (
                      <th key={pkg.id} className="px-4 py-4 text-center font-semibold text-foreground">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full ${BADGE[pkg.name] ?? ''}`}>
                          {pkg.displayName}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayFeatures.map((feat, i) => (
                    <tr key={feat.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">{feat.displayName}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-xs">
                        {feat.description ?? '—'}
                      </td>
                      {packages.map(pkg => {
                        const included = pkg.features.some(f => f.name === feat.name);
                        return (
                          <td key={pkg.id} className="px-4 py-3 text-center">
                            {included
                              ? <Check className="h-4 w-4 text-accent mx-auto" />
                              : <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-foreground dark:bg-accent">
        <div className="container text-center max-w-xl mx-auto">
          <h2 className="font-heading text-4xl font-bold text-background dark:text-accent-foreground leading-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-background/60 dark:text-accent-foreground/70 mb-8">
            Create your account and start managing your ministry today.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="bg-accent dark:bg-background text-accent-foreground dark:text-foreground hover:bg-accent/90 gap-2 h-12 px-8">
                Create account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-background/30 dark:border-accent-foreground/30  dark:text-accent-foreground h-12 px-8">
                Talk to sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
