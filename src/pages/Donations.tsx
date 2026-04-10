import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { givingService } from '@/services/giving';
import { usersService } from '@/services/users';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ChevronDown, ChevronRight, PlusCircle, Search, X } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { STALE_TIME } from '@/lib/query-config';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';

// ─── Member search dropdown ───────────────────────────────────────────────────

function MemberSearchDropdown({
  value,
  onChange,
}: {
  value: { id: string; label: string } | null;
  onChange: (v: { id: string; label: string } | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ['member-search', debouncedQuery],
    queryFn: () => usersService.getAll({ search: debouncedQuery || undefined, role: 'member', limit: 20 }),
    enabled: open,
    staleTime: 0,
  });

  const members = data?.data ?? [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm bg-muted/40">
        <span className="flex-1">{value.label}</span>
        <button type="button" onClick={() => { onChange(null); setQuery(''); }} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search by name or email..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto">
          {isFetching ? (
            <div className="px-3 py-4 text-xs text-center text-muted-foreground">Searching...</div>
          ) : members.length === 0 ? (
            <div className="px-3 py-4 text-xs text-center text-muted-foreground">No members found</div>
          ) : (
            members.map((m: any) => (
              <button
                key={m.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex flex-col"
                onClick={() => {
                  onChange({ id: m.id, label: `${m.firstName} ${m.lastName} (${m.email})` });
                  setOpen(false);
                  setQuery('');
                }}
              >
                <span className="font-medium">{m.firstName} {m.lastName}</span>
                <span className="text-xs text-muted-foreground">{m.email}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Cash donation dialog ─────────────────────────────────────────────────────

type DonorType = 'member' | 'guest' | 'anonymous';

function CashDonationDialog({
  open,
  onOpenChange,
  campaignId,
  defaultCurrency,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaignId: string;
  defaultCurrency: string;
}) {
  const qc = useQueryClient();
  const [donorType, setDonorType] = useState<DonorType>('member');
  const [member, setMember] = useState<{ id: string; label: string } | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setDonorType('member'); setMember(null);
    setGuestName(''); setGuestEmail(''); setGuestPhone('');
    setAmount(''); setReference(''); setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const mutation = useMutation({
    mutationFn: () => givingService.recordCashDonation({
      campaignId,
      donorType,
      memberId: donorType === 'member' ? member!.id : undefined,
      guestName: donorType === 'guest' ? guestName : undefined,
      guestEmail: donorType === 'guest' ? (guestEmail || undefined) : undefined,
      guestPhone: donorType === 'guest' ? (guestPhone || undefined) : undefined,
      amount: parseFloat(amount),
      currency,
      date,
      reference: reference || undefined,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      toast.success('Cash donation recorded');
      qc.invalidateQueries({ queryKey: ['donations', campaignId] });
      onOpenChange(false);
      reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record donation'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (donorType === 'member' && !member) { toast.error('Please select a member'); return; }
    if (donorType === 'guest' && !guestName.trim()) { toast.error('Guest name is required'); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    mutation.mutate();
  };

  const DONOR_TYPES: { value: DonorType; label: string; desc: string }[] = [
    { value: 'member', label: 'Member', desc: 'Registered church member' },
    { value: 'guest', label: 'Guest', desc: 'Known person, not a member' },
    { value: 'anonymous', label: 'Anonymous', desc: 'Identity not revealed' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Record Cash Donation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">

          {/* Donor type toggle */}
          <div className="space-y-1.5">
            <Label>Donor Type</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {DONOR_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { setDonorType(t.value); setMember(null); }}
                  className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    donorType === t.value
                      ? 'border-accent bg-accent/10 text-accent font-medium'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-muted-foreground mt-0.5 leading-tight">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Member search */}
          {donorType === 'member' && (
            <div className="space-y-1.5">
              <Label>Member <span className="text-destructive">*</span></Label>
              <MemberSearchDropdown value={member} onChange={setMember} />
            </div>
          )}

          {/* Guest fields */}
          {donorType === 'guest' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. John Banda" value={guestName} onChange={e => setGuestName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input type="email" placeholder="john@example.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input placeholder="+265 ..." value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Anonymous — no extra fields, just a note */}
          {donorType === 'anonymous' && (
            <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
              No donor details will be stored. The donation will appear as Anonymous.
            </p>
          )}

          {/* Amount + currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" step="any" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={currency} onChange={e => setCurrency(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Date <span className="text-destructive">*</span></Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Reference <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="e.g. receipt #001" value={reference} onChange={e => setReference(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea rows={2} placeholder="Any additional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {mutation.isPending ? 'Saving...' : 'Record Donation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DonationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = searchParams.get('campaignId');
  const [expandedDonation, setExpandedDonation] = useState<string | null>(null);
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const currentUser = useAuthStore(s => s.user);
  const { hasPermission } = useRole();
  const canCreate = hasPermission('donations:create') && currentUser?.roleName !== 'member';

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['donations', campaignId],
    queryFn: () => givingService.getDonations(campaignId || undefined),
    staleTime: STALE_TIME.DEFAULT,
  });

  // Grab campaign currency from first donation, fallback to MWK
  const defaultCurrency = (donations[0] as any)?.currency ?? 'MWK';

  const { data: transactionData, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ['donation-transaction', expandedDonation],
    queryFn: () => givingService.getDonationTransaction(expandedDonation!),
    enabled: !!expandedDonation,
    staleTime: STALE_TIME.DEFAULT,
  });

  const handleToggleExpand = (donationId: string) => {
    setExpandedDonation(expandedDonation === donationId ? null : donationId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/dashboard/giving')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold">Donations/Giving</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{donations.length} total donations</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {canCreate && campaignId && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setCashDialogOpen(true)}
            >
              <PlusCircle className="h-3.5 w-3.5" /> Record Cash
            </Button>
          )}
          <ExportImportButtons
          data={donations.map((d: any) => ({
            donor: d.isAnonymous ? 'Anonymous' : (d.isGuest ? d.guestName : (d.donorName || `${d.user?.firstName} ${d.user?.lastName}`)),
            email: d.isAnonymous ? '' : (d.isGuest ? d.guestEmail : (d.donorEmail || d.user?.email || '')),
            type: d.isAnonymous ? 'Anonymous' : d.isGuest ? 'Guest' : 'Member',
            campaign: d.campaign?.name || '',
            church: d.church?.name || '',
            category: d.campaign?.category || '',
            amount: d.amount,
            currency: d.currency,
            status: d.status,
            date: new Date(d.createdAt).toLocaleDateString(),
          }))}
          filename="donations"
          headers={[
            { label: 'Donor', key: 'donor' },
            { label: 'Email', key: 'email' },
            { label: 'Type', key: 'type' },
            { label: 'Campaign', key: 'campaign' },
            { label: 'Church', key: 'church' },
            { label: 'Category', key: 'category' },
            { label: 'Amount', key: 'amount' },
            { label: 'Currency', key: 'currency' },
            { label: 'Status', key: 'status' },
            { label: 'Date', key: 'date' },
          ]}
          pdfTitle="Donations Report"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs sm:text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">Donor</th>
                <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">Email</th>
                <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">Type</th>
                <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">Campaign</th>
                <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">Church</th>
                <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">Amount</th>
                <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">Status</th>
                <th className="text-left px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">Date</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation: any) => (
                <React.Fragment key={donation.id}>
                  <tr className="border-t hover:bg-muted/50">
                    <td className="px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
                      {donation.isAnonymous ? 'Anonymous' : (donation.isGuest ? donation.guestName : (donation.donorName || `${donation.user?.firstName} ${donation.user?.lastName}`))}
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {donation.isAnonymous ? '-' : (donation.isGuest ? donation.guestEmail : (donation.donorEmail || donation.user?.email || '-'))}
                    </td>
                    <td className="px-3 py-2">
                      {donation.isAnonymous
                        ? <Badge variant="outline" className="text-xs px-1.5 py-0">Anonymous</Badge>
                        : donation.isGuest
                        ? <Badge variant="outline" className="text-xs px-1.5 py-0 text-blue-500 border-blue-300">Guest</Badge>
                        : <Badge variant="outline" className="text-xs px-1.5 py-0">Member</Badge>
                      }
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs sm:text-sm font-medium whitespace-nowrap">{donation.campaign?.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{donation.campaign?.category}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs sm:text-sm whitespace-nowrap">{donation.church?.name || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap">
                      {donation.currency} {donation.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={donation.status === 'completed' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                        {donation.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleToggleExpand(donation.id)} className="p-1 hover:bg-muted rounded">
                        {expandedDonation === donation.id ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedDonation === donation.id && (
                    <tr className="border-t bg-muted/30">
                      <td colSpan={9} className="px-3 py-3">
                        {isLoadingTransaction ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                          </div>
                        ) : transactionData ? (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-xs sm:text-sm">Transaction Details</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm">
                              {transactionData.gateway && (
                                <div>
                                  <div className="text-muted-foreground">Gateway</div>
                                  <div className="font-medium capitalize">{transactionData.gateway}</div>
                                </div>
                              )}
                              {transactionData.baseAmount !== undefined && (
                                <div>
                                  <div className="text-muted-foreground">Base Amount</div>
                                  <div className="font-medium">{transactionData.currency} {transactionData.baseAmount?.toLocaleString()}</div>
                                </div>
                              )}
                              {(transactionData.convenienceFee !== undefined || transactionData.systemFeeAmount !== undefined) && (
                                <div>
                                  <div className="text-muted-foreground">Transaction Cost</div>
                                  <div className="font-medium">{transactionData.currency} {((transactionData.convenienceFee ?? 0) + (transactionData.systemFeeAmount ?? 0)).toLocaleString()}</div>
                                </div>
                              )}
                              {transactionData.totalAmount !== undefined && (
                                <div>
                                  <div className="text-muted-foreground">Total Amount</div>
                                  <div className="font-medium">{transactionData.currency} {transactionData.totalAmount?.toLocaleString()}</div>
                                </div>
                              )}
                              <div>
                                <div className="text-muted-foreground">Payment Method</div>
                                <div className="font-medium capitalize">{transactionData.paymentMethod}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Reference</div>
                                <div className="font-medium break-all">{transactionData.reference}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Status</div>
                                <Badge variant={transactionData.status === 'completed' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                                  {transactionData.status}
                                </Badge>
                              </div>
                              {transactionData.channel && (
                                <div>
                                  <div className="text-muted-foreground">Channel</div>
                                  <div className="font-medium capitalize">{transactionData.channel}</div>
                                </div>
                              )}
                              {transactionData.paidAt && (
                                <div>
                                  <div className="text-muted-foreground">Paid At</div>
                                  <div className="font-medium">{new Date(transactionData.paidAt).toLocaleString()}</div>
                                </div>
                              )}
                              {transactionData.customerEmail && (
                                <div>
                                  <div className="text-muted-foreground">Customer Email</div>
                                  <div className="font-medium break-all">{transactionData.customerEmail}</div>
                                </div>
                              )}
                              {transactionData.subaccountName && (
                                <div>
                                  <div className="text-muted-foreground">Subaccount</div>
                                  <div className="font-medium">{transactionData.subaccountName}</div>
                                </div>
                              )}
                            </div>
                            {donation.notes && (
                              <div>
                                <div className="text-muted-foreground text-xs">Notes</div>
                                <div className="text-xs">{donation.notes}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">No transaction details available</div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {donations.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-muted-foreground">No donations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {canCreate && campaignId && (
        <CashDonationDialog
          open={cashDialogOpen}
          onOpenChange={setCashDialogOpen}
          campaignId={campaignId}
          defaultCurrency={defaultCurrency}
        />
      )}
    </div>
  );
}
