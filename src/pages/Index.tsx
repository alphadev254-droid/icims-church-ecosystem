import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ModuleCatalogue from '@/marketing/ModuleCatalogue';
import { Button } from '@/components/ui/button';
import { BarChart3, Building2, Shield, Globe, ArrowRight, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import { BookDemoDialog } from '@/components/BookDemoDialog';
import { toast } from 'sonner';

const heroImage = 'https://media.chepetsaride.com/media-images/5ba1d3df-18b5-40df-8681-430b07ff2505.webp';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const whys = [
  {
    icon: Shield,
    title: 'Secure by design',
    desc: 'Use roles and church-level permissions to control access to member, attendance and finance records.',
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
    desc: 'Use ICIMS in a web browser and add church branches as your ministry grows.',
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
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) {
      toast.info('To install ICIMS, open your browser menu and choose Install app or Add to Home screen.');
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      toast.success('ICIMS app installation started.');
      setInstallPrompt(null);
    }
  };

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
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-accent text-sm font-semibold tracking-widest uppercase mb-5"
            >
              ICIMS · Church Central
            </motion.p>

            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6"
            >
              Church management software for <span className="text-accent">connected ministries</span>
            </motion.h1>

            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.25 }}
              className="text-white/70 text-lg md:text-xl mb-10 max-w-xl leading-relaxed"
            >
              Manage members and families, plan services and events, oversee giving, and follow up with first-time visitors in one online system. ICIMS serves local churches and ministries with multiple branches.
            </motion.p>

            <motion.div
              initial={false}
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
                className="border-white/30 text-gray hover:text-white h-12 px-7 text-base gap-2"
                onClick={handleInstallApp}
              >
                Install app <Download className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-gray hover:text-white h-12 px-7 text-base"
                onClick={() => setDemoOpen(true)}
              >
                Book a demo
              </Button>
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap gap-5 mt-10 text-white/50 text-sm"
            >
              {['Branch-level access', 'Service QR check-in', 'Ministry reporting'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> {t}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>


      <ModuleCatalogue overview />

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
                  initial={false}
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

      <section className="bg-background py-16">
        <div className="container max-w-5xl">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">What to look for in church management software</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
            Start with one workflow you already run every week, such as Sunday check-in. In a demo, follow that workflow from the first record to the report your team needs. Then check who can see the data and what changes when the same workflow runs at another branch.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            <li className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">For church administrators</h3>
              <p className="mt-2 text-sm text-muted-foreground">Check how you’ll keep households, member details and group rosters up to date.</p>
              <Link to="/features/membership" className="mt-3 inline-block font-medium underline">Explore member records</Link>
            </li>
            <li className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">For welcome teams</h3>
              <p className="mt-2 text-sm text-muted-foreground">Run a test check-in and see how a first-time visitor gets into the follow-up queue.</p>
              <Link to="/features/attendance" className="mt-3 inline-block font-medium underline">Explore service check-in</Link>
            </li>
            <li className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">For ministry leaders</h3>
              <p className="mt-2 text-sm text-muted-foreground">Review what a branch administrator can access and what appears in ministry reporting.</p>
              <Link to="/features/multi-branch" className="mt-3 inline-block font-medium underline">Explore multi-branch oversight</Link>
            </li>
          </ul>
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
              See what ICIMS can do for your church. Compare plans or request a walkthrough of your ministry’s workflow.
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

    </div>
  );
}
