import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamCommunicationService, TeamCommunication } from '@/services/teamCommunication';
import { teamsService } from '@/services/teams';
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
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<TeamCommunication | null>(null);
  const [deletePost, setDeletePost] = useState<TeamCommunication | null>(null);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsService.getAll
  });

  const { data: postableTeams = [] } = useQuery({
    queryKey: ['postable-teams'],
    queryFn: teamCommunicationService.getPostableTeams
  });

  const canPost = postableTeams.length > 0;

  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['team-communications', selectedTeam],
    queryFn: () => teamCommunicationService.getAll(selectedTeam || undefined),
    enabled: teams.length > 0
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
                onSubmit={(data) => createMutation.mutate(data)}
                isPending={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={selectedTeam || teams[0]?.id} onValueChange={setSelectedTeam}>
        <TabsList>
          <TabsTrigger value="">All Teams</TabsTrigger>
          {teams.map(team => (
            <TabsTrigger key={team.id} value={team.id}>
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
          ) : communications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
              </CardContent>
            </Card>
          ) : (
            communications.map(post => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="gap-1">
                          {post.team.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: post.team.color }} />}
                          {post.team.name}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {post.author.avatar && (
                          <img src={post.author.avatar} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <span>{post.author.firstName} {post.author.lastName}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {post.canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditPost(post)} className="p-1 hover:bg-muted rounded">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeletePost(post)} className="p-1 hover:bg-muted rounded text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Attachments</p>
                      <div className="grid gap-2">
                        {post.mediaUrls.map((media, idx) => (
                          <a
                            key={idx}
                            href={getMediaUrl(media.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 border rounded hover:bg-muted text-sm"
                          >
                            {getMediaIcon(media.type)}
                            <span className="flex-1 truncate">{media.name}</span>
                            <span className="text-xs text-muted-foreground">{(media.size / 1024).toFixed(1)} KB</span>
                            <Download className="h-4 w-4" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

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
