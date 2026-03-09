import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Church, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required' }),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.enum(['single', 'married', 'widowed', 'divorced'], { required_error: 'Marital status is required' }),
  weddingDate: z.string().optional(),
  residentialNeighbourhood: z.string().optional(),
  membershipType: z.enum(['visitor', 'member'], { required_error: 'Membership type is required' }),
  baptizedByImmersion: z.boolean().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

export default function MemberRegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married' | 'widowed' | 'divorced' | ''>('');
  const [membershipType, setMembershipType] = useState<'visitor' | 'member' | ''>('');
  const [serviceInterests, setServiceInterests] = useState<string[]>([]);
  const [baptized, setBaptized] = useState<boolean | undefined>(undefined);
  const inviteToken = searchParams.get('invite');

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!inviteToken) {
      toast.error('Invalid invite link');
      navigate('/login');
    }
  }, [inviteToken, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (!inviteToken) {
      toast.error('Invalid invite link');
      return;
    }

    const result = await authRegister({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
      maritalStatus: values.maritalStatus,
      weddingDate: values.weddingDate,
      residentialNeighbourhood: values.residentialNeighbourhood,
      membershipType: values.membershipType,
      serviceInterest: serviceInterests.join(', '),
      baptizedByImmersion: baptized,
      password: values.password,
      inviteToken,
    });

    if (result.success) {
      toast.success('Account created! Welcome to the church.');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Registration failed');
    }
  };

  if (!inviteToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <Church className="h-7 w-7 text-accent" />
            <span className="font-heading text-xl font-bold">ICIMS</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-foreground">Join as Church Member</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your account to join the church</p>
        </div>

        <Alert className="mb-4 border-accent/50 bg-accent/10">
          <AlertCircle className="h-4 w-4 text-accent" />
          <AlertDescription className="text-sm">
            You're registering via a church invite link. Your account will be automatically linked to the church.
          </AlertDescription>
        </Alert>

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
            <Input type="email" {...register('email')} placeholder="member@example.com"
              className={errors.email ? 'border-destructive' : ''} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Phone</Label>
            <Input {...register('phone')} placeholder="+265 ..."
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
            <Label>Date of Birth (Optional)</Label>
            <Input type="date" {...register('dateOfBirth')} />
          </div>

          <div className="space-y-1">
            <Label>Marital Status</Label>
            <Select value={maritalStatus} onValueChange={(v: 'single' | 'married' | 'widowed' | 'divorced') => { setMaritalStatus(v); setValue('maritalStatus', v); }}>
              <SelectTrigger className={errors.maritalStatus ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
              </SelectContent>
            </Select>
            {errors.maritalStatus && <p className="text-xs text-destructive">{errors.maritalStatus.message}</p>}
          </div>

          {maritalStatus === 'married' && (
            <div className="space-y-1">
              <Label>Wedding Date (Optional)</Label>
              <Input type="date" {...register('weddingDate')} />
              <p className="text-xs text-muted-foreground">Used for church anniversary celebrations</p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Residential Neighbourhood (Optional)</Label>
            <Input {...register('residentialNeighbourhood')} placeholder="e.g., Area 47" />
          </div>

          <div className="space-y-1">
            <Label>Are you a:</Label>
            <Select value={membershipType} onValueChange={(v: 'visitor' | 'member') => { setMembershipType(v); setValue('membershipType', v); }}>
              <SelectTrigger className={errors.membershipType ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select membership type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            {errors.membershipType && <p className="text-xs text-destructive">{errors.membershipType.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>How would you like to serve? (Optional)</Label>
            <div className="space-y-2">
              {['Choir', 'Ushering', 'Greeters', 'Security/Protocol', 'Missions/Outreaches', 'Other'].map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={serviceInterests.includes(service)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setServiceInterests([...serviceInterests, service]);
                      } else {
                        setServiceInterests(serviceInterests.filter(s => s !== service));
                      }
                    }}
                  />
                  <label htmlFor={service} className="text-sm cursor-pointer">{service}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Have you been baptized by immersion into water?</Label>
            <RadioGroup value={baptized === undefined ? '' : baptized ? 'yes' : 'no'} onValueChange={(v) => setBaptized(v === 'yes')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="baptized-yes" />
                <label htmlFor="baptized-yes" className="text-sm cursor-pointer">Yes</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="baptized-no" />
                <label htmlFor="baptized-no" className="text-sm cursor-pointer">No</label>
              </div>
            </RadioGroup>
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
            <Input type="password" {...register('confirmPassword')} placeholder="Repeat password"
              className={errors.confirmPassword ? 'border-destructive' : ''} />
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
