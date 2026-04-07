import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, MoreHorizontal, Eye, Trash2, ShieldOff, ShieldCheck, KeyRound, Mail } from 'lucide-react';
import { adminApi, type AdminUser } from '@/services/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { ExportImportButtons } from '@/components/ExportImportButtons';

const ROLES = ['ministry_admin', 'regional_admin', 'district_admin', 'branch_admin', 'member'];
const COUNTRIES = ['Malawi', 'Kenya'];
const STATUSES = ['active', 'suspended', 'inactive'];

function statusBadge(status: string) {
  if (status === 'active') return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge>;
  if (status === 'suspended') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Suspended</Badge>;
  return <Badge variant="outline" className="text-xs">{status}</Badge>;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [emailTarget, setEmailTarget] = useState<AdminUser | null>(null);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, role, country, status, page],
    queryFn: () => adminApi.getUsers({
      search: debouncedSearch || undefined,
      role: role || undefined,
      country: country || undefined,
      status: status || undefined,
      page,
      limit: 70,
    }).then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User updated'); },
    onError: () => toast.error('Failed to update user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deleted'); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete user'),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => adminApi.resetPassword(id, password),
    onSuccess: () => { toast.success('Password reset successfully'); setResetTarget(null); setNewPassword(''); },
    onError: () => toast.error('Failed to reset password'),
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { subject: string; message: string } }) => adminApi.sendEmail(id, data),
    onSuccess: () => { toast.success('Email queued successfully'); setEmailTarget(null); setEmailForm({ subject: '', message: '' }); },
    onError: () => toast.error('Failed to send email'),
  });

  const toggleStatus = (user: AdminUser) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    updateMutation.mutate({ id: user.id, data: { status: newStatus } });
  };

  const pagination = data?.pagination;
  const users = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `${pagination.total.toLocaleString()} total users` : 'All platform users'}
          </p>
        </div>
        <ExportImportButtons
          filename="users"
          pdfTitle="Users Export"
          data={users.map(u => ({
            firstName: u.firstName, lastName: u.lastName, email: u.email,
            phone: u.phone ?? '', role: u.roleName ?? '',
            country: u.resolvedCountry ?? u.accountCountry ?? '',
            churches: u.churchCount ?? 0, status: u.status,
            joined: new Date(u.createdAt).toLocaleDateString(),
          }))}
          headers={[
            { label: 'First Name', key: 'firstName' }, { label: 'Last Name', key: 'lastName' },
            { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' },
            { label: 'Role', key: 'role' }, { label: 'Country', key: 'country' },
            { label: 'Churches', key: 'churches' }, { label: 'Status', key: 'status' },
            { label: 'Joined', key: 'joined' },
          ]}
          pdfColumns={['First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Country', 'Churches', 'Status', 'Joined']}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs"
            placeholder="Search name, email, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={role} onValueChange={v => { setRole(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r} className="text-xs">{r.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={v => { setCountry(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All countries</SelectItem>
            {COUNTRIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Country</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Churches</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                : users.map(user => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-xs">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs capitalize">{user.roleName?.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs">{user.resolvedCountry || user.accountCountry || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs">{user.churchCount ?? 0}</span>
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
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem className="text-xs gap-2" onClick={() => navigate(`/admin/users/${user.id}`)}>
                              <Eye className="h-3.5 w-3.5" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2" onClick={() => toggleStatus(user)}>
                              {user.status === 'active'
                                ? <><ShieldOff className="h-3.5 w-3.5" /> Suspend</>
                                : <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2" onClick={() => { setResetTarget(user); setNewPassword(''); }}>
                              <KeyRound className="h-3.5 w-3.5" /> Reset password
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2" onClick={() => { setEmailTarget(user); setEmailForm({ subject: '', message: '' }); }}>
                              <Mail className="h-3.5 w-3.5" /> Send email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs gap-2 text-destructive" onClick={() => setDeleteTarget(user)}>
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

        {!isLoading && users.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No users found</p>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>? This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send email dialog */}
      <Dialog open={!!emailTarget} onOpenChange={() => setEmailTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Send Email to {emailTarget?.firstName} {emailTarget?.lastName}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">{emailTarget?.email}</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Input className="h-8 text-xs" value={emailForm.subject}
                onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Important Notice" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs min-h-32 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                value={emailForm.message}
                onChange={e => setEmailForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your message here..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEmailTarget(null)}>Cancel</Button>
            <Button size="sm"
              disabled={!emailForm.subject.trim() || !emailForm.message.trim() || sendEmailMutation.isPending}
              onClick={() => emailTarget && sendEmailMutation.mutate({ id: emailTarget.id, data: emailForm })}>
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Reset Password</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-2">
            Set a new password for <strong>{resetTarget?.firstName} {resetTarget?.lastName}</strong>
          </p>
          <div className="space-y-1">
            <Label className="text-xs">New Password</Label>
            <Input className="h-8 text-xs" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button size="sm" disabled={newPassword.length < 8 || resetMutation.isPending}
              onClick={() => resetTarget && resetMutation.mutate({ id: resetTarget.id, password: newPassword })}>
              {resetMutation.isPending ? 'Resetting...' : 'Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
