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
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Users, Pencil, Trash2, Eye, EyeOff, Info } from 'lucide-react';
import { toast } from 'sonner';

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
  phone: z.string().optional().default(''),
  roleName: z.string().default('member'),
  // Location fields for church assignment
  region: z.string().optional(),
  district: z.string().optional(),
  traditionalAuthority: z.string().optional(),
  village: z.string().optional(),
  // Church selection for member role
  churchId: z.string().optional(),
});
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  email: z.string().email('Valid email required'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  phone: z.string().optional().default(''),
  password: z.string().min(8, 'Min 8 characters').optional().or(z.literal('')),
  roleName: z.string().default('member'),
  churchId: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

// ─── Create form ──────────────────────────────────────────────────────────────
function CreateUserForm({ onSubmit, isPending }: {
  onSubmit: (v: CreateValues, districts: string[], tas: string[]) => void;
  isPending: boolean;
}) {
  const [role, setRole] = useState('member');
  const [districts, setDistricts] = useState<string[]>([]);
  const [tas, setTas] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const currentUser = useAuthStore(s => s.user);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { roleName: 'member', phone: '' },
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
  }

  // Determine what fields are needed based on selected role
  const showAdminScope = (role === 'district_overseer' || role === 'local_admin') && currentUserRole === 'national_admin';
  const needsChurchSelection = role === 'member';

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
        <Label>Password</Label>
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
        <Label>Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input {...register('phone')} placeholder="+265 999 000 111" autoComplete="off" />
      </div>
      <div>
        <Label>Role</Label>
        <RoleSelect value={role} onChange={handleRoleChange} />
      </div>
      
      {/* Admin scope for district_overseer / local_admin */}
      {showAdminScope && (
        <AdminScopeSelector
          role={role as 'district_overseer' | 'local_admin'}
          districts={districts}
          tas={tas}
          onDistrictsChange={setDistricts}
          onTAsChange={setTas}
        />
      )}
      
      {/* Church selection for member role */}
      {needsChurchSelection && (
        <div>
          <Label>Assign to Church</Label>
          <Select onValueChange={(value) => setValue('churchId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a church" />
            </SelectTrigger>
            <SelectContent>
              {churches.map((church: any) => (
                <SelectItem key={church.id} value={church.id}>
                  {church.name} ({church.level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
  onSubmit: (v: EditValues, districts: string[], tas: string[]) => void;
  isPending: boolean;
}) {
  const [role, setRole] = useState(user.roleName ?? 'member');
  const [districts, setDistricts] = useState<string[]>(user.districts ?? []);
  const [tas, setTas] = useState<string[]>(user.traditionalAuthorities ?? []);
  const [showPassword, setShowPassword] = useState(false);
  const currentUser = useAuthStore(s => s.user);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      password: '',
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
  }

  const showAdminScope = (role === 'district_overseer' || role === 'local_admin') && currentUserRole === 'national_admin';
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
        <Label>Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
      {showAdminScope && (
        <AdminScopeSelector
          role={role as 'district_overseer' | 'local_admin'}
          districts={districts}
          tas={tas}
          onDistrictsChange={setDistricts}
          onTAsChange={setTas}
        />
      )}
      {needsChurchSelection && (
        <div>
          <Label>Assign to Church</Label>
          <Select value={user.churchId ?? undefined} onValueChange={(value) => setValue('churchId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a church" />
            </SelectTrigger>
            <SelectContent>
              {churches.map((church: any) => (
                <SelectItem key={church.id} value={church.id}>
                  {church.name} ({church.level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AppUser | null>(null);
  const { hasPermission } = useRole();
  const currentUser = useAuthStore(s => s.user);
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getAll,
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteUser(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete user'),
  });

  const canCreate = hasPermission('users:create');
  const canUpdate = hasPermission('users:update');
  const canDelete = hasPermission('users:delete');

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.roleName ?? '').toLowerCase().includes(q)
    );
  });

  function handleCreate(v: CreateValues, districts: string[], tas: string[]) {
    createMutation.mutate({
      ...v,
      districts: (v.roleName === 'district_overseer' || v.roleName === 'local_admin') ? districts : undefined,
      traditionalAuthorities: v.roleName === 'local_admin' ? tas : undefined,
      // Pass location data for church assignment
      region: v.region,
      district: v.district,
      traditionalAuthority: v.traditionalAuthority,
      village: v.village,
      churchId: v.churchId,
    });
  }

  function handleEdit(v: EditValues, districts: string[], tas: string[]) {
    if (!editUser) return;
    const payload: any = {
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone,
      email: v.email,
      roleName: v.roleName,
      churchId: v.churchId,
      districts: (v.roleName === 'district_overseer' || v.roleName === 'local_admin') ? districts : [],
      traditionalAuthorities: v.roleName === 'local_admin' ? tas : [],
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
          <p className="text-sm text-muted-foreground">{users.length} user{users.length !== 1 ? 's' : ''} in your church</p>
        </div>
        {canCreate && (
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
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
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
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Scope</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  {(canUpdate || canDelete) && <TableHead className="w-20">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(user => {
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
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{user.phone ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_BADGE_VARIANT[user.roleName] ?? 'outline'} className="text-xs capitalize">
                          {ROLE_DISPLAY[user.roleName] ?? user.roleName}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[180px] truncate">
                        {scopeText ?? '—'}
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
                              <button onClick={() => setEditUser(user)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
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
                {filtered.length === 0 && (
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
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <p><Badge variant={ROLE_BADGE_VARIANT[viewUser.roleName] ?? 'outline'}>{ROLE_DISPLAY[viewUser.roleName] ?? viewUser.roleName}</Badge></p>
              </div>
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
