import { Link } from 'react-router-dom';
import { CheckCircle2, HandCoins, Link2, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePageMeta } from '@/hooks/usePageMeta';

const heroImage = '/marketers.png';

const steps = [
  {
    icon: Link2,
    title: 'Register as a marketer',
    description: 'Create your marketer account and verify your email address before accessing your dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'Share your marketing link',
    description: 'Use your unique code or link when introducing churches and ministries to ICIMS.',
  },
  {
    icon: HandCoins,
    title: 'Earn on package payments',
    description: 'When a referred ministry pays for an ICIMS package, 20% is credited to your wallet.',
  },
  {
    icon: Wallet,
    title: 'Withdraw from your wallet',
    description: 'Set your payout phone and provider, then request withdrawals securely with OTP verification.',
  },
];

export default function ReferralsPage() {
  usePageMeta({
    title: 'ICIMS Marketer Program',
    description: 'Market ICIMS to churches and ministries and earn commission when they pay for packages.',
    canonical: 'https://churchcentral.church/referrals',
  });

  return (
    <div className="overflow-x-hidden">
      <section className="relative flex min-h-[460px] items-center overflow-hidden md:min-h-[540px]">
        <div className="absolute inset-0">
          <img src={heroImage} alt="ICIMS marketers" className="h-full w-full object-contain" fetchPriority="high" loading="eager" />
          <div className="absolute inset-0 bg-black/78" />
        </div>
      </section>

      <section className="border-b bg-accent py-5">
        <div className="container">
          <div className="grid gap-5 text-center text-accent-foreground sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold">20%</p>
              <p className="text-xs uppercase tracking-wide opacity-75">Package commission</p>
            </div>
            <div>
              <p className="text-2xl font-bold">Wallet</p>
              <p className="text-xs uppercase tracking-wide opacity-75">Ledger-based earnings</p>
            </div>
            <div>
              <p className="text-2xl font-bold">OTP</p>
              <p className="text-xs uppercase tracking-wide opacity-75">Secure withdrawals</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">How it works</p>
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Simple marketer flow</h2>
          <p className="mt-3 text-muted-foreground">
            The marketer module is separate from church operations, so marketers get their own dashboard without touching ministry data.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step {index + 1}</p>
                  <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-muted/40 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              'Each marketer gets a unique code and link.',
              'Commission is recorded separately on the payment.',
              'Wallet balance uses ledger entries for accuracy.',
              'Withdrawals require OTP confirmation.',
            ].map(item => (
              <div key={item} className="flex gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-heading text-xl font-semibold">Ready to start?</h3>
              <p className="text-sm text-muted-foreground">Create your marketer account and verify your email.</p>
            </div>
            <Link to="/register/referrer">
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto">
                Register now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
