import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Search, MoreHorizontal, Eye, ShieldOff, ShieldCheck, Trash2, KeyRound, Edit2 } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-xs font-medium">{value ?? '—'}</span>
    </div>
  );
}

function statusBadge(status: string) {
  if (status === 'active') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge>;
  if (status === 'suspended') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Suspended</Badge>;
  return <Badge variant="outline" className="text-xs">{status}</Badge>;
}

export default function AdminChurchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [deleteChurchOpen, setDeleteChurchOpen] = useState(false);
  const [editChurchOpen, setEditChurchOpen] = useState(false);
  const [editChurchData, setEditChurchData] = useState({ name: '', pastorName: '', phone: '', email: '', address: '' });

  const [deleteUserTarget, setDeleteUserTarget] = useState<any>(null);
  const [resetUserTarget, setResetUserTarget] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-church', id, debouncedSearch, roleFilter, statusFilter, page],
    queryFn: () => adminApi.getChurch(id!, {
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      page,
    }).then(r => r.data.data),
    enabled: !!id,
  });

  const updateChurchMutation = useMutation({
    mutationFn: (d: any) => adminApi.updateChurch(id!, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-church', id] }); toast.success('Church updated'); setEditChurchOpen(false); },
    onError: () => toast.error('Update failed'),
  });

  const deleteChurchMutation = useMutation({
    mutationFn: () => adminApi.deleteChurch(id!),
    onSuccess: () => { toast.success('Church deleted'); navigate(-1); },
    onError: () => toast.error('Delete failed'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ uid, d }: { uid: string; d: any }) => adminApi.updateChurchUser(uid, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-church', id] }); toast.success('User updated'); },
    onError: () => toast.error('Update failed'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (uid: string) => adminApi.deleteUser(uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-church', id] }); toast.success('User deleted'); setDeleteUserTarget(null); },
    onError: () => toast.error('Delete failed'),
  });

  const resetUserMutation = useMutation({
    mutationFn: ({ uid, pw }: { uid: string; pw: string }) => adminApi.resetPassword(uid, pw),
    onSuccess: () => { toast.success('Password reset'); setResetUserTarget(null); setNewPassword(''); },
    onError: () => toast.error('Reset failed'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!data) return <p className="text-sm text-muted-foreground">Church not found</p>;

  const pagination = data.userPagination;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{data.name}</h1>
            <p className="text-xs text-muted-foreground">{data.location} · {data.country}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
            onClick={() => { setEditChurchData({ name: data.name, pastorName: data.pastorName ?? '', phone: data.phone ?? '', email: data.email ?? '', address: data.address ?? '' }); setEditChurchOpen(true); }}>
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setDeleteChurchOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete Church
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Church info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Church Info</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <InfoRow label="Name" value={data.name} />
            <InfoRow label="Location" value={data.location} />
            <InfoRow label="Country" value={data.country} />
            <InfoRow label="Region" value={data.region} />
            <InfoRow label="District" value={data.district} />
            <InfoRow label="Pastor" value={data.pastorName} />
            <InfoRow label="Phone" value={data.phone} />
            <InfoRow label="Email" value={data.email} />
            <InfoRow label="Website" value={data.website} />
            <InfoRow label="Year Founded" value={data.yearFounded} />
            <InfoRow label="Branch Code" value={data.branchCode} />
            <InfoRow label="Total Users" value={data._count.users} />
            <InfoRow label="Events" value={data._count.events} />
            <InfoRow label="Campaigns" value={data._count.givingCampaigns} />
          </CardContent>
        </Card>

        {/* Ministry admin */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ministry Admin</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            {data.ministryAdmin ? (
              <>
                <InfoRow label="Name" value={`${data.ministryAdmin.firstName} ${data.ministryAdmin.lastName}`} />
                <InfoRow label="Email" value={data.ministryAdmin.email} />
                <InfoRow label="Phone" value={data.ministryAdmin.phone} />
                <InfoRow label="Country" value={data.ministryAdmin.accountCountry} />
                <div className="mt-3">
                  <Button variant="outline" size="sm" className="h-7 text-xs"
                    onClick={() => navigate(`/admin/users/${data.ministryAdmin!.id}`)}>
                    View Admin Profile →
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No admin assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members / Users */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 px-4 py-3 border-b">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-8 h-8 text-xs" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All roles</SelectItem>
                {['member', 'branch_admin', 'district_admin'].map(r => (
                  <SelectItem key={r} value={r} className="text-xs">{r.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All</SelectItem>
                <SelectItem value="active" className="text-xs">Active</SelectItem>
                <SelectItem value="suspended" className="text-xs">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                  <th className="px-4 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-xs capitalize">{user.roleName?.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">{statusBadge(user.status)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => navigate(`/admin/users/${user.id}`)}>
                            <Eye className="h-3.5 w-3.5" /> View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2"
                            onClick={() => updateUserMutation.mutate({ uid: user.id, d: { status: user.status === 'active' ? 'suspended' : 'active' } })}>
                            {user.status === 'active'
                              ? <><ShieldOff className="h-3.5 w-3.5" /> Suspend</>
                              : <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => { setResetUserTarget(user); setNewPassword(''); }}>
                            <KeyRound className="h-3.5 w-3.5" /> Reset password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => setDeleteUserTarget(user)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.users.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit church dialog */}
      <Dialog open={editChurchOpen} onOpenChange={setEditChurchOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Edit Church</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(['name', 'pastorName', 'phone', 'email', 'address'] as const).map(field => (
              <div key={field} className="space-y-1">
                <Label className="text-xs capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                <Input className="h-8 text-xs" value={editChurchData[field]} onChange={e => setEditChurchData(d => ({ ...d, [field]: e.target.value }))} />
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditChurchOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={updateChurchMutation.isPending} onClick={() => updateChurchMutation.mutate(editChurchData)}>
              {updateChurchMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete church dialog */}
      <Dialog open={deleteChurchOpen} onOpenChange={setDeleteChurchOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Delete Church</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <strong>{data.name}</strong>? All related data will be removed. This cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteChurchOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deleteChurchMutation.isPending} onClick={() => deleteChurchMutation.mutate()}>
              {deleteChurchMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user dialog */}
      <Dialog open={!!deleteUserTarget} onOpenChange={() => setDeleteUserTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Delete User</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <strong>{deleteUserTarget?.firstName} {deleteUserTarget?.lastName}</strong>? This cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteUserTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deleteUserMutation.isPending} onClick={() => deleteUserMutation.mutate(deleteUserTarget.id)}>
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset user password dialog */}
      <Dialog open={!!resetUserTarget} onOpenChange={() => setResetUserTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Reset Password</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground mb-2">For <strong>{resetUserTarget?.firstName} {resetUserTarget?.lastName}</strong></p>
          <div className="space-y-1">
            <Label className="text-xs">New Password</Label>
            <Input className="h-8 text-xs" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setResetUserTarget(null)}>Cancel</Button>
            <Button size="sm" disabled={newPassword.length < 8 || resetUserMutation.isPending}
              onClick={() => resetUserMutation.mutate({ uid: resetUserTarget.id, pw: newPassword })}>
              {resetUserMutation.isPending ? 'Resetting...' : 'Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
