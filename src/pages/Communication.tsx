import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { communicationService, type Announcement } from '@/services/communication';
import { useRole } from '@/hooks/useRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChurchSelect } from '@/components/ChurchSelect';
import { Plus, MessageSquare, Bell, Trash2, HandHeart, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  content: z.string().min(1, 'Content required'),
  type: z.enum(['announcement', 'prayer_request', 'newsletter']),
  priority: z.enum(['normal', 'urgent']).default('normal'),
  churchId: z.string().min(1, 'Church selection required'),
});
type FormValues = z.infer<typeof schema>;


const TYPE_ICON: Record<string, typeof MessageSquare> = {
  announcement: Bell,
  prayer_request: HandHeart,
  newsletter: MessageSquare,
};

const TYPE_LABEL: Record<string, string> = {
  announcement: 'Announcement',
  prayer_request: 'Prayer Request',
  newsletter: 'Newsletter',
};

export default function CommunicationPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [formType, setFormType] = useState<'announcement' | 'prayer_request' | 'newsletter'>('announcement');
  const { hasPermission } = useRole();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: communicationService.getAll,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'announcement', priority: 'normal' },
  });

  const churchId = watch('churchId');

  const createMutation = useMutation({
    mutationFn: communicationService.create,
    onSuccess: () => {
      toast.success('Posted successfully');
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setDialogOpen(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to post'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => communicationService.update(id, dto),
    onSuccess: () => {
      toast.success('Updated successfully');
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setEditItem(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: communicationService.delete,
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const canCreate = hasPermission('communication:create');
  const canUpdate = hasPermission('communication:update');
  const canDelete = hasPermission('communication:delete');

  const filterByType = (type: string) => items.filter((i: any) => i.type === type);

  const ItemCard = ({ item }: { item: any }) => {
    const Icon = TYPE_ICON[item.type] ?? Bell;
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="mt-0.5 p-2 bg-accent/10 rounded-md flex-shrink-0">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-heading font-semibold text-foreground">{item.title}</span>
                  {item.priority === 'urgent' && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            {(canUpdate || canDelete) && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {canUpdate && (
                  <button
                    onClick={() => setEditItem(item)}
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12 text-muted-foreground col-span-full">
      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
      <p>{canCreate ? `No ${TYPE_LABEL[type]?.toLowerCase()}s yet.` : `No ${TYPE_LABEL[type]?.toLowerCase()}s posted.`}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Communication</h1>
          <p className="text-sm text-muted-foreground">Announcements, newsletters, and prayer requests</p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> New Post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Create Post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(v => createMutation.mutate(v))} className="space-y-4">
                <ChurchSelect 
                  value={churchId} 
                  onValueChange={value => setValue('churchId', value)}
                />
                {errors.churchId && <p className="text-xs text-destructive mt-1">{errors.churchId.message}</p>}
                
                <div>
                  <Label>Type</Label>
                  <Select
                    defaultValue="announcement"
                    onValueChange={v => {
                      const t = v as typeof formType;
                      setFormType(t);
                      setValue('type', t);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="prayer_request">Prayer Request</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select defaultValue="normal" onValueChange={v => setValue('priority', v as 'normal' | 'urgent')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input {...register('title')} />
                  {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <Label>{formType === 'prayer_request' ? 'Prayer Request Details' : 'Content'}</Label>
                  <Textarea {...register('content')} rows={4} />
                  {errors.content && <p className="text-xs text-destructive mt-1">{errors.content.message}</p>}
                </div>
                <Button type="submit" disabled={createMutation.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {createMutation.isPending ? 'Posting...' : 'Post'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <Tabs defaultValue="announcement">
          <TabsList>
            <TabsTrigger value="announcement">
              Announcements <Badge variant="secondary" className="ml-2">{filterByType('announcement').length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="prayer_request">
              Prayer Requests <Badge variant="secondary" className="ml-2">{filterByType('prayer_request').length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="newsletter">
              Newsletters <Badge variant="secondary" className="ml-2">{filterByType('newsletter').length}</Badge>
            </TabsTrigger>
          </TabsList>

          {(['announcement', 'prayer_request', 'newsletter'] as const).map(type => (
            <TabsContent key={type} value={type} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {filterByType(type).length === 0
                  ? <EmptyState type={type} />
                  : filterByType(type).map((item: any) => <ItemCard key={item.id} item={item} />)
                }
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Post</DialogTitle>
          </DialogHeader>
          {editItem && (
            <form onSubmit={handleSubmit(v => updateMutation.mutate({ id: editItem.id, dto: v }))} className="space-y-4">
              <ChurchSelect 
                value={editItem.churchId} 
                onValueChange={value => setValue('churchId', value)}
              />
              
              <div>
                <Label>Type</Label>
                <Select
                  defaultValue={editItem.type}
                  onValueChange={v => {
                    const t = v as typeof formType;
                    setFormType(t);
                    setValue('type', t);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="prayer_request">Prayer Request</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select defaultValue={editItem.priority} onValueChange={v => setValue('priority', v as 'normal' | 'urgent')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input {...register('title')} defaultValue={editItem.title} />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <Label>Content</Label>
                <Textarea {...register('content')} rows={4} defaultValue={editItem.content} />
                {errors.content && <p className="text-xs text-destructive mt-1">{errors.content.message}</p>}
              </div>
              <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
