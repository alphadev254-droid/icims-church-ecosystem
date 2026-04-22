import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import heroImage from '@/assets/hero-church.jpg';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    const result = await login(values.email, values.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(result.redirectTo || '/dashboard');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* â”€â”€ Left brand panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/72" />
        </div>

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <img src="/icims-logo.jpg" alt="ICIMS" className="h-12 w-12 object-contain rounded-full bg-white p-1" />
        </Link>

        {/* Middle content */}
        <div className="relative z-10">
          <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-4">Church Management Platform</p>
          <h2 className="font-heading text-4xl font-bold text-white leading-tight mb-6">
            Run your church.<br />Not spreadsheets.
          </h2>
          <div className="space-y-3">
            {[
              '12 integrated modules in one platform',
              'Multi-level hierarchy support',
              'Real-time giving and attendance tracking',
              'Secure, cloud-hosted infrastructure',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                <span className="text-white/75 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 border-l-2 border-accent pl-4">
          <p className="text-white/70 text-sm italic leading-relaxed">
            "ICIMS transformed how we manage our denomination. We can focus on people, not paperwork."
          </p>
          <p className="text-white/40 text-xs mt-2">â€” Ministry Administrator, CCAP</p>
        </div>
      </div>

      {/* â”€â”€ Right form panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-background">
        <div className="w-full max-w-sm mx-auto">

          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Link to="/" className="flex flex-col items-center gap-2">
              <img src="/icims-logo.jpg" alt="ICIMS" className="h-12 w-12 object-contain rounded-full bg-white p-1" />
              <span className="font-heading text-sm font-bold text-foreground tracking-wide">ICIMS</span>
            </Link>
          </div>

          {/* Desktop logo — centered at top of form panel */}
          <div className="hidden lg:flex flex-col items-center mb-8">
            <Link to="/" className="flex flex-col items-center gap-2">
              <img src="/icims-logo.jpg" alt="ICIMS" className="h-12 w-12 object-contain rounded-full bg-white p-1" />
              <span className="font-heading text-sm font-bold text-foreground tracking-wide">ICIMS</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your church account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@church.org"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  autoComplete="current-password"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">
              Create one 
            </Link>
          </p>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors inline-flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Back to website</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
