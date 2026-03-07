import { useQuery } from '@tanstack/react-query';
import { churchesService } from '@/services/churches';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ChurchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

export function ChurchSelect({ 
  value, 
  onValueChange, 
  required = true, 
  label = "Church",
  placeholder = "Select a church"
}: ChurchSelectProps) {
  const { data: churches = [], isLoading } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll
  });

  return (
    <div>
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Loading churches..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {churches.map(church => (
            <SelectItem key={church.id} value={church.id}>
              {church.name} 
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}