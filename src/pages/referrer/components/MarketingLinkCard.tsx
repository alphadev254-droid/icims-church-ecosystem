import { useState } from 'react';
import { Copy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CardTitleRow } from './PageStates';

export function MarketingLinkCard({
  referralCode,
  referralLink,
  verified,
}: {
  referralCode?: string;
  referralLink?: string;
  verified: boolean;
}) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const copyValue = async (value: string | undefined, type: 'code' | 'link') => {
    if (!verified || !value) return;
    await navigator.clipboard.writeText(value);
    setCopied(type);
    toast.success(type === 'code' ? 'Marketing code copied' : 'Marketing link copied');
    setTimeout(() => setCopied(null), 1500);
  };

  if (!verified) {
    return (
      <Card>
        <CardTitleRow title="Marketing link locked" description="Your marketer link will be available after your account is verified." />
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
      <CardTitleRow title="My marketing code" description="Share the code or link with ministries so registrations can be tracked to you." />
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 rounded-md border bg-muted px-3 py-2 text-xs font-semibold tracking-wide break-all sm:text-sm">{referralCode}</div>
          <Button onClick={() => copyValue(referralCode, 'code')} variant="outline" disabled={!referralCode} className="w-full sm:w-auto">
            <Copy className="mr-2 h-4 w-4" />{copied === 'code' ? 'Copied' : 'Copy code'}
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 rounded-md border bg-muted px-3 py-2 text-xs break-all sm:text-sm">{referralLink}</div>
          <Button onClick={() => copyValue(referralLink, 'link')} variant="outline" disabled={!referralLink} className="w-full sm:w-auto">
            <Copy className="mr-2 h-4 w-4" />{copied === 'link' ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
