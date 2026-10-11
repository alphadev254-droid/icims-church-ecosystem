import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Mail, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dateTimeLocalToIso, toDateTimeLocalInputValue } from '@/lib/date-time';
import { apiErrorMessage, isForbiddenError } from '@/lib/api-error';
import {
  programsService,
  type ProgramItem,
  type ProgramPerson,
  type ProgramTarget,
} from '@/services/programs';

type DraftItem = Omit<ProgramItem, 'startsAt' | 'endsAt'> & {
  key: string;
  startsAt: string;
  endsAt: string;
};

function itemDraft(item: ProgramItem): DraftItem {
  return {
    ...item,
    key: item.id || crypto.randomUUID(),
    startsAt: toDateTimeLocalInputValue(item.startsAt),
    endsAt: toDateTimeLocalInputValue(item.endsAt),
  };
}

function PersonPicker({
  target,
  targetId,
  item,
  onChange,
  disabled,
}: {
  target: ProgramTarget;
  targetId: string;
  item: DraftItem;
  onChange: (patch: Partial<DraftItem>) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const { data: people = [], isFetching } = useQuery({
    queryKey: ['program-people', target, targetId, debounced],
    queryFn: () => programsService.searchPeople(target, targetId, debounced),
    enabled: debounced.length >= 3 && !disabled,
  });
  const [mode, setMode] = useState<'user' | 'guest'>(
    item.guestName ? 'guest' : 'user',
  );
  const selectPerson = (person: ProgramPerson) => {
    onChange({
      userId: person.id,
      user: person,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
    });
    setQuery('');
  };

  return (
    <div className="space-y-2">
      <Label>Responsible person</Label>
      <Select
        value={mode}
        onValueChange={(value) => {
          setMode(value as 'user' | 'guest');
          onChange(
            value === 'guest'
              ? {
                  userId: null,
                  user: null,
                  guestName: item.guestName || '',
                  guestEmail: item.guestEmail || '',
                  guestPhone: item.guestPhone || '',
                }
              : {
                  userId: null,
                  user: null,
                  guestName: null,
                  guestEmail: null,
                  guestPhone: null,
                },
          );
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">Church user</SelectItem>
          <SelectItem value="guest">Guest</SelectItem>
        </SelectContent>
      </Select>
      {mode === 'guest' ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            aria-label="Guest name"
            placeholder="Name *"
            value={item.guestName || ''}
            onChange={(e) => onChange({ guestName: e.target.value })}
            disabled={disabled}
          />
          <Input
            aria-label="Guest email"
            type="email"
            placeholder="Email"
            value={item.guestEmail || ''}
            onChange={(e) => onChange({ guestEmail: e.target.value })}
            disabled={disabled}
          />
          <Input
            aria-label="Guest phone"
            type="tel"
            placeholder="Phone"
            value={item.guestPhone || ''}
            onChange={(e) => onChange({ guestPhone: e.target.value })}
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {item.user && (
            <div className="flex items-center justify-between rounded border px-3 py-2 text-sm">
              <span>
                {item.user.firstName} {item.user.lastName}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange({ userId: null, user: null })}
              >
                Change
              </Button>
            </div>
          )}
          {!item.user && (
            <Input
              aria-label="Search church users"
              placeholder="Search name, email or phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={disabled}
            />
          )}
          {!item.user && debounced.length >= 3 && (
            <div className="max-h-40 overflow-y-auto rounded border">
              {people.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => selectPerson(person)}
                >
                  <span className="font-medium">
                    {person.firstName} {person.lastName}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {person.email || person.phone}
                  </span>
                </button>
              ))}
              {!people.length && (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  {isFetching ? 'Searching...' : 'No users found'}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProgramDialog({
  open,
  onOpenChange,
  target,
  targetId,
  targetTitle,
  startsAt,
  canEdit,
  canSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ProgramTarget;
  targetId: string;
  targetTitle: string;
  startsAt: string;
  canEdit: boolean;
  canSend: boolean;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmChanges, setConfirmChanges] = useState(false);
  const [notifyPrevious, setNotifyPrevious] = useState(true);
  const [sendItem, setSendItem] = useState<DraftItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const {
    data: program,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['program', target, targetId],
    queryFn: () => programsService.get(target, targetId),
    enabled: open,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (!open || isLoading || isError) return;
    setTitle(program?.title || `${targetTitle} Program`);
    setDescription(program?.description || '');
    setItems((program?.items || []).map(itemDraft));
    setDirty(false);
  }, [open, isLoading, isError, program, targetTitle]);
  const save = useMutation({
    mutationFn: (notifyPrevious: boolean) =>
      programsService.save(target, targetId, {
        title: title.trim(),
        description: description.trim(),
        notifyPrevious,
        items: items.map(({ key, user, emailStatus, lastEmailAt, ...item }) => ({
          ...item,
          startsAt: dateTimeLocalToIso(item.startsAt)!,
          endsAt: dateTimeLocalToIso(item.endsAt)!,
        })),
      }),
    onSuccess: ({ notificationWarnings }) => {
      toast.success(notificationWarnings ? `Program saved; ${notificationWarnings} removal email(s) could not be queued` : 'Program saved');
      qc.invalidateQueries({ queryKey: ['program', target, targetId] });
      qc.invalidateQueries({ queryKey: [target] });
      if (target === 'services') qc.invalidateQueries({ queryKey: ['services-page'] });
      setConfirmChanges(false);
      onOpenChange(false);
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || 'Could not save program'),
  });
  const send = useMutation({
    mutationFn: (itemId: string) => programsService.sendAssignment(target, targetId, itemId),
    onSuccess: () => {
      toast.success('Assignment email queued');
      qc.invalidateQueries({ queryKey: ['program', target, targetId] });
      setSendItem(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Could not queue assignment email'),
  });
  const remove = useMutation({
    mutationFn: () => programsService.remove(target, targetId),
    onSuccess: () => {
      toast.success('Program removed');
      qc.invalidateQueries({ queryKey: ['program', target, targetId] });
      qc.invalidateQueries({ queryKey: [target] });
      if (target === 'services') qc.invalidateQueries({ queryKey: ['services-page'] });
      setConfirmRemove(false);
      onOpenChange(false);
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || 'Could not remove program'),
  });
  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setDirty(true);
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  };
  const moveItem = (index: number, direction: number) => {
    setDirty(true);
    setItems((current) => {
      const next = [...current];
      const other = index + direction;
      if (other < 0 || other >= next.length) return current;
      [next[index], next[other]] = [next[other], next[index]];
      return next;
    });
  };
  const addItem = () => {
    setDirty(true);
    const base = items.at(-1)?.endsAt || toDateTimeLocalInputValue(startsAt);
    const end = new Date(new Date(base).getTime() + 10 * 60_000);
    setItems((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        title: '',
        startsAt: base,
        endsAt: toDateTimeLocalInputValue(end),
        userId: null,
      },
    ]);
  };
  const submit = () => {
    if (!title.trim()) return toast.error('Enter a program title');
    for (const [index, item] of items.entries()) {
      if (
        !item.title.trim() ||
        !dateTimeLocalToIso(item.startsAt) ||
        !dateTimeLocalToIso(item.endsAt) ||
        new Date(item.endsAt) <= new Date(item.startsAt)
      )
        return toast.error(`Check the title and times for item ${index + 1}`);
      if (!item.userId && !item.guestName?.trim())
        return toast.error(`Assign a user or guest to item ${index + 1}`);
      if (
        item.guestEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.guestEmail)
      )
        return toast.error(`Check the guest email for item ${index + 1}`);
    }
    const previouslyNotified = (program?.items || []).some((oldItem) => {
      const next = items.find((item) => item.id === oldItem.id);
      const changedRecipient = !next || (next.userId || null) !== (oldItem.userId || null)
        || (next.guestEmail?.trim().toLowerCase() || null) !== (oldItem.guestEmail?.trim().toLowerCase() || null);
      return changedRecipient && oldItem.endsAt > new Date().toISOString()
        && (oldItem.emailStatus === 'sent' || oldItem.emailStatus === 'queued' || oldItem.emailStatus === 'changed');
    });
    if (previouslyNotified) {
      setNotifyPrevious(true);
      setConfirmChanges(true);
    } else save.mutate(false);
  };
  const currentEmailStatus = (item: DraftItem) => {
    const original = program?.items.find((entry) => entry.id === item.id);
    const email = item.userId ? item.user?.email : item.guestEmail;
    if (!email) return 'No email';
    if (!original || original.userId !== item.userId || (original.guestEmail || '') !== (item.guestEmail || '')) return 'Not sent';
    if (original.title !== item.title || (original.description || '') !== (item.description || '')
      || toDateTimeLocalInputValue(original.startsAt) !== item.startsAt
      || toDateTimeLocalInputValue(original.endsAt) !== item.endsAt) return 'Changed since last email';
    return ({ no_email: 'No email', not_sent: 'Not sent', queued: 'Queued', sent: 'Sent', failed: 'Failed', changed: 'Changed since last email' } as const)[item.emailStatus || 'not_sent'];
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {program ? 'Program' : 'Add program'} · {targetTitle}
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading program...
            </p>
          ) : isError ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-sm text-destructive">
                {apiErrorMessage(error, 'Could not load this program.')}
              </p>
              {isForbiddenError(error) && (
                <p className="text-xs text-muted-foreground">
                  If this permission was just granted, sign out and sign back in to refresh your session.
                </p>
              )}
              {!isForbiddenError(error) && <Button variant="outline" onClick={() => refetch()}>Retry</Button>}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    className="min-h-10"
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Running order</h3>
                <div className="flex items-center gap-2">
                {program?.notifications?.length ? <Button type="button" size="sm" variant="ghost" onClick={() => setHistoryOpen(true)}>Email history</Button> : null}
                {canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addItem}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add item
                  </Button>
                )}
                </div>
              </div>
              {items.map((item, index) => (
                <section
                  key={item.key}
                  className="space-y-3 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {index + 1}. {item.title || 'New item'}
                    </span>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          title="Move up"
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          title="Move down"
                          disabled={index === items.length - 1}
                          onClick={() => moveItem(index, 1)}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          title="Remove item"
                          onClick={() =>
                            { setDirty(true); setItems((current) => current.filter((row) => row.key !== item.key)); }
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Item title</Label>
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          updateItem(item.key, { title: e.target.value })
                        }
                        disabled={!canEdit}
                        placeholder="Opening prayer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input
                        value={item.description || ''}
                        onChange={(e) =>
                          updateItem(item.key, { description: e.target.value })
                        }
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>From</Label>
                      <Input
                        type="datetime-local"
                        value={item.startsAt}
                        onChange={(e) =>
                          updateItem(item.key, { startsAt: e.target.value })
                        }
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>To</Label>
                      <Input
                        type="datetime-local"
                        value={item.endsAt}
                        onChange={(e) =>
                          updateItem(item.key, { endsAt: e.target.value })
                        }
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                  <PersonPicker
                    target={target}
                    targetId={targetId}
                    item={item}
                    onChange={(patch) => updateItem(item.key, patch)}
                    disabled={!canEdit}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{currentEmailStatus(item)}</Badge>
                      {item.lastEmailAt && currentEmailStatus(item) === 'Sent' && <span className="text-xs text-muted-foreground">{new Date(item.lastEmailAt).toLocaleString()}</span>}
                    </div>
                    {canSend && item.id && (item.userId ? item.user?.email : item.guestEmail) && (
                      <Button type="button" size="sm" variant="outline" disabled={dirty || currentEmailStatus(item) === 'Queued'} onClick={() => setSendItem(item)}>
                        <Mail className="mr-1 h-4 w-4" /> {currentEmailStatus(item) === 'Sent' ? 'Resend email' : 'Send email'}
                      </Button>
                    )}
                  </div>
                </section>
              ))}
              {!items.length && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No items yet
                </p>
              )}
              {canEdit && (
                <div className="flex flex-wrap justify-end gap-2">
                  {program && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="mr-auto"
                      onClick={() => setConfirmRemove(true)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Remove program
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={submit}
                    disabled={save.isPending}
                  >
                    {save.isPending ? 'Saving...' : 'Save program'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove program?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the running order and its assignments from{' '}
              {targetTitle}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              Remove program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmChanges} onOpenChange={setConfirmChanges}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change notified assignments?</AlertDialogTitle>
            <AlertDialogDescription>People previously emailed about an upcoming assignment may still expect to participate.</AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={notifyPrevious} onCheckedChange={(checked) => setNotifyPrevious(checked === true)} />
            Email the previous person that their assignment was removed
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={save.isPending} onClick={() => save.mutate(notifyPrevious)}>Save changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!sendItem} onOpenChange={(value) => { if (!value) setSendItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send assignment email?</AlertDialogTitle>
            <AlertDialogDescription>
              Send {sendItem?.title} for {targetTitle} to {sendItem?.userId ? sendItem.user?.email : sendItem?.guestEmail}.
              {sendItem?.emailStatus === 'sent' ? ' This will be another email to the same person.' : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={send.isPending} onClick={() => { if (sendItem?.id) send.mutate(sendItem.id); }}>Send email</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[80vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>Email history</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {(program?.notifications || []).map((notification) => (
              <div key={notification.id} className="border-b py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <strong>{notification.itemTitle}</strong>
                  <Badge variant="outline" className="capitalize">{notification.status}</Badge>
                </div>
                <p className="text-muted-foreground">{notification.kind === 'removal' ? 'Removal notice' : 'Assignment'} to {notification.name} ({notification.recipient})</p>
                <p className="text-xs text-muted-foreground">{new Date(notification.sentAt || notification.createdAt).toLocaleString()}</p>
                {notification.error && <p className="text-xs text-destructive">{notification.error}</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
