import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { moduleGroups } from './module-catalogue';
import { featurePath } from './topic-content';

type CatalogueModule = (typeof moduleGroups)[number]['modules'][number];

function ModuleCards({ modules, heading: Heading }: { modules: CatalogueModule[]; heading: 'h3' | 'h4' }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map(({ icon: Icon, title, benefit, topic }) => (
        <li key={title} className="flex flex-col rounded-xl border bg-card p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <Heading className="font-semibold text-foreground">{title}</Heading>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{benefit}</p>
          {topic && (
            <Link to={featurePath(topic)} className="mt-4 inline-flex items-center gap-2 self-start text-sm font-medium underline underline-offset-4">
              Explore {title} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function ModuleCatalogue({ overview = false }: { overview?: boolean }) {
  return (
    <section className="bg-muted/30 py-16" aria-labelledby="module-catalogue-title">
      <div className="container">
        <h2 id="module-catalogue-title" className="font-heading text-3xl font-bold text-foreground md:text-4xl">
          {overview ? 'Modules for running your ministry' : 'Explore the ICIMS module catalogue'}
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          See how each module helps your team care for people, plan ministry activity and manage church operations.
        </p>

        {overview ? (
          <div className="mt-8">
            <ModuleCards modules={moduleGroups.flatMap(group => group.modules.filter(module => module.topic))} heading="h3" />
            <Button asChild variant="outline" className="mt-8">
              <Link to="/features">View all modules <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {moduleGroups.map(group => (
              <div key={group.title}>
                <h3 className="mb-4 font-heading text-xl font-bold">{group.title}</h3>
                <ModuleCards modules={group.modules} heading="h4" />
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Module availability depends on your plan and role. <Link to="/pricing" className="underline underline-offset-4">Compare plans</Link>.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
