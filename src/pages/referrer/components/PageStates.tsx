import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function LoadingState({ label = 'Loading marketer page...' }: { label?: string }) {
  return <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">{label}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-8 text-center text-muted-foreground">{children}</div>;
}

export function PageCard({ children }: { children: ReactNode }) {
  return <Card><CardContent className="p-6">{children}</CardContent></Card>;
}
