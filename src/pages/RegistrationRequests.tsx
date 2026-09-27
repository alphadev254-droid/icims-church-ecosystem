import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { usersService, type AppUser } from '@/services/users';
import { churchesService } from '@/services/churches';
import { useDebounce } from '@/hooks/use-debounce';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function displayName(user: AppUser) {
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
}

export default function RegistrationRequests() {
  const [search, setSearch] = useState('');
  const [churchFilter, setChurchFilter] = useState('all');
  const [decision, setDecision] = useState<{ user: AppUser; action: 'approve' | 'reject' } | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 350);
  const { hasPermission } = useRole();
  const qc = useQueryClient();

  const canApprove = hasPermission('registration_requests:approve');
  const canReject = hasPermission('registration_requests:reject');

  const { data: churches = [] } = useQuery({
    queryKey: ['churches-for-registration-requests'],
    queryFn: churchesService.getAll,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['registration-requests', debouncedSearch, churchFilter],
    queryFn: () => usersService.getRegistrationRequests({
      search: debouncedSearch || undefined,
      churchId: churchFilter !== 'all' ? churchFilter : undefined,
      limit: 100,
    }),
  });

  const decideMutation = useMutation({
    mutationFn: ({ user, action }: { user: AppUser; action: 'approve' | 'reject' }) =>
      action === 'approve'
        ? usersService.approveRegistrationRequest(user.id)
        : usersService.rejectRegistrationRequest(user.id),
    onSuccess: (_updated, variables) => {
      qc.invalidateQueries({ queryKey: ['registration-requests'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.action === 'approve' ? 'Registration approved' : 'Registration rejected');
      setDecision(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update registration request'),
  });

  const requests = data?.data ?? [];
  const total = data?.pagination?.total ?? requests.length;

  if (!hasPermission('registration_requests:read')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have permission to view registration requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold sm:text-2xl">Registration Requests</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">{total} pending member registration{total === 1 ? '' : 's'}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search by name, email, or phone..."
            className="pl-9"
          />
        </div>
        <Select value={churchFilter} onValueChange={setChurchFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Churches</SelectItem>
            {churches.map(church => (
              <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">No pending registration requests.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Church</TableHead>
                  <TableHead>Status</TableHead>
                  {(canApprove || canReject) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{displayName(user)}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{user.email}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{user.phone ?? '-'}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{user.church?.name ?? '-'}</TableCell>
                    <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                    {(canApprove || canReject) && (
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {canApprove && (
                            <Button size="sm" className="h-8 gap-1.5" onClick={() => setDecision({ user, action: 'approve' })}>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                          )}
                          {canReject && (
                            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setDecision({ user, action: 'reject' })}>
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!decision} onOpenChange={open => !open && setDecision(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{decision?.action === 'approve' ? 'Approve registration?' : 'Reject registration?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {decision?.action === 'approve'
                ? `${decision ? displayName(decision.user) : 'This member'} will be activated for their church.`
                : `${decision ? displayName(decision.user) : 'This member'} will be marked as rejected. Their account status will not be changed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={decideMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={decideMutation.isPending}
              onClick={() => decision && decideMutation.mutate(decision)}
              className={decision?.action === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
            >
              {decideMutation.isPending ? 'Saving...' : decision?.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
