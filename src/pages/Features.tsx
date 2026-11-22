import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ModuleCatalogue from '@/marketing/ModuleCatalogue';
import { Button } from '@/components/ui/button';
import { Shield, Globe, Lock, Smartphone, FileText, ArrowRight } from 'lucide-react';

const techSpecs = [
  { icon: Smartphone, title: 'Responsive Design',   desc: 'Works on desktop and mobile browsers without a native app install.' },
  { icon: Lock,       title: 'Role-based Access',  desc: 'Set staff permissions based on their role and the church records they need.' },
  { icon: Globe,      title: 'Cloud Hosted',       desc: 'Access church operations in a browser from the office or another branch.' },
  { icon: FileText,   title: 'Export Reports',     desc: 'Download supported reports for review or sharing with church leadership.' },
  { icon: Shield,     title: 'Approval Workflows', desc: 'Review member registration, asset booking and other requests in the platform.' },
];

const inView = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
};

export default function FeaturesPage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://media.chepetsaride.com/media-images/20e847ba-fb2d-45f8-ad77-95b615ef85c8.webp" alt="ICIMS Features" className="h-full w-full object-cover" fetchPriority="high" loading="eager" />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="container relative z-10 py-28 md:py-36">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-4">Platform Features</p>
            <h1 className="font-heading text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
              Church management features
            </h1>
            <p className="text-white/65 text-lg leading-relaxed mb-8">
              Explore the tools ICIMS brings together for church administrators, welcome teams, finance staff and ministry leaders.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-12 px-7">
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <ModuleCatalogue />

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
                initial={false}
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
                See ICIMS with your own workflow
              </h2>
              <p className="text-muted-foreground max-w-md">
                Bring your service schedule, member register or next church event to a demo, and we’ll walk through how to manage it in ICIMS.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
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
