import { Link } from 'react-router-dom';
import { TERMS_LABEL } from '@/lib/legal';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account, signing in, using ICIMS, registering as a member, booking tickets, giving, pledging, or using ministry tools, you agree to these Terms and Conditions. If you use ICIMS on behalf of a ministry, church, branch, team, or other organization, you confirm that you are authorized to do so.',
  },
  {
    title: '2. Account Responsibility',
    body: 'You are responsible for keeping your login details secure, for activity performed under your account, and for making sure the information you provide is accurate and lawful. You must not share accounts, impersonate another person, bypass access controls, or use ICIMS for unauthorized purposes.',
  },
  {
    title: '3. Ministry and Member Data',
    body: 'ICIMS helps ministries manage members, children, attendance, cells, events, giving, pledges, reminders, communications, reports, and related operations. Ministries are responsible for entering accurate data, assigning proper permissions, and using member data only for legitimate ministry purposes.',
  },
  {
    title: '4. Controller and Processor Responsibilities',
    body: 'For ministry records, member records, children records, church operations, attendance, and ministry communications, the relevant ministry or church is generally responsible for deciding why and how that data is used. ICIMS provides the platform, hosting, support, security, audit, reporting, payment reconciliation, and related processing tools. Each ministry must ensure it has a lawful basis, authority, consent, or legitimate ministry reason before uploading, collecting, or processing personal data through ICIMS.',
  },
  {
    title: '5. User Roles and Responsibilities',
    body: 'Ministry administrators are responsible for managing churches, roles, permissions, payment records, member records, and reports lawfully and carefully. Staff, branch users, cell leaders, team leaders, and custom-role users must only access and use data within their assigned scope. Members are responsible for accurate profile information, bookings, giving, pledges, and attendance activity performed through their accounts. System administrators may access platform data only for support, security, audit, billing, maintenance, and lawful operational purposes.',
  },
  {
    title: '6. Public Users, Guests, and Shared Links',
    body: 'Some ICIMS features may be used without a full account, including public giving links, event registration links, attendance check-in links, QR codes, and ministry website forms. By submitting information through those public pages, you confirm that the information is accurate and that ICIMS and the relevant ministry may use it for the requested ministry, event, attendance, payment, or communication purpose.',
  },
  {
    title: '7. Children, Guardians, and Safeguarding',
    body: 'Where children, youth, guardians, or family records are entered, the ministry or user entering the information is responsible for having the proper authority, consent, and safeguarding basis to do so. ICIMS provides tools for record keeping and ministry administration, but ministries remain responsible for their own safeguarding policies, legal duties, and pastoral decisions.',
  },
  {
    title: '8. Payments, Giving, Pledges, and Fees',
    body: 'Payments, donations, ticket purchases, pledges, withdrawals, and related transactions may be processed through third-party payment providers. Gateway charges, platform fees, taxes, reversals, disputes, settlement delays, and failed payments may apply. ICIMS may store transaction references, status updates, webhook responses, and audit records needed for reconciliation and support.',
  },
  {
    title: '9. Payment Confirmation, Reversals, and Disputes',
    body: 'A payment, giving record, pledge payment, event ticket, or withdrawal may depend on confirmation from a payment gateway, bank, mobile money operator, webhook, or manual reconciliation. Records may be updated, reversed, marked failed, reviewed, refunded, or corrected where a gateway response, chargeback, settlement issue, duplicate payment, fraud concern, or administrative error requires it. Users and ministries must cooperate with reasonable verification and reconciliation requests.',
  },
  {
    title: '10. International Providers and Data Transfers',
    body: 'ICIMS may use hosting, storage, payment, email, messaging, analytics, monitoring, backup, or support providers that operate in different countries. By using ICIMS, you understand that data may be processed or stored outside your country where necessary to provide, secure, support, and improve the service, subject to reasonable safeguards and applicable law.',
  },
  {
    title: '11. Acceptable Use',
    body: 'You must not use ICIMS for fraud, spam, illegal activity, harassment, unauthorized data access, malicious code, payment abuse, or activity that disrupts the platform or another ministry. We may restrict, suspend, or terminate access where misuse, security risk, unpaid obligations, or legal risk is identified.',
  },
  {
    title: '12. Service Availability',
    body: 'We work to keep ICIMS reliable, but the service may be interrupted by maintenance, network issues, provider outages, security incidents, payment gateway downtime, or events outside our control. ICIMS is provided without a guarantee of uninterrupted availability.',
  },
  {
    title: '13. Limitation of Liability',
    body: 'To the fullest extent allowed by law, ICIMS and its operators are not liable for indirect, incidental, special, consequential, punitive, or loss-of-profit damages arising from use of the platform. Ministries remain responsible for decisions made using platform data, exports, reports, communications, or payment records.',
  },
  {
    title: '14. Changes to These Terms',
    body: 'We may update these Terms from time to time. The version accepted during account creation or later acceptance may be stored on your account. Continued use after changes means you accept the updated Terms.',
  },
  {
    title: '15. Contact',
    body: 'Questions about these Terms, billing, security, privacy, or account access should be sent to the ICIMS support or administration contact provided by your ministry or platform administrator.',
  },
];

export default function TermsPage() {
  return (
    <main className="bg-background">
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <Link to="/register" className="text-sm font-medium text-accent hover:underline">
          Back to account creation
        </Link>
        <div className="mt-6">
          <p className="text-sm font-semibold text-accent">{TERMS_LABEL}</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-foreground">Terms and Conditions</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            These Terms are written to support clear use of ICIMS. They should be reviewed by qualified legal counsel for your jurisdiction and ministry structure.
          </p>
        </div>

        <div className="mt-8 space-y-6">
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
