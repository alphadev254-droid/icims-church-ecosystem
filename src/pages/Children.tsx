import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Baby, Info, Link2, MoreHorizontal, Pencil, Plus, Search, Trash2, Upload, Users } from 'lucide-react';
import { childrenService, type Child } from '@/services/children';
import { usersService, type AppUser } from '@/services/users';
import { churchesService } from '@/services/churches';
import { useDebounce } from '@/hooks/use-debounce';
import { useRole } from '@/hooks/useRole';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { useAuthStore } from '@/stores/authStore';
import { PACKAGE_FEATURES } from '@/lib/package-features';
import { FeatureGate } from '@/components/FeatureGate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 50;
const MAX_IMPORT_ROWS = 100;

const CHILD_IMPORT_FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  dateOfBirth: 'Date of Birth',
  age: 'Age',
  gender: 'Gender',
  phone: 'Phone',
  churchId: 'Church',
  guardianEmail: 'Guardian Email',
  guardianPhone: 'Guardian Phone',
  relationship: 'Relationship',
  status: 'Status',
};

const RELATIONSHIP_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'parent', label: 'Parent' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'relative', label: 'Relative' },
];

function childName(child: Child) {
  return `${child.firstName} ${child.lastName}`.trim();
}

function guardianName(user?: AppUser | Child['guardians'][number]['guardian']) {
  return user ? `${user.firstName} ${user.lastName}`.trim() : '';
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
}

function calculateAge(value?: string | null) {
  if (!value) return null;
  const dateOnly = value.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  const dob = year && month && day ? new Date(year, month - 1, day) : new Date(value);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return age >= 0 ? age : null;
}

function childAge(child: Child) {
  const computedAge = child.dateOfBirth ? calculateAge(child.dateOfBirth) : null;
  return computedAge ?? child.age ?? null;
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <Label className="text-muted-foreground">{label}</Label>
      <p className="text-sm">{value ?? '-'}</p>
    </div>
  );
}

function ChildDetailsDialog({ child, onOpenChange }: { child: Child | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!child} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Child Details</DialogTitle></DialogHeader>
        {child && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-md border p-4">
              <DetailField label="Full Name" value={childName(child)} />
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p><Badge variant={child.status === 'active' ? 'default' : 'secondary'}>{child.status}</Badge></p>
              </div>
              <DetailField label="Church" value={child.church?.name} />
              <DetailField label="Age" value={childAge(child) != null ? `${childAge(child)} yrs` : null} />
              <DetailField label="Sex" value={child.gender ? child.gender[0].toUpperCase() + child.gender.slice(1) : null} />
              <DetailField label="Phone" value={child.phone} />
              <DetailField label="Date of Birth" value={formatDate(child.dateOfBirth)} />
              <DetailField label="Created" value={formatDate(child.createdAt)} />
            </div>

            <div>
              <Label className="text-muted-foreground">Notes</Label>
              <p className="mt-1 rounded-md border p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                {child.notes || 'No notes.'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-muted-foreground">Parents / Guardians</Label>
              </div>
              {!child.guardians || child.guardians.length === 0 ? (
                <p className="rounded-md border p-3 text-sm text-muted-foreground">No parent or guardian linked.</p>
              ) : (
                <div className="space-y-2">
                  {child.guardians.map(link => (
                    <div key={link.id} className="rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{guardianName(link.guardian)}</p>
                          <p className="text-xs text-muted-foreground capitalize">{link.relationship}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {link.isPrimary && <Badge variant="outline">Primary</Badge>}
                          {link.canPickup && <Badge variant="secondary">Can pickup</Badge>}
                          {link.emergencyContact && <Badge variant="secondary">Emergency</Badge>}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailField label="Email" value={link.guardian?.email} />
                        <DetailField label="Phone" value={link.guardian?.phone} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GuardianSearchPicker({
  churchId,
  value,
  onChange,
  disabledGuardianIds = [],
}: {
  churchId?: string;
  value: AppUser | null;
  onChange: (user: AppUser | null) => void;
  disabledGuardianIds?: string[];
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);

  const { data, isFetching } = useQuery({
    queryKey: ['guardian-search', churchId, debounced],
    queryFn: () => usersService.getAll({ churchId, role: 'member', search: debounced, limit: 8 }),
    enabled: !!churchId && debounced.trim().length >= 2,
  });

  const members = data?.data ?? [];

  return (
    <div className="space-y-2">
      <Label>Parent / Guardian</Label>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{guardianName(value)}</p>
            <p className="truncate text-xs text-muted-foreground">{value.email}</p>
          </div>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => onChange(null)}>
            Change
          </Button>
        </div>
      ) : (
        <>
          <Input
            value={search}
            disabled={!churchId}
            onChange={event => setSearch(event.target.value)}
            placeholder={churchId ? 'Type at least 2 letters...' : 'Select church first'}
          />
          {debounced.trim().length >= 2 && (
            <div className="max-h-44 overflow-auto rounded-md border">
              {isFetching ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
              ) : members.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">No matching members.</div>
              ) : (
                members.map(member => {
                  const disabled = disabledGuardianIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      disabled={disabled}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        onChange(member);
                        setSearch('');
                      }}
                    >
                      <span className="block font-medium">{guardianName(member)}</span>
                      <span className="block text-xs text-muted-foreground">{member.email}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChildForm({ child, defaultChurchId, onSubmit, isPending, disabledGuardianIds = [], fixedGuardian }: {
  child?: Child | null;
  defaultChurchId?: string;
  onSubmit: (payload: any) => void;
  isPending?: boolean;
  disabledGuardianIds?: string[];
  fixedGuardian?: { id: string; firstName: string; lastName: string; email: string };
}) {
  const initialAge = child ? childAge(child) : null;
  const [churchId, setChurchId] = useState(child?.churchId ?? defaultChurchId ?? '');
  const [firstName, setFirstName] = useState(child?.firstName ?? '');
  const [lastName, setLastName] = useState(child?.lastName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(child?.dateOfBirth ? child.dateOfBirth.split('T')[0] : '');
  const [age, setAge] = useState(initialAge != null ? String(initialAge) : '');
  const [gender, setGender] = useState(child?.gender ?? '');
  const [phone, setPhone] = useState(child?.phone ?? '');
  const [notes, setNotes] = useState(child?.notes ?? '');
  const [status, setStatus] = useState(child?.status ?? 'active');
  const [guardian, setGuardian] = useState<AppUser | { id: string; firstName: string; lastName: string; email: string } | null>(fixedGuardian ?? null);
  const [relationship, setRelationship] = useState('guardian');
  const calculatedAge = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const currentUser = useAuthStore(state => state.user);
  const canEditChurch = currentUser?.roleName !== 'member' && !fixedGuardian;

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll,
    enabled: canEditChurch,
  });

  return (
    <div className="space-y-3">
      {canEditChurch && (
        <div>
          <Label>Church</Label>
          <Select value={churchId} onValueChange={value => { setChurchId(value); setGuardian(null); }}>
            <SelectTrigger><SelectValue placeholder="Select church" /></SelectTrigger>
            <SelectContent>
              {churches.map(church => (
                <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>First Name</Label>
          <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Age</Label>
          <Input
            type="number"
            min="0"
            value={dateOfBirth ? String(calculatedAge ?? '') : age}
            onChange={e => setAge(e.target.value)}
            readOnly={!!dateOfBirth}
          />
        </div>
        <div>
          <Label>Sex</Label>
          <Select value={gender || undefined} onValueChange={value => setGender(value as 'male' | 'female' | 'other')}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Date of Birth</Label>
        <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" />
      </div>
      {child && (
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Notes</Label>
        <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      {fixedGuardian ? (
        <div className="space-y-2">
          <Label>Parent / Guardian</Label>
          <div className="rounded-md border px-3 py-2 text-sm">
            <p className="font-medium">{guardianName(fixedGuardian)}</p>
            <p className="text-xs text-muted-foreground">{fixedGuardian.email}</p>
          </div>
        </div>
      ) : (
        <GuardianSearchPicker
          churchId={child?.churchId ?? churchId}
          value={guardian as AppUser | null}
          onChange={setGuardian}
          disabledGuardianIds={disabledGuardianIds}
        />
      )}
      {guardian && (
        <div>
          <Label>Relationship</Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button
        className="w-full"
        disabled={!firstName || !lastName || (!child && !churchId) || isPending}
        onClick={() => onSubmit({
          churchId,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth || null,
          age: dateOfBirth ? calculatedAge : age ? Number(age) : null,
          gender: gender || null,
          phone: phone || null,
          notes: notes || null,
          ...(guardian ? { guardianId: guardian.id, relationship } : {}),
          ...(child ? { status } : {}),
        })}
      >
        {isPending ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}

function GuardianLinkDialog({ child, open, onOpenChange }: { child: Child | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const [guardian, setGuardian] = useState<AppUser | null>(null);
  const [relationship, setRelationship] = useState('guardian');
  const mutation = useMutation({
    mutationFn: () => childrenService.linkGuardian(child!.id, { guardianId: guardian!.id, relationship, isPrimary: false, canPickup: true }),
    onSuccess: () => {
      toast.success('Guardian linked');
      qc.invalidateQueries({ queryKey: ['children'] });
      setGuardian(null);
      setRelationship('guardian');
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to link guardian'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Link Guardian</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <GuardianSearchPicker
            churchId={child?.churchId}
            value={guardian}
            onChange={setGuardian}
            disabledGuardianIds={child?.guardians?.map(link => link.guardianId) ?? []}
          />
          <div>
            <Label>Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" disabled={!guardian || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Linking...' : 'Link Guardian'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ChildrenPage() {
  const qc = useQueryClient();
  const { hasPermission } = useRole();
  const currentUser = useAuthStore(state => state.user);
  const packageHasUsersManagement = useHasFeature(PACKAGE_FEATURES.USERS_MANAGEMENT);
  const hasChildrenFeature = currentUser?.roleName === 'system_admin' || packageHasUsersManagement;
  const isMember = currentUser?.roleName === 'member';
  const [search, setSearch] = useState('');
  const [churchId, setChurchId] = useState('all');
  const [unlinkedOnly, setUnlinkedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewChild, setViewChild] = useState<Child | null>(null);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [deleteChild, setDeleteChild] = useState<Child | null>(null);
  const [linkChild, setLinkChild] = useState<Child | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<Record<number, Record<string, string>>>({});
  const [importWarnings, setImportWarnings] = useState<Array<{ row: number; childName: string; warning: string }>>([]);
  const [bulkChurchId, setBulkChurchId] = useState('');
  const [unlinkTarget, setUnlinkTarget] = useState<{ child: Child; guardianId: string; guardianName: string } | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const canCreate = hasPermission('children:create');
  const canUpdate = hasPermission('children:update');
  const canDelete = hasPermission('children:delete');
  const canLinkGuardians = canUpdate && !isMember;
  const importValidationSummary = Object.entries(importErrors).flatMap(([rowIndex, rowErrors]) =>
    Object.entries(rowErrors).map(([field, message]) => ({
      row: Number(rowIndex) + 1,
      field: CHILD_IMPORT_FIELD_LABELS[field] ?? field,
      message,
    })),
  );

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: churchesService.getAll,
    enabled: hasChildrenFeature && !isMember,
  });
  const defaultChurchId = isMember ? currentUser?.churchId ?? undefined : churches[0]?.id;
  const fixedGuardian = isMember && currentUser ? {
    id: currentUser.id,
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email,
  } : undefined;

  const queryParams = useMemo(() => ({
    churchId: isMember ? currentUser?.churchId ?? undefined : churchId !== 'all' ? churchId : undefined,
    search: debouncedSearch || undefined,
    unlinked: unlinkedOnly || undefined,
    page,
    limit: PAGE_SIZE,
  }), [churchId, currentUser?.churchId, debouncedSearch, isMember, unlinkedOnly, page]);

  const { data, isLoading } = useQuery({
    queryKey: ['children', queryParams],
    queryFn: () => childrenService.list(queryParams),
    enabled: hasChildrenFeature,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => childrenService.create(payload),
    onSuccess: () => {
      toast.success('Child created');
      qc.invalidateQueries({ queryKey: ['children'] });
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create child'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { guardianId, relationship, ...childPayload } = payload;
      const updated = await childrenService.update(id, childPayload);
      if (guardianId) {
        await childrenService.linkGuardian(id, { guardianId, relationship, isPrimary: false, canPickup: true });
      }
      return updated;
    },
    onSuccess: () => {
      toast.success('Child updated');
      qc.invalidateQueries({ queryKey: ['children'] });
      setEditChild(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update child'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => childrenService.delete(id),
    onSuccess: () => {
      toast.success('Child deleted');
      qc.invalidateQueries({ queryKey: ['children'] });
      setDeleteChild(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete child'),
  });

  const unlinkMutation = useMutation({
    mutationFn: ({ childId, guardianId }: { childId: string; guardianId: string }) => childrenService.unlinkGuardian(childId, guardianId),
    onSuccess: () => {
      toast.success('Guardian unlinked');
      qc.invalidateQueries({ queryKey: ['children'] });
      setUnlinkTarget(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to unlink guardian'),
  });

  const bulkUploadMutation = useMutation({
    mutationFn: (children: any[]) => childrenService.bulkCreate(children),
    onSuccess: (result) => {
      toast.success(`Imported ${result.success} children`);
      if (result.failed > 0) toast.warning(`${result.failed} children failed to import`);
      if (result.dropped) toast.warning(`${result.dropped} rows were dropped because only ${MAX_IMPORT_ROWS} can be uploaded at once`);
      setImportWarnings(result.warnings ?? []);
      if (result.errors?.length) {
        const nextErrors: Record<number, Record<string, string>> = {};
        result.errors.forEach(error => {
          const index = Math.max(error.row - 1, 0);
          const field = error.field || 'firstName';
          nextErrors[index] = { ...(nextErrors[index] || {}), [field]: error.error };
        });
        setImportErrors(nextErrors);
      }
      qc.invalidateQueries({ queryKey: ['children'] });
      if (!result.failed) {
        setUploadOpen(false);
        setImportRows([]);
        setImportErrors({});
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to upload children'),
  });

  const normalizeDate = (value: any) => {
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().split('T')[0];
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    return raw;
  };

  const normalizeBoolean = (value: any, fallback = '') => {
    const raw = String(value ?? '').trim().toLowerCase();
    if (!raw) return fallback;
    if (['true', 'yes', 'y', '1'].includes(raw)) return true;
    if (['false', 'no', 'n', '0'].includes(raw)) return false;
    return fallback;
  };

  const parseImportRows = (rows: any[]) => {
    const mapped = rows
      .filter(row => !String(row.firstName ?? row.FirstName ?? row['First Name'] ?? '').startsWith('#'))
      .map(row => ({
        firstName: String(row.firstName ?? row.FirstName ?? row['First Name'] ?? '').trim(),
        lastName: String(row.lastName ?? row.LastName ?? row['Last Name'] ?? '').trim(),
        phone: String(row.phone ?? row.Phone ?? '').trim(),
        gender: String(row.gender ?? row.Gender ?? '').trim().toLowerCase(),
        dateOfBirth: normalizeDate(row.dateOfBirth ?? row.DateOfBirth ?? row['Date of Birth'] ?? ''),
        age: String(row.age ?? row.Age ?? '').trim(),
        churchId: String(row.churchId ?? row.ChurchId ?? row['Church ID'] ?? '').trim(),
        guardianEmail: String(row.guardianEmail ?? row.GuardianEmail ?? row['Guardian Email'] ?? '').trim(),
        guardianPhone: String(row.guardianPhone ?? row.GuardianPhone ?? row['Guardian Phone'] ?? '').trim(),
        relationship: String(row.relationship ?? row.guardianRelationship ?? row.Relationship ?? row['Guardian Relationship'] ?? '').trim() || 'guardian',
        isPrimary: normalizeBoolean(row.isPrimary ?? row.IsPrimary ?? row['Primary Guardian'], true),
        canPickup: normalizeBoolean(row.canPickup ?? row.CanPickup ?? row['Can Pickup'], true),
        emergencyContact: normalizeBoolean(row.emergencyContact ?? row.EmergencyContact ?? row['Emergency Contact'], false),
        status: String(row.status ?? row.Status ?? '').trim().toLowerCase() || 'active',
        notes: String(row.notes ?? row.Notes ?? '').trim(),
      }))
      .filter(row => !(row.firstName.toLowerCase() === 'first name' && row.lastName.toLowerCase() === 'last name'));
    return mapped.slice(0, MAX_IMPORT_ROWS);
  };

  const validateImportRows = (rows: any[]) => {
    const errors: Record<number, Record<string, string>> = {};
    rows.forEach((row, index) => {
      const rowErrors: Record<string, string> = {};
      if (!row.firstName) rowErrors.firstName = 'Required';
      if (!row.lastName) rowErrors.lastName = 'Required';
      if (!row.dateOfBirth && !row.age) rowErrors.dateOfBirth = 'DOB or age required';
      if (row.gender && !['male', 'female', 'other'].includes(row.gender)) rowErrors.gender = 'Use male, female, or other';
      if (row.status && !['active', 'inactive'].includes(row.status)) rowErrors.status = 'Use active or inactive';
      if (!row.churchId) rowErrors.churchId = 'Select or apply a church';
      if (Object.keys(rowErrors).length > 0) errors[index] = rowErrors;
    });
    return errors;
  };

  const openChildrenImport = (rows: any[], originalCount: number) => {
    const parsedRows = parseImportRows(rows);
    const errors = validateImportRows(parsedRows);
    setImportRows(parsedRows);
    setImportErrors(errors);
    setImportWarnings(originalCount > MAX_IMPORT_ROWS
      ? [{ row: MAX_IMPORT_ROWS + 1, childName: 'Extra rows', warning: `${originalCount - MAX_IMPORT_ROWS} rows were dropped. Upload a maximum of ${MAX_IMPORT_ROWS} at a time.` }]
      : []);
    setUploadOpen(true);
  };

  const handleChildrenImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellText: false, cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: '' });
      openChildrenImport(rows, rows.length);
      event.target.value = '';
      return;
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const headers = (lines[0] ?? '').split(',').map(header => header.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((acc: any, header, index) => {
        acc[header] = String(values[index] ?? '').trim();
        return acc;
      }, {});
    });
    openChildrenImport(rows, rows.length);
    event.target.value = '';
  };

  if (!hasChildrenFeature) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Children</h1>
          <p className="text-sm text-muted-foreground">Manage dependents and guardian links</p>
        </div>
        <FeatureGate feature={PACKAGE_FEATURES.USERS_MANAGEMENT}><></></FeatureGate>
      </div>
    );
  }

  const children = data?.data ?? [];
  const pagination = data?.pagination;
  const totalChildren = data?.summary?.total ?? pagination?.total ?? children.length;
  const maleChildren = data?.summary?.gender?.male ?? 0;
  const femaleChildren = data?.summary?.gender?.female ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Baby className="h-5 w-5 text-accent" /> Children
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage dependents and guardian links</p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap gap-2">
            {!isMember && (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    const headers = ['firstName','lastName','dateOfBirth','age','gender','phone','churchId','guardianEmail','guardianPhone','relationship','isPrimary','canPickup','emergencyContact','status','notes'];
                    const notes = ['First Name','Last Name','YYYY-MM-DD','Optional if DOB is present','male/female/other','Optional','Apply church in preview if blank','Existing guardian email','Existing guardian phone','mother/father/parent/guardian','true/false','true/false','true/false','active/inactive','Optional'];
                    const example = ['William','Mvula','2018-10-10','','male','','','','','guardian','true','true','false','active',''];
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.aoa_to_sheet([headers, notes, example]);
                    ws['!cols'] = headers.map(() => ({ wch: 22 }));
                    XLSX.utils.book_append_sheet(wb, ws, 'Children Template');
                    XLSX.writeFile(wb, 'children-import-template.xlsx');
                  }}
                >
                  Template
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={() => document.getElementById('children-upload')?.click()}>
                  <Upload className="h-4 w-4" /> Upload
                </Button>
                <input id="children-upload" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleChildrenImportFile} />
              </>
            )}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5"><Plus className="h-4 w-4" /> Add Child</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add Child</DialogTitle></DialogHeader>
                <ChildForm
                  defaultChurchId={defaultChurchId}
                  fixedGuardian={fixedGuardian}
                  onSubmit={payload => createMutation.mutate(payload)}
                  isPending={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total children</p>
              <p className="font-heading text-2xl font-bold">{totalChildren}</p>
              <p className="text-xs text-muted-foreground">Within current filters</p>
            </div>
            <div className="rounded-md bg-accent/10 p-3 text-accent">
              <Baby className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Male</p>
              <p className="font-heading text-2xl font-bold">{maleChildren}</p>
              <p className="text-xs text-muted-foreground">Within current filters</p>
            </div>
            <div className="rounded-md bg-blue-500/10 p-3 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Female</p>
              <p className="font-heading text-2xl font-bold">{femaleChildren}</p>
              <p className="text-xs text-muted-foreground">Within current filters</p>
            </div>
            <div className="rounded-md bg-rose-500/10 p-3 text-rose-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search children..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {!isMember && (
          <>
            <Select value={churchId} onValueChange={v => { setChurchId(v); setPage(1); }}>
              <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All churches</SelectItem>
                {churches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <Checkbox checked={unlinkedOnly} onCheckedChange={v => { setUnlinkedOnly(Boolean(v)); setPage(1); }} />
              No guardian
            </label>
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Age</TableHead>
                  <TableHead className="hidden xl:table-cell">DOB</TableHead>
                  <TableHead className="hidden md:table-cell">Sex</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Church</TableHead>
                  <TableHead>Parent / Guardian</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {children.map(child => (
                  <TableRow key={child.id} className="h-9 text-xs sm:text-sm">
                    <TableCell className="font-medium">
                      {childName(child)}
                      <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                        {childAge(child) != null && <span className="text-xs text-muted-foreground">{childAge(child)} yrs</span>}
                        {child.gender && <span className="text-xs text-muted-foreground capitalize">{child.gender}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{childAge(child) != null ? `${childAge(child)} yrs` : '-'}</TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">{formatDate(child.dateOfBirth)}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize text-muted-foreground">{child.gender ?? '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{child.phone ?? '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[180px] truncate text-muted-foreground">{child.church?.name ?? '-'}</TableCell>
                    <TableCell>
                      {!child.guardians || child.guardians.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No guardian</span>
                      ) : (
                        <div className="space-y-1">
                          {child.guardians.slice(0, 2).map(link => (
                            <div key={link.id} className="flex items-center gap-1 text-xs">
                              <span className="max-w-[160px] truncate font-medium">{guardianName(link.guardian)}</span>
                              <span className="text-muted-foreground">({link.relationship})</span>
                              {link.isPrimary && <Badge variant="outline" className="text-[10px]">Primary</Badge>}
                              {canUpdate && (!isMember || link.guardianId === currentUser?.id) && (
                                <button
                                  type="button"
                                  className="ml-1 text-muted-foreground hover:text-destructive"
                                  disabled={unlinkMutation.isPending}
                                  onClick={() => setUnlinkTarget({
                                    child,
                                    guardianId: link.guardianId,
                                    guardianName: guardianName(link.guardian) || 'this guardian',
                                  })}
                                  title="Remove guardian link"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          {child.guardians.length > 2 && (
                            <p className="text-xs text-muted-foreground">+{child.guardians.length - 2} more</p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={child.status === 'active' ? 'default' : 'secondary'} className="text-xs">{child.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {new Date(child.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onSelect={() => setViewChild(child)}>
                              <Info className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {canLinkGuardians && (
                              <DropdownMenuItem onSelect={() => setLinkChild(child)}>
                                <Link2 className="mr-2 h-4 w-4" />
                                Link guardian
                              </DropdownMenuItem>
                            )}
                            {canUpdate && (
                              <DropdownMenuItem onSelect={() => setEditChild(child)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleteChild(child)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {children.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      {canCreate ? 'No children yet. Add your first child.' : 'No children found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Review Children Import ({importRows.length} children)</DialogTitle></DialogHeader>
          {importValidationSummary.length > 0 && (
            <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p className="font-semibold">Fix {importValidationSummary.length} validation issue{importValidationSummary.length === 1 ? '' : 's'} before uploading.</p>
              <div className="mt-1 max-h-24 overflow-auto text-xs">
                {importValidationSummary.map((item, index) => (
                  <p key={`${item.row}-${item.field}-${index}`}>Row {item.row}, {item.field}: {item.message}</p>
                ))}
              </div>
            </div>
          )}
          {importWarnings.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {importWarnings.map((warning, index) => (
                <p key={`${warning.row}-${index}`}>Row {warning.row}, {warning.childName}: {warning.warning}</p>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[1500px] text-sm">
              <thead className="sticky top-0 z-10 bg-background border-b">
                <tr>
                  <th className="p-2 text-left min-w-[130px]">First Name</th>
                  <th className="p-2 text-left min-w-[130px]">Last Name</th>
                  <th className="p-2 text-left min-w-[130px]">DOB</th>
                  <th className="p-2 text-left min-w-[90px]">Age</th>
                  <th className="p-2 text-left min-w-[110px]">Gender</th>
                  <th className="p-2 text-left min-w-[130px]">Phone</th>
                  <th className="p-2 text-left min-w-[220px]">
                    <div>
                      <div>Church</div>
                      <Select value={bulkChurchId} onValueChange={(value) => {
                        setBulkChurchId(value);
                        const nextRows = importRows.map(row => ({ ...row, churchId: value }));
                        setImportRows(nextRows);
                        setImportErrors(validateImportRows(nextRows));
                      }}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Apply to all" /></SelectTrigger>
                        <SelectContent>
                          {churches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </th>
                  <th className="p-2 text-left min-w-[180px]">Guardian Email</th>
                  <th className="p-2 text-left min-w-[150px]">Guardian Phone</th>
                  <th className="p-2 text-left min-w-[130px]">Relationship</th>
                  <th className="p-2 text-left min-w-[110px]">Can Pickup</th>
                  <th className="p-2 text-left min-w-[120px]">Emergency</th>
                  <th className="p-2 text-left min-w-[110px]">Status</th>
                  <th className="p-2 text-left min-w-[200px]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {importRows.map((row, index) => {
                  const errors = importErrors[index] || {};
                  const updateRow = (field: string, value: any) => {
                    const nextRows = [...importRows];
                    nextRows[index] = { ...nextRows[index], [field]: value };
                    setImportRows(nextRows);
                    setImportErrors(validateImportRows(nextRows));
                  };
                  return (
                    <tr key={index} className={Object.keys(errors).length ? 'bg-destructive/10' : ''}>
                      <td className="p-2"><Input value={row.firstName} onChange={e => updateRow('firstName', e.target.value)} className={errors.firstName ? 'border-destructive' : ''} />{errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}</td>
                      <td className="p-2"><Input value={row.lastName} onChange={e => updateRow('lastName', e.target.value)} className={errors.lastName ? 'border-destructive' : ''} />{errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}</td>
                      <td className="p-2"><Input type="date" value={row.dateOfBirth} onChange={e => updateRow('dateOfBirth', e.target.value)} className={errors.dateOfBirth ? 'border-destructive' : ''} />{errors.dateOfBirth && <p className="mt-1 text-xs text-destructive">{errors.dateOfBirth}</p>}</td>
                      <td className="p-2"><Input value={row.age} onChange={e => updateRow('age', e.target.value.replace(/\D/g, ''))} /></td>
                      <td className="p-2"><Input value={row.gender} onChange={e => updateRow('gender', e.target.value.toLowerCase())} className={errors.gender ? 'border-destructive' : ''} />{errors.gender && <p className="mt-1 text-xs text-destructive">{errors.gender}</p>}</td>
                      <td className="p-2"><Input value={row.phone} onChange={e => updateRow('phone', e.target.value)} /></td>
                      <td className="p-2">
                        <Select value={row.churchId || ''} onValueChange={value => updateRow('churchId', value)}>
                          <SelectTrigger className={errors.churchId ? 'border-destructive h-9' : 'h-9'}><SelectValue placeholder="Select church" /></SelectTrigger>
                          <SelectContent>{churches.map(church => <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>)}</SelectContent>
                        </Select>
                        {errors.churchId && <p className="mt-1 text-xs text-destructive">{errors.churchId}</p>}
                      </td>
                      <td className="p-2"><Input value={row.guardianEmail} onChange={e => updateRow('guardianEmail', e.target.value)} /></td>
                      <td className="p-2"><Input value={row.guardianPhone} onChange={e => updateRow('guardianPhone', e.target.value)} /></td>
                      <td className="p-2"><Input value={row.relationship} onChange={e => updateRow('relationship', e.target.value)} /></td>
                      <td className="p-2"><Checkbox checked={Boolean(row.canPickup)} onCheckedChange={value => updateRow('canPickup', Boolean(value))} /></td>
                      <td className="p-2"><Checkbox checked={Boolean(row.emergencyContact)} onCheckedChange={value => updateRow('emergencyContact', Boolean(value))} /></td>
                      <td className="p-2"><Input value={row.status} onChange={e => updateRow('status', e.target.value.toLowerCase())} className={errors.status ? 'border-destructive' : ''} />{errors.status && <p className="mt-1 text-xs text-destructive">{errors.status}</p>}</td>
                      <td className="p-2"><Input value={row.notes} onChange={e => updateRow('notes', e.target.value)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button
              disabled={bulkUploadMutation.isPending || importRows.length === 0}
              onClick={() => {
                const errors = validateImportRows(importRows);
                setImportErrors(errors);
                if (Object.keys(errors).length > 0) {
                  toast.error('Please fix validation errors');
                  return;
                }
                bulkUploadMutation.mutate(importRows);
              }}
              className={Object.keys(importErrors).length === 0 && importRows.length > 0 ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {bulkUploadMutation.isPending ? 'Uploading...' : `Upload ${importRows.length} Children`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ChildDetailsDialog child={viewChild} onOpenChange={open => !open && setViewChild(null)} />

      <Dialog open={!!editChild} onOpenChange={open => !open && setEditChild(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Child</DialogTitle></DialogHeader>
          {editChild && (
            <ChildForm
              child={editChild}
              onSubmit={payload => updateMutation.mutate({ id: editChild.id, payload })}
              isPending={updateMutation.isPending}
              disabledGuardianIds={editChild.guardians?.map(link => link.guardianId) ?? []}
              fixedGuardian={fixedGuardian}
            />
          )}
        </DialogContent>
      </Dialog>

      <GuardianLinkDialog child={linkChild} open={!!linkChild} onOpenChange={open => !open && setLinkChild(null)} />

      <AlertDialog open={!!deleteChild} onOpenChange={open => !open && setDeleteChild(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete child?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {deleteChild ? childName(deleteChild) : 'this child'} and all guardian links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteChild && deleteMutation.mutate(deleteChild.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!unlinkTarget} onOpenChange={open => !open && setUnlinkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove guardian link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {unlinkTarget?.guardianName ?? 'this guardian'} from {unlinkTarget ? childName(unlinkTarget.child) : 'this child'}. The guardian account and child record will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={unlinkMutation.isPending}
              onClick={() => unlinkTarget && unlinkMutation.mutate({
                childId: unlinkTarget.child.id,
                guardianId: unlinkTarget.guardianId,
              })}
            >
              Remove Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
