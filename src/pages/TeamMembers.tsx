import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsService } from '@/services/teams';
import { useAuth } from '@/contexts/AuthContext';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowLeft, Crown, Users, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { AgeRangeFilter } from '@/components/AgeRangeFilter';
import { toast } from 'sonner';

export default function TeamMembersPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [minAge, setMinAge] = useState<number | undefined>();
  const [maxAge, setMaxAge] = useState<number | undefined>();
  const hasTeamsFeature = useHasFeature('teams_management');

  // Block members from accessing this page
  if (user?.roleName === 'member') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
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

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => teamsService.getAll(),
  });

  const team = teams.find(t => t.id === id);

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['team-members', id, search, limit, offset, minAge, maxAge],
    queryFn: () => teamsService.getMembers(id!, search, limit, offset, minAge, maxAge),
    enabled: !!id,
  });

  const members = membersData?.data || [];
  const total = membersData?.total || 0;
  const teamMembersCount = membersData?.teamMembersCount ?? team?.memberCount ?? 0;

  const addMutation = useMutation({
    mutationFn: ({ userId, isLeader }: { userId: string; isLeader: boolean }) => teamsService.addMember(id!, userId, isLeader),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Member added');
      setOffset(0);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => teamsService.removeMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Member removed');
      setOffset(0);
    },
  });

  const leaderMutation = useMutation({
    mutationFn: ({ userId, isLeader }: { userId: string; isLeader: boolean }) => teamsService.updateLeader(id!, userId, isLeader),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Leader status updated');
    },
  });

  if (!hasTeamsFeature) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard/teams')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Teams
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Teams management is not available in your current package.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard/teams')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Teams
        </Button>
        <p className="text-muted-foreground">Team not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/teams')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              {team.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />}
              {team.name}
            </h1>
            <p className="text-sm text-muted-foreground">{team.church.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportButtons
            data={members.map(m => ({
              firstName: m.firstName,
              lastName: m.lastName,
              email: m.email,
              phone: m.phone || '',
              gender: (m as any).gender || '',
              dateOfBirth: (m as any).dateOfBirth ? new Date((m as any).dateOfBirth).toLocaleDateString() : '',
              residentialNeighbourhood: (m as any).residentialNeighbourhood || '',
              membershipType: m.membershipType || '',
              maritalStatus: m.maritalStatus || '',
              weddingDate: (m as any).weddingDate ? new Date((m as any).weddingDate).toLocaleDateString() : '',
              serviceInterest: m.serviceInterest || '',
              baptizedByImmersion: (m as any).baptizedByImmersion ? 'Yes' : 'No',
              inTeam: m.inTeam ? 'Yes' : 'No',
              isLeader: m.isLeader ? 'Yes' : 'No',
            }))}
            filename={`team-${team.name}-members`}
            headers={[
              { label: 'First Name', key: 'firstName' },
              { label: 'Last Name', key: 'lastName' },
              { label: 'Email', key: 'email' },
              { label: 'Phone', key: 'phone' },
              { label: 'Gender', key: 'gender' },
              { label: 'Date of Birth', key: 'dateOfBirth' },
              { label: 'Neighbourhood', key: 'residentialNeighbourhood' },
              { label: 'Membership Type', key: 'membershipType' },
              { label: 'Marital Status', key: 'maritalStatus' },
              { label: 'Wedding Date', key: 'weddingDate' },
              { label: 'Service Interest', key: 'serviceInterest' },
              { label: 'Baptized', key: 'baptizedByImmersion' },
              { label: 'In Team', key: 'inTeam' },
              { label: 'Is Leader', key: 'isLeader' },
            ]}
            pdfTitle={`${team.name} - Team Members`}
          />
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {teamMembersCount} members
          </Badge>
        </div>
      </div>

      {team.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{team.description}</p>
          </CardContent>
        </Card>
      )}

      {team.leaders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              Team Leaders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {team.leaders.map((leader) => (
                <Badge key={leader.id} variant="outline" className="gap-1">
                  {leader.firstName} {leader.lastName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <Tabs defaultValue="assign" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assign">Assign New Members</TabsTrigger>
              <TabsTrigger value="manage">Manage Team Members</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent value="assign">
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }} placeholder="Search by name or email..." className="pl-9" />
                  </div>
                  <AgeRangeFilter
                    minAge={minAge}
                    maxAge={maxAge}
                    onMinAgeChange={(v) => { setMinAge(v); setOffset(0); }}
                    onMaxAgeChange={(v) => { setMaxAge(v); setOffset(0); }}
                    onClear={() => { setMinAge(undefined); setMaxAge(undefined); setOffset(0); }}
                  />
                  <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setOffset(0); }}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 / page</SelectItem>
                      <SelectItem value="200">200 / page</SelectItem>
                      <SelectItem value="500">500 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                  </div>
                ) : members.filter(m => !m.inTeam).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">All members are already in this team</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Assign</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Neighbourhood</TableHead>
                        <TableHead>Membership</TableHead>
                        <TableHead>Marital Status</TableHead>
                        <TableHead>Wedding Date</TableHead>
                        <TableHead>Service Interest</TableHead>
                        <TableHead>Baptized</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.filter(m => !m.inTeam).map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Checkbox
                              checked={false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addMutation.mutate({ userId: member.id, isLeader: false });
                                }
                              }}
                              disabled={addMutation.isPending}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                          <TableCell className="text-muted-foreground">{member.email}</TableCell>
                          <TableCell className="text-muted-foreground">{member.phone || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground capitalize">{(member as any).gender || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(member as any).dateOfBirth ? new Date((member as any).dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(member as any).residentialNeighbourhood || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{member.membershipType || 'Member'}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground capitalize">{member.maritalStatus || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(member as any).weddingDate ? new Date((member as any).weddingDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{member.serviceInterest || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(member as any).baptizedByImmersion ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {total > limit && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="manage">
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }} placeholder="Search by name or email..." className="pl-9" />
                  </div>
                  <AgeRangeFilter
                    minAge={minAge}
                    maxAge={maxAge}
                    onMinAgeChange={(v) => { setMinAge(v); setOffset(0); }}
                    onMaxAgeChange={(v) => { setMaxAge(v); setOffset(0); }}
                    onClear={() => { setMinAge(undefined); setMaxAge(undefined); setOffset(0); }}
                  />
                  <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setOffset(0); }}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 / page</SelectItem>
                      <SelectItem value="200">200 / page</SelectItem>
                      <SelectItem value="500">500 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                  </div>
                ) : members.filter(m => m.inTeam).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No members in this team yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Remove</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Neighbourhood</TableHead>
                        <TableHead>Membership</TableHead>
                        <TableHead>Marital Status</TableHead>
                        <TableHead>Wedding Date</TableHead>
                        <TableHead>Service Interest</TableHead>
                        <TableHead>Baptized</TableHead>
                        <TableHead className="w-24 text-center">Leader</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.filter(m => m.inTeam).map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Checkbox
                              checked={true}
                              onCheckedChange={(checked) => {
                                if (!checked) {
                                  removeMutation.mutate(member.id);
                                }
                              }}
                              disabled={removeMutation.isPending}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                          <TableCell className="text-muted-foreground">{member.email}</TableCell>
                          <TableCell className="text-muted-foreground">{member.phone || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground capitalize">{(member as any).gender || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(member as any).dateOfBirth ? new Date((member as any).dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(member as any).residentialNeighbourhood || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{member.membershipType || 'Member'}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground capitalize">{member.maritalStatus || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(member as any).weddingDate ? new Date((member as any).weddingDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{member.serviceInterest || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(member as any).baptizedByImmersion ? 'Yes' : 'No'}</TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => leaderMutation.mutate({ userId: member.id, isLeader: !member.isLeader })}
                              disabled={leaderMutation.isPending}
                              className={`p-1.5 rounded transition-colors ${member.isLeader ? 'text-amber-600 hover:bg-amber-50' : 'text-muted-foreground hover:bg-muted'}`}
                              title={member.isLeader ? 'Remove as leader' : 'Make leader'}
                            >
                              <Crown className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {total > limit && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setOffset(offset + limit)} disabled={offset + limit >= total}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
