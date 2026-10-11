import { useEffect, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function resourceImageUrl(url: string) {
  if (url.startsWith('http')) return url;
  const base = (import.meta.env.VITE_STATIC_URL || 'http://localhost:5000').replace(/['"]|\/$|^\/api$/g, '');
  return `${base}${url}`;
}

export function ResourceImagesField({ images, files, onFilesChange, onRemoveImage, removingUrl, disabled }: {
  images: string[];
  files: File[];
  onFilesChange: (files: File[]) => void;
  onRemoveImage: (url: string) => void;
  removingUrl?: string;
  disabled?: boolean;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  const count = images.length + files.length;
  const addFiles = (selection: FileList | null) => {
    if (!selection?.length) return;
    const chosen = Array.from(selection);
    if (count + chosen.length > 3) { toast.error('A resource can have at most 3 images'); return; }
    if (chosen.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))) { toast.error('Use JPG, PNG, WebP or GIF images'); return; }
    if (chosen.some(file => file.size > 5 * 1024 * 1024)) { toast.error('Each image must be 5 MB or smaller'); return; }
    onFilesChange([...files, ...chosen]);
  };
  return <div className="space-y-2 sm:col-span-2">
    <div className="flex items-center justify-between"><Label>Images (optional)</Label><span className="text-xs text-muted-foreground">{count}/3 · up to 5 MB each</span></div>
    <div className="grid grid-cols-3 gap-2">
      {images.map((url, index) => <div key={url} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
        <img src={resourceImageUrl(url)} alt={`Resource image ${index + 1}`} className="h-full w-full object-cover" />
        <Button type="button" size="icon" variant="destructive" className="absolute right-1 top-1 h-7 w-7" disabled={disabled || removingUrl === url} aria-label={`Remove image ${index + 1}`} onClick={() => onRemoveImage(url)}><X className="h-4 w-4" /></Button>
      </div>)}
      {files.map((file, index) => <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
        <img src={previews[index]} alt={`New image ${index + 1}`} className="h-full w-full object-cover" />
        <Button type="button" size="icon" variant="destructive" className="absolute right-1 top-1 h-7 w-7" disabled={disabled} aria-label={`Remove new image ${index + 1}`} onClick={() => onFilesChange(files.filter((_, itemIndex) => itemIndex !== index))}><X className="h-4 w-4" /></Button>
      </div>)}
      {count < 3 && <label className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed text-center text-xs text-muted-foreground ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted'}`}>
        <ImagePlus className="h-5 w-5" /><span>Add images</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" disabled={disabled} onChange={event => { addFiles(event.target.files); event.target.value = ''; }} />
      </label>}
    </div>
    <p className="text-xs text-muted-foreground">Show the room or item clearly. Images will upload when you save the resource.</p>
  </div>;
}
