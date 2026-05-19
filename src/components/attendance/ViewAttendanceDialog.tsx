import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService, type AttendanceVisitor } from '@/services/attendance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardList, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GENDER_LABELS, HOW_HEARD_LABELS } from './constants';

interface Props {
  record: any;
  onClose: () => void;
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/40 rounded-md px-3 py-2 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

const PAGE_SIZE = 20;

export function ViewAttendanceDialog({ record, onClose }: Props) {
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<(AttendanceVisitor & { id?: string })[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['attendance-visitors', record.id, page],
    queryFn: () => attendanceService.getVisitors(record.id, { page, limit: PAGE_SIZE }),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data?.data) {
      setAccumulated(prev => page === 1 ? data.data : [...prev, ...data.data]);
    }
  }, [data]);

  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  const date = new Date(record.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-accent" />
            {record.serviceType}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{date} · {(record as any).church?.name}</p>
        </DialogHeader>

        {/* Attendance stats */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Total Attendees" value={record.totalAttendees} />
            <StatBox label="Male" value={(record as any).maleCount ?? 0} />
            <StatBox label="Female" value={(record as any).femaleCount ?? 0} />
          </div>

          {/* Age groups — only show if any are non-zero */}
          {(['children', 'youth', 'youngAdults', 'adults', 'seniors'] as const).some(k => (record as any)[k] > 0) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Age Groups</p>
              <div className="grid grid-cols-5 gap-2">
                <StatBox label="0-12" value={(record as any).children ?? 0} />
                <StatBox label="13-17" value={(record as any).youth ?? 0} />
                <StatBox label="18-35" value={(record as any).youngAdults ?? 0} />
                <StatBox label="36-59" value={(record as any).adults ?? 0} />
                <StatBox label="60+" value={(record as any).seniors ?? 0} />
              </div>
            </div>
          )}

          {record.notes && (
            <div className="p-3 border rounded-md bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{record.notes}</p>
            </div>
          )}
        </div>

        {/* Visitors section */}
        <div className="border-t pt-4 mt-2">
          <p className="text-sm font-semibold mb-3">
            Visitors
            {total > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">({accumulated.length} of {total})</span>}
          </p>

          {isLoading && accumulated.length === 0 ? (
            <div className="flex justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : accumulated.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
              No individual visitor details recorded for this service.
            </p>
          ) : (
            <div className="space-y-2">
              {accumulated.map((v, i) => (
                <div key={v.id ?? i} className="border rounded-md px-3 py-2.5 bg-muted/20">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-sm">
                    <div className="font-medium">{v.name}</div>
                    {v.phone && <div className="text-muted-foreground text-xs">{v.phone}</div>}
                    {v.email && <div className="text-muted-foreground text-xs">{v.email}</div>}
                    {v.residentialArea && <div className="text-muted-foreground text-xs col-span-2 sm:col-span-3">{v.residentialArea}</div>}
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-3 col-span-2 sm:col-span-3 mt-0.5">
                      {v.gender && <span>{GENDER_LABELS[v.gender] ?? v.gender}</span>}
                      {v.ageBracket && <span>{v.ageBracket} yrs</span>}
                      {v.howHeard && <span>Via: {HOW_HEARD_LABELS[v.howHeard] ?? v.howHeard}</span>}
                    </div>
                    {v.notes && <div className="text-xs text-muted-foreground italic col-span-2 sm:col-span-3">{v.notes}</div>}
                  </div>
                </div>
              ))}
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1"
                  disabled={isFetching}
                  onClick={() => setPage(p => p + 1)}
                >
                  {isFetching ? 'Loading...' : <><ChevronDown className="h-3.5 w-3.5" /> Load more ({total - accumulated.length} remaining)</>}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
