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

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required' }),
  accountCountry: z.enum(['Malawi', 'Kenya'], { required_error: 'Country is required' }),
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

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    const result = await authRegister({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      gender: values.gender,
      accountCountry: values.accountCountry,
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <Church className="h-7 w-7 text-accent" />
            <span className="font-heading text-xl font-bold">ICIMS</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start managing your churches from day one</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>First Name</Label>
              <Input {...register('firstName')} placeholder="James"
                className={errors.firstName ? 'border-destructive' : ''} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Last Name</Label>
              <Input {...register('lastName')} placeholder="Banda"
                className={errors.lastName ? 'border-destructive' : ''} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Email Address</Label>
            <Input type="email" {...register('email')} placeholder="admin@church.org"
              className={errors.email ? 'border-destructive' : ''} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
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

          <div className="space-y-1">
            <Label>Phone</Label>
            <Input {...register('phone')} placeholder={accountCountry === 'Kenya' ? '+254 ...' : '+265 ...'}
              className={errors.phone ? 'border-destructive' : ''} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1">
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

          <div className="space-y-1">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Confirm Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Repeat password"
                className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirmPassword(v => !v)}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
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
