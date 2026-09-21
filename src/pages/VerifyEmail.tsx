import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, MailCheck } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fetchMe = useAuthStore(state => state.fetchMe);
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(40);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown(seconds => Math.max(seconds - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/verify-email', { email, otpCode });
      await fetchMe();
      toast.success('Email verified. Welcome to ICIMS.');
      const user = useAuthStore.getState().user;
      navigate(user?.roleName === 'referrer' ? '/dashboard/referrals' : '/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    setResending(true);
    try {
      await apiClient.post('/auth/resend-verification-otp', { email });
      setResendCountdown(40);
      toast.success('Verification code sent');
    } catch (error: any) {
      if (error.response?.data?.retryAfterSeconds) {
        setResendCountdown(error.response.data.retryAfterSeconds);
      }
      toast.error(error.response?.data?.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
        <Card>
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <MailCheck className="h-6 w-6" />
            </div>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>Enter the 6-digit code sent to your email address.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={verify} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="otpCode">OTP code</Label>
                <Input id="otpCode" value={otpCode} onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" required />
              </div>
              <Button type="submit" disabled={loading || otpCode.length !== 6} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {loading ? 'Verifying...' : 'Verify account'}
              </Button>
              <Button type="button" variant="ghost" disabled={resending || resendCountdown > 0} onClick={resend} className="w-full">
                {resending ? 'Sending...' : resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
