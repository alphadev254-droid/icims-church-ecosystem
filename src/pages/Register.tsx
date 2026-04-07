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
import { Church, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const TITLES = ['Rev', 'Dr', 'Prof', 'Pastor', 'Prophet', 'Seer', 'Sister', 'Brother', 'Father', 'Other'] as const;

const schema = z.object({
  title: z.enum(TITLES).optional(),
  titleOther: z.string().optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  ministryName: z.string().optional(),
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

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountCountry, setAccountCountry] = useState<'Malawi' | 'Kenya' | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [title, setTitle] = useState<string>('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    const result = await authRegister({
      title: values.title,
      titleOther: values.titleOther,
      firstName: values.firstName,
      lastName: values.lastName,
      ministryName: values.ministryName,
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
      toast.success('Account created! Welcome to ICIMS.');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <Church className="h-7 w-7 text-accent" />
            <span className="font-heading text-xl font-bold">ICIMS</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start managing your churches from day one</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          {/* Row 1: Title + titleOther or Ministry Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Select value={title} onValueChange={(v) => { setTitle(v); setValue('title', v as any); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Title (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {TITLES.map(t => <SelectItem key={t} value={t} className="text-xs py-1">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">First Name</Label>
              <Input className={errors.firstName ? 'border-destructive h-8 text-xs' : 'h-8 text-xs'} {...register('firstName')} placeholder="James" />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Last Name</Label>
              <Input className={errors.lastName ? 'border-destructive h-8 text-xs' : 'h-8 text-xs'} {...register('lastName')} placeholder="Banda" />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          {title === 'Other' && (
            <div className="space-y-1">
              <Label className="text-xs">Specify Title</Label>
              <Input className="h-8 text-xs" {...register('titleOther')} placeholder="e.g. Apostle" />
            </div>
          )}

          {/* Row 2: Ministry Name */}
          <div className="space-y-1">
            <Label className="text-xs">Name of Ministry / Church</Label>
            <Input className="h-8 text-xs" {...register('ministryName')} placeholder="e.g. Grace Community Church" />
          </div>

          {/* Row 3: Membership + Branches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Current Membership (Optional)</Label>
              <Input className="h-8 text-xs" type="number" min={0} {...register('currentMembership')} placeholder="e.g. 250" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Number of Branches</Label>
              <Select onValueChange={(v) => setValue('numberOfBranches', Number(v))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="max-h-40">
                  {Array.from({ length: 21 }, (_, i) => (
                    <SelectItem key={i} value={String(i)} className="text-xs py-1">{i === 0 ? '0 (None)' : String(i)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <Input className={errors.email ? 'border-destructive h-8 text-xs' : 'h-8 text-xs'} type="email" {...register('email')} placeholder="admin@church.org" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input className={errors.phone ? 'border-destructive h-8 text-xs' : 'h-8 text-xs'} {...register('phone')} placeholder={accountCountry === 'Kenya' ? '+254 ...' : '+265 ...'} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Row 5: Country + Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Country</Label>
              <Select value={accountCountry} onValueChange={(v: 'Malawi' | 'Kenya') => { setAccountCountry(v); setValue('accountCountry', v); }}>
                <SelectTrigger className={errors.accountCountry ? 'border-destructive h-8 text-xs' : 'h-8 text-xs'}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Malawi" className="text-xs">Malawi</SelectItem>
                  <SelectItem value="Kenya" className="text-xs">Kenya</SelectItem>
                </SelectContent>
              </Select>
              {errors.accountCountry && <p className="text-xs text-destructive">{errors.accountCountry.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gender</Label>
              <Select value={gender} onValueChange={(v: 'male' | 'female') => { setGender(v); setValue('gender', v); }}>
                <SelectTrigger className={errors.gender ? 'border-destructive h-8 text-xs' : 'h-8 text-xs'}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male" className="text-xs">Male</SelectItem>
                  <SelectItem value="female" className="text-xs">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
            </div>
          </div>

          {/* Row 6: Founded Date */}
          <div className="space-y-1">
            <Label className="text-xs">Church Founded Date (Optional)</Label>
            <Input className="h-8 text-xs" type="date" {...register('anniversary')} />
          </div>

          {/* Row 7: Password + Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className={errors.password ? 'border-destructive pr-10 h-8 text-xs' : 'pr-10 h-8 text-xs'}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Repeat password"
                  className={errors.confirmPassword ? 'border-destructive pr-10 h-8 text-xs' : 'pr-10 h-8 text-xs'}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowConfirmPassword(v => !v)}>
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
