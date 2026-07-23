import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { attendanceService, type QrCheckInSession } from '@/services/attendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle2, Clock, Loader2, MapPin, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { SignInDialog } from '@/pages/church-public/SignInDialog';

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function PublicQrCheckIn({
  token,
  accent = '#d89b12',
  ministryName,
}: {
  token: string;
  accent?: string;
  ministryName?: string;
  onRequireSignIn?: () => void;
}) {
  const [session, setSession] = useState<QrCheckInSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberLoading, setMemberLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const user = useAuthStore(state => state.user);
  const [visitorType, setVisitorType] = useState<'guest' | 'ministry_member'>('guest');
  const [form, setForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestGender: '',
    guestAgeBracket: '',
    guestFirstTime: false,
    invitedBy: '',
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    attendanceService.getQrCheckInSession(token)
      .then(data => {
        if (mounted) setSession(data);
      })
      .catch((err: any) => {
        toast.error(err.response?.data?.message || 'Check-in link not found');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [token]);

  const title = useMemo(() => {
    if (!session) return 'Attendance Check-in';
    return session.event?.title || session.serviceType || 'Attendance Check-in';
  }, [session]);

  const runMemberCheckIn = async () => {
    setMemberLoading(true);
    try {
      const participant = await attendanceService.checkInMemberByQr(token);
      const user = participant.user;
      setSuccessName(user ? `${user.firstName} ${user.lastName}` : 'Member');
      toast.success('You are checked in');
      setSignInOpen(false);
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.message('Sign in first, then tap member check-in again.');
        setSignInOpen(true);
      } else {
        toast.error(err.response?.data?.message || 'Could not check you in');
      }
    } finally {
      setMemberLoading(false);
    }
  };

  const checkInMember = async () => {
    if (!user) {
      setSignInOpen(true);
      return;
    }

    await runMemberCheckIn();
  };

  const checkInGuest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.guestName.trim()) {
      toast.error('Enter your name');
      return;
    }
    setGuestLoading(true);
    try {
      await attendanceService.checkInGuestByQr(token, {
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim() || undefined,
        guestPhone: form.guestPhone.trim() || undefined,
        guestGender: form.guestGender || undefined,
        guestAgeBracket: form.guestAgeBracket || undefined,
        guestFirstTime: visitorType === 'guest' ? form.guestFirstTime : false,
        invitedBy: visitorType === 'guest' ? form.invitedBy.trim() || undefined : undefined,
      });
      setSuccessName(form.guestName.trim());
      toast.success('You are checked in');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not check you in');
    } finally {
      setGuestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div>
          <h1 className="font-heading text-2xl font-bold">Check-in link not found</h1>
          <p className="mt-2 text-sm text-white/65">Please ask an usher or admin for a new QR code.</p>
        </div>
      </div>
    );
  }

  const displayName = ministryName || session.church?.name || 'Church';
  const displayDate = formatDate(session.event?.date || session.date);
  const time = session.event?.time;
  const location = session.event?.location;

  return (
    <>
    <section className="min-h-[70vh] bg-[#f8fafc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl bg-[#121D39] p-6 text-white shadow-xl sm:p-8">
          <Badge style={{ background: accent, color: '#121D39' }} className="mb-5 border-0">
            {session.isOpen ? 'Open for check-in' : 'Check-in closed'}
          </Badge>
          <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-white/70">{displayName}</p>
          <div className="mt-6 space-y-3 text-sm text-white/80">
            {displayDate && <p className="flex items-center gap-2"><Calendar className="h-4 w-4" style={{ color: accent }} /> {displayDate}</p>}
            {time && <p className="flex items-center gap-2"><Clock className="h-4 w-4" style={{ color: accent }} /> {time}</p>}
            {location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" style={{ color: accent }} /> {location}</p>}
          </div>
          {session.qrActiveUntil && (
            <p className="mt-8 rounded-lg bg-white/10 p-3 text-xs text-white/70">
              Active until {new Date(session.qrActiveUntil).toLocaleString()}.
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-xl sm:p-7">
          {successName ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-14 w-14 text-green-600" />
              <h2 className="mt-4 font-heading text-2xl font-bold">You're checked in</h2>
              <p className="mt-2 text-sm text-muted-foreground">Welcome, {successName}.</p>
            </div>
          ) : !session.isOpen ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 font-heading text-2xl font-bold">Check-in is not active</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                This QR code may not have started yet, may have expired, or may have been closed by an admin.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-bold">Check in</h2>
                <p className="mt-1 text-sm text-muted-foreground">Members can sign in, guests can use the quick form.</p>
              </div>

              <Button className="w-full" style={{ background: accent, color: '#121D39' }} onClick={checkInMember} disabled={memberLoading}>
                {memberLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Check in as member
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">or guest check-in</span></div>
              </div>

              <form onSubmit={checkInGuest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Check-in type</Label>
                  <Select value={visitorType} onValueChange={(value: 'guest' | 'ministry_member') => setVisitorType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select check-in type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="ministry_member">Ministry member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Full name *</Label>
                  <Input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input type="email" value={form.guestEmail} onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={form.guestPhone} onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <Select value={form.guestGender} onValueChange={value => setForm(f => ({ ...f, guestGender: value }))}>
                      <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Age</Label>
                    <Select value={form.guestAgeBracket} onValueChange={value => setForm(f => ({ ...f, guestAgeBracket: value }))}>
                      <SelectTrigger><SelectValue placeholder="Age" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-12">0-12</SelectItem>
                        <SelectItem value="13-17">13-17</SelectItem>
                        <SelectItem value="18-35">18-35</SelectItem>
                        <SelectItem value="36-59">36-59</SelectItem>
                        <SelectItem value="60+">60+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {visitorType === 'guest' && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Invited by</Label>
                      <Input value={form.invitedBy} onChange={e => setForm(f => ({ ...f, invitedBy: e.target.value }))} />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={form.guestFirstTime} onCheckedChange={checked => setForm(f => ({ ...f, guestFirstTime: checked === true }))} />
                      First time visiting
                    </label>
                  </>
                )}
                <Button type="submit" className="w-full" disabled={guestLoading}>
                  {guestLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {visitorType === 'guest' ? 'Check in as guest' : 'Check in as ministry member'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
    <SignInDialog
      open={signInOpen}
      onClose={() => setSignInOpen(false)}
      accent={accent}
      ministryName={displayName}
      logoInitial={displayName.charAt(0).toUpperCase()}
      mode="check-in"
      contextTitle="Sign in to be checked in."
      contextDescription={`Use your ${displayName} member account and we will mark you present for ${title}.`}
      submitLabel="Sign In & Check In"
      onSuccess={runMemberCheckIn}
    />
    </>
  );
}
