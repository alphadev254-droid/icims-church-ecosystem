import { Link } from 'react-router-dom';
import { PRIVACY_LABEL } from '@/lib/legal';

const sections = [
  {
    title: '1. Information We Collect',
    body: 'ICIMS may collect account details, contact details, church membership information, children and guardian records, attendance records, event bookings, giving and pledge records, wallet and withdrawal data, device tokens, support information, logs, request metadata, and usage activity needed to operate the platform.',
  },
  {
    title: '2. How Information Is Used',
    body: 'We use information to create accounts, authenticate users, manage ministry operations, process payments, generate reports, send reminders and notifications, detect errors, prevent abuse, provide support, reconcile transactions, maintain security, and comply with legal or operational obligations.',
  },
  {
    title: '3. Ministry Access and Responsibility',
    body: 'Authorized ministry administrators may access data for churches, branches, teams, cells, members, events, attendance, giving, and reports according to their permissions. Ministries are responsible for granting appropriate access and using personal data responsibly.',
  },
  {
    title: '4. Data Controller and Processor Roles',
    body: 'For ministry operations, member records, children records, attendance, giving, pledges, events, and communications, the relevant ministry or church generally determines the purpose and use of the data. ICIMS processes data as the platform provider for hosting, security, support, reporting, payment reconciliation, backups, audit logs, and related operations. ICIMS may also act as an independent controller for its own platform administration, security, billing, compliance, analytics, and support records.',
  },
  {
    title: '5. Role-Based Data Access',
    body: 'ICIMS uses roles and permissions to control access. Ministry administrators, branch users, cell leaders, team leaders, finance users, members, and custom-role users may see different data depending on their assigned scope. System administrators may access data for support, troubleshooting, billing, security, audit, backups, compliance, and platform operations.',
  },
  {
    title: '6. Public Forms, Guests, and Shared Links',
    body: 'When a person uses a public giving page, event registration page, attendance link, QR code, member registration invite, or ministry website form, ICIMS may collect the information submitted on that form and connect it to the relevant ministry, church, campaign, event, attendance record, pledge, or transaction. If submitted details match an existing ministry member, the system may use that match to improve record accuracy.',
  },
  {
    title: '7. Payments and Third Parties',
    body: 'Payment data may be shared with payment gateways, banks, mobile money operators, notification providers, hosting providers, analytics or observability tools, and other service providers needed to deliver ICIMS. Sensitive payment credentials are handled by payment processors where applicable.',
  },
  {
    title: '8. Payment Records and Reconciliation',
    body: 'ICIMS may store payment initiation payloads, gateway responses, webhook data, transaction references, payout records, withdrawal records, reconciliation notes, failure reasons, refund or reversal information, and related audit metadata. This information is used to confirm payments, investigate failed or disputed transactions, support accounting, and protect the platform and ministries from fraud or error.',
  },
  {
    title: '9. International Processing and Transfers',
    body: 'ICIMS and its service providers may process, store, transmit, back up, or support data in countries other than the country where a user, ministry, or church is located. This may happen through hosting, payment gateways, email providers, monitoring tools, backup services, and support systems. We use these providers to operate and secure the service and expect them to handle data under appropriate confidentiality, security, and legal obligations.',
  },
  {
    title: '10. Your Data Rights',
    body: 'Depending on applicable law, you may have rights to request access to your personal data, correction of inaccurate data, deletion or erasure, restriction of processing, objection to processing, portability of data, or withdrawal of consent where processing is based on consent. Some requests may be limited where data must be retained for payment reconciliation, accounting, audit logs, security, backups, legal obligations, safeguarding, or legitimate ministry administration.',
  },
  {
    title: '11. Security and Audit Records',
    body: 'We use technical and operational safeguards such as access controls, authentication, audit logs, backups, monitoring, and restricted administrative access. No system is completely risk-free, so users must also protect passwords and report suspicious activity.',
  },
  {
    title: '12. Children and Guardian Data',
    body: 'Where children records are managed, ministries should ensure they have the proper authority or consent to collect and use that information. ICIMS stores child and guardian data only to support legitimate ministry administration and safeguarding workflows.',
  },
  {
    title: '13. Retention',
    body: 'Information may be retained while accounts, ministries, transactions, audit requirements, backups, reports, or legal obligations require it. Some cancelled or inactive records may be retained to preserve financial, attendance, and operational history.',
  },
  {
    title: '14. Your Choices',
    body: 'You may request correction, access, or account assistance through your ministry administrator or ICIMS support contact. Some requests may be limited where records must be retained for security, payment reconciliation, legal, or audit reasons.',
  },
  {
    title: '15. Updates',
    body: 'We may update this Privacy Policy as the platform, laws, or operational practices change. The version accepted during account creation or later acceptance may be stored on your account.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-background">
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <Link to="/register" className="text-sm font-medium text-accent hover:underline">
          Back to account creation
        </Link>
        <div className="mt-6">
          <p className="text-sm font-semibold text-accent">{PRIVACY_LABEL}</p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This Policy explains how ICIMS handles data for ministry management. It should be reviewed by qualified legal counsel for your jurisdiction and ministry obligations.
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
