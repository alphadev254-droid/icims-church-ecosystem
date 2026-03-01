import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesService } from '@/services/roles';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, CheckSquare, Square, Save } from 'lucide-react';
import { toast } from 'sonner';

// Group permissions by resource for display
function groupPermissions(perms: { id: string; name: string; resource: string; action: string }[]) {
  const groups: Record<string, typeof perms> = {};
  for (const p of perms) {
    if (!groups[p.resource]) groups[p.resource] = [];
    groups[p.resource].push(p);
  }
  return groups;
}

const RESOURCE_LABEL: Record<string, string> = {
  dashboard: 'Dashboard', members: 'Members', events: 'Events', giving: 'Giving',
  attendance: 'Attendance', churches: 'Churches', communication: 'Communication',
  resources: 'Resources', reports: 'Reports', performance: 'Performance',
  settings: 'Settings', users: 'Users', roles: 'Roles & Permissions',
};

export default function RolesManagementPage() {
  const { hasPermission } = useRole();
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [pendingPerms, setPendingPerms] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesService.getRoles,
  });

  const { data: allPermissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: rolesService.getAllPermissions,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      rolesService.updateRolePermissions(id, permissions),
    onSuccess: () => {
      toast.success('Permissions updated');
      qc.invalidateQueries({ queryKey: ['roles'] });
      setDirty(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update permissions'),
  });

  const canManage = hasPermission('roles:manage');

  const currentRole = roles.find(r => r.id === selectedRole);
  const grouped = groupPermissions(allPermissions);

  function handleSelectRole(roleId: string) {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      setPendingPerms(new Set(role.permissions.map((p: any) => p.name)));
    }
    setSelectedRole(roleId);
    setDirty(false);
  }

  function togglePerm(permName: string) {
    if (!canManage) return;
    setPendingPerms(prev => {
      const next = new Set(prev);
      if (next.has(permName)) next.delete(permName);
      else next.add(permName);
      return next;
    });
    setDirty(true);
  }

  function savePermissions() {
    if (!selectedRole) return;
    updateMutation.mutate({ id: selectedRole, permissions: Array.from(pendingPerms) });
  }

  if (rolesLoading || permsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground">Manage what each role can do in your church system</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Role list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Roles</h2>
          {roles.map((role: any) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role.id)}
              className={`w-full text-left rounded-lg border p-4 transition-all ${
                selectedRole === role.id
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <span className="font-medium text-sm">{role.displayName}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{role.userCount} users</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {role.permissions?.length ?? 0} permission{role.permissions?.length !== 1 ? 's' : ''} assigned
              </p>
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        <div className="lg:col-span-2">
          {!selectedRole ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg">
              <div className="text-center">
                <Shield className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select a role to manage its permissions</p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" />
                    {currentRole?.displayName}
                    <Badge variant="secondary" className="ml-1">
                      <Users className="h-3 w-3 mr-1" />{currentRole?.userCount} users
                    </Badge>
                  </CardTitle>
                  {canManage && (
                    <Button
                      size="sm"
                      onClick={savePermissions}
                      disabled={!dirty || updateMutation.isPending}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </div>
                {!canManage && (
                  <p className="text-xs text-muted-foreground mt-1">You have view-only access to role permissions.</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(grouped).map(([resource, perms]) => (
                  <div key={resource}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {RESOURCE_LABEL[resource] ?? resource}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {perms.map(perm => {
                        const isGranted = pendingPerms.has(perm.name);
                        return (
                          <button
                            key={perm.id}
                            onClick={() => togglePerm(perm.name)}
                            disabled={!canManage}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all text-left ${
                              isGranted
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-border text-muted-foreground hover:border-muted-foreground'
                            } ${!canManage ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                          >
                            {isGranted
                              ? <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />
                              : <Square className="h-3.5 w-3.5 flex-shrink-0" />}
                            <span className="capitalize">{perm.action}</span>
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
    </div>
  );
}
