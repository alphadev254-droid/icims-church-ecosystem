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
import { Users, Plus, Pencil, Trash2, UserPlus, Crown, ShieldAlert } from 'lucide-react';
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

  // Block members from accessing this page
  if (user?.roleName === 'member') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground text-center">This page is only available to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsService.getAll,
    enabled: hasPermission('teams:read'),
  });

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll,
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

  const canCreate = hasPermission('teams:create') && hasTeamsFeature;
  const canUpdate = hasPermission('teams:update') && hasTeamsFeature;
  const canDelete = hasPermission('teams:delete') && hasTeamsFeature;
  const canAssign = hasPermission('teams:assign') && hasTeamsFeature;

  if (!hasTeamsFeature) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Teams</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Teams management is not available in your current package. Please upgrade to Standard or Premium to access this feature.</p>
          </CardContent>
        </Card>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Teams</h1>
          <p className="text-sm text-muted-foreground">{teams.length} teams</p>
        </div>
        <div className="flex gap-2">
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
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Team</DialogTitle>
              </DialogHeader>
              <TeamForm onSubmit={(data) => createMutation.mutate(data)} isPending={createMutation.isPending} churches={churches} />
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No teams yet. Create your first team!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {team.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />}
                      {team.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{team.church.name}</p>
                  </div>
                  <div className="flex gap-1">
                    {canUpdate && (
                      <button onClick={() => setEditTeam(team)} className="p-1 hover:bg-muted rounded">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteTeam(team)} className="p-1 hover:bg-muted rounded text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {team.description && <p className="text-xs text-muted-foreground">{team.description}</p>}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <Badge variant="secondary">{team.memberCount}</Badge>
                </div>
                {team.leaders.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Leaders
                    </p>
                    {team.leaders.map((leader) => (
                      <p key={leader.id} className="text-xs font-medium">{leader.firstName} {leader.lastName}</p>
                    ))}
                  </div>
                )}
                {canAssign && (
                  <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => navigate(`/dashboard/teams/${team.id}/members`)}>
                    <UserPlus className="h-3.5 w-3.5" /> Manage Members
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTeam} onOpenChange={(open) => !open && setEditTeam(null)}>
        <DialogContent>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Team Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Usher Team" required />
      </div>
      <div>
        <Label>Description (Optional)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={2} />
      </div>
      {!team && (
        <div>
          <Label>Church</Label>
          <Select value={churchId} onValueChange={setChurchId} required>
            <SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger>
            <SelectContent>
              {churches.map((church: any) => (
                <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Color (Optional)</Label>
        <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
      </Button>
    </form>
  );
}


