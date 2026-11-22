import { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookDemoDialog } from '@/components/BookDemoDialog';
import { Button } from '@/components/ui/button';
import { featurePath, featureTopics, type FeatureTopic } from './topic-content';

export default function FeaturePage({ topic }: { topic: FeatureTopic }) {
  const [demoOpen, setDemoOpen] = useState(false);
  const related = featureTopics.filter(feature => topic.related.includes(feature.slug));

  return (
    <article>
      <header className="border-b bg-muted/30">
        <div className="container max-w-5xl py-12 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
            <Link to="/features" className="hover:text-foreground">Features</Link>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
            <span aria-current="page">{topic.label}</span>
          </nav>
          <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight md:text-6xl">{topic.heading}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{topic.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setDemoOpen(true)}>
              Book a demo
            </Button>
            <Button asChild variant="outline"><Link to="/pricing">Compare plans</Link></Button>
          </div>
        </div>
      </header>

      <div className="container max-w-5xl space-y-12 py-12 md:py-16">
        <section>
          <h2 className="font-heading text-3xl font-bold">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {topic.steps.map((step, index) => (
              <li key={step.title} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold"><span className="mr-2 text-accent">{index + 1}.</span>{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-6">
          <h2 className="font-heading text-2xl font-bold">Example workflow</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{topic.example}</p>
        </section>
        <section>
          <h2 className="font-heading text-3xl font-bold">Common questions</h2>
          <div className="mt-5 grid gap-4">
            {topic.questions.map(({ question, answer }) => (
              <div key={question} className="border-b pb-4">
                <h3 className="font-semibold">{question}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{answer}</p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-heading text-2xl font-bold">Related features</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {related.map(feature => (
              <li key={feature.slug}>
                <Link to={featurePath(feature.slug)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-medium hover:border-accent">
                  {feature.label} <ArrowRight aria-hidden="true" className="h-4 w-4 text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <BookDemoDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </article>
  );
}
