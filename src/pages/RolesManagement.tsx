import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesService, type Permission, type Role, type RolePayload, type RoleScope } from '@/services/roles';
import { churchesService, type Church } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, CheckSquare, Square, Save, Lock, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

function groupPermissions(perms: Permission[]) {
  const groups: Record<string, Permission[]> = {};
  for (const p of perms) {
    if (!groups[p.resource]) groups[p.resource] = [];
    groups[p.resource].push(p);
  }
  return groups;
}

const RESOURCE_LABEL: Record<string, string> = {
  dashboard: 'Dashboard',
  members: 'Members',
  children: 'Children',
  events: 'Events',
  giving: 'Giving',
  campaigns: 'Campaigns',
  donations: 'Donations',
  pledges: 'Pledges',
  transactions: 'Transactions',
  attendance: 'Attendance',
  churches: 'Churches',
  communication: 'Communication',
  resources: 'Resources',
  teams: 'Teams',
  cells: 'Cells',
  reminders: 'Reminders',
  reports: 'Reports',
  performance: 'Performance',
  settings: 'Settings',
  users: 'Users',
  roles: 'Roles & Permissions',
};

const BLOCKED_CUSTOM_PERMS = ['roles:manage', 'roles:assign', 'packages:view', 'packages:manage'];

function isAllowedForCustomRole(permission: Permission) {
  return !BLOCKED_CUSTOM_PERMS.includes(permission.name)
    && !permission.name.startsWith('packages:')
    && !permission.name.startsWith('payments:')
    && !permission.name.startsWith('system_payments:');
}

function getImpliedReadName(permission: Permission | undefined, permissions: Permission[]) {
  if (!permission || permission.action === 'read') return null;
  const readPermission = permissions.find(item => item.resource === permission.resource && item.action === 'read');
  return readPermission?.name ?? null;
}

function togglePermissionWithImpliedRead(current: string[], permName: string, permissions: Permission[]) {
  const selected = new Set(current);
  const permission = permissions.find(item => item.name === permName);
  if (selected.has(permName)) {
    const hasDependentActions = permission?.action === 'read'
      && permissions.some(item => item.resource === permission.resource && item.name !== permName && selected.has(item.name));
    if (hasDependentActions) return Array.from(selected);

    selected.delete(permName);
    return Array.from(selected);
  }

  selected.add(permName);
  const impliedReadName = getImpliedReadName(permission, permissions);
  if (impliedReadName) selected.add(impliedReadName);
  return Array.from(selected);
}

function uniq(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort();
}

function ToggleList({ values, selected, onChange }: { values: string[]; selected: string[]; onChange: (values: string[]) => void }) {
  if (values.length === 0) return <p className="text-xs text-muted-foreground">No values available.</p>;
  return (
    <div className="max-h-44 overflow-auto rounded-md border p-2 grid gap-1">
      {values.map(value => (
        <label key={value} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
          <Checkbox
            checked={selected.includes(value)}
            onCheckedChange={checked => onChange(checked ? [...selected, value] : selected.filter(item => item !== value))}
          />
          <span>{value}</span>
        </label>
      ))}
    </div>
  );
}

function PermissionPicker({ permissions, selected, onChange }: { permissions: Permission[]; selected: string[]; onChange: (values: string[]) => void }) {
  const grouped = groupPermissions(permissions.filter(isAllowedForCustomRole));
  const selectedSet = new Set(selected);

  const toggle = (name: string) => {
    onChange(togglePermissionWithImpliedRead(selected, name, permissions));
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([resource, perms]) => (
        <div key={resource}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {RESOURCE_LABEL[resource] ?? resource}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {perms.map(permission => {
              const granted = selectedSet.has(permission.name);
              return (
                <button
                  key={permission.id}
                  type="button"
                  onClick={() => toggle(permission.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all text-left ${
                    granted ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}
                >
                  {granted ? <CheckSquare className="h-3.5 w-3.5 shrink-0" /> : <Square className="h-3.5 w-3.5 shrink-0" />}
                  <span className="capitalize">{permission.action}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleDialog({
  role,
  permissions,
  churches,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  role?: Role | null;
  permissions: Permission[];
  churches: Church[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: RolePayload) => void;
  isPending?: boolean;
}) {
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [scope, setScope] = useState<RoleScope>({ scopeType: 'specific_churches', churchIds: [], regions: [], districts: [], traditionalAuthorities: [] });

  const regions = useMemo(() => uniq(churches.map(church => church.region)), [churches]);
  const districts = useMemo(() => uniq(churches.map(church => church.district)), [churches]);
  const tas = useMemo(() => uniq(churches.map(church => church.traditionalAuthority)), [churches]);

  useEffect(() => {
    if (!open) return;
    setDisplayName(role?.displayName ?? '');
    setDescription(role?.description ?? '');
    setSelectedPerms(role?.permissions?.map(permission => permission.name) ?? []);
    setScope(role?.scope ?? { scopeType: 'specific_churches', churchIds: [], regions: [], districts: [], traditionalAuthorities: [] });
  }, [open, role]);

  const submit = () => {
    onSubmit({
      displayName,
      description: description || null,
      permissions: selectedPerms,
      scope,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{role ? 'Edit Custom Role' : 'Create Custom Role'}</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Role name</Label>
              <Input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Children Ministry Admin" />
            </div>
            <div>
              <Label>Data scope</Label>
              <Select value={scope.scopeType} onValueChange={value => setScope({ scopeType: value as RoleScope['scopeType'], churchIds: [], regions: [], districts: [], traditionalAuthorities: [] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_ministry">All ministry churches</SelectItem>
                  <SelectItem value="specific_churches">Specific churches</SelectItem>
                  <SelectItem value="regions">Regions</SelectItem>
                  <SelectItem value="districts">Districts</SelectItem>
                  <SelectItem value="traditional_authorities">Traditional authorities</SelectItem>
                  <SelectItem value="own_church">Own church only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={event => setDescription(event.target.value)} placeholder="Optional note about this role" />
          </div>

          {scope.scopeType === 'specific_churches' && (
            <div>
              <Label>Churches</Label>
              <ToggleList
                values={churches.map(church => `${church.name}::${church.id}`)}
                selected={(scope.churchIds ?? []).map(id => {
                  const church = churches.find(item => item.id === id);
                  return church ? `${church.name}::${church.id}` : id;
                })}
                onChange={values => setScope(s => ({ ...s, churchIds: values.map(value => value.split('::').pop() || value) }))}
              />
            </div>
          )}
          {scope.scopeType === 'regions' && <div><Label>Regions</Label><ToggleList values={regions} selected={scope.regions ?? []} onChange={values => setScope(s => ({ ...s, regions: values }))} /></div>}
          {scope.scopeType === 'districts' && <div><Label>Districts</Label><ToggleList values={districts} selected={scope.districts ?? []} onChange={values => setScope(s => ({ ...s, districts: values }))} /></div>}
          {scope.scopeType === 'traditional_authorities' && <div><Label>Traditional authorities</Label><ToggleList values={tas} selected={scope.traditionalAuthorities ?? []} onChange={values => setScope(s => ({ ...s, traditionalAuthorities: values }))} /></div>}

          <div>
            <Label>Permissions</Label>
            <div className="mt-2 rounded-md border p-3">
              <PermissionPicker permissions={permissions} selected={selectedPerms} onChange={setSelectedPerms} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" disabled={!displayName || isPending} onClick={submit} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
              <Save className="h-4 w-4" /> {isPending ? 'Saving...' : 'Save Role'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RolesManagementPage() {
  const { hasPermission } = useRole();
  const hasRoles = useHasFeature('roles_permissions');
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [pendingPerms, setPendingPerms] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({ queryKey: ['roles'], queryFn: rolesService.getRoles, enabled: hasRoles });
  const { data: allPermissions = [], isLoading: permsLoading } = useQuery({ queryKey: ['all-permissions'], queryFn: rolesService.getAllPermissions, enabled: hasRoles });
  const { data: churches = [] } = useQuery({ queryKey: ['churches'], queryFn: churchesService.getAll, enabled: hasRoles });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) => rolesService.updateRolePermissions(id, permissions),
    onSuccess: () => {
      toast.success('Permissions updated');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setDirty(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update permissions'),
  });

  const createMutation = useMutation({
    mutationFn: rolesService.createRole,
    onSuccess: () => {
      toast.success('Role created');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create role'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RolePayload }) => rolesService.updateRole(id, payload),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setEditRole(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update role'),
  });

  const deleteMutation = useMutation({
    mutationFn: rolesService.deleteRole,
    onSuccess: () => {
      toast.success('Role deleted');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setDeleteRole(null);
      setSelectedRole(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete role'),
  });

  const canManage = hasPermission('roles:manage');
  const currentRole = roles.find(role => role.id === selectedRole);
  const grouped = groupPermissions(allPermissions);

  if (!hasRoles) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Manage role permissions</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Roles & Permissions is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  function handleSelectRole(roleId: string) {
    const role = roles.find(item => item.id === roleId);
    if (role) setPendingPerms(new Set(role.permissions.map(permission => permission.name)));
    setSelectedRole(roleId);
    setDirty(false);
  }

  function togglePerm(permName: string) {
    if (!canManage || currentRole?.isEditable === false) return;
    const permission = allPermissions.find(item => item.name === permName);
    if (permission && currentRole?.isSystemRole === false && !isAllowedForCustomRole(permission)) return;
    setPendingPerms(prev => {
      const next = new Set(prev);
      if (next.has(permName)) {
        const hasDependentActions = permission?.action === 'read'
          && allPermissions.some(item => item.resource === permission.resource && item.name !== permName && next.has(item.name));
        if (hasDependentActions) return next;

        next.delete(permName);
      } else {
        next.add(permName);
        const impliedReadName = getImpliedReadName(permission, allPermissions);
        if (impliedReadName) next.add(impliedReadName);
      }
      return next;
    });
    setDirty(true);
  }

  function savePermissions() {
    if (!selectedRole) return;
    updatePermissionsMutation.mutate({ id: selectedRole, permissions: Array.from(pendingPerms) });
  }

  if (rolesLoading || permsLoading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Create roles, assign permissions, and control data scope</p>
        </div>
        {canManage && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                <Plus className="h-4 w-4" /> Create Role
              </Button>
            </DialogTrigger>
            <RoleDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              permissions={allPermissions}
              churches={churches}
              onSubmit={payload => createMutation.mutate(payload)}
              isPending={createMutation.isPending}
            />
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Roles</h2>
          {roles.filter(role => role.name !== 'ministry_admin' && role.name !== 'system_admin').map(role => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role.id)}
              className={`w-full text-left rounded-lg border p-4 transition-all ${selectedRole === role.id ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-muted/50'}`}
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="h-4 w-4 text-accent shrink-0" />
                  <span className="font-medium text-sm truncate">{role.displayName}</span>
                </div>
                <Badge variant={role.isSystemRole ? 'secondary' : 'outline'} className="text-xs shrink-0">{role.userCount} users</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {role.permissions?.length ?? 0} permission{role.permissions?.length !== 1 ? 's' : ''} assigned
              </p>
              {!role.isSystemRole && <p className="text-xs text-accent mt-1">Custom role</p>}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {!selectedRole ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg">
              <div className="text-center">
                <Shield className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select a role to manage permissions and scope</p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex flex-wrap items-center gap-2">
                      <Shield className="h-4 w-4 text-accent" />
                      {currentRole?.displayName}
                      <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />{currentRole?.userCount} users</Badge>
                      {!currentRole?.isSystemRole && <Badge variant="outline">Custom</Badge>}
                    </CardTitle>
                    {currentRole?.scope && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Scope: {currentRole.scope.scopeType.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex gap-1.5">
                      {!currentRole?.isSystemRole && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => currentRole && setEditRole(currentRole)}>
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => currentRole && setDeleteRole(currentRole)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </>
                      )}
                      {currentRole?.isEditable !== false && (
                        <Button size="sm" onClick={savePermissions} disabled={!dirty || updatePermissionsMutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1">
                          <Save className="h-3.5 w-3.5" /> {updatePermissionsMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(grouped).map(([resource, perms]) => (
                  <div key={resource}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{RESOURCE_LABEL[resource] ?? resource}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {perms.map(permission => {
                        const granted = pendingPerms.has(permission.name);
                        const blockedForCustomRole = currentRole?.isSystemRole === false && !isAllowedForCustomRole(permission);
                        return (
                          <button
                            key={permission.id}
                            onClick={() => togglePerm(permission.name)}
                            disabled={!canManage || currentRole?.isEditable === false || blockedForCustomRole}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all text-left ${
                              granted ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-muted-foreground'
                            } ${!canManage || currentRole?.isEditable === false || blockedForCustomRole ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                          >
                            {granted ? <CheckSquare className="h-3.5 w-3.5 shrink-0" /> : <Square className="h-3.5 w-3.5 shrink-0" />}
                            <span className="capitalize">{permission.action}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <RoleDialog
        role={editRole}
        open={!!editRole}
        onOpenChange={open => !open && setEditRole(null)}
        permissions={allPermissions}
        churches={churches}
        onSubmit={payload => editRole && updateRoleMutation.mutate({ id: editRole.id, payload })}
        isPending={updateRoleMutation.isPending}
      />

      <AlertDialog open={!!deleteRole} onOpenChange={open => !open && setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete custom role?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteRole?.displayName}. It cannot be deleted while users are assigned to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteRole && deleteMutation.mutate(deleteRole.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
