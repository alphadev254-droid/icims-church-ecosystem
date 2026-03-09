import { useState, useRef, useEffect } from 'react';
import { TeamCommunication } from '@/services/teamCommunication';
import { Team } from '@/services/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface TeamCommunicationFormProps {
  teams: Team[];
  initialData?: TeamCommunication;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

export function TeamCommunicationForm({ teams, initialData, onSubmit, isPending }: TeamCommunicationFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [teamId, setTeamId] = useState(initialData?.teamId || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<{ url: string; type: string; name: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData?.mediaUrls) {
      setExistingMedia(initialData.mediaUrls);
    }
  }, [initialData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalMedia = existingMedia.length + selectedFiles.length + files.length;
    if (totalMedia > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewMedia = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia(existingMedia.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !teamId) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit({ title, content, teamId, files: selectedFiles, existingMedia });
  };

  const getMediaIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const totalMediaCount = existingMedia.length + selectedFiles.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="team">Team *</Label>
        <Select value={teamId} onValueChange={setTeamId} disabled={!!initialData}>
          <SelectTrigger>
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map(team => (
              <SelectItem key={team.id} value={team.id}>
                {team.color && <div className="w-2 h-2 rounded-full inline-block mr-2" style={{ backgroundColor: team.color }} />}
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter post content"
          rows={6}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={totalMediaCount >= 5}
            className="w-full gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Files ({totalMediaCount}/5)
          </Button>
          
          {/* Existing Media */}
          {existingMedia.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Existing Files</p>
              {existingMedia.map((media, idx) => (
                <div key={`existing-${idx}`} className="flex items-center gap-2 p-2 border rounded text-sm bg-muted/50">
                  {getMediaIcon(media.type)}
                  <span className="flex-1 truncate">{media.name}</span>
                  <span className="text-xs text-muted-foreground">{(media.size / 1024).toFixed(1)} KB</span>
                  <button
                    type="button"
                    onClick={() => removeExistingMedia(idx)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">New Files</p>
              {selectedFiles.map((file, idx) => (
                <div key={`new-${idx}`} className="flex items-center gap-2 p-2 border rounded text-sm">
                  {getMediaIcon(file.type)}
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  <button
                    type="button"
                    onClick={() => removeNewMedia(idx)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
}
