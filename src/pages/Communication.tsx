import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { communicationService, type Announcement } from '@/services/communication';
import { uploadService } from '@/services/upload';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChurchSelect } from '@/components/ChurchSelect';
import TeamCommunicationTab from '@/components/TeamCommunicationTab';
import { Plus, MessageSquare, Bell, Trash2, HandHeart, Pencil, Eye, Paperclip, X, FileText, Image as ImageIcon, Download, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const hasCommunication = useHasFeature('communication');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [viewItem, setViewItem] = useState<Announcement | null>(null);
  const [formType, setFormType] = useState<'announcement' | 'prayer_request' | 'newsletter'>('announcement');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const { hasPermission } = useRole();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: communicationService.getAll,
    enabled: hasCommunication,
  });

  if (!hasCommunication) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Communication</h1>
          <p className="text-sm text-muted-foreground">Announcements, newsletters, and prayer requests</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Communication & Announcements is not available in your current package.{' '}
            <Link to="/dashboard/packages" className="font-medium underline">
              Upgrade now
            </Link>{' '}
            to unlock communication features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit, formState: { errors: errorsEdit } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const churchId = watch('churchId');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload files first if any
      let uploadedFiles: any[] = [];
      if (selectedFiles.length > 0) {
        uploadedFiles = await uploadService.uploadCommunicationFiles(selectedFiles);
      }
      // Create announcement with uploaded files
      return communicationService.create({
        ...data,
        attachments: uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Posted successfully');
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setDialogOpen(false);
      setSelectedFiles([]);
      reset();
      setFormType('announcement');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to post'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: any }) => {
      // Upload new files if any
      let uploadedFiles: any[] = [];
      if (selectedFiles.length > 0) {
        uploadedFiles = await uploadService.uploadCommunicationFiles(selectedFiles);
      }
      // Merge existing and new files
      const allFiles = [...existingFiles, ...uploadedFiles];
      return communicationService.update(id, {
        ...dto,
        attachments: allFiles.length > 0 ? JSON.stringify(allFiles) : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Updated successfully');
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setEditItem(null);
      setSelectedFiles([]);
      setExistingFiles([]);
      resetEdit();
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

  // Check if user is admin (not just member) for church communication
  const { role } = useRole();
  const canCreateChurchPost = canCreate && role !== 'member';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const totalFiles = selectedFiles.length + existingFiles.length + files.length;
    if (totalFiles > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = async (index: number, fileUrl: string) => {
    try {
      await uploadService.deleteFile(fileUrl);
      setExistingFiles(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  const filterByType = (type: string) => items.filter((i: any) => i.type === type);

  const ItemCard = ({ item }: { item: any }) => {
    const Icon = TYPE_ICON[item.type] ?? Bell;
    const attachments = item.attachments ? JSON.parse(item.attachments) : [];
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
                  {attachments.length > 0 && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{item.content}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => setViewItem(item)}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" /> View
                  </button>
                </div>
              </div>
            </div>
            {(canUpdate || canDelete) && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {canUpdate && (
                  <button
                    onClick={() => {
                      setEditItem(item);
                      setExistingFiles(item.attachments ? JSON.parse(item.attachments) : []);
                      setSelectedFiles([]);
                      resetEdit({
                        churchId: item.churchId,
                        title: item.title,
                        content: item.content,
                        type: item.type,
                        priority: item.priority,
                      });
                    }}
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
        {canCreateChurchPost && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> New Church Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
                
                <div>
                  <Label>Attachments <span className="text-xs text-muted-foreground">(Max 5 files - Images, PDFs, Documents, Videos)</span></Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.mp4,.webm,.mov,.avi"
                      onChange={handleFileSelect}
                      disabled={selectedFiles.length >= 5}
                      className="cursor-pointer"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="space-y-1">
                        {selectedFiles.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                            {file.type?.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                            <button type="button" onClick={() => removeSelectedFile(i)} className="text-destructive hover:text-destructive/80">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
        <Tabs defaultValue="church">
          <TabsList>
            <TabsTrigger value="church">Church Communication</TabsTrigger>
            <TabsTrigger value="team">Team Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="church" className="mt-4">
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
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <TeamCommunicationTab />
          </TabsContent>
        </Tabs>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={open => !open && setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              {viewItem && (() => {
                const Icon = TYPE_ICON[viewItem.type] ?? Bell;
                return <Icon className="h-5 w-5 text-accent" />;
              })()}
              {viewItem?.title}
            </DialogTitle>
          </DialogHeader>
          {viewItem && (() => {
            const attachments = viewItem.attachments ? JSON.parse(viewItem.attachments) : [];
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{TYPE_LABEL[viewItem.type]}</Badge>
                  {viewItem.priority === 'urgent' && <Badge variant="destructive">Urgent</Badge>}
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{viewItem.content}</p>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Attachments</Label>
                    <div className="grid gap-2">
                      {attachments.map((file: any, i: number) => {
                        const isVideo = file.mimeType?.startsWith('video/');
                        return isVideo ? (
                          <div key={i} className="rounded-lg overflow-hidden bg-black">
                            <video src={`${import.meta.env.VITE_STATIC_URL}${file.url}`} controls className="w-full" />
                          </div>
                        ) : (
                          <a
                            key={i}
                            href={`${import.meta.env.VITE_STATIC_URL}${file.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-muted rounded hover:bg-muted/80 transition-colors"
                          >
                            {file.mimeType?.startsWith('image/') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                            <span className="flex-1 text-sm truncate">{file.name}</span>
                            <Download className="h-3 w-3" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Posted on {new Date(viewItem.createdAt).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={open => {
        if (!open) {
          setEditItem(null);
          setSelectedFiles([]);
          setExistingFiles([]);
          resetEdit();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Post</DialogTitle>
          </DialogHeader>
          {editItem && (
            <form onSubmit={handleSubmitEdit(v => updateMutation.mutate({ id: editItem.id, dto: v }))} className="space-y-4">
              <ChurchSelect 
                value={editItem.churchId} 
                onValueChange={value => setValueEdit('churchId', value)}
              />
              
              <div>
                <Label>Type</Label>
                <Select
                  value={editItem.type}
                  onValueChange={v => {
                    const t = v as typeof formType;
                    setFormType(t);
                    setValueEdit('type', t);
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
                <Select value={editItem.priority} onValueChange={v => setValueEdit('priority', v as 'normal' | 'urgent')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input {...registerEdit('title')} />
                {errorsEdit.title && <p className="text-xs text-destructive mt-1">{errorsEdit.title.message}</p>}
              </div>
              <div>
                <Label>Content</Label>
                <Textarea {...registerEdit('content')} rows={4} />
                {errorsEdit.content && <p className="text-xs text-destructive mt-1">{errorsEdit.content.message}</p>}
              </div>
              
              <div>
                <Label>Attachments <span className="text-xs text-muted-foreground">(Max 5 files - Images, PDFs, Documents, Videos)</span></Label>
                <div className="space-y-2">
                  {existingFiles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Existing files:</p>
                      {existingFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                          {file.mimeType?.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          <span className="flex-1 truncate">{file.name}</span>
                          <button type="button" onClick={() => removeExistingFile(i, file.url)} className="text-destructive hover:text-destructive/80">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.mp4,.webm,.mov,.avi"
                    onChange={handleFileSelect}
                    disabled={(existingFiles.length + selectedFiles.length) >= 5}
                    className="cursor-pointer"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">New files:</p>
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-muted p-2 rounded">
                          {file.type?.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                          <button type="button" onClick={() => removeSelectedFile(i)} className="text-destructive hover:text-destructive/80">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
