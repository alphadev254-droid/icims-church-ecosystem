import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium sm:text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="break-words text-xl font-bold sm:text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
}
