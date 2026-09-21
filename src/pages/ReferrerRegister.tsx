import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Handshake, ArrowLeft, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FALLBACK_COUNTRIES, type CountryOption } from '@/lib/countries';

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

  const onSubmit = async ({ confirmPassword: _confirmPassword, ...values }: FormValues) => {
    try {
      const response = await apiClient.post('/referrals/register', values);
      toast.success('Referrer application submitted. Check your email for the verification code.');
      navigate(`/verify-email?email=${encodeURIComponent(response.data.email || values.email)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not submit referrer application');
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Handshake className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Become an ICIMS Referrer</CardTitle>
              <CardDescription>Refer ministries to ICIMS and earn commission when they pay for packages.</CardDescription>
            </div>
            <div className="grid gap-2 rounded-lg bg-muted p-4 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Unique referral link</div>
              <div className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> 20% package commission</div>
              <div className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Email OTP verification</div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              {[
                ['firstName', 'First name'],
                ['lastName', 'Last name'],
                ['email', 'Email'],
                ['phone', 'Phone'],
              ].map(([name, label]) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name}>{label}</Label>
                  <Input id={name} type={name === 'email' ? 'email' : 'text'} {...register(name as keyof FormValues)} />
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
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              <label className="sm:col-span-2 flex items-start gap-3 rounded-md border p-3 text-sm">
                <input type="checkbox" className="mt-1" {...register('acceptedTerms')} />
                <span>
                  I accept the ICIMS Partner Terms and understand approval is required before earning commission.
                  {errors.acceptedTerms && <p className="mt-1 text-xs text-destructive">{errors.acceptedTerms.message}</p>}
                </span>
              </label>

              <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">Applications start as pending and must be approved before earning commission.</p>
                <Button type="submit" disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {isSubmitting ? 'Submitting...' : 'Submit application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
