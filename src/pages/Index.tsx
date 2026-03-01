import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Users, Church, Calendar, HandCoins, BarChart3, MessageSquare,
  BookOpen, ClipboardList, Building2, TrendingUp, Shield, Globe,
  ArrowRight, CheckCircle2
} from 'lucide-react';
import heroImage from '@/assets/hero-church.jpg';

const modules = [
  { icon: Users, title: 'Membership', desc: 'Registration, profiles & family tracking' },
  { icon: Church, title: 'Church Management', desc: 'Departments, ministries & leadership' },
  { icon: Calendar, title: 'Activity Teams', desc: 'Volunteer teams & task assignment' },
  { icon: ClipboardList, title: 'Attendance', desc: 'Service scheduling & real-time tracking' },
  { icon: HandCoins, title: 'Giving & Donations', desc: 'Tithes, offerings & pledges' },
  { icon: MessageSquare, title: 'Communication', desc: 'Announcements & prayer requests' },
  { icon: BookOpen, title: 'Bible Study', desc: 'Digital resources & study plans' },
  { icon: Calendar, title: 'Events', desc: 'Scheduling, registration & reporting' },
  { icon: BarChart3, title: 'Revenue', desc: 'Consolidated tracking & audit trails' },
  { icon: Building2, title: 'Administration', desc: 'Multi-level church hierarchy' },
  { icon: ClipboardList, title: 'Meetings', desc: 'Agendas, minutes & action items' },
  { icon: TrendingUp, title: 'Performance', desc: 'KPI tracking & automated measurement' },
];

const features = [
  { icon: Shield, title: 'Secure & Compliant', desc: 'Role-based access, encrypted data, PCI-compliant payments' },
  { icon: Building2, title: 'Multi-Level Hierarchy', desc: 'National → Regional → District → Local church support' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Dashboards for giving, attendance & performance' },
  { icon: Globe, title: 'Scalable Platform', desc: 'Cloud-hosted, supports 5,000+ concurrent users' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Church community" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
        <div className="container relative z-10 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wider uppercase rounded-full bg-accent/20 text-accent border border-accent/30">
              12 Integrated Modules
            </span>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              The Complete Church Management Ecosystem
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl">
              Built to help churches grow sustainably, maintain accountability, and make data-driven decisions across every level of your denomination.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="border-foreground/30 dark:border-white/30 text-foreground dark:text-white hover:bg-foreground/10 dark:hover:bg-white/10">
                  Explore Features
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              Why Choose ICIMS?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A centralized digital platform designed specifically for church and ministry operations.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-lg border border-border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-20 bg-secondary">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              12 Functional Modules
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every aspect of church operations covered in one integrated platform.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {modules.map((m, i) => (
              <motion.div
                key={m.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="h-9 w-9 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <m.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">{m.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Trust */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              Trusted by Churches Worldwide
            </h2>
            <p className="text-muted-foreground">
              From small congregations to large denominations, ICIMS adapts to your unique needs.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { stat: '500+', label: 'Churches Onboarded' },
              { stat: '50,000+', label: 'Members Managed' },
              { stat: '99.9%', label: 'Platform Uptime' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center rounded-lg border border-border bg-card p-8"
              >
                <p className="text-3xl font-bold text-accent mb-1">{s.stat}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <img src="/cta.png" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-primary/75" />
        </div>
        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Transform Your Church Management?
            </h2>
            <p className="text-primary-foreground/70 mb-8 max-w-xl mx-auto">
              Join churches already using ICIMS to streamline operations, engage members, and grow sustainably.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-foreground/30 dark:border-white/30 text-foreground dark:text-white hover:bg-foreground/10 dark:hover:bg-white/10">
                  Contact Sales
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-10 text-primary-foreground/60 text-sm">
              {['Free 30-day trial', 'No credit card required', '24/7 support'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
