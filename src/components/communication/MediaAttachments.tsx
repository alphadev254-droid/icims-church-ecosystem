import { Download, FileText } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media-url';

export type MediaAttachment = { url: string; name?: string; size?: number; type?: string; mimeType?: string };

export function MediaAttachments({ files }: { files: MediaAttachment[] }) {
  if (!files.length) return null;
  return <div className="grid gap-3 sm:grid-cols-2">{files.map((file, index) => {
    const mime = file.mimeType || file.type || '';
    const url = resolveMediaUrl(file.url);
    const name = file.name || `Attachment ${index + 1}`;
    if (mime.startsWith('image/')) return <a key={`${file.url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-lg border bg-muted/30"><img src={url} alt={name} loading="lazy" className="max-h-80 w-full object-contain" /><p className="truncate px-3 py-2 text-xs">{name}</p></a>;
    if (mime.startsWith('video/')) return <div key={`${file.url}-${index}`} className="overflow-hidden rounded-lg border bg-black"><video src={url} controls preload="metadata" className="max-h-[32rem] w-full" /><a href={url} target="_blank" rel="noopener noreferrer" className="block truncate bg-background px-3 py-2 text-xs hover:underline">{name}</a></div>;
    if (mime.startsWith('audio/')) return <div key={`${file.url}-${index}`} className="rounded-lg border p-3"><p className="mb-2 truncate text-xs font-medium">{name}</p><audio src={url} controls preload="metadata" className="w-full" /></div>;
    return <a key={`${file.url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted"><FileText className="h-5 w-5" /><span className="min-w-0 flex-1 truncate text-sm">{name}</span>{file.size != null && <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>}<Download className="h-4 w-4" /></a>;
  })}</div>;
}
