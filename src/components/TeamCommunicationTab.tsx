import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamCommunicationService, TeamCommunication } from '@/services/teamCommunication';
import { teamsService } from '@/services/teams';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, MessageSquare, Pencil, Trash2, Download, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TeamCommunicationForm } from '@/components/TeamCommunicationForm';
import { formatDistanceToNow } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
const getMediaUrl = (url: string) => url.startsWith('http') ? url : `${API_BASE}${url}`;

export default function TeamCommunicationTab() {
  const queryClient = useQueryClient();
  const { isMember } = useRole();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewPost, setViewPost] = useState<TeamCommunication | null>(null);
  const [editPost, setEditPost] = useState<TeamCommunication | null>(null);
  const [deletePost, setDeletePost] = useState<TeamCommunication | null>(null);

  const { data: memberTeams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsService.getAll(),
    enabled: isMember
  });

  const { data: postableTeams = [] } = useQuery({
    queryKey: ['postable-teams'],
    queryFn: teamCommunicationService.getPostableTeams
  });

  const teams = isMember ? memberTeams : postableTeams;
  const canPost = postableTeams.length > 0;

  // Initialize selectedTeam with first team when teams load
  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].id);
    }
  }, [teams, selectedTeam]);

  const { data: groupedCommunications = [], isLoading } = useQuery({
    queryKey: ['team-communications', selectedTeam],
    queryFn: () => teamCommunicationService.getAll(selectedTeam || undefined),
    enabled: teams.length > 0 && !!selectedTeam
  });

  const createMutation = useMutation({
    mutationFn: teamCommunicationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-communications'] });
      toast.success('Post created');
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create post')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => teamCommunicationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-communications'] });
      toast.success('Post updated');
      setEditPost(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update post')
  });

  const deleteMutation = useMutation({
    mutationFn: teamCommunicationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-communications'] });
      toast.success('Post deleted');
      setDeletePost(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete post')
  });

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">You are not a member of any team yet.</p>
        </CardContent>
      </Card>
    );
  }

  const getMediaIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team Communication</h2>
        {canPost && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Team post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Team Post</DialogTitle>
              </DialogHeader>
              <TeamCommunicationForm
                teams={postableTeams}
                onSubmit={(data) => {
                  console.log('Team communication form values:', data);
                  createMutation.mutate(data);
                }}
                isPending={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <Tabs value={selectedTeam || teams[0]?.id} onValueChange={(value) => {
          setSelectedTeam(value);
        }}>
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="" className="whitespace-nowrap">All Teams</TabsTrigger>
            {teams.map(team => (
              <TabsTrigger key={team.id} value={team.id} className="whitespace-nowrap">
                {team.color && <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: team.color }} />}
                {team.name}
              </TabsTrigger>
            ))}
          </TabsList>

        <TabsContent value={selectedTeam || teams[0]?.id} className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : groupedCommunications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
              </CardContent>
            </Card>
          ) : (
            groupedCommunications.map(group => (
              <div key={group.label} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {group.posts.map(post => (
                    <Card key={post.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setViewPost(post)}>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            {post.author.avatar && (
                              <img src={post.author.avatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{post.author.firstName} {post.author.lastName}</p>
                              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="gap-1 text-xs w-fit">
                            {post.team.color && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: post.team.color }} />}
                            <span className="truncate">{post.team.name}</span>
                          </Badge>
                          <h4 className="text-sm font-semibold line-clamp-2">{post.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-3">{post.content}</p>
                          {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {getMediaIcon(post.mediaUrls[0].type)}
                              <span>{post.mediaUrls.length} attachment{post.mediaUrls.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
        </Tabs>
      </div>

      {/* View Dialog */}
      {viewPost && (
        <Dialog open={!!viewPost} onOpenChange={() => setViewPost(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  {viewPost.author.avatar && (
                    <img src={viewPost.author.avatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{viewPost.author.firstName} {viewPost.author.lastName}</p>
                    <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                      <Badge variant="outline" className="gap-1">
                        {viewPost.team.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: viewPost.team.color }} />}
                        {viewPost.team.name}
                      </Badge>
                      <span className="text-xs">{formatDistanceToNow(new Date(viewPost.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <DialogTitle className="text-xl sm:text-2xl">{viewPost.title}</DialogTitle>
                  {viewPost.canEdit && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setViewPost(null); setEditPost(viewPost); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setViewPost(null); setDeletePost(viewPost); }} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm sm:text-base whitespace-pre-wrap">{viewPost.content}</p>
              {viewPost.mediaUrls && viewPost.mediaUrls.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Attachments</p>
                  <div className="grid gap-2">
                    {viewPost.mediaUrls.map((media, idx) => (
                      <a
                        key={idx}
                        href={getMediaUrl(media.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-muted transition-colors"
                      >
                        {getMediaIcon(media.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{media.name}</p>
                          <p className="text-xs text-muted-foreground">{(media.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Download className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editPost && (
        <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <TeamCommunicationForm
              teams={postableTeams}
              initialData={editPost}
              onSubmit={(data) => updateMutation.mutate({ id: editPost.id, data })}
              isPending={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      {deletePost && (
        <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletePost.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate(deletePost.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
