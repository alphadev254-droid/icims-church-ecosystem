import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function LoadingState({ label = 'Loading marketer page...' }: { label?: string }) {
  return <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">{label}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-8 text-center text-muted-foreground">{children}</div>;
}

export function PageCard({ children }: { children: ReactNode }) {
  return <Card><CardContent className="p-6">{children}</CardContent></Card>;
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SummaryGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', columns === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4')}>
      {children}
    </div>
  );
}

export function CardTitleRow({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
      {action}
    </CardHeader>
  );
}

export function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">{children}</div>;
}
