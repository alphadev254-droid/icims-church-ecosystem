import { useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MarketingLinkCard({ referralLink }: { referralLink?: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink || '');
    setCopied(true);
    toast.success('Marketing link copied');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My marketing link</CardTitle>
        <CardDescription>Share this link with ministries so registrations can be tracked to you.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm break-all">{referralLink}</div>
        <Button onClick={copyLink} variant="outline" disabled={!referralLink}>
          <Copy className="mr-2 h-4 w-4" />{copied ? 'Copied' : 'Copy'}
        </Button>
      </CardContent>
    </Card>
  );
}
