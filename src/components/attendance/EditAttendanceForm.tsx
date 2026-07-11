import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance';
import { RegularServiceForm } from './RegularServiceForm';

interface Props {
  record: any;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

export function EditAttendanceForm({ record, onSubmit, isPending }: Props) {
  const summaryLocked = !!record.qrToken || !!record.digitalCheckInEnabled || ((record._count?.participants ?? 0) > 0);
  const { data: visitorsResult } = useQuery({
    queryKey: ['attendance-visitors', record.id, 'all'],
    queryFn: () => attendanceService.getVisitors(record.id, { page: 1, limit: 100 }),
    staleTime: 0,
    enabled: !summaryLocked,
  });
  const existingVisitors = visitorsResult?.data ?? [];

  return (
    <RegularServiceForm
      key={`${record.id}-${existingVisitors.length}`}
      defaultValues={{
        churchId: record.churchId,
        date: new Date(record.date).toISOString().split('T')[0],
        serviceType: record.serviceType,
        maleCount: record.maleCount ?? 0,
        femaleCount: record.femaleCount ?? 0,
        children: record.children ?? 0,
        youth: record.youth ?? 0,
        youngAdults: record.youngAdults ?? 0,
        adults: record.adults ?? 0,
        seniors: record.seniors ?? 0,
        newVisitors: record.newVisitors ?? 0,
        notes: record.notes ?? '',
      }}
      defaultVisitors={existingVisitors}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel="Update Record"
      summaryLocked={summaryLocked}
    />
  );
}
