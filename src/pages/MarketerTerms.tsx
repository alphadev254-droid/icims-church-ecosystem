import { Link } from 'react-router-dom';

const scheduleItems = [
  { label: 'Standard commission rate', value: '20% of eligible subscription fees actually received by ICIMS' },
  { label: 'Commission eligibility period', value: '4 running calendar months from the first paid subscription' },
  { label: 'Minimum payout threshold', value: 'MWK 10,000, unless a market-specific threshold is configured' },
  { label: 'Payout review target', value: 'Within 3 business days after an eligible payout is submitted for review' },
  { label: 'Payment target after approval', value: 'Within 5 business days after approval, subject to provider confirmation' },
];

const sections = [
  {
    title: '1. Marketer Role',
    body: 'As an ICIMS marketer, your role is to introduce churches and ministries to ICIMS through your assigned marketer code or link. You are not an employee, agent, legal representative, or partner of ICIMS unless a signed agreement expressly says otherwise.',
  },
  {
    title: '2. Approval and Account Verification',
    body: 'Creating a marketer account does not automatically approve you to earn commission. ICIMS may require email verification, profile details, payout details, and a signed marketer agreement before your marketer account is approved.',
  },
  {
    title: '3. Prospects and No Self-Referrals',
    body: 'A referred ministry must register through your marketer code or link, or enter your valid marketer code during registration. Self-referrals, duplicate prospects, fake registrations, close-family referrals using your own contact details, or prospects already recorded by ICIMS or another marketer may be rejected.',
  },
  {
    title: '4. Commission Eligibility',
    body: 'Commission is calculated by the ICIMS billing system from eligible subscription fees actually received. The standard rate is 20%, and the standard eligibility period is 4 running calendar months per referred ministry from its first paid subscription.',
  },
  {
    title: '5. Non-Commissionable Charges',
    body: 'Commission is not earned on setup or onboarding fees, SMS, WhatsApp, payment gateway charges, mobile money charges, refunds, chargebacks, custom development, consulting, training, taxes, or any other non-subscription charge.',
  },
  {
    title: '6. Multi-Month Payments',
    body: 'If a referred ministry pays for multiple months at once, only the part of the subscription that falls within the active eligibility period is commissionable. Unpaid months still count toward the running eligibility period and do not extend it.',
  },
  {
    title: '7. Wallet, Statements, and Payouts',
    body: 'Your marketer dashboard may show referred ministries, commission ledger entries, available balance, and payout settings. Payouts are subject to approval, minimum payout thresholds, provider fees, payout account validation, and payment provider confirmation.',
  },
  {
    title: '8. Refunds and Reversals',
    body: 'If a referred ministry payment is refunded, charged back, reversed, or corrected, ICIMS may cancel the related unpaid commission or deduct the reversed amount from future available commission balances.',
  },
  {
    title: '9. Conduct and Compliance',
    body: 'You must promote ICIMS honestly, lawfully, and professionally. You must not misrepresent pricing, features, commission rules, approval status, legal authority, or customer obligations. Fraud, bribery, spam, harassment, misleading claims, or conduct that damages ICIMS may lead to suspension or termination.',
  },
  {
    title: '10. Confidentiality and Data Protection',
    body: 'You must keep non-public ICIMS, prospect, customer, pricing, billing, technical, and business information confidential. Any personal data received during marketing must be handled lawfully, securely, and only for approved ICIMS marketing purposes.',
  },
  {
    title: '11. Brand and Marketing Materials',
    body: 'ICIMS names, logos, links, documents, screenshots, platform materials, and brand assets remain ICIMS property. You may use them only as allowed by ICIMS and must stop using or remove them if requested.',
  },
  {
    title: '12. Taxes and Expenses',
    body: 'You are responsible for your own costs, taxes, levies, phone charges, internet costs, transport, marketing costs, and statutory obligations related to marketer activity and payouts.',
  },
  {
    title: '13. Suspension, Rejection, and Termination',
    body: 'ICIMS may reject prospects, suspend commission eligibility, hold payouts for review, or terminate marketer access where fraud, breach, misuse, unresolved verification, legal risk, or policy violation is suspected or confirmed.',
  },
  {
    title: '14. Signed Agreement Controls',
    body: 'These terms summarize key marketer rules for registration and platform use. If you sign a marketer agreement and there is a conflict between these online terms and the signed agreement, the signed agreement and approved ICIMS records control for that marketer relationship.',
  },
];

export default function MarketerTermsPage() {
  return (
    <main className="bg-background">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <Link to="/register/referrer" className="text-sm font-medium text-accent hover:underline">
          Back to marketer registration
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold text-accent">ICIMS Marketer Program</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-foreground">Marketer Terms and Conditions</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            These terms apply to people registering to market ICIMS and earn approved commission from eligible ministry subscriptions.
          </p>
        </div>

        <section className="mt-8 rounded-lg border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground">Schedule Summary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {scheduleItems.map((item) => (
              <div key={item.label} className="rounded-md border bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold text-foreground">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
