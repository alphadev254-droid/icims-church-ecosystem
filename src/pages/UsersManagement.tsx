import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersService, type AppUser } from '@/services/users';
import { rolesService } from '@/services/roles';
import { churchesService } from '@/services/churches';
import { locationsService } from '@/services/locations';
import { AdminScopeSelector } from '@/components/AdminScopeSelector';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Users, Pencil, Trash2, Eye, EyeOff, Info, Lock } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// ─── Role display helpers ─────────────────────────────────────────────────────
const ROLE_DISPLAY: Record<string, string> = {
  national_admin: 'National Admin',
  regional_leader: 'Regional Leader',
  district_overseer: 'District Overseer',
  local_admin: 'Local Admin',
  member: 'Member',
};

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  national_admin: 'default',
  regional_leader: 'default',
  district_overseer: 'secondary',
  local_admin: 'secondary',
  member: 'outline',
};

// ─── Role select ──────────────────────────────────────────────────────────────
function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: rolesService.getRoles });
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {roles.map(r => (
          <SelectItem key={r.name} value={r.name}>{ROLE_DISPLAY[r.name] ?? r.displayName}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Form schemas ─────────────────────────────────────────────────────────────
const createSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  phone: z.string().min(1, 'Phone number is required'),
  gender: z.enum(['male', 'female']).optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  maritalStatus: z.enum(['single', 'married', 'widowed', 'divorced'], { required_error: 'Marital status is required' }),
  weddingDate: z.string().optional(),
  residentialNeighbourhood: z.string().min(1, 'Residential neighbourhood is required'),
  membershipType: z.enum(['visitor', 'member']).optional(),
  serviceInterest: z.string().optional(),
  baptizedByImmersion: z.boolean().optional(),
  roleName: z.string().default('member'),
  region: z.string().optional(),
  district: z.string().optional(),
  traditionalAuthority: z.string().optional(),
  village: z.string().optional(),
  churchId: z.string().min(1, 'Church is required').refine((val) => val !== 'CHURCH_ID_HERE' && !val.includes('placeholder'), {
    message: 'Please select a valid church',
  }),
}).refine((data) => {
  if (data.roleName === 'member') {
    return !!data.churchId && !!data.dateOfBirth && !!data.maritalStatus && !!data.residentialNeighbourhood;
  }
  return true;
}, {
  message: 'All church member fields are required',
  path: ['churchId'],
});
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  email: z.string().email('Valid email required'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  phone: z.string().optional().default(''),
  password: z.string().min(8, 'Min 8 characters').optional().or(z.literal('')),
  gender: z.enum(['male', 'female']).optional(),
  dateOfBirth: z.string().optional(),
  maritalStatus: z.enum(['single', 'married', 'widowed', 'divorced']).optional(),
  weddingDate: z.string().optional(),
  residentialNeighbourhood: z.string().optional(),
  membershipType: z.enum(['visitor', 'member']).optional(),
  serviceInterest: z.string().optional(),
  baptizedByImmersion: z.boolean().optional(),
  roleName: z.string().default('member'),
  churchId: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

// ─── Create form ──────────────────────────────────────────────────────────────
function CreateUserForm({ onSubmit, isPending }: {
  onSubmit: (v: CreateValues, districts: string[], tas: string[], regions: string[]) => void;
  isPending: boolean;
}) {
  const [role, setRole] = useState('member');
  const [districts, setDistricts] = useState<string[]>([]);
  const [tas, setTas] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const currentUser = useAuthStore(s => s.user);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { roleName: 'member', phone: '', membershipType: 'member' },
  });

  // Determine current user role (with fallback for backend compatibility)
  const currentUserRole = currentUser?.roleName || currentUser?.role;

  // Get churches for member role selection
  const { data: churches = [] } = useQuery({
    queryKey: ['churches-for-user-assignment'],
    queryFn: churchesService.getAll,
    enabled: role === 'member' && currentUserRole === 'national_admin',
  });

  function handleRoleChange(v: string) {
    setRole(v);
    setValue('roleName', v);
    setDistricts([]);
    setTas([]);
    setRegions([]);
  }

  // Determine what fields are needed based on selected role
  const showAdminScope = (role === 'district_overseer' || role === 'local_admin' || role === 'regional_leader') && currentUserRole === 'national_admin';
  const needsChurchSelection = role === 'member';

  return (
    <form onSubmit={handleSubmit(v => onSubmit(v, districts, tas))} className="space-y-4" autoComplete="off">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>First Name *</Label>
          <Input {...register('firstName')} autoComplete="off" />
          {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <Label>Last Name *</Label>
          <Input {...register('lastName')} autoComplete="off" />
          {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <Label>Email *</Label>
        <Input {...register('email')} type="email" autoComplete="off" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label>Password *</Label>
        <div className="relative">
          <Input 
            {...register('password')} 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Min 8 characters" 
            className="pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <Label>Phone *</Label>
        <Input {...register('phone')} placeholder="+265 999 000 111" autoComplete="off" />
        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
      </div>
      <div>
        <Label>Role *</Label>
        <RoleSelect value={role} onChange={handleRoleChange} />
      </div>
      
      {/* Member-specific fields */}
      {needsChurchSelection && (
        <>
          <div>
            <Label>Assign to Church *</Label>
            <Select onValueChange={(value) => setValue('churchId', value)}>
              <SelectTrigger className={errors.churchId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a church" />
              </SelectTrigger>
              <SelectContent>
                {churches.map((church: any) => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.name} 
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.churchId && <p className="text-xs text-destructive mt-1">{errors.churchId.message}</p>}
          </div>
          
          <div>
            <Label>Gender</Label>
            <Select onValueChange={(v) => setValue('gender', v as 'male' | 'female')}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Date of Birth *</Label>
            <Input type="date" {...register('dateOfBirth')} className={errors.dateOfBirth ? 'border-destructive' : ''} />
            {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth.message}</p>}
          </div>
          
          <div>
            <Label>Marital Status *</Label>
            <Select onValueChange={(v) => setValue('maritalStatus', v as any)}>
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
            {errors.maritalStatus && <p className="text-xs text-destructive mt-1">{errors.maritalStatus.message}</p>}
          </div>
          
          {watch('maritalStatus') === 'married' && (
            <div>
              <Label>Wedding Date</Label>
              <Input type="date" {...register('weddingDate')} />
            </div>
          )}
          
          <div>
            <Label>Residential Neighbourhood *</Label>
            <Input {...register('residentialNeighbourhood')} placeholder="e.g., Area 47" className={errors.residentialNeighbourhood ? 'border-destructive' : ''} />
            {errors.residentialNeighbourhood && <p className="text-xs text-destructive mt-1">{errors.residentialNeighbourhood.message}</p>}
          </div>
          
          <div>
            <Label>Membership Type</Label>
            <Select defaultValue="member" onValueChange={(v) => setValue('membershipType', v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Service Interest <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input {...register('serviceInterest')} placeholder="e.g., Choir, Ushering" />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="baptized"
              onChange={(e) => setValue('baptizedByImmersion', e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="baptized" className="cursor-pointer">Baptized by immersion</Label>
          </div>
        </>
      )}
      
      {/* Admin scope for district_overseer / local_admin / regional_leader */}
      {showAdminScope && (
        <AdminScopeSelector
          role={role as 'district_overseer' | 'local_admin' | 'regional_leader'}
          districts={districts}
          tas={tas}
          regions={regions}
          onDistrictsChange={setDistricts}
          onTAsChange={setTas}
          onRegionsChange={setRegions}
        />
      )}
      
      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Creating...' : 'Create User'}
      </Button>
    </form>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────
function EditUserForm({ user, onSubmit, isPending }: {
  user: AppUser;
  onSubmit: (v: EditValues, districts: string[], tas: string[], regions: string[]) => void;
  isPending: boolean;
}) {
  const [role, setRole] = useState(user.roleName ?? 'member');
  const [districts, setDistricts] = useState<string[]>(user.districts ?? []);
  const [tas, setTas] = useState<string[]>(user.traditionalAuthorities ?? []);
  const [regions, setRegions] = useState<string[]>(user.regions ?? []);
  const [showPassword, setShowPassword] = useState(false);
  const currentUser = useAuthStore(s => s.user);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      password: '',
      gender: (user as any).gender,
      dateOfBirth: (user as any).dateOfBirth ? new Date((user as any).dateOfBirth).toISOString().split('T')[0] : '',
      maritalStatus: (user as any).maritalStatus,
      weddingDate: (user as any).weddingDate ? new Date((user as any).weddingDate).toISOString().split('T')[0] : '',
      residentialNeighbourhood: (user as any).residentialNeighbourhood ?? '',
      membershipType: (user as any).membershipType,
      serviceInterest: (user as any).serviceInterest ?? '',
      baptizedByImmersion: (user as any).baptizedByImmersion ?? false,
      roleName: user.roleName ?? 'member',
      churchId: user.churchId ?? undefined,
    },
  });

  const currentUserRole = currentUser?.roleName || currentUser?.role;

  const { data: churches = [] } = useQuery({
    queryKey: ['churches-for-edit'],
    queryFn: churchesService.getAll,
    enabled: role === 'member' && currentUserRole === 'national_admin',
  });

  function handleRoleChange(v: string) {
    setRole(v);
    setValue('roleName', v);
    if (v !== 'district_overseer') setDistricts([]);
    if (v !== 'local_admin') setTas([]);
    if (v !== 'regional_leader') setRegions([]);
  }

  const showAdminScope = (role === 'district_overseer' || role === 'local_admin' || role === 'regional_leader') && currentUserRole === 'national_admin';
  const needsChurchSelection = role === 'member' && currentUserRole === 'national_admin';

  return (
    <form onSubmit={handleSubmit(v => onSubmit(v, districts, tas))} className="space-y-4" autoComplete="off">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>First Name</Label>
          <Input {...register('firstName')} autoComplete="off" />
          {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <Label>Last Name</Label>
          <Input {...register('lastName')} autoComplete="off" />
          {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <Label>Email</Label>
        <Input {...register('email')} type="email" autoComplete="off" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label>Phone</Label>
        <Input {...register('phone')} placeholder="+265 999 000 111" autoComplete="off" />
      </div>
      <div>
        <Label>New Password <span className="text-muted-foreground text-xs">(leave blank to keep current)</span></Label>
        <div className="relative">
          <Input 
            {...register('password')} 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Min 8 characters" 
            className="pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <Label>Role</Label>
        <RoleSelect value={role} onChange={handleRoleChange} />
      </div>
      
      {needsChurchSelection && (
        <>
          <div>
            <Label>Assign to Church</Label>
            <Select value={user.churchId ?? undefined} onValueChange={(value) => setValue('churchId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a church" />
              </SelectTrigger>
              <SelectContent>
                {churches.map((church: any) => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.name} 
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Gender</Label>
            <Select value={watch('gender')} onValueChange={(v) => setValue('gender', v as 'male' | 'female')}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" {...register('dateOfBirth')} />
          </div>
          
          <div>
            <Label>Marital Status</Label>
            <Select value={watch('maritalStatus')} onValueChange={(v) => setValue('maritalStatus', v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watch('maritalStatus') === 'married' && (
            <div>
              <Label>Wedding Date</Label>
              <Input type="date" {...register('weddingDate')} />
            </div>
          )}
          
          <div>
            <Label>Residential Neighbourhood</Label>
            <Input {...register('residentialNeighbourhood')} placeholder="e.g., Area 47" />
          </div>
          
          <div>
            <Label>Membership Type</Label>
            <Select value={watch('membershipType')} onValueChange={(v) => setValue('membershipType', v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visitor">Visitor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Service Interest</Label>
            <Input {...register('serviceInterest')} placeholder="e.g., Choir, Ushering" />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="baptized-edit"
              checked={watch('baptizedByImmersion')}
              onChange={(e) => setValue('baptizedByImmersion', e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="baptized-edit" className="cursor-pointer">Baptized by immersion</Label>
          </div>
        </>
      )}
      
      {showAdminScope && (
        <AdminScopeSelector
          role={role as 'district_overseer' | 'local_admin' | 'regional_leader'}
          districts={districts}
          tas={tas}
          regions={regions}
          onDistrictsChange={setDistricts}
          onTAsChange={setTas}
          onRegionsChange={setRegions}
        />
      )}
      
      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UsersManagement() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [churchFilter, setChurchFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AppUser | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({});
  const [bulkChurchId, setBulkChurchId] = useState<string>('');
  const { hasPermission } = useRole();
  const hasUsers = useHasFeature('users_management');
  const currentUser = useAuthStore(s => s.user);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, search, churchFilter, roleFilter],
    queryFn: () => usersService.getAll({ 
      page, 
      limit, 
      search: search || undefined,
      churchId: churchFilter !== 'all' ? churchFilter : undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined
    }),
    enabled: hasUsers,
  });

  const { data: churches = [] } = useQuery({
    queryKey: ['churches-for-filter'],
    queryFn: churchesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (dto: Parameters<typeof usersService.create>[0]) => usersService.create(dto),
    onSuccess: () => {
      toast.success('User created');
      qc.invalidateQueries({ queryKey: ['users'] });
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof usersService.update>[1] }) => usersService.update(id, dto),
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update user'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => usersService.update(id, { status }),
    onSuccess: () => {
      toast.success('User status updated');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteUser(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete user'),
  });

  const bulkUploadMutation = useMutation({
    mutationFn: (users: any[]) => usersService.bulkCreate(users),
    onSuccess: (data) => {
      toast.success(`Successfully uploaded ${data.success} users`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} users failed to upload`);
        console.error('Failed users:', data.errors);
      }
      qc.invalidateQueries({ queryKey: ['users'] });
      setUploadOpen(false);
      setCsvData([]);
      setValidationErrors({});
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Bulk upload failed'),
  });

  const canCreate = hasPermission('users:create');
  const canUpdate = hasPermission('users:update');
  const canDelete = hasPermission('users:delete');

  if (!hasUsers) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage system users</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            User Management is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const users = data?.data || [];
  const pagination = data?.pagination;

  function handleCreate(v: CreateValues, districts: string[], tas: string[], regions: string[]) {
    createMutation.mutate({
      ...v,
      districts: (v.roleName === 'district_overseer' || v.roleName === 'local_admin') ? districts : undefined,
      traditionalAuthorities: v.roleName === 'local_admin' ? tas : undefined,
      regions: v.roleName === 'regional_leader' ? regions : undefined,
      // Pass location data for church assignment
      region: v.region,
      district: v.district,
      traditionalAuthority: v.traditionalAuthority,
      village: v.village,
      churchId: v.churchId,
    });
  }

  function handleEdit(v: EditValues, districts: string[], tas: string[], regions: string[]) {
    if (!editUser) return;
    const payload: any = {
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone,
      email: v.email,
      gender: v.gender,
      dateOfBirth: v.dateOfBirth,
      maritalStatus: v.maritalStatus,
      weddingDate: v.weddingDate,
      residentialNeighbourhood: v.residentialNeighbourhood,
      membershipType: v.membershipType,
      serviceInterest: v.serviceInterest,
      baptizedByImmersion: v.baptizedByImmersion,
      roleName: v.roleName,
      churchId: v.churchId,
      districts: (v.roleName === 'district_overseer' || v.roleName === 'local_admin') ? districts : [],
      traditionalAuthorities: v.roleName === 'local_admin' ? tas : [],
      regions: v.roleName === 'regional_leader' ? regions : [],
    };
    if (v.password && v.password.trim()) {
      payload.password = v.password;
    }
    updateMutation.mutate({ id: editUser.id, dto: payload });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{pagination?.total || 0} total users</p>
        </div>
        <div className="flex gap-2">
          <ExportImportButtons
            data={users.map(u => ({
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              phone: u.phone || '',
              gender: (u as any).gender || '',
              dateOfBirth: (u as any).dateOfBirth ? new Date((u as any).dateOfBirth).toLocaleDateString() : '',
              weddingDate: (u as any).weddingDate ? new Date((u as any).weddingDate).toLocaleDateString() : '',
              anniversary: (u as any).anniversary ? new Date((u as any).anniversary).toLocaleDateString() : '',
              residentialNeighbourhood: (u as any).residentialNeighbourhood || '',
              baptizedByImmersion: (u as any).baptizedByImmersion ? 'Yes' : 'No',
              role: ROLE_DISPLAY[u.roleName] || u.roleName,
              teams: (u as any).teams?.join(', ') || '',
              status: u.status,
              joined: new Date(u.createdAt).toLocaleDateString(),
            }))}
            filename="users"
            headers={[
              { label: 'First Name', key: 'firstName' },
              { label: 'Last Name', key: 'lastName' },
              { label: 'Email', key: 'email' },
              { label: 'Phone', key: 'phone' },
              { label: 'Gender', key: 'gender' },
              { label: 'Date of Birth', key: 'dateOfBirth' },
              { label: 'Wedding Date', key: 'weddingDate' },
              { label: 'Anniversary', key: 'anniversary' },
              { label: 'Neighbourhood', key: 'residentialNeighbourhood' },
              { label: 'Baptized', key: 'baptizedByImmersion' },
              { label: 'Role', key: 'role' },
              { label: 'Teams', key: 'teams' },
              { label: 'Status', key: 'status' },
              { label: 'Joined', key: 'joined' },
            ]}
            pdfTitle="Users Report"
          />
          {canCreate && (
          <>
          <Button variant="outline" className="gap-2" onClick={() => document.getElementById('csv-upload')?.click()}>
            <Plus className="h-4 w-4" /> Upload CSV
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result as string;
                  const rows = text.split('\n').map(row => row.split(','));
                  const headers = rows[0].map(h => h.trim());
                  const data = rows.slice(1).filter(row => row.length > 1).map((row, idx) => {
                    const obj: any = { _rowIndex: idx };
                    headers.forEach((header, i) => {
                      obj[header] = row[i]?.trim() || '';
                    });
                    return obj;
                  });
                  
                  // Validate immediately on load
                  const errors: Record<number, Record<string, string>> = {};
                  data.forEach((row, idx) => {
                    const rowErrors: Record<string, string> = {};
                    if (!row.firstName) rowErrors.firstName = 'Required';
                    if (!row.lastName) rowErrors.lastName = 'Required';
                    if (!row.email) rowErrors.email = 'Required';
                    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) rowErrors.email = 'Invalid email';
                    if (!row.phone) rowErrors.phone = 'Required';
                    if (!row.dateOfBirth) rowErrors.dateOfBirth = 'Required';
                    if (!row.maritalStatus) rowErrors.maritalStatus = 'Required';
                    if (!row.residentialNeighbourhood) rowErrors.residentialNeighbourhood = 'Required';
                    if (!row.churchId || row.churchId === 'CHURCH_ID_HERE' || row.churchId.includes('placeholder')) rowErrors.churchId = 'Valid church required';
                    if (Object.keys(rowErrors).length > 0) errors[idx] = rowErrors;
                  });
                  
                  setCsvData(data);
                  setValidationErrors(errors);
                  setUploadOpen(true);
                  e.target.value = '';
                };
                reader.readAsText(file);
              }
            }}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-heading">Add New User</DialogTitle></DialogHeader>
              <CreateUserForm onSubmit={handleCreate} isPending={createMutation.isPending} />
            </DialogContent>
          </Dialog>
          </>
        )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
            placeholder="Search by name or email..." 
            className="pl-9" 
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="national_admin">National Admin</SelectItem>
            <SelectItem value="regional_leader">Regional Leader</SelectItem>
            <SelectItem value="district_overseer">District Overseer</SelectItem>
            <SelectItem value="local_admin">Local Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
        <Select value={churchFilter} onValueChange={(v) => { setChurchFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Churches</SelectItem>
            {churches.map((church: any) => (
              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(limit)} onValueChange={(v) => { setLimit(Math.max(100, parseInt(v))); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
            <SelectItem value="500">500</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden xl:table-cell">Gender</TableHead>
                  <TableHead className="hidden xl:table-cell">DOB</TableHead>
                  <TableHead className="hidden lg:table-cell">Marital Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Residence</TableHead>
                  <TableHead className="hidden 2xl:table-cell">Baptized</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden xl:table-cell">Teams</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const isSelf = user.id === currentUser?.id;
                  const scopeItems = user.roleName === 'district_overseer'
                    ? user.districts
                    : user.roleName === 'local_admin'
                    ? user.traditionalAuthorities
                    : null;
                  const scopeText = !scopeItems || scopeItems.length === 0
                    ? null
                    : scopeItems.includes('__all__')
                    ? 'All'
                    : scopeItems.join(', ');

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                        {isSelf && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>}
                        {user.status === 'inactive' && <Badge variant="destructive" className="ml-2 text-xs">Inactive</Badge>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{user.phone ?? '—'}</TableCell>
                      <TableCell className="hidden xl:table-cell text-xs capitalize">{(user as any).gender ?? '—'}</TableCell>
                      <TableCell className="hidden xl:table-cell text-xs">
                        {(user as any).dateOfBirth ? new Date((user as any).dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs capitalize">{(user as any).maritalStatus ?? '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{(user as any).residentialNeighbourhood ?? '—'}</TableCell>
                      <TableCell className="hidden 2xl:table-cell text-xs">{(user as any).baptizedByImmersion ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_BADGE_VARIANT[user.roleName] ?? 'outline'} className="text-xs capitalize">
                          {ROLE_DISPLAY[user.roleName] ?? user.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[150px] truncate">
                        {(user as any).teams?.length > 0 ? (user as any).teams.join(', ') : '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      {(canUpdate || canDelete) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setViewUser(user)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                            {canUpdate && (
                              <>
                                <button onClick={() => setEditUser(user)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => toggleStatusMutation.mutate({ id: user.id, status: user.status === 'active' ? 'inactive' : 'active' })}
                                  disabled={isSelf}
                                >
                                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                </Button>
                              </>
                            )}
                            {canDelete && !isSelf && (
                              <button onClick={() => setDeleteUser(user)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {canCreate ? 'No users yet. Add your first user!' : 'No users found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* View dialog */}
      <Dialog open={!!viewUser} onOpenChange={open => !open && setViewUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">User Details</DialogTitle></DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">First Name</Label>
                  <p className="font-medium">{viewUser.firstName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Name</Label>
                  <p className="font-medium">{viewUser.lastName}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{viewUser.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{viewUser.phone || '—'}</p>
              </div>
              {(viewUser as any).gender && (
                <div>
                  <Label className="text-muted-foreground">Gender</Label>
                  <p className="font-medium capitalize">{(viewUser as any).gender}</p>
                </div>
              )}
              {(viewUser as any).dateOfBirth && (
                <div>
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p className="font-medium">{new Date((viewUser as any).dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
              {(viewUser as any).weddingDate && (
                <div>
                  <Label className="text-muted-foreground">Wedding Date</Label>
                  <p className="font-medium">{new Date((viewUser as any).weddingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
              {(viewUser as any).anniversary && (
                <div>
                  <Label className="text-muted-foreground">Anniversary</Label>
                  <p className="font-medium">{new Date((viewUser as any).anniversary).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              )}
              {(viewUser as any).residentialNeighbourhood && (
                <div>
                  <Label className="text-muted-foreground">Residential Neighbourhood</Label>
                  <p className="font-medium">{(viewUser as any).residentialNeighbourhood}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Baptized by Immersion</Label>
                <p className="font-medium">{(viewUser as any).baptizedByImmersion ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p><Badge variant={ROLE_BADGE_VARIANT[viewUser.roleName] ?? 'outline'}>{ROLE_DISPLAY[viewUser.roleName] ?? viewUser.roleName}</Badge></p>
              </div>
              {(viewUser as any).teams?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Teams</Label>
                  <p className="font-medium">{(viewUser as any).teams.join(', ')}</p>
                </div>
              )}
              {viewUser.roleName === 'district_overseer' && viewUser.districts && viewUser.districts.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Districts</Label>
                  <p className="font-medium">{viewUser.districts.includes('__all__') ? 'All Districts' : viewUser.districts.join(', ')}</p>
                </div>
              )}
              {viewUser.roleName === 'local_admin' && viewUser.districts && viewUser.districts.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">District</Label>
                  <p className="font-medium">{viewUser.districts[0]}</p>
                </div>
              )}
              {viewUser.roleName === 'local_admin' && viewUser.traditionalAuthorities && viewUser.traditionalAuthorities.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Traditional Authorities</Label>
                  <p className="font-medium">{viewUser.traditionalAuthorities.includes('__all__') ? 'All TAs' : viewUser.traditionalAuthorities.join(', ')}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Joined</Label>
                <p className="font-medium">{new Date(viewUser.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Edit User</DialogTitle></DialogHeader>
          {editUser && (
            <EditUserForm
              user={editUser}
              onSubmit={handleEdit}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* CSV Upload Preview Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Review CSV Data ({csvData.length} users)</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1200px]">
                <thead className="sticky top-0 bg-background border-b z-10">
                  <tr>
                    <th className="p-2 text-left min-w-[120px]">First Name</th>
                    <th className="p-2 text-left min-w-[120px]">Last Name</th>
                    <th className="p-2 text-left min-w-[180px]">Email</th>
                    <th className="p-2 text-left min-w-[130px]">Phone</th>
                    <th className="p-2 text-left min-w-[100px]">Gender</th>
                    <th className="p-2 text-left min-w-[120px]">DOB</th>
                    <th className="p-2 text-left min-w-[130px]">Marital Status</th>
                    <th className="p-2 text-left min-w-[120px]">Wedding Date</th>
                    <th className="p-2 text-left min-w-[150px]">Neighbourhood</th>
                    <th className="p-2 text-left min-w-[120px]">Membership</th>
                    <th className="p-2 text-left min-w-[150px]">Service Interest</th>
                    <th className="p-2 text-left min-w-[100px]">Baptized</th>
                    <th className="p-2 text-left min-w-[200px]">
                      <div className="space-y-1">
                        <div>Church ID</div>
                        <Select value={bulkChurchId} onValueChange={(value) => {
                          setBulkChurchId(value);
                          const newData = csvData.map(row => ({ ...row, churchId: value }));
                          setCsvData(newData);
                          // Clear all churchId errors
                          const newErrors = { ...validationErrors };
                          Object.keys(newErrors).forEach(idx => {
                            if (newErrors[idx].churchId) {
                              delete newErrors[idx].churchId;
                              if (Object.keys(newErrors[idx]).length === 0) delete newErrors[idx];
                            }
                          });
                          setValidationErrors(newErrors);
                        }}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Apply to all" />
                          </SelectTrigger>
                          <SelectContent>
                            {churches.map((church: any) => (
                              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </th>
                    <th className="p-2 text-left min-w-[120px]">Password</th>
                  </tr>
                </thead>
                <tbody>
                {csvData.map((row, idx) => {
                  const errors = validationErrors[idx] || {};
                  const hasErrors = Object.keys(errors).length > 0;
                  return (
                    <tr key={idx} className={hasErrors ? 'bg-destructive/10' : ''}>
                      <td className="p-2">
                        <Input
                          value={row.firstName || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].firstName = e.target.value;
                            setCsvData(newData);
                            // Clear error if field is now valid
                            if (e.target.value && validationErrors[idx]?.firstName) {
                              const newErrors = { ...validationErrors };
                              delete newErrors[idx].firstName;
                              if (Object.keys(newErrors[idx]).length === 0) delete newErrors[idx];
                              setValidationErrors(newErrors);
                            }
                          }}
                          className={errors.firstName ? 'border-destructive' : ''}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.lastName || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].lastName = e.target.value;
                            setCsvData(newData);
                            if (e.target.value && validationErrors[idx]?.lastName) {
                              const newErrors = { ...validationErrors };
                              delete newErrors[idx].lastName;
                              if (Object.keys(newErrors[idx]).length === 0) delete newErrors[idx];
                              setValidationErrors(newErrors);
                            }
                          }}
                          className={errors.lastName ? 'border-destructive' : ''}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.email || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].email = e.target.value;
                            setCsvData(newData);
                            if (e.target.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value) && validationErrors[idx]?.email) {
                              const newErrors = { ...validationErrors };
                              delete newErrors[idx].email;
                              if (Object.keys(newErrors[idx]).length === 0) delete newErrors[idx];
                              setValidationErrors(newErrors);
                            }
                          }}
                          className={errors.email ? 'border-destructive' : ''}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.phone || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].phone = e.target.value;
                            setCsvData(newData);
                            if (e.target.value && validationErrors[idx]?.phone) {
                              const newErrors = { ...validationErrors };
                              delete newErrors[idx].phone;
                              if (Object.keys(newErrors[idx]).length === 0) delete newErrors[idx];
                              setValidationErrors(newErrors);
                            }
                          }}
                          className={errors.phone ? 'border-destructive' : ''}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.gender || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].gender = e.target.value;
                            setCsvData(newData);
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="date"
                          value={row.dateOfBirth || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].dateOfBirth = e.target.value;
                            setCsvData(newData);
                            if (e.target.value && validationErrors[idx]?.dateOfBirth) {
                              const newErrors = { ...validationErrors };
                              delete newErrors[idx].dateOfBirth;
                              if (Object.keys(newErrors[idx]).length === 0) delete newErrors[idx];
                              setValidationErrors(newErrors);
                            }
                          }}
                          className={errors.dateOfBirth ? 'border-destructive' : ''}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.maritalStatus || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].maritalStatus = e.target.value;
                            setCsvData(newData);
                            if (e.target.value && validationErrors[idx]?.maritalStatus) {
                              const newErrors = { ...validationErrors };
                              delete newErrors[idx].maritalStatus;
                              if (Object.keys(newErrors[idx]).length === 0) delete newErrors[idx];
                              setValidationErrors(newErrors);
                            }
                          }}
                          className={errors.maritalStatus ? 'border-destructive' : ''}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="date"
                          value={row.weddingDate || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].weddingDate = e.target.value;
                            setCsvData(newData);
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.residentialNeighbourhood || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].residentialNeighbourhood = e.target.value;
                            setCsvData(newData);
                            if (e.target.value && validationErrors[idx]?.residentialNeighbourhood) {
                              const newErrors = { ...validationErrors };
                              delete newErrors[idx].residentialNeighbourhood;
                              if (Object.keys(newErrors[idx]).length === 0) delete newErrors[idx];
                              setValidationErrors(newErrors);
                            }
                          }}
                          className={errors.residentialNeighbourhood ? 'border-destructive' : ''}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.membershipType || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].membershipType = e.target.value;
                            setCsvData(newData);
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.serviceInterest || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].serviceInterest = e.target.value;
                            setCsvData(newData);
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.baptizedByImmersion || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].baptizedByImmersion = e.target.value;
                            setCsvData(newData);
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={row.churchId || ''}
                          onValueChange={(value) => {
                            const newData = [...csvData];
                            newData[idx].churchId = value;
                            setCsvData(newData);
                            if (value && validationErrors[idx]?.churchId) {
                              const newErrors = { ...validationErrors };
                              delete newErrors[idx].churchId;
                              if (Object.keys(newErrors[idx]).length === 0) delete newErrors[idx];
                              setValidationErrors(newErrors);
                            }
                          }}
                        >
                          <SelectTrigger className={errors.churchId ? 'border-destructive h-9' : 'h-9'}>
                            <SelectValue placeholder="Select church" />
                          </SelectTrigger>
                          <SelectContent>
                            {churches.map((church: any) => (
                              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.password || ''}
                          onChange={(e) => {
                            const newData = [...csvData];
                            newData[idx].password = e.target.value;
                            setCsvData(newData);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button
              disabled={bulkUploadMutation.isPending}
              onClick={() => {
                const errors: Record<number, Record<string, string>> = {};
                csvData.forEach((row, idx) => {
                  const rowErrors: Record<string, string> = {};
                  if (!row.firstName) rowErrors.firstName = 'Required';
                  if (!row.lastName) rowErrors.lastName = 'Required';
                  if (!row.email) rowErrors.email = 'Required';
                  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) rowErrors.email = 'Invalid email';
                  if (!row.phone) rowErrors.phone = 'Required';
                  if (!row.dateOfBirth) rowErrors.dateOfBirth = 'Required';
                  if (!row.maritalStatus) rowErrors.maritalStatus = 'Required';
                  if (!row.residentialNeighbourhood) rowErrors.residentialNeighbourhood = 'Required';
                  if (!row.churchId || row.churchId === 'CHURCH_ID_HERE' || row.churchId.includes('placeholder')) rowErrors.churchId = 'Valid church required';
                  if (Object.keys(rowErrors).length > 0) errors[idx] = rowErrors;
                });
                setValidationErrors(errors);
                if (Object.keys(errors).length === 0) {
                  bulkUploadMutation.mutate(csvData.map(row => ({
                    firstName: row.firstName,
                    lastName: row.lastName,
                    email: row.email,
                    phone: row.phone,
                    gender: row.gender,
                    dateOfBirth: row.dateOfBirth,
                    maritalStatus: row.maritalStatus,
                    weddingDate: row.weddingDate,
                    residentialNeighbourhood: row.residentialNeighbourhood,
                    membershipType: row.membershipType || 'member',
                    serviceInterest: row.serviceInterest,
                    baptizedByImmersion: row.baptizedByImmersion === 'true' || row.baptizedByImmersion === 'Yes',
                    churchId: row.churchId,
                    password: row.password || 'Welcome123',
                    roleName: 'member',
                  })));
                } else {
                  toast.error('Please fix validation errors');
                }
              }}
              className={Object.keys(validationErrors).length === 0 && csvData.length > 0 ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {bulkUploadMutation.isPending ? 'Uploading...' : `Upload ${csvData.length} Users`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={open => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteUser?.firstName} {deleteUser?.lastName}</strong> ({deleteUser?.email})? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
