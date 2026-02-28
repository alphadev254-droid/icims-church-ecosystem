import { motion } from 'framer-motion';
import { Target, Eye, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">About ICIMS</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto">
            Empowering churches and ministries with technology to manage, grow, and thrive.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container max-w-4xl">
          <div className="grid gap-8 md:grid-cols-3 mb-16">
            {[
              { icon: Target, title: 'Our Mission', desc: 'To provide churches with an accessible, integrated platform that simplifies administration and empowers data-driven decisions.' },
              { icon: Eye, title: 'Our Vision', desc: 'A world where every church, regardless of size, has the tools to operate efficiently and focus on what matters — ministry.' },
              { icon: Heart, title: 'Our Values', desc: 'Transparency, accountability, servant leadership, and stewardship guide everything we build and support.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-lg border border-border bg-card"
              >
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground">
            <h2 className="font-heading text-2xl font-bold text-foreground">The Story Behind ICIMS</h2>
            <p>
              The Integrated Church Information Management System was born from a simple observation: churches across all denominations struggle with fragmented tools and manual processes. From tracking membership to managing finances, most churches rely on spreadsheets, paper records, and disconnected software.
            </p>
            <p>
              ICIMS brings together 12 functional modules into a single, unified platform that supports the entire denominational hierarchy — from national headquarters to local congregations. Our system is designed to be intuitive enough for volunteers yet powerful enough for full-time administrators.
            </p>
            <p>
              Whether you're a small local church or a national denomination with thousands of congregations, ICIMS scales to meet your needs with cloud-hosted infrastructure that supports 5,000+ concurrent users.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
