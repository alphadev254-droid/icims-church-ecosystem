import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PRIVACY_LABEL, TERMS_LABEL } from '@/lib/legal';
import { useAuthStore } from '@/stores/authStore';

export default function TermsAcceptanceGate() {
  const user = useAuthStore((state) => state.user);
  const acceptTerms = useAuthStore((state) => state.acceptTerms);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const open = Boolean(user && user.acceptedTerms === false);

  const submit = async () => {
    if (!checked) {
      toast.error('Please accept the Terms and Privacy Policy to continue.');
      return;
    }

    setSaving(true);
    const result = await acceptTerms();
    setSaving(false);

    if (result.success) {
      toast.success('Terms accepted');
    } else {
      toast.error(result.message || 'Failed to accept terms');
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Accept Terms to Continue</DialogTitle>
          <DialogDescription>
            Please review and accept the current ICIMS Terms and Privacy Policy before using your account.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
          <p>{TERMS_LABEL}</p>
          <p>{PRIVACY_LABEL}</p>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox id="terms-gate" checked={checked} onCheckedChange={(value) => setChecked(value === true)} />
          <Label htmlFor="terms-gate" className="text-sm leading-5 text-muted-foreground">
            I agree to the{' '}
            <Link to="/terms" target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
              Privacy Policy
            </Link>
            .
          </Label>
        </div>

        <Button disabled={!checked || saving} onClick={submit} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {saving ? 'Saving...' : 'Accept and continue'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
