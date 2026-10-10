import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  ClipboardList,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { churchesService } from '@/services/churches';
import {
  servicesService,
  type ChurchService,
  type ServiceInput,
} from '@/services/services';
import { ProgramDialog } from '@/components/programs/ProgramDialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dateTimeLocalToIso, toDateTimeLocalInputValue } from '@/lib/date-time';

const emptyForm = {
  churchId: '',
  title: '',
  type: '',
  startsAt: '',
  endsAt: '',
  location: '',
  description: '',
  status: 'scheduled' as const,
};

export default function ServicesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = useRole();
  const hasFeature = useHasFeature('attendance_tracking');
  const canCreate = hasFeature && hasPermission('attendance:create');
  const canEdit = hasFeature && hasPermission('attendance:update');
  const [churchFilter, setChurchFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChurchService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [programService, setProgramService] = useState<ChurchService | null>(
    null,
  );
  const [deleteService, setDeleteService] = useState<ChurchService | null>(
    null,
  );
  const { data: churches = [] } = useQuery({
    queryKey: ['churches-select'],
    queryFn: churchesService.getSelectable,
  });
  const {
    data: services = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesService.list(),
    enabled: hasFeature,
  });
  const save = useMutation({
    mutationFn: (input: ServiceInput) =>
      editing
        ? servicesService.update(editing.id, input)
        : servicesService.create(input),
    onSuccess: () => {
      toast.success(editing ? 'Service updated' : 'Service created');
      qc.invalidateQueries({ queryKey: ['services'] });
      setFormOpen(false);
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || 'Could not save service'),
  });
  const remove = useMutation({
    mutationFn: servicesService.remove,
    onSuccess: () => {
      toast.success('Service deleted');
      qc.invalidateQueries({ queryKey: ['services'] });
      setDeleteService(null);
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || 'Could not delete service'),
  });
  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      churchId: churchFilter !== 'all' ? churchFilter : churches[0]?.id || '',
      startsAt: toDateTimeLocalInputValue(new Date()),
    });
    setFormOpen(true);
  };
  const openEdit = (service: ChurchService) => {
    setEditing(service);
    setForm({
      churchId: service.churchId,
      title: service.title,
      type: service.type || '',
      startsAt: toDateTimeLocalInputValue(service.startsAt),
      endsAt: service.endsAt ? toDateTimeLocalInputValue(service.endsAt) : '',
      location: service.location || '',
      description: service.description || '',
      status: service.status,
    });
    setFormOpen(true);
  };
  const submit = () => {
    const startsAt = dateTimeLocalToIso(form.startsAt);
    const endsAt = form.endsAt ? dateTimeLocalToIso(form.endsAt) : null;
    if (
      !form.churchId ||
      !form.title.trim() ||
      !startsAt ||
      (form.endsAt && !endsAt)
    )
      return toast.error('Enter a church, title, and valid date');
    if (endsAt && new Date(endsAt) <= new Date(startsAt))
      return toast.error('End time must be after start time');
    save.mutate({
      ...form,
      title: form.title.trim(),
      type: form.type.trim() || null,
      startsAt,
      endsAt,
    });
  };
  const filtered = services.filter(
    (service) =>
      (churchFilter === 'all' || service.churchId === churchFilter) &&
      (!search ||
        `${service.title} ${service.type || ''} ${service.church?.name || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );

  if (!hasFeature) {
    return (
      <div className="space-y-3">
        <h1 className="font-heading text-2xl font-bold">Services</h1>
        <p className="text-sm text-muted-foreground">
          Attendance Tracking is not available in your current package.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Services</h1>
          <p className="text-sm text-muted-foreground">
            {services.length} scheduled and past services
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Create service
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          className="min-w-[180px] flex-1 sm:max-w-xs"
          placeholder="Search services"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={churchFilter} onValueChange={setChurchFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {churches.map((church: any) => (
              <SelectItem key={church.id} value={church.id}>
                {church.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading services...
        </p>
      ) : isError ? (
        <div className="space-y-3 py-12 text-center">
          <p className="text-sm text-destructive">Could not load services.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : filtered.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((service) => (
            <Card key={service.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{service.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {service.church?.name}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Service actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(service.program || canEdit) && (
                        <DropdownMenuItem
                          onClick={() => setProgramService(service)}
                        >
                          {service.program ? 'View program' : 'Add program'}
                        </DropdownMenuItem>
                      )}
                      {canCreate &&
                        !service.attendance &&
                        service.status !== 'cancelled' && (
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/dashboard/attendance?serviceId=${service.id}`,
                              )
                            }
                          >
                            Start attendance
                          </DropdownMenuItem>
                        )}
                      {canEdit && (
                        <DropdownMenuItem onClick={() => openEdit(service)}>
                          Edit service
                        </DropdownMenuItem>
                      )}
                      {canEdit && !service.attendance && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteService(service)}
                        >
                          Delete service
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  {new Date(service.startsAt).toLocaleString()}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded border px-2 py-1 capitalize">
                    {service.status}
                  </span>
                  {service.type && (
                    <span className="rounded border px-2 py-1">
                      {service.type}
                    </span>
                  )}
                  {service.attendance && (
                    <Link
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                      to={`/dashboard/attendance/${service.attendance.id}`}
                    >
                      <ClipboardList className="h-3.5 w-3.5" /> Attendance
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No services found
        </p>
      )}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit service' : 'Create service'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select
                value={form.churchId}
                onValueChange={(churchId) =>
                  setForm((current) => ({ ...current, churchId }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((church: any) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Sunday Worship"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type (optional)</Label>
                <Input
                  value={form.type}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, type: e.target.value }))
                  }
                  placeholder="Sunday Service"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Starts</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      startsAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ends (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      endsAt: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      location: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(status) =>
                    setForm((current) => ({
                      ...current,
                      status: status as ChurchService['status'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={save.isPending}>
                {save.isPending ? 'Saving...' : 'Save service'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {programService && (
        <ProgramDialog
          open={!!programService}
          onOpenChange={(open) => {
            if (!open) setProgramService(null);
          }}
          target="services"
          targetId={programService.id}
          targetTitle={programService.title}
          startsAt={programService.startsAt}
          canEdit={canEdit}
        />
      )}
      <AlertDialog
        open={!!deleteService}
        onOpenChange={(open) => {
          if (!open) setDeleteService(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteService?.title} and its program. Services
              with attendance cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteService && remove.mutate(deleteService.id)}
              disabled={remove.isPending}
            >
              Delete service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
