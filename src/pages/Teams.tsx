import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { teamsService, Team } from '@/services/teams';
import { churchesService } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/contexts/AuthContext';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, Plus, Pencil, Trash2, UserPlus, Crown, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function TeamsPage() {
  const { user } = useAuth();
  const { hasPermission } = useRole();
  const hasTeamsFeature = useHasFeature('teams_management');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [churchFilter, setChurchFilter] = useState<string>('all');

  const isMember = user?.roleName === 'member';

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', churchFilter],
    queryFn: async () => {
      const filterValue = churchFilter !== 'all' ? churchFilter : undefined;
      return teamsService.getAll(filterValue);
    },
    enabled: hasPermission('teams:read'),
  });

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll,
    enabled: !isMember,
  });

  const createMutation = useMutation({
    mutationFn: teamsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created');
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create team'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => teamsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated');
      setEditTeam(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update team'),
  });

  const deleteMutation = useMutation({
    mutationFn: teamsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted');
      setDeleteTeam(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete team'),
  });

  const canCreate = hasPermission('teams:create') && hasTeamsFeature && !isMember;
  const canUpdate = hasPermission('teams:update') && hasTeamsFeature && !isMember;
  const canDelete = hasPermission('teams:delete') && hasTeamsFeature && !isMember;
  const canAssign = hasPermission('teams:assign') && hasTeamsFeature && !isMember;

  // Members see their teams without feature gate
  if (!hasTeamsFeature && !isMember) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Teams</h1>
          <p className="text-sm text-muted-foreground">Manage church teams and members</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Teams Management is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">Upgrade now</Link>
            {' '}to unlock teams management features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasPermission('teams:read')) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Teams</h1>
        <p className="text-sm text-muted-foreground">You don't have permission to view teams.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">{isMember ? 'My Teams' : 'Teams'}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{teams.length} {isMember ? 'team(s) you belong to' : 'teams'}</p>
        </div>
        {!isMember && (
        <div className="flex flex-wrap items-center gap-2">
          {churches.length >= 1 && (
            <Select value={churchFilter} onValueChange={setChurchFilter}>
              <SelectTrigger className="h-8 text-xs sm:h-9 sm:text-sm w-40 sm:w-48">
                <SelectValue placeholder="Filter by church" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {churches.map((church: any) => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <ExportImportButtons
            data={teams.map(t => ({
              name: t.name,
              church: t.church.name,
              description: t.description || '',
              memberCount: t.memberCount,
              leaders: t.leaders.map(l => `${l.firstName} ${l.lastName}`).join(', '),
              created: new Date(t.createdAt).toLocaleDateString(),
            }))}
            filename="teams"
            headers={[
              { label: 'Team Name', key: 'name' },
              { label: 'Church', key: 'church' },
              { label: 'Description', key: 'description' },
              { label: 'Members', key: 'memberCount' },
              { label: 'Leaders', key: 'leaders' },
              { label: 'Created', key: 'created' },
            ]}
            pdfTitle="Teams Report"
          />
          {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs sm:h-9 sm:text-sm gap-1.5">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
              </DialogHeader>
              <TeamForm onSubmit={(data) => createMutation.mutate(data)} isPending={createMutation.isPending} churches={churches} />
            </DialogContent>
          </Dialog>
          )}
        </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{isMember ? 'You are not part of any team yet.' : churchFilter === 'all' ? 'No teams yet. Create your first team!' : 'No teams found for this church.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      {team.color && <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: team.color }} />}
                      {team.name}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{team.church.name}</p>
                  </div>
                  <div className="flex gap-1">
                    {canUpdate && (
                      <button onClick={() => setEditTeam(team)} className="p-1 hover:bg-muted rounded">
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteTeam(team)} className="p-1 hover:bg-muted rounded text-destructive">
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
                {team.description && <p className="text-xs sm:text-sm text-muted-foreground">{team.description}</p>}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <Badge variant="secondary">{team.memberCount}</Badge>
                </div>
                {team.leaders.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                      <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Leaders
                    </p>
                    {team.leaders.map((leader) => (
                      <p key={leader.id} className="text-xs sm:text-sm font-medium">{leader.firstName} {leader.lastName}</p>
                    ))}
                  </div>
                )}
                {canAssign && (
                  <Button size="sm" variant="outline" className="w-full gap-1.5 h-8 text-xs sm:h-9 sm:text-sm" onClick={() => navigate(`/dashboard/teams/${team.id}/members`)}>
                    <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Manage Members
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTeam} onOpenChange={(open) => !open && setEditTeam(null)}>
        <DialogContent className="max-w-sm sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          {editTeam && (
            <TeamForm
              team={editTeam}
              onSubmit={(data) => updateMutation.mutate({ id: editTeam.id, data })}
              isPending={updateMutation.isPending}
              churches={churches}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTeam} onOpenChange={(open) => !open && setDeleteTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteTeam?.name}"? All member assignments will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTeam && deleteMutation.mutate(deleteTeam.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TeamForm({ team, onSubmit, isPending, churches }: { team?: Team; onSubmit: (data: any) => void; isPending: boolean; churches: any[] }) {
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const [churchId, setChurchId] = useState(team?.churchId || '');
  const [color, setColor] = useState(team?.color || '#3b82f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, churchId, color });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label className="text-xs sm:text-sm">Team Name</Label>
        <Input className="h-8 text-xs sm:h-10 sm:text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Usher Team" required />
      </div>
      <div>
        <Label className="text-xs sm:text-sm">Description (Optional)</Label>
        <Textarea className="text-xs sm:text-sm" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={2} />
      </div>
      {!team && (
        <div>
          <Label className="text-xs sm:text-sm">Church</Label>
          <Select value={churchId} onValueChange={setChurchId} required>
            <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="Select church" /></SelectTrigger>
            <SelectContent>
              {churches.map((church: any) => (
                <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label className="text-xs sm:text-sm">Color (Optional)</Label>
        <Input type="color" className="h-8 sm:h-10" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>
      <Button type="submit" disabled={isPending} className="w-full h-8 text-xs sm:h-10 sm:text-sm">
        {isPending ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
      </Button>
    </form>
  );
}


