import { motion } from 'framer-motion';
import {
  Users, Church, Calendar, HandCoins, BarChart3, MessageSquare,
  BookOpen, ClipboardList, Building2, TrendingUp, Shield, Globe,
  Zap, Lock, Smartphone, FileText
} from 'lucide-react';

const modules = [
  { icon: Users, num: '01', title: 'Membership Management', desc: 'Member registration, personal & family profiles, role assignment and membership tracking.' },
  { icon: Church, num: '02', title: 'Church Management', desc: 'Manage departments, ministries, leadership, task and resource allocation.' },
  { icon: Calendar, num: '03', title: 'Activity Teams', desc: 'Create ministry/volunteer teams, task assignment, team attendance monitoring.' },
  { icon: ClipboardList, num: '04', title: 'Service Attendance', desc: 'Service scheduling, attendance recording, real-time dashboards & demographics.' },
  { icon: HandCoins, num: '05', title: 'Giving & Donations', desc: 'Online & offline giving, donor history, automated receipts & reconciliation.' },
  { icon: MessageSquare, num: '06', title: 'Communication Portal', desc: 'Announcements, newsletters, email/SMS notifications, prayer requests.' },
  { icon: BookOpen, num: '07', title: 'Bible Study Resources', desc: 'Digital Bible & devotionals, study plans, searchable sermon library.' },
  { icon: Calendar, num: '08', title: 'Event Management', desc: 'Event creation, registration, volunteer coordination, post-event reporting.' },
  { icon: BarChart3, num: '09', title: 'Revenue Management', desc: 'Consolidated tracking, automated reconciliation, audit trails & reports.' },
  { icon: Building2, num: '10', title: 'Church Administration', desc: 'Multi-level hierarchy, church profiles, integration with all modules.' },
  { icon: ClipboardList, num: '11', title: 'Official Meetings', desc: 'Meeting scheduling, agenda preparation, minutes recording & archiving.' },
  { icon: TrendingUp, num: '12', title: 'Performance Management', desc: 'KPI tracking, target setting, automated measurement & reporting.' },
];

const techSpecs = [
  { icon: Smartphone, title: 'Responsive Design', desc: 'Works on desktop and mobile browsers' },
  { icon: Lock, title: 'Enterprise Security', desc: 'Role-based access, PCI-compliant, encrypted data' },
  { icon: Globe, title: 'Cloud Hosted', desc: 'Scalable for 5,000+ concurrent users' },
  { icon: Zap, title: 'Fast Performance', desc: 'Page load under 2 seconds' },
  { icon: FileText, title: 'Export Reports', desc: 'Excel, PDF exportable reports' },
  { icon: Shield, title: '99.5% Uptime', desc: 'High availability with disaster recovery' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

export default function FeaturesPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/features.png" alt="ICIMS Features" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
        <div className="container relative z-10 py-24 md:py-36 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            12 Integrated Modules
          </h1>
          <p className="text-primary-foreground/80 text-xl font-medium mb-2">Faith for Every Generation.</p>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            Every aspect of church operations unified in one powerful, easy-to-use platform.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <motion.div
                key={m.num}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-lg border border-border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-accent">{m.num}</span>
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <m.icon className="h-4 w-4 text-accent" />
                  </div>
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary">
        <div className="container">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">Technical Specifications</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {techSpecs.map((s, i) => (
              <motion.div
                key={s.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-start gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">{s.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
