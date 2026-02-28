import { motion } from 'framer-motion';
import { Target, Eye, Heart } from 'lucide-react';
import churchCommunity from '@/assets/church-community.jpg';

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

      {/* Image + Story */}
      <section className="py-20 bg-background">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-xl overflow-hidden"
            >
              <img
                src={churchCommunity}
                alt="Church community worshipping together"
                className="w-full h-auto object-cover rounded-xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
                The Story Behind ICIMS
              </h2>
              <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>
                  The Integrated Church Information Management System was born from a simple observation: churches across all denominations struggle with fragmented tools and manual processes.
                </p>
                <p>
                  ICIMS brings together 12 functional modules into a single, unified platform that supports the entire denominational hierarchy — from national headquarters to local congregations.
                </p>
                <p>
                  Whether you're a small local church or a national denomination with thousands of congregations, ICIMS scales to meet your needs with cloud-hosted infrastructure that supports 5,000+ concurrent users.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Mission / Vision / Values */}
          <div className="grid gap-8 md:grid-cols-3">
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
        </div>
      </section>
    </div>
  );
}
