import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Eye, EyeOff, Handshake, MailCheck } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FALLBACK_COUNTRIES, type CountryOption } from '@/lib/countries';
import { useTheme } from '@/contexts/ThemeContext';

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(6, 'Phone is required'),
  country: z.string().min(2, 'Country is required'),
  city: z.string().min(1, 'City / region is required'),
  district: z.string().min(1, 'District is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptedTerms: z.boolean().refine(Boolean, 'You must accept the Partner Terms'),
}).refine(values => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

type FormValues = z.infer<typeof schema>;

export default function ReferrerRegister() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const heroImage = theme === 'dark' ? '/marketers_dark.png' : '/marketers_light.png';
  const fetchMe = useAuthStore(state => state.fetchMe);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      district: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
  });

  const country = watch('country');
  const city = watch('city');

  const { data: countries = FALLBACK_COUNTRIES } = useQuery<CountryOption[]>({
    queryKey: ['public-countries'],
    queryFn: async () => {
      const { data } = await apiClient.get('/packages/countries');
      return data.data?.length ? data.data : FALLBACK_COUNTRIES;
    },
    staleTime: 24 * 60 * 60_000,
  });

  const { data: regions = [] } = useQuery<string[]>({
    queryKey: ['public-location-regions', country],
    enabled: Boolean(country),
    queryFn: async () => {
      const { data } = await apiClient.get('/locations/public/regions', { params: { country } });
      return data.data || [];
    },
  });

  const { data: districts = [] } = useQuery<string[]>({
    queryKey: ['public-location-districts', country, city],
    enabled: Boolean(country && city && regions.length > 0),
    queryFn: async () => {
      const { data } = await apiClient.get('/locations/public/districts', { params: { country, region: city } });
      return data.data || [];
    },
  });

  const hasLocationData = regions.length > 0;
  const countryOptions = useMemo(() => countries.map(item => item.name), [countries]);

  useEffect(() => {
    setValue('city', '');
    setValue('district', '');
  }, [country, setValue]);

  useEffect(() => {
    setValue('district', '');
  }, [city, setValue]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setTimeout(() => setResendCountdown(seconds => Math.max(seconds - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  const onSubmit = async ({ confirmPassword: _confirmPassword, ...values }: FormValues) => {
    try {
      const response = await apiClient.post('/referrals/register', values);
      toast.success('Marketer account created. Check your email for the verification code.');
      setVerificationEmail(response.data.email || values.email);
      setOtpCode('');
      setResendCountdown(40);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not submit marketer registration');
    }
  };

  const verifyEmail = async (event: FormEvent) => {
    event.preventDefault();
    setVerifying(true);
    try {
      await apiClient.post('/auth/verify-email', { email: verificationEmail, otpCode });
      await fetchMe();
      toast.success('Email verified. Welcome to ICIMS.');
      navigate('/dashboard/referrals');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!verificationEmail) return;
    setResending(true);
    try {
      await apiClient.post('/auth/resend-verification-otp', { email: verificationEmail });
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
    <div className="flex h-screen overflow-hidden">
      <div className="relative hidden h-screen flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[52%]">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover object-left" />
          <div className="absolute inset-0 bg-black/78" />
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-2.5 self-start">
          <img src="https://media.aircnc.co.ke/media-images/e295d9c1-36d8-474a-a897-5d84f99e57fc.webp" alt="ICIMS" className="h-12 w-12 rounded-full bg-white object-contain p-1" />
        </Link>
      </div>

      <div className="h-screen flex-1 overflow-y-auto bg-background px-6 py-8 lg:px-16">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <Link to="/" className="flex flex-col items-center gap-2">
              <img src="https://media.aircnc.co.ke/media-images/e295d9c1-36d8-474a-a897-5d84f99e57fc.webp" alt="ICIMS" className="h-12 w-12 rounded-full bg-white object-contain p-1" />
              <span className="font-heading text-sm font-bold tracking-wide text-foreground">ICIMS</span>
            </Link>
          </div>

          <Link to="/referrals" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to marketers
          </Link>

          {verificationEmail ? (
            <>
              <div className="mb-6 shrink-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <MailCheck className="h-6 w-6" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Verify your email</h1>
                <p className="mt-1 text-sm text-muted-foreground">Enter the 6-digit code sent to {verificationEmail}.</p>
              </div>

              <form onSubmit={verifyEmail} className="max-w-sm space-y-5 pb-2">
                <div className="space-y-1.5">
                  <Label htmlFor="otpCode">OTP code</Label>
                  <Input
                    id="otpCode"
                    value={otpCode}
                    onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    inputMode="numeric"
                    required
                  />
                </div>

                <Button type="submit" disabled={verifying || otpCode.length !== 6} className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {verifying ? 'Verifying...' : 'Verify account'}
                </Button>

                <Button type="button" variant="ghost" disabled={resending || resendCountdown > 0} onClick={resendVerification} className="w-full">
                  {resending ? 'Sending...' : resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend code'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 shrink-0">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Handshake className="h-6 w-6" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Create marketer account</h1>
                <p className="mt-1 text-sm text-muted-foreground">Register, verify your email, then share your marketer link.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 pb-2 sm:grid-cols-2">
            {[
              ['firstName', 'First name'],
              ['lastName', 'Last name'],
              ['email', 'Email address'],
              ['phone', 'Phone number'],
            ].map(([name, label]) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  type={name === 'email' ? 'email' : 'text'}
                  autoComplete={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'name'}
                  {...register(name as keyof FormValues)}
                  className={errors[name as keyof FormValues] ? 'border-destructive' : ''}
                />
                {errors[name as keyof FormValues] && <p className="text-xs text-destructive">{errors[name as keyof FormValues]?.message as string}</p>}
              </div>
            ))}

            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <select id="country" {...register('country')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select country</option>
                {countryOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
              {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">City / Region</Label>
              {hasLocationData ? (
                <select id="city" {...register('city')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select city / region</option>
                  {regions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <Input id="city" {...register('city')} placeholder="Enter city / region" />
              )}
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="district">District</Label>
              {hasLocationData ? (
                <select id="district" {...register('district')} disabled={!city} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50">
                  <option value="">Select district</option>
                  {districts.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <Input id="district" {...register('district')} placeholder="Enter district" />
              )}
              {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(value => !value)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(value => !value)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <label className="flex items-start gap-3 rounded-md border p-3 text-sm sm:col-span-2">
              <input type="checkbox" className="mt-1" {...register('acceptedTerms')} />
              <span>
                I accept the ICIMS{' '}
                <Link to="/terms" className="text-accent hover:underline" target="_blank" rel="noreferrer">
                  Terms and Conditions
                </Link>
                {' '}and understand approval is required before earning commission.
                {errors.acceptedTerms && <p className="mt-1 text-xs text-destructive">{errors.acceptedTerms.message}</p>}
              </span>
            </label>

            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">Your account starts as pending until approved by ICIMS.</p>
              <Button type="submit" disabled={isSubmitting} className="h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                {isSubmitting ? 'Creating account...' : 'Create marketer account'}
              </Button>
            </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
