import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resourcesService, parseResourceFiles, type Resource, type ResourceFile } from '@/services/resources';
import { churchesService, Church } from '@/services/churches';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChurchSelect } from '@/components/ChurchSelect';
import {
  BookOpen, Search, BookMarked, Video, FileText, Music, ExternalLink,
  Plus, Pencil, Trash2, Upload, Link, X, Youtube, Eye, ImageIcon, Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link as RouterLink } from 'react-router-dom';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  bible: 'Bible', devotional: 'Devotional', study_plan: 'Study Plan',
  sermon: 'Sermon', worship: 'Worship', general: 'General',
};
const TYPE_ICON: Record<string, typeof BookOpen> = {
  article: FileText, video: Video, audio: Music, document: BookMarked, link: Link,
};
const CATEGORY_COLOR: Record<string, string> = {
  bible: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  devotional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  study_plan: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  sermon: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  worship: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};
const CATEGORIES = ['all', 'devotional', 'study_plan', 'sermon', 'worship', 'bible', 'general'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isYouTubeUrl(url: string) {
  return /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(url);
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional().default(''),
  category: z.enum(['bible', 'devotional', 'study_plan', 'sermon', 'worship', 'general']).default('general'),
  type: z.enum(['article', 'video', 'audio', 'document', 'link']).default('document'),
  author: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  fileUrl: z.string().optional().default(''),
  churchId: z.string().min(1, 'Church selection required'),
});
type FormValues = z.infer<typeof schema>;

// ─── ResourceForm ─────────────────────────────────────────────────────────────

type ExistingFileEntry = { url: string; name: string };

function ResourceForm({ defaultValues, onSubmit, isPending, submitLabel }: {
  defaultValues?: Partial<FormValues & { fileName?: string | null; existingFiles?: ExistingFileEntry[] }>;
  onSubmit: (v: FormValues, newFiles: File[], keepFilesJson?: string) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [keptFiles, setKeptFiles] = useState<ExistingFileEntry[]>(defaultValues?.existingFiles ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'general', type: 'document', description: '', author: '', duration: '', fileUrl: '', ...defaultValues },
  });
  const resourceType = watch('type');
  const churchId = watch('churchId');
  const fileUrlValue = watch('fileUrl');

  const isUrlType = resourceType === 'link' || resourceType === 'video';
  const showYouTubeBadge = isUrlType && !!fileUrlValue && isYouTubeUrl(fileUrlValue);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFiles(prev => [...prev, ...Array.from(e.target.files ?? [])]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const doSubmit = (v: FormValues) => {
    // If editing (existingFiles was provided), send which files to keep
    const keepFilesJson = defaultValues?.existingFiles !== undefined
      ? JSON.stringify(keptFiles.map(f => f.url))
      : undefined;
    onSubmit(v, newFiles, keepFilesJson);
  };

  return (
    <form onSubmit={handleSubmit(doSubmit)} className="space-y-4">
      <ChurchSelect value={churchId} onValueChange={value => setValue('churchId', value)} />
      {errors.churchId && <p className="text-xs text-destructive mt-1">{errors.churchId.message}</p>}

      <div>
        <Label>Title</Label>
        <Input {...register('title')} />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Textarea {...register('description')} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select defaultValue={defaultValues?.category ?? 'general'} onValueChange={v => setValue('category', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bible">Bible</SelectItem>
              <SelectItem value="devotional">Devotional</SelectItem>
              <SelectItem value="study_plan">Study Plan</SelectItem>
              <SelectItem value="sermon">Sermon</SelectItem>
              <SelectItem value="worship">Worship</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select defaultValue={defaultValues?.type ?? 'document'} onValueChange={v => setValue('type', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Author <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input {...register('author')} />
        </div>
        <div>
          <Label>Duration <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input {...register('duration')} placeholder="e.g. 45 min" />
        </div>
      </div>

      {resourceType === 'link' ? (
        <div>
          <Label>URL</Label>
          <Input {...register('fileUrl')} placeholder="https://..." />
        </div>
      ) : resourceType === 'video' ? (
        <div className="space-y-3">
          <div>
            <Label>
              YouTube URL <span className="text-muted-foreground text-xs">(optional - or upload video below)</span>
            </Label>
            <div className="relative">
              <Input {...register('fileUrl')} placeholder="https://youtube.com/..." disabled={newFiles.length > 0} />
              {showYouTubeBadge && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-red-500 font-medium">
                  <Youtube className="h-3.5 w-3.5" /> YouTube
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center">
              <div className="flex-1 border-t border-muted" />
              <span className="px-2 text-xs text-muted-foreground">OR</span>
              <div className="flex-1 border-t border-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>
              Upload Video
              <span className="text-muted-foreground text-xs ml-1">(MP4, WebM, MOV — max 500 MB)</span>
            </Label>

            {keptFiles.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current file:</p>
                <ul className="space-y-1">
                  {keptFiles.map(f => (
                    <li key={f.url} className="flex items-center justify-between text-xs bg-muted rounded px-2 py-1.5">
                      <span className="truncate max-w-[230px]">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setKeptFiles(prev => prev.filter(x => x.url !== f.url))}
                        className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove this file"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div
              className="border-2 border-dashed border-muted rounded-md p-4 text-center cursor-pointer hover:border-accent transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Click to browse or drop video here</p>
            </div>
            <input
              ref={fileRef} type="file" className="hidden"
              accept=".mp4,.webm,.mov,.avi,.mkv"
              onChange={handleFileChange}
              disabled={!!fileUrlValue}
            />

            {newFiles.length > 0 && (
              <ul className="space-y-1">
                {newFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-accent/10 rounded px-2 py-1.5">
                    <span className="truncate max-w-[230px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>
            Upload Files
            <span className="text-muted-foreground text-xs ml-1">(PDF, Word, PPT, Audio, Video, Images — max 200 MB each)</span>
          </Label>

          {/* Existing files — with remove button */}
          {keptFiles.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current files:</p>
              <ul className="space-y-1">
                {keptFiles.map(f => (
                  <li key={f.url} className="flex items-center justify-between text-xs bg-muted rounded px-2 py-1.5">
                    <span className="truncate max-w-[230px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setKeptFiles(prev => prev.filter(x => x.url !== f.url))}
                      className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove this file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-muted rounded-md p-4 text-center cursor-pointer hover:border-accent transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Click to browse or drop files here</p>
          </div>
          <input
            ref={fileRef} type="file" className="hidden" multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.m4a,.aac,.ogg"
            onChange={handleFileChange}
          />

          {/* New files to upload */}
          {newFiles.length > 0 && (
            <ul className="space-y-1">
              {newFiles.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-xs bg-accent/10 rounded px-2 py-1.5">
                  <span className="truncate max-w-[230px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}

// ─── ResourceDetailDialog ─────────────────────────────────────────────────────

function ResourceDetailDialog({ resource, open, onClose, backendBase }: {
  resource: Resource | null;
  open: boolean;
  onClose: () => void;
  backendBase: string;
}) {
  if (!resource) return null;

  const resolveUrl = (url?: string | null) =>
    url?.startsWith('/uploads/') ? `${backendBase}${url}` : (url ?? null);

  const storedFiles = parseResourceFiles(resource);
  const allFiles: { href: string; name: string; mimeType: string }[] =
    storedFiles.length > 0
      ? storedFiles.map(f => ({ href: resolveUrl(f.url) ?? '', name: f.name, mimeType: f.mimeType }))
      : resource.fileUrl
        ? [{ href: resolveUrl(resource.fileUrl) ?? '', name: resource.fileName ?? 'File', mimeType: resource.mimeType ?? '' }]
        : [];

  const primaryHref = allFiles[0]?.href ?? resolveUrl(resource.fileUrl) ?? null;
  const isYT = primaryHref ? isYouTubeUrl(primaryHref) : false;
  const ytEmbed = isYT && primaryHref ? getYouTubeEmbedUrl(primaryHref) : null;
  const isVideoFile = resource.type === 'video' && primaryHref && !isYT;
  const isAudioFile = resource.type === 'audio' && primaryHref;
  const isPdfOrDoc = primaryHref && !isYT && (resource.mimeType?.includes('pdf') || resource.mimeType?.includes('word'));

  const Icon = TYPE_ICON[resource.type] ?? BookOpen;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 pr-6">
            <div className="p-1.5 bg-accent/10 rounded flex-shrink-0">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <DialogTitle className="font-heading text-left leading-snug">{resource.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLOR[resource.category] ?? ''}`}>
              {CATEGORY_LABEL[resource.category]}
            </span>
            <Badge variant="outline" className="text-xs capitalize">{resource.type}</Badge>
            {resource.duration && <Badge variant="outline" className="text-xs">{resource.duration}</Badge>}
            {resource.author && <span className="text-sm text-muted-foreground">By {resource.author}</span>}
          </div>

          {/* Description */}
          {resource.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{resource.description}</p>
          )}

          {/* YouTube embed */}
          {ytEmbed && (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={ytEmbed}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={resource.title}
              />
            </div>
          )}

          {/* Uploaded video player */}
          {isVideoFile && (
            <div className="rounded-lg overflow-hidden bg-black">
              <video src={primaryHref} controls className="w-full" />
            </div>
          )}

          {/* Audio player */}
          {isAudioFile && primaryHref && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">{allFiles[0]?.name ?? resource.fileName}</p>
              <audio src={primaryHref} controls className="w-full" />
            </div>
          )}

          {/* Image preview */}
          {primaryHref && resource.mimeType?.startsWith('image/') && (
            <div className="rounded-lg overflow-hidden border">
              <img src={primaryHref} alt={resource.title} className="w-full object-contain max-h-80" />
            </div>
          )}

          {/* Link (non-YouTube) */}
          {resource.type === 'link' && primaryHref && !isYT && (
            <a
              href={primaryHref} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent hover:underline break-all"
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
              {primaryHref}
            </a>
          )}

          {/* Files list — for documents/multi-file */}
          {allFiles.length > 0 && !isAudioFile && !isVideoFile && !isYT && resource.type !== 'link' && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {allFiles.length === 1 ? 'File' : `Files (${allFiles.length})`}
              </p>
              <ul className="space-y-2">
                {allFiles.map((f, i) => {
                  const isImg = f.mimeType.startsWith('image/');
                  const isAud = f.mimeType.startsWith('audio/');
                  const isVid = f.mimeType.startsWith('video/');
                  const FIcon = isImg ? ImageIcon : isAud ? Music : isVid ? Video : FileText;
                  return (
                    <li key={i} className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                      <FIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{f.name}</span>
                      {f.href && (
                        <a
                          href={f.href} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-accent hover:underline flex-shrink-0 font-medium"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Open
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* PDF quick-open button */}
          {isPdfOrDoc && primaryHref && (
            <a
              href={primaryHref} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:bg-accent/90"
            >
              <ExternalLink className="h-4 w-4" /> Open File
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── ResourcesPage ────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedChurch, setSelectedChurch] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [deleteResource, setDeleteResource] = useState<Resource | null>(null);
  const [viewResource, setViewResource] = useState<Resource | null>(null);
  const { user } = useAuth();
  const { hasPermission, role } = useRole();
  const hasResources = useHasFeature('resources_library');
  const qc = useQueryClient();
  const isMember = role === 'member';

  const { data: resourcesResponse = [], isLoading } = useQuery({
    queryKey: ['resources', selectedChurch, activeCategory],
    queryFn: () => resourcesService.getAll({
      churchId: selectedChurch !== 'all' ? selectedChurch : undefined,
      category: activeCategory !== 'all' ? activeCategory : undefined,
    }),
    enabled: isMember || hasResources,
  });

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll,
    enabled: !isMember,
  });

  const resources = Array.isArray(resourcesResponse) && resourcesResponse[0]?.label
    ? resourcesResponse.flatMap((group: any) => group.posts || [])
    : resourcesResponse;
  const groupedResources = Array.isArray(resourcesResponse) && resourcesResponse[0]?.label
    ? resourcesResponse
    : [];

  const createMutation = useMutation({
    mutationFn: ({ dto, files }: { dto: FormValues; files: File[] }) =>
      resourcesService.create({
        title: dto.title, churchId: dto.churchId, type: dto.type, category: dto.category,
        description: dto.description || undefined, author: dto.author || undefined,
        duration: dto.duration || undefined, fileUrl: dto.fileUrl || undefined, files,
      }),
    onSuccess: () => { toast.success('Resource created'); qc.invalidateQueries({ queryKey: ['resources'] }); setCreateOpen(false); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto, files, keepFilesJson }: { id: string; dto: FormValues; files: File[]; keepFilesJson?: string }) =>
      resourcesService.update(id, {
        title: dto.title, churchId: dto.churchId, type: dto.type, category: dto.category,
        description: dto.description || undefined, author: dto.author || undefined,
        duration: dto.duration || undefined, fileUrl: dto.fileUrl || undefined,
        files, keepFilesJson,
      }),
    onSuccess: () => { toast.success('Resource updated'); qc.invalidateQueries({ queryKey: ['resources'] }); setEditResource(null); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: resourcesService.delete,
    onSuccess: () => { toast.success('Resource deleted'); qc.invalidateQueries({ queryKey: ['resources'] }); setDeleteResource(null); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete'),
  });

  const canCreate = hasPermission('resources:create');

  if (!isMember && !hasResources) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Bible Study Resources</h1>
          <p className="text-sm text-muted-foreground">Devotionals, study plans, sermons, and worship materials</p>
        </div>
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Resources Library is not available in your current package.{' '}
            <RouterLink to="/dashboard/packages" className="font-medium underline">Upgrade now</RouterLink>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filtered = resources.filter(r => {
    const matchSearch = search === '' ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const backendBase = import.meta.env.VITE_STATIC_URL ?? 'http://localhost:5000';

  const resolveUrl = (url?: string | null) =>
    url?.startsWith('/uploads/') ? `${backendBase}${url}` : (url ?? null);

  // Build the existing-files list for a resource (for the edit form)
  const getExistingFiles = (r: Resource): ExistingFileEntry[] => {
    const stored = parseResourceFiles(r);
    if (stored.length > 0) return stored.map(f => ({ url: f.url, name: f.name }));
    if (r.fileUrl?.startsWith('/uploads/') && r.fileName) return [{ url: r.fileUrl, name: r.fileName }];
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Bible Study Resources</h1>
          <p className="text-sm text-muted-foreground">Devotionals, study plans, sermons, and worship materials</p>
        </div>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <Plus className="h-4 w-4" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-heading">Add Resource</DialogTitle></DialogHeader>
              <ResourceForm
                onSubmit={(v, files) => {
                  console.log('Resource form values:', v);
                  console.log('Resource form files:', files);
                  createMutation.mutate({ dto: v, files });
                }}
                isPending={createMutation.isPending}
                submitLabel="Create Resource"
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources..." className="pl-9" />
        </div>
        
        {!isMember && churches.length > 0 && (
          <Select value={selectedChurch} onValueChange={setSelectedChurch}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="All Churches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Churches</SelectItem>
              {churches.map((church: Church) => (
                <SelectItem key={church.id} value={church.id}>
                  {church.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${activeCategory === cat ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {cat === 'all' ? 'All' : CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : groupedResources.length > 0 ? (
        groupedResources.map((group: any) => {
          const groupFiltered = group.posts.filter((r: any) => {
            const matchSearch = search === '' ||
              r.title.toLowerCase().includes(search.toLowerCase()) ||
              (r.description ?? '').toLowerCase().includes(search.toLowerCase());
            return matchSearch;
          });
          if (groupFiltered.length === 0) return null;
          return (
            <div key={group.label} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupFiltered.map((resource: any) => {
            const Icon = TYPE_ICON[resource.type] ?? BookOpen;
            const storedFiles = parseResourceFiles(resource);
            const primaryHref = resolveUrl(resource.fileUrl);
            const isYT = primaryHref ? isYouTubeUrl(primaryHref) : false;
            const allFiles: { href: string | null; name: string }[] =
              storedFiles.length > 0
                ? storedFiles.map((f: ResourceFile) => ({ href: resolveUrl(f.url), name: f.name }))
                : primaryHref ? [{ href: primaryHref, name: resource.fileName ?? 'File' }] : [];

            return (
              <Card
                key={resource.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setViewResource(resource)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 bg-accent/10 rounded-md flex-shrink-0">
                      <Icon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {/* View */}
                      <button
                        onClick={() => setViewResource(resource)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="View resource"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {/* External link for single-file / YouTube */}
                      {allFiles.length === 1 && allFiles[0].href && (
                        <a href={allFiles[0].href} target="_blank" rel="noopener noreferrer"
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title={isYT ? 'Open in YouTube' : 'Open file'}
                        >
                          {isYT
                            ? <Youtube className="h-3.5 w-3.5 text-red-500" />
                            : <ExternalLink className="h-3.5 w-3.5" />
                          }
                        </a>
                      )}
                      {canCreate && (
                        <>
                          <button
                            onClick={() => setEditResource(resource)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteResource(resource)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-sm font-semibold leading-snug mt-2">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {resource.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLOR[resource.category] ?? ''}`}>
                      {CATEGORY_LABEL[resource.category]}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">{resource.type}</Badge>
                    {resource.duration && <span className="text-xs text-muted-foreground">{resource.duration}</span>}
                  </div>
                  {resource.author && <p className="text-xs text-muted-foreground">By {resource.author}</p>}
                  {/* File count / names */}
                  {allFiles.length > 1 ? (
                    <p className="text-xs text-muted-foreground">{allFiles.length} files attached</p>
                  ) : allFiles.length === 1 && !isYT && (
                    <p className="text-xs text-muted-foreground truncate">{allFiles[0].name}</p>
                  )}
                </CardContent>
              </Card>
            );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>{canCreate ? 'No resources yet. Add your first resource!' : 'No resources match your search.'}</p>
        </div>
      )}

      {/* View dialog */}
      <ResourceDetailDialog
        resource={viewResource}
        open={!!viewResource}
        onClose={() => setViewResource(null)}
        backendBase={backendBase}
      />

      {/* Edit dialog */}
      <Dialog open={!!editResource} onOpenChange={open => !open && setEditResource(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Edit Resource</DialogTitle></DialogHeader>
          {editResource && (
            <ResourceForm
              key={editResource.id}
              defaultValues={{
                title: editResource.title,
                description: editResource.description ?? '',
                category: editResource.category,
                type: editResource.type,
                author: editResource.author ?? '',
                duration: editResource.duration ?? '',
                fileUrl: editResource.fileUrl ?? '',
                fileName: editResource.fileName,
                churchId: editResource.churchId,
                existingFiles: getExistingFiles(editResource),
              }}
              onSubmit={(v, files, keepFilesJson) =>
                updateMutation.mutate({ id: editResource.id, dto: v, files, keepFilesJson })
              }
              isPending={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteResource} onOpenChange={open => !open && setDeleteResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteResource?.title}</strong>? This will also remove all uploaded files. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteResource && deleteMutation.mutate(deleteResource.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
