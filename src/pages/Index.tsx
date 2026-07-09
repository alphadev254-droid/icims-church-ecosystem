import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import {
  Users, Church, Calendar, HandCoins, BarChart3, MessageSquare,
  BookOpen, ClipboardList, Building2, TrendingUp, Shield, Globe,
  ArrowRight, Baby, CheckCircle2, ChevronRight, Smartphone, Download, X,
} from 'lucide-react';
const heroImage = 'https://media.aircnc.co.ke/media-images/5ba1d3df-18b5-40df-8681-430b07ff2505.webp';
import { BookDemoDialog } from '@/components/BookDemoDialog';

const modules = [
  { icon: Users,        title: 'Members Management',            desc: 'This module helps you manage an online membership register of all the brethren in the church.' },
  { icon: Baby,         title: 'Children & Dependents',         desc: 'Record children, link them to parents or guardians, and keep family relationships clear inside the church register.' },
  { icon: Calendar,     title: 'Events Management',             desc: 'This module allows you to create church events and share them with all your church members. It also issues tickets for all ticketed events.' },
  { icon: HandCoins,    title: 'Giving',            desc: "Online giving is made easy! You can now manage your church's giving online." },
  { icon: ClipboardList,title: 'Attendance Tracking',           desc: 'Report every church meeting and retrieve the data at any time in the future.' },
  { icon: BookOpen,     title: 'Resources Library',             desc: 'This module gives you a platform to keep resource materials that can be accessed by all church members.' },
  { icon: Church,       title: 'Churches Management',           desc: 'Create your church and manage how data flows from the churches under you in this module.' },
  { icon: BarChart3,    title: 'Transactions View',             desc: 'View all the giving transactions on your account as they happen.' },
  { icon: Building2,    title: 'Cell & Fellowship Management',  desc: 'Manage cells and home fellowships using this module.' },
  { icon: Users,        title: 'Users Management',              desc: 'Manage the users using this module.' },
  { icon: MessageSquare,title: 'Communication & Announcements', desc: 'This module helps you manage your communication within the church. You communicate directly with your targeted audience in the church/ministry.' },
  { icon: Users,        title: 'Teams Management',              desc: "Assign your church members to teams to ensure they are engaged in the ministry's work." },
  { icon: TrendingUp,   title: 'Performance Dashboard',         desc: 'Track all your Key Performance Indicators using this module.' },
  { icon: BarChart3,    title: 'Reports & Analytics',           desc: 'Access all your giving, attendance, and membership reports using this module.' },
  { icon: Calendar,     title: 'Event Ticketing',               desc: 'Issue tickets for your events using this module.' },
  { icon: ClipboardList,title: 'Reminders Management',          desc: 'This module reminds you of special days, including anniversaries, birthdays, and ministry events, so that you do not miss any.' },
];

const stats = [
  { value: '500+',   label: 'Churches onboarded' },
  { value: '50k+',   label: 'Members managed' },
  { value: '99.9%',  label: 'Platform uptime' },
  { value: '16+',    label: 'Integrated modules' },
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
  const [demoOpen, setDemoOpen] = useState(false);
  const { canInstall, install, showInstallUI, isIOS, isChromiumBased } = usePWAInstall();
  const [iosHint, setIosHint] = useState(false);
  const [desktopHint, setDesktopHint] = useState(false);
  const handleInstall = async () => {
    if (canInstall) { await install(); }
    else if (isIOS) { setIosHint(true); }
    else { setDesktopHint(true); }
  };

  usePageMeta({
    title: 'The Complete Church Management Ecosystem',
    description: 'ICIMS is a cloud-based church management platform with integrated modules for membership, children and dependents, giving, attendance, events, communication and more.',
    canonical: 'https://churchcentral.church/',
    ogImage: 'https://media.aircnc.co.ke/media-images/420984ab-7d48-40fc-b653-a09eb1428d14.webp',
  });

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Church community" className="h-full w-full object-cover" fetchPriority="high" loading="eager" />
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
              16+ integrated modules covering every aspect of ministry — from membership and children records to giving, events, attendance, and performance tracking.
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
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-gray hover:text-white  h-12 px-7 text-base"
                onClick={() => setDemoOpen(true)}
              >
                Book a demo
              </Button>
              {showInstallUI && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:text-white h-12 px-7 text-base gap-2"
                  onClick={handleInstall}
                >
                  <Smartphone className="h-4 w-4" /> Install App
                </Button>
              )}
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
                16+ modules.<br />One platform.
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

      {/* ── PWA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/40">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={inView}
            className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12"
          >
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Smartphone className="h-10 w-10 text-accent" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">Available as a mobile app</h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Install ICIMS directly on your phone or tablet — no app store required. Works on Android and iOS. Opens instantly, even on slow connections.
              </p>
            </div>
            <div className="flex-shrink-0">
              {canInstall ? (
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-12 px-7 text-base"
                  onClick={handleInstall}
                >
                  <Download className="h-4 w-4" /> Install Now
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Add to Home Screen</p>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Android — Chrome menu → "Install app"</span>
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> iPhone — Safari share → "Add to Home Screen"</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
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
              <Button
                size="lg"
                variant="outline"
                className="border-background/30 dark:border-accent-foreground/30 text-background dark:text-accent-foreground bg-background/10 dark:hover:bg-accent-foreground/10 h-12 px-8 text-white"
                onClick={() => setDemoOpen(true)}
              >
                Book a demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <BookDemoDialog open={demoOpen} onOpenChange={setDemoOpen} />

      {/* Desktop / Chrome install instructions */}
      {desktopHint && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60" onClick={() => setDesktopHint(false)}>
          <div className="w-full max-w-sm bg-background rounded-2xl shadow-2xl p-5 mb-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-accent" />
                <span className="font-semibold text-sm">Install ICIMS on your computer</span>
              </div>
              <button onClick={() => setDesktopHint(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            {isChromiumBased ? (
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="font-bold text-foreground">1.</span> Look for the <span className="font-medium text-foreground">install icon ⊕</span> on the right side of the address bar</li>
                <li className="flex gap-2"><span className="font-bold text-foreground">2.</span> Click it and select <span className="font-medium text-foreground">"Install"</span></li>
                <li className="flex gap-2"><span className="font-bold text-foreground">Alt:</span> Chrome menu <span className="font-medium text-foreground">(⋮)</span> → <span className="font-medium text-foreground">"Save and share"</span> → <span className="font-medium text-foreground">"Install ICIMS"</span></li>
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Use Chrome, Edge, or Brave on desktop for the best install experience.</p>
            )}
          </div>
        </div>
      )}

      {/* iOS install instructions */}
      {iosHint && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60" onClick={() => setIosHint(false)}>
          <div className="w-full max-w-sm bg-background rounded-2xl shadow-2xl p-5 mb-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-accent" />
                <span className="font-semibold text-sm">Install ICIMS on iPhone</span>
              </div>
              <button onClick={() => setIosHint(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="font-bold text-foreground">1.</span> Open this page in <span className="font-medium text-foreground">Safari</span></li>
              <li className="flex gap-2"><span className="font-bold text-foreground">2.</span> Tap the <span className="font-medium text-foreground">Share</span> button (box with arrow at the bottom)</li>
              <li className="flex gap-2"><span className="font-bold text-foreground">3.</span> Scroll and tap <span className="font-medium text-foreground">"Add to Home Screen"</span></li>
              <li className="flex gap-2"><span className="font-bold text-foreground">4.</span> Tap <span className="font-medium text-foreground">"Add"</span> — done!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
