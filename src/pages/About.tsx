import { motion } from 'framer-motion';
import { Target, Eye, Heart, Users, Church, Globe, ShieldCheck, ArrowRight, CheckCircle2, Lightbulb, HandHeart, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import churchCommunity from '@/assets/church-community.jpg';

const stats = [
  { value: '500+', label: 'Churches Served' },
  { value: '12', label: 'Integrated Modules' },
  { value: '5,000+', label: 'Concurrent Users' },
  { value: '99.5%', label: 'Platform Uptime' },
];

const values = [
  { icon: ShieldCheck, title: 'Integrity', desc: 'We build transparent systems that churches can trust with their most sensitive data.' },
  { icon: HandHeart, title: 'Service', desc: 'Servant leadership guides every product decision, support interaction, and update we ship.' },
  { icon: Lightbulb, title: 'Innovation', desc: 'We continuously evolve the platform to meet the changing needs of modern ministries.' },
  { icon: BookOpen, title: 'Stewardship', desc: 'We help churches be better stewards of their resources, members, and mission.' },
];

const milestones = [
  { year: '2019', title: 'Founded', desc: 'ICIMS was conceived after observing fragmented administration challenges in local churches across East Africa.' },
  { year: '2020', title: 'First Module', desc: 'Launched membership management and giving modules, onboarding our first 10 pilot churches.' },
  { year: '2021', title: 'Platform Expansion', desc: 'Added 8 additional modules including attendance, event management, and communication portals.' },
  { year: '2022', title: 'National Rollout', desc: 'Scaled to support full ministries hierarchies — national, regional, district, and local church levels.' },
  { year: '2023', title: 'Cloud Infrastructure', desc: 'Migrated to enterprise cloud infrastructure supporting 5,000+ concurrent users with 99.5% uptime.' },
  { year: '2024', title: 'Growing Community', desc: 'Now serving 500+ churches and continuing to expand across multiple countries and ministries.' },
];

const team = [
  { name: 'Rev. James Banda', role: 'Founder & CEO', initials: 'JB' },
  { name: 'Dr. Grace Phiri', role: 'Chief Technology Officer', initials: 'GP' },
  { name: 'Samuel Chirwa', role: 'Head of Product', initials: 'SC' },
  { name: 'Esther Mwale', role: 'Head of Customer Success', initials: 'EM' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/about.png" alt="About ICIMS" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-primary/55" />
        </div>
        <div className="container relative z-10 py-24 md:py-36 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">About ICIMS</h1>
          <p className="text-primary-foreground/90 text-xl font-medium mb-2">Growing Together in Faith and Love.</p>
          <p className="text-primary-foreground/75 max-w-2xl mx-auto">
            Empowering churches and ministries with technology to manage, grow, and thrive.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-accent">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
              >
                <p className="font-heading text-4xl font-bold text-accent-foreground">{s.value}</p>
                <p className="text-accent-foreground/70 text-sm mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden"
            >
              <img
                src={churchCommunity}
                alt="Church community worshipping together"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Our Story</span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-2 mb-5">
                The Story Behind ICIMS
              </h2>
              <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>
                  The Integrated Church Management Information System is part of a bouquet of resources developed by the Strategy Led Church Academy under{' '}
                  <a href="http://www.thestrategy-ledchurch.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                    "The Strategy Led Church"
                  </a>{' '}
                  that seeks Equipping Church Leaders for Effective Ministry. ICMIS provides a one stop solution for performance management and stakeholder engagement. While ICMIS can be used by any church, it is optimal when combined with the other aspects of{' '}
                  <a href="http://www.thestrategy-ledchurch.com/SLC-Academy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
                    "The Strategy Led Church"
                  </a>.
                </p>
                <p>
                  ICIMS brings together 12 functional modules into a single, unified platform that supports the entire ministries hierarchy — from national headquarters down to local branches. No more spreadsheets, no more disconnected software.
                </p>
                <p>
                  Whether you're a small local church or a national ministry with thousands of branches, ICIMS scales to meet your needs with cloud-hosted infrastructure that supports 5,000+ concurrent users.
                </p>
              </div>
              <ul className="mt-6 space-y-2">
                {['Built specifically for ministries structures', 'Secure, cloud-based with 99.5% uptime', 'Supported by a dedicated customer success team'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">What Drives Us</span>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-2">Mission, Vision & Values</h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {[
              { icon: Target, title: 'Our Mission', desc: 'To provide ministries with an accessible, integrated platform that simplifies administration and empowers data-driven decisions.' },
              { icon: Eye, title: 'Our Vision', desc: 'A world where every ministry, regardless of size, has the tools to operate efficiently and focus on what matters — ministry.' },
              { icon: Heart, title: 'Our Values', desc: 'Transparency, accountability, servant leadership, and stewardship guide everything we build and support.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                className="text-center p-8 rounded-2xl border border-border bg-card"
              >
                <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Core values grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                viewport={{ once: true }}
                className="flex gap-4 p-5 rounded-xl border border-border bg-card"
              >
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <v.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">{v.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

  

      {/* Why ICIMS */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Why Choose Us</span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-2 mb-6">
                Built for the Church, by People Who Understand Ministry
              </h2>
              <div className="space-y-5">
                {[
                  { icon: Church, title: 'Ministry-Aware', desc: 'Designed around real church hierarchies — national, regional, district, and local branch levels.' },
                  { icon: Users, title: 'People-First Design', desc: 'Intuitive interfaces that church staff and volunteers can learn in minutes, not weeks.' },
                  { icon: Globe, title: 'Scalable for Any Size', desc: 'From 50 to 50,000 members, ICIMS grows with your ministry without extra configuration.' },
                  { icon: ShieldCheck, title: 'Secure & Compliant', desc: 'Role-based access control, PCI-compliant giving, and encrypted data at rest and in transit.' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    variants={fadeUp}
                    viewport={{ once: true }}
                    className="flex gap-4"
                  >
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-0.5">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-primary p-10 text-center"
            >
              <p className="font-heading text-4xl font-bold text-primary-foreground mb-2">500+</p>
              <p className="text-primary-foreground/70 text-sm mb-8">churches already trust ICIMS</p>
              <blockquote className="text-primary-foreground/90 text-sm italic leading-relaxed mb-6">
                "ICIMS transformed how we manage our denomination. What used to take our admin team days now takes hours. We can focus on people, not paperwork."
              </blockquote>
              <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-wider">— National Administrator, CCAP</p>
            </motion.div>
          </div>
        </div>
      </section>

     
    </div>
  );
}
