import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Church, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, Globe } from 'lucide-react';
import { toast } from 'sonner';
const heroImage = 'https://media.aircnc.co.ke/media-images/5ba1d3df-18b5-40df-8681-430b07ff2505.webp';

const TITLES = ['Rev', 'Dr', 'Prof', 'Pastor', 'Prophet', 'Seer', 'Sister', 'Brother', 'Father', 'Other'] as const;

/** Convert a string to a DNS-safe slug */
function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const DOMAIN = 'churchcentral.church';

const schema = z.object({
  title: z.enum(TITLES).optional(),
  titleOther: z.string().optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  ministryName: z.string().min(2, 'Ministry / church name is required'),
  subdomain: z.string().optional(),
  currentMembership: z.coerce.number().int().min(0).optional(),
  numberOfBranches: z.coerce.number().int().min(0).optional(),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required' }),
  accountCountry: z.enum(['Malawi', 'Kenya'], { required_error: 'Country is required' }),
  anniversary: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

// Step definitions
const STEPS = [
  { id: 1, label: 'Your details' },
  { id: 2, label: 'Ministry info' },
  { id: 3, label: 'Security' },
];

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountCountry, setAccountCountry] = useState<'Malawi' | 'Kenya' | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [title, setTitle] = useState<string>('');
  const [subdomainSlug, setSubdomainSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, trigger, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  const nextStep = async () => {
    const fields: (keyof FormValues)[] = step === 1
      ? ['firstName', 'lastName', 'email', 'phone', 'gender', 'accountCountry']
      : ['ministryName', 'subdomain'];
    const valid = await trigger(fields);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = async (values: FormValues) => {
    const result = await authRegister({
      title: values.title,
      titleOther: values.titleOther,
      firstName: values.firstName,
      lastName: values.lastName,
      ministryName: values.ministryName,
      subdomain: values.subdomain || toSlug(values.ministryName),
      currentMembership: values.currentMembership,
      numberOfBranches: values.numberOfBranches,
      email: values.email,
      phone: values.phone,
      gender: values.gender,
      accountCountry: values.accountCountry,
      anniversary: values.anniversary,
      password: values.password,
    });
    if (result.success) {
      if (result.isNewRegistration && result.subdomain) {
        // Store subdomain in sessionStorage so Dashboard can show the welcome dialog
        sessionStorage.setItem('newRegistration', JSON.stringify({
          subdomain: result.subdomain,
          ministryName: values.ministryName,
        }));
      }
      toast.success('Account created! Welcome to ICIMS.');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* â”€â”€ Left brand panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="hidden lg:flex lg:w-[40%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/72" />
        </div>

        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <img src="https://media.aircnc.co.ke/media-images/e295d9c1-36d8-474a-a897-5d84f99e57fc.webp" alt="ICIMS" className="h-12 w-12 object-contain rounded-full bg-white p-1" />
        </Link>

        <div className="relative z-10">
          <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-4">Get started today</p>
          <h2 className="font-heading text-4xl font-bold text-white leading-tight mb-6">
            Your ministry,<br />fully managed.
          </h2>
          <div className="space-y-3">
            {[
              'Set up in under 5 minutes',
              'No credit card required',
              'Full access to all modules',
              'Dedicated onboarding support',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                <span className="text-white/75 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-l-2 border-accent pl-4">
          <p className="text-white/70 text-sm italic leading-relaxed">
            "500+ churches already trust ICIMS to run their ministry with clarity and confidence."
          </p>
        </div>
      </div>

      {/* â”€â”€ Right form panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-14 bg-background overflow-y-auto">
        <div className="w-full max-w-lg mx-auto">

          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Link to="/" className="flex flex-col items-center gap-2">
              <img src="https://media.aircnc.co.ke/media-images/e295d9c1-36d8-474a-a897-5d84f99e57fc.webp" alt="ICIMS" className="h-12 w-12 object-contain rounded-full bg-white p-1" />
              <span className="font-heading text-sm font-bold text-foreground tracking-wide">ICIMS</span>
            </Link>
          </div>

          {/* Desktop logo — centered at top of form panel */}
          <div className="hidden lg:flex flex-col items-center mb-8">
            <Link to="/" className="flex flex-col items-center gap-2">
              <img src="https://media.aircnc.co.ke/media-images/e295d9c1-36d8-474a-a897-5d84f99e57fc.webp" alt="ICIMS" className="h-12 w-12 object-contain rounded-full bg-white p-1" />
              <span className="font-heading text-sm font-bold text-foreground tracking-wide">ICIMS</span>
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start managing your churches from day one</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  step > s.id ? 'bg-accent text-accent-foreground' :
                  step === s.id ? 'bg-accent text-accent-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span className={`text-xs hidden sm:block ${step === s.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 ${step > s.id ? 'bg-accent' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* â”€â”€ Step 1: Personal details â”€â”€ */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Title</Label>
                    <Select value={title} onValueChange={v => { setTitle(v); setValue('title', v as any); }}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>First name</Label>
                    <Input {...register('firstName')} placeholder="James" className={errors.firstName ? 'border-destructive' : ''} />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last name</Label>
                    <Input {...register('lastName')} placeholder="Banda" className={errors.lastName ? 'border-destructive' : ''} />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>

                {title === 'Other' && (
                  <div className="space-y-1.5">
                    <Label>Specify title</Label>
                    <Input {...register('titleOther')} placeholder="e.g. Apostle" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Email address</Label>
                    <Input type="email" autoComplete="email" {...register('email')} placeholder="admin@church.org" className={errors.email ? 'border-destructive' : ''} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone number</Label>
                    <Input {...register('phone')} placeholder={accountCountry === 'Kenya' ? '+254...' : '+265...'} className={errors.phone ? 'border-destructive' : ''} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Select value={accountCountry} onValueChange={(v: 'Malawi' | 'Kenya') => { setAccountCountry(v); setValue('accountCountry', v); }}>
                      <SelectTrigger className={errors.accountCountry ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Malawi">Malawi</SelectItem>
                        <SelectItem value="Kenya">Kenya</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.accountCountry && <p className="text-xs text-destructive">{errors.accountCountry.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={(v: 'male' | 'female') => { setGender(v); setValue('gender', v); }}>
                      <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
                  </div>
                </div>

                <Button type="button" onClick={nextStep} className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* â”€â”€ Step 2: Ministry info â”€â”€ */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>
                    Name of ministry / church <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...register('ministryName')}
                    placeholder="e.g. Grace Community Church"
                    className={errors.ministryName ? 'border-destructive' : ''}
                    onChange={e => {
                      register('ministryName').onChange(e);
                      if (!slugManuallyEdited) {
                        const slug = toSlug(e.target.value);
                        setSubdomainSlug(slug);
                        setValue('subdomain', slug);
                      }
                    }}
                  />
                  {errors.ministryName && <p className="text-xs text-destructive">{errors.ministryName.message}</p>}
                </div>

                {/* Subdomain slug field */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Your ministry URL <span className="text-muted-foreground text-xs font-normal">(optional — auto-filled from name)</span>
                  </Label>
                  <div className="flex items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden">
                    <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-input shrink-0 select-none">
                      https://
                    </span>
                    <input
                      className="flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                      placeholder="grace-community-church"
                      value={subdomainSlug}
                      onChange={e => {
                        const slug = toSlug(e.target.value);
                        setSubdomainSlug(slug);
                        setValue('subdomain', slug);
                        setSlugManuallyEdited(true);
                      }}
                    />
                    <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-l border-input shrink-0 select-none">
                      .{DOMAIN}
                    </span>
                  </div>
                  {subdomainSlug && (
                    <div className="flex items-center gap-2 rounded-md bg-accent/10 border border-accent/20 px-3 py-2">
                      <Globe className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="text-xs text-muted-foreground">Your site will be at:</span>
                      <span className="text-xs font-medium text-accent break-all">
                        https://{subdomainSlug}.{DOMAIN}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Only letters, numbers, and hyphens. This is where your ministry portal will be accessible.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Current membership <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input type="number" min={0} {...register('currentMembership')} placeholder="e.g. 250" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Number of branches</Label>
                    <Select onValueChange={v => setValue('numberOfBranches', Number(v))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="max-h-40">
                        {Array.from({ length: 21 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{i === 0 ? '0 (None)' : String(i)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Church founded date <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input type="date" {...register('anniversary')} />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="flex-1 h-11 bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* â”€â”€ Step 3: Password â”€â”€ */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password')}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button type="button" tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Confirm password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                      placeholder="Repeat password"
                      className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button type="button" tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirmPassword(v => !v)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                {/* Password rules hint */}
                <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1.5">
                  {[
                    { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
                    { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
                    { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
                  ].map(rule => {
                    const pw = getValues('password') ?? '';
                    const ok = rule.test(pw);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
                        <span className={`text-xs ${ok ? 'text-foreground' : 'text-muted-foreground'}`}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-11">
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                  </Button>
                </div>
              </div>
            )}

          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back to website</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
