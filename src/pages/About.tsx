
import { motion } from 'framer-motion';
import { Target, Eye, Heart, Users, Church, Globe, ShieldCheck, CheckCircle2, Lightbulb, HandHeart, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import churchCommunity from '@/assets/church-community.jpg';
import { usePageMeta } from '@/hooks/usePageMeta';

const values = [
  { icon: ShieldCheck, title: 'Integrity',   desc: 'Transparent systems churches can trust with their most sensitive data.' },
  { icon: HandHeart,   title: 'Service',     desc: 'Servant leadership guides every product decision and support interaction.' },
  { icon: Lightbulb,   title: 'Innovation',  desc: 'Continuously evolving to meet the changing needs of modern ministries.' },
  { icon: BookOpen,    title: 'Stewardship', desc: 'Helping churches be better stewards of resources, members, and mission.' },
];

const milestones = [
  {
    year: '2015/16',
    title: 'The spark',
    desc: 'After leading a successful change management project at a leading Non-Governmental Organization in Malawi, the brain behind this platform was impressed by the Spirit to use the skills and lessons to support church ministry.',
  },
  {
    year: '2016/17',
    title: 'The Strategy-Led Church',
    desc: 'The Strategy-Led Church was created to help churches apply strategic management tools in the pursuit of their calling — a set of resources including a workbook to guide Pastors in formulating church strategy.',
  },
  {
    year: '2020',
    title: 'ICIMS conceived',
    desc: 'The Integrated Church Management Information System was conceived as part of the Strategy-Led Church resources, bringing digital tools to support every aspect of ministry management.',
  },
  {
    year: '2021',
    title: 'Platform expansion',
    desc: 'Added modules covering attendance, events, communication, and more.',
  },
  {
    year: '2022',
    title: 'National rollout',
    desc: 'Scaled to support full ministry hierarchies — national, regional, district, and local.',
  },
  {
    year: '2023',
    title: 'Cloud infrastructure',
    desc: 'Migrated to enterprise cloud supporting 5,000+ concurrent users at 99.5% uptime.',
  },
  {
    year: '2024',
    title: 'Growing community',
    desc: 'Now serving 500+ churches and expanding across multiple countries.',
  },
];

const inView = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

export default function AboutPage() {
  usePageMeta({
    title: 'About ICIMS',
    description: 'Learn about ICIMS — the Integrated Church Management System. Our mission, vision, values and the story behind the platform.',
    canonical: 'https://churchcentral.church/about',
    ogImage: 'https://churchcentral.church/about.png',
  });

  return (
    <div className="overflow-x-hidden">

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/about.png" alt="About ICIMS" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/68" />
        </div>
        <div className="container relative z-10 py-28 md:py-36">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-4">About us</p>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
              Technology built<br />for ministry.
            </h1>
            <p className="text-white/65 text-lg leading-relaxed">
              ICIMS was built by people who understand how churches actually work — the hierarchy, the accountability, the community. Not just software people.
            </p>
          </motion.div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-accent">
        <div className="container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '100+',   label: 'Churches served' },
              { value: '19',     label: 'Integrated modules' },
              { value: '5,000+', label: 'Concurrent users' },
              { value: '99.5%',  label: 'Platform uptime' },
            ].map((s, i) => (
              <motion.div key={s.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView}>
                <p className="text-2xl md:text-3xl font-bold text-accent-foreground">{s.value}</p>
                <p className="text-xs text-accent-foreground/70 mt-0.5 uppercase tracking-wide">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-2xl overflow-hidden aspect-[4/3]">
              <img src={churchCommunity} alt="Church community" className="w-full h-full object-cover object-left" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Our story</p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
                Where ICIMS<br />came from.
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  ICIMS is part of a bouquet of resources developed by the Strategy Led Church Academy under{' '}
                  <a href="http://www.thestrategy-ledchurch.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                    The Strategy Led Church
                  </a>{' '}
                  — a movement equipping church leaders for effective ministry.
                </p>
                <p>
                  We saw churches drowning in spreadsheets, disconnected tools, and manual processes. ICIMS brings 19 functional modules into one unified platform that supports the entire ministry hierarchy — from national headquarters to local branches.
                </p>
                <p>
                  Whether you are a small local church or a national ministry with thousands of branches, ICIMS scales without extra configuration.
                </p>
              </div>
              <ul className="mt-6 space-y-2.5">
                {['Built specifically for ministry structures', 'Secure, cloud-based with 99.5% uptime', 'Supported by a dedicated customer success team'].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MISSION / VISION / VALUES — dark section */}
      <section className="py-24 bg-foreground dark:bg-card">
        <div className="container">
          <div className="max-w-xl mb-14">
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">What drives us</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-background dark:text-foreground leading-tight">
              Mission, vision<br />and values.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { icon: Target, title: 'Mission', desc: 'Provide ministries with an accessible, integrated platform that simplifies administration and empowers data-driven decisions.' },
              { icon: Eye,    title: 'Vision',  desc: 'A world where every ministry, regardless of size, has the tools to operate efficiently and focus on what matters — people.' },
              { icon: Heart,  title: 'Purpose', desc: 'Transparency, accountability, servant leadership, and stewardship guide everything we build and support.' },
            ].map((item, i) => (
              <motion.div key={item.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView}
                className="border border-background/10 dark:border-border rounded-xl p-6 bg-background/5 dark:bg-muted/30">
                <div className="h-10 w-10 rounded-lg bg-accent/15 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-background dark:text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-background/55 dark:text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <motion.div key={v.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView}
                className="flex gap-3 p-4 rounded-xl border border-background/10 dark:border-border bg-background/5 dark:bg-muted/20">
                <div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                  <v.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-background dark:text-foreground text-sm mb-1">{v.title}</h4>
                  <p className="text-xs text-background/50 dark:text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="max-w-xl mb-14">
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Our journey</p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground leading-tight">How we got here.</h2>
          </div>
          <div className="relative">
            <div className="absolute left-[72px] top-0 bottom-0 w-px bg-border hidden md:block" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <motion.div key={m.year} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView}
                  className="flex gap-6 md:gap-10 items-start">
                  <div className="shrink-0 w-16 text-right">
                    <span className="text-sm font-bold text-accent">{m.year}</span>
                  </div>
                  <div className="hidden md:flex h-3 w-3 rounded-full bg-accent mt-1 shrink-0 relative z-10" />
                  <div className="flex-1 pb-2">
                    <h3 className="font-semibold text-foreground mb-1">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY ICIMS */}
      <section className="py-24 bg-muted/30 border-t border-border">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Why choose us</p>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
                Built for the church,<br />by people who get it.
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Church,      title: 'Ministry-aware',     desc: 'Designed around real church hierarchies — national, regional, district, and local branch levels.' },
                  { icon: Users,       title: 'People-first design', desc: 'Intuitive interfaces that church staff and volunteers can learn in minutes, not weeks.' },
                  { icon: Globe,       title: 'Scales with you',     desc: 'From 50 to 50,000 members, ICIMS grows with your ministry without extra configuration.' },
                  { icon: ShieldCheck, title: 'Secure and compliant', desc: 'Role-based access, PCI-compliant giving, and encrypted data at rest and in transit.' },
                ].map((item, i) => (
                  <motion.div key={item.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={inView} className="flex gap-4">
                    <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-0.5">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="border border-border rounded-2xl p-8 bg-card">
              <p className="text-4xl font-bold text-accent mb-1">100+</p>
              <p className="text-muted-foreground text-sm mb-6">churches already trust ICIMS</p>
              <blockquote className="text-foreground/80 leading-relaxed mb-6 border-l-2 border-accent pl-4 italic">
                "ICIMS transformed how we manage our denomination. What used to take our admin team days now takes hours. We can focus on people, not paperwork."
              </blockquote>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">— Ministry Administrator, CCAP</p>
              <div className="mt-8 pt-6 border-t border-border">
                <Link to="/register">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 w-full">
                    Start your free trial <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
