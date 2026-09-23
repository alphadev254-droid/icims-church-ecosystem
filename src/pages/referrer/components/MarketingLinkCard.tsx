import { useState } from 'react';
import { Copy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MarketingLinkCard({ referralLink, verified }: { referralLink?: string; verified: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!verified || !referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Marketing link copied');
    setTimeout(() => setCopied(false), 1500);
  };

  if (!verified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marketing link locked</CardTitle>
          <CardDescription>Your marketer link will be available after your account is verified.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            Link hidden until verification is complete.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My marketing link</CardTitle>
        <CardDescription>Share this link with ministries so registrations can be tracked to you.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 rounded-md border bg-muted px-3 py-2 text-xs break-all sm:text-sm">{referralLink}</div>
        <Button onClick={copyLink} variant="outline" disabled={!referralLink} className="w-full sm:w-auto">
          <Copy className="mr-2 h-4 w-4" />{copied ? 'Copied' : 'Copy'}
        </Button>
      </CardContent>
    </Card>
  );
}
