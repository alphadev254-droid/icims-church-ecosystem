import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import {
  Users, Church, Calendar, HandCoins, BarChart3, MessageSquare,
  BookOpen, ClipboardList, Building2, TrendingUp, Shield, Globe,
  ArrowRight, CheckCircle2, ChevronRight,
} from 'lucide-react';
import heroImage from '@/assets/hero-church.jpg';

const modules = [
  { icon: Users,        title: 'Members Management',           desc: 'Profiles, families & role tracking' },
  { icon: Calendar,     title: 'Events Management',            desc: 'Scheduling, registration & reporting' },
  { icon: HandCoins,    title: 'Giving & Donations',           desc: 'Tithes, offerings & pledges' },
  { icon: ClipboardList,title: 'Attendance Tracking',          desc: 'Service scheduling & real-time tracking' },
  { icon: BookOpen,     title: 'Resources Library',            desc: 'Digital resources & study plans' },
  { icon: Church,       title: 'Churches Management',          desc: 'Multi-level church hierarchy' },
  { icon: BarChart3,    title: 'Transactions View',            desc: 'Consolidated tracking & audit trails' },
  { icon: Building2,    title: 'Cell & Fellowship Management', desc: 'Cells, meetings & member assignments' },
  { icon: Users,        title: 'Users Management',             desc: 'Accounts, roles & access control' },
  { icon: MessageSquare,title: 'Communication',                desc: 'Announcements & prayer requests' },
  { icon: Users,        title: 'Teams Management',             desc: 'Ministry teams & task assignment' },
  { icon: TrendingUp,   title: 'Performance Dashboard',        desc: 'KPI tracking & automated measurement' },
  { icon: BarChart3,    title: 'Reports & Analytics',          desc: 'Exportable reports across all modules' },
  { icon: Calendar,     title: 'Event Ticketing',              desc: 'Paid & free tickets, QR check-in' },
  { icon: ClipboardList,title: 'Reminders Management',         desc: 'Birthdays, anniversaries & follow-ups' },
];

const stats = [
  { value: '500+',   label: 'Churches onboarded' },
  { value: '50k+',   label: 'Members managed' },
  { value: '99.9%',  label: 'Platform uptime' },
  { value: '15+',    label: 'Integrated modules' },
];

const whys = [
  {
    icon: Shield,
    title: 'Secure by design',
    desc: 'Role-based access control, encrypted data at rest, and PCI-compliant payment processing built in from day one.',
  },
  {
    icon: Building2,
    title: 'Built for hierarchy',
    desc: 'National → Regional → District → Local. Every level gets the right view, the right permissions, the right data.',
  },
  {
    icon: BarChart3,
    title: 'Data you can act on',
    desc: 'Real-time dashboards for giving trends, attendance patterns, and ministry performance — not just numbers.',
  },
  {
    icon: Globe,
    title: 'Scales with you',
    desc: 'Cloud-hosted infrastructure that handles 5,000+ concurrent users. Start small, grow without limits.',
  },
];

const inView = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.45 },
  }),
};

export default function LandingPage() {
  usePageMeta({
    title: 'The Complete Church Management Ecosystem',
    description: 'ICIMS is a cloud-based church management platform with 12 integrated modules — membership, giving, attendance, events, communication and more.',
    canonical: 'https://churchcentral.church/',
    ogImage: 'https://churchcentral.church/about.png',
  });

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Church community" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>

        <div className="container relative z-10 py-24 md:py-32">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-accent text-sm font-semibold tracking-widest uppercase mb-5"
            >
              Church Management Platform
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6"
            >
              Run your church.<br />
              <span className="text-accent">Not spreadsheets.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.25 }}
              className="text-white/70 text-lg md:text-xl mb-10 max-w-xl leading-relaxed"
            >
              15+ integrated modules covering every aspect of ministry — from membership and giving to events, attendance, and performance tracking.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.38 }}
              className="flex flex-wrap gap-3"
            >
              <Link to="/register">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-12 px-7 text-base">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="border-white/30 hover:text-white hover:bg-white/10 h-12 px-7 text-base">
                  See all features
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap gap-5 mt-10 text-white/50 text-sm"
            >
              {['Affordable Packages', 'Full Controll', '24/7 support'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> {t}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="bg-accent">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={inView}
              >
                <p className="text-2xl md:text-3xl font-bold text-accent-foreground">{s.value}</p>
                <p className="text-xs text-accent-foreground/70 mt-0.5 uppercase tracking-wide">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ICIMS ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Why ICIMS</p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
                Built for how<br />churches actually work.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Most software forces churches to adapt to it. ICIMS was designed around the real structure of ministry — hierarchy, accountability, and community.
              </p>
              <Link to="/features">
                <Button variant="outline" className="gap-2">
                  Explore the platform <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {whys.map((w, i) => (
                <motion.div
                  key={w.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={inView}
                  className="border border-border rounded-xl p-5 bg-card hover:border-accent/40 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                    <w.icon className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{w.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULES ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-foreground dark:bg-card">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-14">
            {/* Left */}
            <div>
              <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">What's included</p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-background dark:text-foreground leading-tight">
                15+ modules.<br />One platform.
              </h2>
            </div>
            {/* Right */}
            <div className="flex flex-col gap-5">
              <p className="font-heading text-2xl md:text-3xl font-bold text-background/70 dark:text-foreground/60 leading-snug">
                Join hundreds of churches already using the platform.
              </p>
              <div>
                <Link to="/register">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-11 px-6">
                    Join now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-background/10 dark:bg-border rounded-xl overflow-hidden border border-background/10 dark:border-border">
            {modules.map((m, i) => (
              <motion.div
                key={m.title + i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={inView}
                className="bg-foreground dark:bg-card p-5 hover:bg-foreground/90 dark:hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-md bg-accent/15 flex items-center justify-center shrink-0">
                    <m.icon className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <span className="text-xs font-bold text-accent opacity-60">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="font-semibold text-background dark:text-foreground text-sm mb-1">{m.title}</h3>
                <p className="text-xs text-background/50 dark:text-muted-foreground leading-relaxed">{m.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* View all */}
          <div className="mt-8 flex justify-center">
            <Link to="/features">
              <Button variant="outline" className="border-background/30 dark:border-border  dark:text-foreground hover:bg-background/10 dark:hover:bg-muted gap-2">
                View all modules <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="max-w-xl mb-14">
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Trusted by ministries</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground leading-tight">
              From small branches<br />to large ministries.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "ICIMS transformed how we track attendance and giving across all our branches. What used to take days now takes minutes.",
                name: "Pastor James M.",
                role: "National Director, Malawi",
              },
              {
                quote: "The multi-level hierarchy was exactly what we needed. Every regional leader sees their data, nothing more.",
                name: "Rev. Sarah K.",
                role: "Regional Coordinator, Kenya",
              },
              {
                quote: "Our giving increased 40% after members could give online. The transparency built trust in our congregation.",
                name: "Elder David N.",
                role: "Finance Lead, Nairobi",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={inView}
                className="border border-border rounded-xl p-6 bg-card"
              >
                <p className="text-foreground/80 leading-relaxed mb-5 text-sm">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-foreground dark:bg-accent">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-background dark:text-accent-foreground leading-tight mb-5">
              Ready to get started?
            </h2>
            <p className="text-background/60 dark:text-accent-foreground/70 text-lg mb-10 leading-relaxed">
              Join hundreds of churches already using ICIMS to run their ministry with clarity and confidence.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="bg-accent dark:bg-background text-accent-foreground dark:text-foreground hover:bg-accent/90 dark:hover:bg-background/90 gap-2 h-12 px-8 text-base">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-background/30 dark:border-accent-foreground/30 hover:text-white dark:text-accent-foreground hover:bg-background/10 dark:hover:bg-accent-foreground/10 h-12 px-8 text-base">
                  Talk to sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
