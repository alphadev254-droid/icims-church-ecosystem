import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersService, type AppUser } from '@/services/users';
import { rolesService } from '@/services/roles';
import { churchesService } from '@/services/churches';
import { locationsService } from '@/services/locations';
import { cellsService } from '@/services/cells';
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
import { AgeRangeFilter } from '@/components/AgeRangeFilter';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

// ─── Role display helpers ─────────────────────────────────────────────────────
const ROLE_DISPLAY: Record<string, string> = {
  ministry_admin: 'Ministry Administrator',
  regional_admin: 'Regional Administrator',
  district_admin: 'District Administrator',
  branch_admin: 'Branch Administrator',
  member: 'Member',
};

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  ministry_admin: 'default',
  regional_admin: 'default',
  district_admin: 'secondary',
  branch_admin: 'secondary',
  member: 'outline',
};

// ─── Role select ──────────────────────────────────────────────────────────────
function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: rolesService.getRoles });
  // Filter out ministry_admin role from user creation/editing
  const filteredRoles = roles.filter(r => r.name !== 'ministry_admin');
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {filteredRoles.map(r => (
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
  dateOfBirth: z.string().optional(),
  maritalStatus: z.enum(['single', 'married', 'widowed', 'divorced']).optional(),
  weddingDate: z.string().optional(),
  residentialNeighbourhood: z.string().optional(),
  membershipType: z.enum(['member', 'pastor', 'deacon', 'other']).optional(),
  serviceInterest: z.string().optional(),
  baptizedByImmersion: z.boolean().optional(),
  roleName: z.string().default('member'),
  region: z.string().optional(),
  district: z.string().optional(),
  traditionalAuthority: z.string().optional(),
  village: z.string().optional(),
  churchId: z.string().optional(),
}).refine((data) => {
  if (data.roleName === 'member') {
    if (!data.churchId || data.churchId === 'CHURCH_ID_HERE' || data.churchId.includes('placeholder')) {
      return false;
    }
    if (!data.dateOfBirth || !data.maritalStatus || !data.residentialNeighbourhood) {
      return false;
    }
  }
  return true;
}, {
  message: 'Church, date of birth, marital status, and residential neighbourhood are required for members',
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
  membershipType: z.enum(['member', 'pastor', 'deacon', 'other']).nullable().optional(),
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

  // Get churches for all roles
  const { data: churches = [] } = useQuery({
    queryKey: ['churches-for-user-assignment'],
    queryFn: churchesService.getAll,
  });

  function handleRoleChange(v: string) {
    setRole(v);
    setValue('roleName', v);
    setDistricts([]);
    setTas([]);
    setRegions([]);
    
    // Clear churchId for non-member roles
    if (v !== 'member') {
      setValue('churchId', undefined);
    }
  }

  // Determine what fields are needed based on selected role
  const showAdminScope = (role === 'district_admin' || role === 'branch_admin' || role === 'regional_admin') && currentUserRole === 'ministry_admin';
  const needsChurchSelection = role === 'member';

  return (
    <form onSubmit={handleSubmit((v) =>
      { onSubmit(v, districts, tas, regions)
      }, (errors) => {

        console.log('=== CREATE FORM VALIDATION FAILED ===');
        console.log('Validation errors:', errors);
      }
    )} className="space-y-4" autoComplete="off">
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
      
      {/* Church and membership - only for member role */}
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
            <Label>Membership Type</Label>
            <Select defaultValue="member" onValueChange={(v) => setValue('membershipType', v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="pastor">Pastor</SelectItem>
                <SelectItem value="deacon">Deacon</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      
      {/* User personal fields - shown for all roles */}
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
        <Label>Date of Birth {needsChurchSelection && '*'}</Label>
        <Input type="date" {...register('dateOfBirth')} className={errors.dateOfBirth ? 'border-destructive' : ''} />
        {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth.message}</p>}
      </div>
      
      <div>
        <Label>Marital Status {needsChurchSelection && '*'}</Label>
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
        <Label>Residential Neighbourhood {needsChurchSelection && '*'}</Label>
        <Input {...register('residentialNeighbourhood')} placeholder="e.g., Area 47" className={errors.residentialNeighbourhood ? 'border-destructive' : ''} />
        {errors.residentialNeighbourhood && <p className="text-xs text-destructive mt-1">{errors.residentialNeighbourhood.message}</p>}
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
      
      {/* Admin scope for district_admin / branch_admin / regional_admin */}
      {showAdminScope && (
        <AdminScopeSelector
          role={role as 'district_admin' | 'branch_admin' | 'regional_admin'}
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
  });

  function handleRoleChange(v: string) {
    setRole(v);
    setValue('roleName', v);
    if (v !== 'district_admin') setDistricts([]);
    if (v !== 'branch_admin') setTas([]);
    if (v !== 'regional_admin') setRegions([]);
  }

  const showAdminScope = (role === 'district_admin' || role === 'branch_admin' || role === 'regional_admin') && currentUserRole === 'ministry_admin';
  const needsChurchSelection = role === 'member' && currentUserRole === 'ministry_admin';

  return (
    <form onSubmit={handleSubmit((v) => {
      console.log('=== EDIT FORM SUBMIT TRIGGERED ===');
      console.log('Form is valid, calling onSubmit');
      onSubmit(v, districts, tas, regions);
    }, (errors) => {
      console.log('=== EDIT FORM VALIDATION FAILED ===');
      console.log('Validation errors:', errors);
      console.log('===================================');
    })} className="space-y-4" autoComplete="off">
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
      
      {/* Church and membership - only for member role */}
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
            <Label>Membership Type</Label>
            <Select value={watch('membershipType')} onValueChange={(v) => setValue('membershipType', v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="pastor">Pastor</SelectItem>
                <SelectItem value="deacon">Deacon</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      
      {/* User personal fields - shown for all roles */}
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
      
      {showAdminScope && (
        <AdminScopeSelector
          role={role as 'district_admin' | 'branch_admin' | 'regional_admin'}
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
  const [cellFilter, setCellFilter] = useState<string>('all');
  const [minAge, setMinAge] = useState<number | undefined>();
  const [maxAge, setMaxAge] = useState<number | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AppUser | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({});
  const [precisionWarnings, setPrecisionWarnings] = useState<Record<number, string>>({});
  const [bulkChurchId, setBulkChurchId] = useState<string>('');
  const { hasPermission } = useRole();
  const hasUsers = useHasFeature('users_management');
  const currentUser = useAuthStore(s => s.user);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit, search, churchFilter, roleFilter, cellFilter, minAge, maxAge],
    queryFn: () => usersService.getAll({ 
      page, 
      limit, 
      search: search || undefined,
      churchId: churchFilter !== 'all' ? churchFilter : undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      cellId: cellFilter !== 'all' ? cellFilter : undefined,
      minAge,
      maxAge,
    }),
    enabled: hasUsers,
  });

  const { data: churches = [] } = useQuery({
    queryKey: ['churches-for-filter'],
    queryFn: churchesService.getAll,
  });

  // Cells for filter dropdown — use simple endpoint
  const { data: cellsForFilter = [] } = useQuery({
    queryKey: ['cells-simple-for-filter'],
    queryFn: () => cellsService.getSimple(),
    enabled: hasUsers,
    staleTime: 60_000,
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
      setPrecisionWarnings({});
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
    console.log('=== CREATE USER SUBMISSION ===');
    console.log('Form values:', v);
    console.log('Role:', v.roleName);
    console.log('Districts:', districts);
    console.log('TAs:', tas);
    console.log('Regions:', regions);
    
    const payload = {
      ...v,
      districts: (v.roleName === 'district_admin' || v.roleName === 'branch_admin') ? districts : undefined,
      traditionalAuthorities: v.roleName === 'branch_admin' ? tas : undefined,
      regions: v.roleName === 'regional_admin' ? regions : undefined,
      // Pass location data for church assignment
      region: v.region,
      district: v.district,
      traditionalAuthority: v.traditionalAuthority,
      village: v.village,
      churchId: v.churchId,
    };
    
    console.log('Final payload:', payload);
    console.log('==============================');
    
    createMutation.mutate(payload);
  }

  function handleEdit(v: EditValues, districts: string[], tas: string[], regions: string[]) {
    if (!editUser) return;
    
    console.log('=== EDIT USER SUBMISSION ===');
    console.log('Editing user:', editUser.id, editUser.firstName, editUser.lastName);
    console.log('Current user role:', editUser.roleName);
    console.log('Form values:', v);
    console.log('New role:', v.roleName);
    console.log('Districts array:', districts);
    console.log('TAs array:', tas);
    console.log('Regions array:', regions);
    
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
      serviceInterest: v.serviceInterest,
      baptizedByImmersion: v.baptizedByImmersion,
      roleName: v.roleName,
      districts: (v.roleName === 'district_admin' || v.roleName === 'branch_admin') ? districts : [],
      traditionalAuthorities: v.roleName === 'branch_admin' ? tas : [],
      regions: v.roleName === 'regional_admin' ? regions : [],
    };
    
    console.log('Payload before church check:', payload);
    
    // Set church and membership based on role
    if (v.roleName === 'member') {
      payload.churchId = v.churchId;
      payload.membershipType = v.membershipType;
      console.log('Member role - churchId:', v.churchId, 'membershipType:', v.membershipType);
    } else {
      // Clear church and membership for non-member roles
      payload.churchId = null;
      payload.membershipType = null;
      console.log('Non-member role - clearing church and membership');
    }
    
    if (v.password && v.password.trim()) {
      payload.password = v.password;
      console.log('Password will be updated');
    }
    
    console.log('Final payload:', payload);
    console.log('============================');
    
    updateMutation.mutate({ id: editUser.id, dto: payload });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Users</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{pagination?.total || 0} total users</p>
        </div>
        <div className="flex flex-wrap gap-2 self-end sm:self-auto">
          <ExportImportButtons
            data={users.map(u => ({
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              phone: u.phone || '',
              gender: (u as any).gender || '',
              dateOfBirth: (u as any).dateOfBirth ? new Date((u as any).dateOfBirth).toLocaleDateString() : '',
              maritalStatus: (u as any).maritalStatus || '',
              weddingDate: (u as any).weddingDate ? new Date((u as any).weddingDate).toLocaleDateString() : '',
              residentialNeighbourhood: (u as any).residentialNeighbourhood || '',
              baptizedByImmersion: (u as any).baptizedByImmersion ? 'Yes' : 'No',
              role: ROLE_DISPLAY[u.roleName] || u.roleName,
              teams: (u as any).teams?.join(', ') || '',
              cells: (u as any).cells?.map((c: any) => c.name).join(', ') || '',
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
              { label: 'Marital Status', key: 'maritalStatus' },
              { label: 'Wedding Date', key: 'weddingDate' },
              { label: 'Neighbourhood', key: 'residentialNeighbourhood' },
              { label: 'Baptized', key: 'baptizedByImmersion' },
              { label: 'Role', key: 'role' },
              { label: 'Teams', key: 'teams' },
              { label: 'Cells', key: 'cells' },
              { label: 'Status', key: 'status' },
              { label: 'Joined', key: 'joined' },
            ]}
            pdfTitle="Users Report"
          />
          <Button variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm" onClick={() => {
            const headers = ['First Name','Last Name','Email','Phone','Gender','Date of Birth','Marital Status','Wedding Date','Neighbourhood','Baptized','Role','Teams','Cells','Status','Joined'];
            const rows = users.map(u => [
              u.firstName, u.lastName, u.email,
              u.phone || '',
              (u as any).gender || '',
              (u as any).dateOfBirth ? new Date((u as any).dateOfBirth).toISOString().split('T')[0] : '',
              (u as any).maritalStatus || '',
              (u as any).weddingDate ? new Date((u as any).weddingDate).toISOString().split('T')[0] : '',
              (u as any).residentialNeighbourhood || '',
              (u as any).baptizedByImmersion ? 'Yes' : 'No',
              ROLE_DISPLAY[u.roleName] || u.roleName,
              (u as any).teams?.join(', ') || '',
              (u as any).cells?.map((c: any) => c.name).join(', ') || '',
              u.status,
              new Date(u.createdAt).toLocaleDateString(),
            ]);
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            // Format phone column as text
            const phoneCol = headers.indexOf('Phone');
            for (let r = 1; r <= rows.length; r++) {
              const ref = XLSX.utils.encode_cell({ r, c: phoneCol });
              if (ws[ref]) ws[ref].z = '@';
            }
            ws['!cols'] = headers.map(() => ({ wch: 20 }));
            XLSX.utils.book_append_sheet(wb, ws, 'Users');
            XLSX.writeFile(wb, 'users-export.xlsx');
          }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Excel
          </Button>
          {canCreate && (
          <>
          <Button variant="outline" className="gap-2" onClick={() => {
            // Generate Excel template using SheetJS — phone/date columns formatted as text
            const headers = ['firstName','lastName','email','phone','gender','dateOfBirth','maritalStatus','weddingDate','residentialNeighbourhood','membershipType','serviceInterest','baptizedByImmersion'];
            const notes =   ['First Name','Last Name','Email','Phone e.g. 265999000111','male or female','YYYY-MM-DD e.g. 1990-05-15','single/married/widowed/divorced','YYYY-MM-DD if married','e.g. Area 47','member/pastor/deacon/other','e.g. Choir','true or false'];
            const example = ['John','Banda','john.banda@example.com','265999000111','male','1990-05-15','married','2018-06-20','Area 47','member','Choir','false'];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, notes, example]);

            // Force text format on phone and date columns to prevent Excel auto-conversion
            const textColNames = ['phone','dateOfBirth','weddingDate'];
            textColNames.forEach(name => {
              const colIdx = headers.indexOf(name);
              if (colIdx < 0) return;
              for (let r = 0; r <= 100; r++) {
                const ref = XLSX.utils.encode_cell({ r, c: colIdx });
                if (!ws[ref]) ws[ref] = { t: 's', v: '' };
                ws[ref].z = '@';
              }
            });

            ws['!cols'] = headers.map(() => ({ wch: 22 }));
            XLSX.utils.book_append_sheet(wb, ws, 'Users Template');
            XLSX.writeFile(wb, 'users-import-template.xlsx');
          }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Template
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => document.getElementById('csv-upload')?.click()}>
            <Plus className="h-4 w-4" /> Upload CSV / Excel
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const ext = file.name.split('.').pop()?.toLowerCase();

              // ── Shared helpers ──────────────────────────────────────────────
              const normalizeDate = (val: string): string => {
                if (!val) return '';
                if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
                const d = new Date(val);
                if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                const parts = val.split(/[\/\-\.]/);
                if (parts.length === 3) {
                  const [a, b, c] = parts;
                  if (c.length === 4) {
                    const attempt = new Date(`${c}-${a.padStart(2,'0')}-${b.padStart(2,'0')}`);
                    if (!isNaN(attempt.getTime())) return attempt.toISOString().split('T')[0];
                  }
                }
                return val;
              };

              const normalizePhone = (raw: any): { value: string; warning?: string } => {
                if (typeof raw === 'number') {
                  // SheetJS raw numeric value — full precision preserved
                  if (Number.isFinite(raw) && Math.abs(raw) <= Number.MAX_SAFE_INTEGER) {
                    return { value: Math.round(raw).toString() };
                  }
                }
                const v = String(raw ?? '').trim();
                if (!v) return { value: '' };
                // Strip ="..." wrapper
                if (v.startsWith('="') && v.endsWith('"')) return { value: v.slice(2, -1) };
                // Scientific notation from CSV
                const sciMatch = v.match(/^(\d+\.?\d*)[eE]\+?(\d+)$/);
                if (sciMatch) {
                  const num = parseFloat(v);
                  if (Number.isFinite(num) && Math.abs(num) <= Number.MAX_SAFE_INTEGER) {
                    const result = Math.round(num).toString();
                    const warning = /0{4,}$/.test(result)
                      ? `Phone "${result}" — digits may be truncated. Upload the .xlsx file directly (not CSV) to preserve all digits.`
                      : undefined;
                    return { value: result, warning };
                  }
                }
                return { value: v };
              };

              const validateAndOpen = (data: any[], warnings: Record<number, string>) => {
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
                  if (!row.churchId || row.churchId === 'CHURCH_ID_HERE') rowErrors.churchId = 'Valid church required';
                  if (Object.keys(rowErrors).length > 0) errors[idx] = rowErrors;
                });
                setCsvData(data);
                setValidationErrors(errors);
                setPrecisionWarnings(warnings);
                setUploadOpen(true);
                e.target.value = '';
              };

              // ── Excel path (SheetJS) ────────────────────────────────────────
              if (ext === 'xlsx' || ext === 'xls') {
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array', cellText: false, cellDates: true });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: '' });
                const warnings: Record<number, string> = {};
                const data = rows
                  .filter(row => !String(row.firstName ?? '').startsWith('#'))
                  .map((row, idx) => {
                    const { value: phone, warning } = normalizePhone(row.phone ?? row.Phone ?? '');
                    if (warning) warnings[idx] = warning;
                    return {
                      ...row,
                      phone,
                      dateOfBirth: row.dateOfBirth ? normalizeDate(
                        row.dateOfBirth instanceof Date
                          ? row.dateOfBirth.toISOString().split('T')[0]
                          : String(row.dateOfBirth)
                      ) : '',
                      weddingDate: row.weddingDate ? normalizeDate(
                        row.weddingDate instanceof Date
                          ? row.weddingDate.toISOString().split('T')[0]
                          : String(row.weddingDate)
                      ) : '',
                    };
                  });
                validateAndOpen(data, warnings);
                return;
              }

              // ── CSV path ────────────────────────────────────────────────────
              const reader = new FileReader();
              reader.onload = (event) => {
                const text = event.target?.result as string;
                const rows = text.split('\n').map(row => row.split(','));
                const headers = rows[0].map(h => h.trim());
                const DATE_FIELDS = ['dateOfBirth', 'weddingDate'];
                const PHONE_FIELDS = ['phone'];
                const warnings: Record<number, string> = {};

                const data = rows.slice(1)
                  .filter(row => row.length > 1 && !row[0]?.trim().startsWith('#'))
                  .map((row, idx) => {
                    const obj: any = { _rowIndex: idx };
                    headers.forEach((header, i) => {
                      const raw = row[i]?.trim() || '';
                      if (PHONE_FIELDS.includes(header)) {
                        const { value, warning } = normalizePhone(raw);
                        obj[header] = value;
                        if (warning) warnings[idx] = warning;
                      } else if (DATE_FIELDS.includes(header)) {
                        let v = raw;
                        if (v.startsWith('="') && v.endsWith('"')) v = v.slice(2, -1);
                        obj[header] = normalizeDate(v);
                      } else {
                        let v = raw;
                        if (v.startsWith('="') && v.endsWith('"')) v = v.slice(2, -1);
                        obj[header] = v;
                      }
                    });
                    return obj;
                  });

                validateAndOpen(data, warnings);
              };
              reader.readAsText(file);
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
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
            placeholder="Search by name or email..." 
            className="pl-8 sm:pl-9 h-8 text-xs sm:h-10 sm:text-sm" 
          />
        </div>
        <AgeRangeFilter
          minAge={minAge}
          maxAge={maxAge}
          onMinAgeChange={(v) => { setMinAge(v); setPage(1); }}
          onMaxAgeChange={(v) => { setMaxAge(v); setPage(1); }}
          onClear={() => { setMinAge(undefined); setMaxAge(undefined); setPage(1); }}
        />
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44 h-8 text-xs sm:h-10 sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ministry_admin">Ministry Administrator</SelectItem>
            <SelectItem value="regional_admin">Regional Administrator</SelectItem>
            <SelectItem value="district_admin">District Administrator</SelectItem>
            <SelectItem value="branch_admin">Branch Administrator</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
        <Select value={churchFilter} onValueChange={(v) => { setChurchFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44 h-8 text-xs sm:h-10 sm:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Churches</SelectItem>
            {churches.map((church: any) => (
              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cellFilter} onValueChange={(v) => { setCellFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44 h-8 text-xs sm:h-10 sm:text-sm">
            <SelectValue placeholder="All Cells" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cells</SelectItem>
            <SelectItem value="none">No Cell</SelectItem>
            {(cellsForFilter as any[]).map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}{c.zone ? ` (${c.zone})` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(limit)} onValueChange={(v) => { setLimit(Math.max(100, parseInt(v))); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-28 h-8 text-xs sm:h-10 sm:text-sm">
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
                  <TableHead className="hidden xl:table-cell">Cell</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const isSelf = user.id === currentUser?.id;
                  const scopeItems = user.roleName === 'district_admin'
                    ? user.districts
                    : user.roleName === 'branch_admin'
                    ? user.traditionalAuthorities
                    : null;
                  const scopeText = !scopeItems || scopeItems.length === 0
                    ? null
                    : scopeItems.includes('__all__')
                    ? 'All'
                    : scopeItems.join(', ');

                  return (
                    <TableRow key={user.id} className="h-9 text-xs sm:text-sm">
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
                      <TableCell className="hidden xl:table-cell text-muted-foreground max-w-[120px] truncate">
                        {(user as any).cells?.length > 0
                          ? (user as any).cells.map((c: any) => c.name).join(', ')
                          : '—'}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
              {(viewUser as any).cells?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Cell / Fellowship</Label>
                  <p className="font-medium">{(viewUser as any).cells.map((c: any) => c.name).join(', ')}</p>
                </div>
              )}
              {viewUser.roleName === 'district_admin' && viewUser.districts && viewUser.districts.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Districts</Label>
                  <p className="font-medium">{viewUser.districts.includes('__all__') ? 'All Districts' : viewUser.districts.join(', ')}</p>
                </div>
              )}
              {viewUser.roleName === 'branch_admin' && viewUser.districts && viewUser.districts.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">District</Label>
                  <p className="font-medium">{viewUser.districts[0]}</p>
                </div>
              )}
              {viewUser.roleName === 'branch_admin' && viewUser.traditionalAuthorities && viewUser.traditionalAuthorities.length > 0 && (
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
          {Object.keys(precisionWarnings).length > 0 && (
            <div className="mx-1 mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">⚠️ Phone number precision warning</p>
              {Object.entries(precisionWarnings).map(([idx, msg]) => (
                <p key={idx}>Row {parseInt(idx) + 1}: {msg}</p>
              ))}
              <p className="text-amber-600">Fix: Upload the <strong>.xlsx file directly</strong> instead of saving as CSV — SheetJS will read the full number correctly.</p>
            </div>
          )}
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
                      <div>
                        <div>Church ID</div>
                        <Select value={bulkChurchId} onValueChange={(value) => {
                          setBulkChurchId(value);
                          const newData = csvData.map(row => ({ ...row, churchId: value }));
                          setCsvData(newData);
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
                    // password auto-generated by backend if not provided
                    password: row.password || undefined,
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
