import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import {
  Users, Church, Calendar, HandCoins, BarChart3, MessageSquare,
  BookOpen, ClipboardList, Building2, TrendingUp, Shield, Globe,
  Zap, Lock, Smartphone, FileText, ArrowRight, CheckCircle2,
  Users2, UsersRound, Bell, Ticket, Receipt, ShieldCheck,
} from 'lucide-react';

const CATEGORY_LABEL: Record<string, string> = {
  core: 'Core',
  management: 'Management',
  communication: 'Communication',
  reporting: 'Reporting',
  events: 'Events',
};

const modules = [
  // Core
  { icon: Users,        cat: 'core',          num: '01', title: 'Members Management',           desc: 'This module helps you manage an online membership register of all the brethren in the church.' },
  { icon: Calendar,     cat: 'core',          num: '02', title: 'Events Management',             desc: 'This module allows you to create church events and share them with all your church members. It also issues tickets for all ticketed events.' },
  { icon: HandCoins,    cat: 'core',          num: '03', title: 'Giving & Donations',            desc: "Online giving is made easy! You can now manage your church's giving online." },
  { icon: ClipboardList,cat: 'core',          num: '04', title: 'Attendance Tracking',           desc: 'Report every church meeting and retrieve the data at any time in the future.' },
  { icon: BookOpen,     cat: 'core',          num: '05', title: 'Resources Library',             desc: 'This module gives you a platform to keep resource materials that can be accessed by all church members.' },
  { icon: Church,       cat: 'core',          num: '06', title: 'Churches Management',           desc: 'Create your church and manage how data flows from the churches under you in this module.' },
  { icon: Receipt,      cat: 'core',          num: '07', title: 'Transactions View',             desc: 'View all the giving transactions on your account as they happen.' },
  { icon: Users2,       cat: 'core',          num: '08', title: 'Cell & Fellowship Management',  desc: 'Manage cells and home fellowships using this module.' },
  // Management
  { icon: Users2,       cat: 'management',    num: '09', title: 'Users Management',              desc: 'Manage the users using this module.' },
  { icon: ShieldCheck,  cat: 'management',    num: '10', title: 'Roles & Permissions',           desc: 'Assign roles and permissions to the users using this module.' },
  { icon: Users2,       cat: 'management',    num: '11', title: 'Cell & Fellowship Management',  desc: 'Manage cells and home fellowships using this module.' },
  // Communication
  { icon: MessageSquare,cat: 'communication', num: '12', title: 'Communication & Announcements', desc: 'This module helps you manage your communication within the church. You communicate directly with your targeted audience in the church/ministry.' },
  { icon: UsersRound,   cat: 'communication', num: '13', title: 'Teams Management',              desc: "Assign your church members to teams to ensure they are engaged in the ministry's work." },
  { icon: Bell,         cat: 'communication', num: '14', title: 'Reminders Management',          desc: 'This module reminds you of special days, including anniversaries, birthdays, and ministry events, so that you do not miss any.' },
  // Reporting
  { icon: BarChart3,    cat: 'reporting',     num: '15', title: 'Reports & Analytics',           desc: 'Access all your giving, attendance, and membership reports using this module.' },
  { icon: TrendingUp,   cat: 'reporting',     num: '16', title: 'Performance Dashboard',         desc: 'Track all your Key Performance Indicators using this module.' },
  { icon: FileText,     cat: 'reporting',     num: '17', title: 'Advanced Reports',              desc: 'Export and analyze your data using other analytical softwares.' },
  // Events
  { icon: Ticket,       cat: 'events',        num: '18', title: 'Event Ticketing',               desc: 'Issue tickets for your events using this module.' },
  { icon: ClipboardList,cat: 'events',        num: '19', title: 'Event Attendance Tracking',     desc: 'Report your service attendance using this module.' },
];

const techSpecs = [
  { icon: Smartphone, title: 'Responsive Design',   desc: 'Works on desktop and mobile browsers without a native app install.' },
  { icon: Lock,       title: 'Enterprise Security', desc: 'Role-based access, PCI-compliant payments, encrypted data at rest.' },
  { icon: Globe,      title: 'Cloud Hosted',        desc: 'Scalable infrastructure for 5,000+ concurrent users.' },
  { icon: Zap,        title: 'Fast Performance',    desc: 'Page loads under 2 seconds on standard connections.' },
  { icon: FileText,   title: 'Export Reports',      desc: 'Excel and PDF exports for all major reports.' },
  { icon: Shield,     title: '99.5% Uptime',        desc: 'High availability with automated failover and disaster recovery.' },
];

const inView = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

export default function FeaturesPage() {
  usePageMeta({
    title: '19 Integrated Modules & Features',
    description: 'Explore all 19 ICIMS modules: membership, giving, attendance, events, communication, Bible study, revenue management, performance KPIs and more.',
    canonical: 'https://churchcentral.church/features',
    ogImage: 'https://churchcentral.church/features.png',
  });

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/features.png" alt="ICIMS Features" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="container relative z-10 py-28 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-4">Platform Features</p>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
              Everything your<br />ministry needs.
            </h1>
            <p className="text-white/65 text-lg leading-relaxed mb-8">
              19 modules, one login. Every aspect of church operations unified in a platform built for how ministries actually work.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-12 px-7">
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── MODULE COUNT STRIP ───────────────────────────────────────────── */}
      <section className="bg-accent py-5">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 text-accent-foreground">
            {[
              { n: '19', label: 'Integrated modules' },
              { n: '500+', label: 'Churches using ICIMS' },
              { n: '50k+', label: 'Members managed' },
              { n: '99.5%', label: 'Uptime SLA' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold">{s.n}</p>
                <p className="text-xs opacity-70 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES GRID ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="max-w-xl mb-14">
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">All modules</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground leading-tight">
              19 features,<br />built to work together.
            </h2>
          </div>

          {/* Grouped by category */}
          {Object.entries(
            modules.reduce((acc: Record<string, typeof modules>, m) => {
              if (!acc[m.cat]) acc[m.cat] = [];
              acc[m.cat].push(m);
              return acc;
            }, {})
          ).map(([cat, feats]) => (
            <div key={cat} className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs font-bold uppercase tracking-widest text-accent">{CATEGORY_LABEL[cat] ?? cat}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{feats.length} feature{feats.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {feats.map((m, i) => (
                  <motion.div
                    key={m.num}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={inView}
                    className="group border border-border rounded-xl p-5 bg-card hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                        <m.icon className="h-4 w-4 text-accent" />
                      </div>
                      <span className="text-xs font-bold text-accent/40 mt-2 font-mono">{m.num}</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1.5">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH SPECS ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-foreground dark:bg-card border-t border-border">
        <div className="container">
          <div className="max-w-xl mb-14">
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Under the hood</p>
            <h2 className="font-heading text-4xl font-bold text-background dark:text-foreground leading-tight">
              Enterprise-grade.<br />Church-friendly.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {techSpecs.map((s, i) => (
              <motion.div
                key={s.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={inView}
                className="flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-background dark:text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-background/55 dark:text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
                See it in action.
              </h2>
              <p className="text-muted-foreground max-w-md">
                Start Now.
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {['Centralized Management', 'Affordable packages ', 'Full Controll'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/register">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                  Get started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">Talk to sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
