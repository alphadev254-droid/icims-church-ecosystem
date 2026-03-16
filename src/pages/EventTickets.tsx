import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { eventsService } from '@/services/events';
import { usersService } from '@/services/users';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';

const ticketSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  ticketStatus: z.enum(['confirmed', 'pending', 'cancelled', 'used']),
  useExistingTransaction: z.boolean().optional(),
  existingTransactionId: z.string().optional(),
  amount: z.number().optional(),
  currency: z.enum(['MWK', 'KSH']).optional(),
  transactionStatus: z.enum(['pending', 'completed', 'failed']).optional(),
  paymentMethod: z.enum(['cash', 'mobile_money', 'card', 'bank_transfer']).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export default function EventTicketsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = useRole();
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const { data: transactionData, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ['ticket-transaction', expandedTicket],
    queryFn: () => eventsService.getTicketTransaction(expandedTicket!),
    enabled: !!expandedTicket,
  });

  const handleToggleExpand = (ticketId: string) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };
  
  const { register, handleSubmit, setValue, watch, reset } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { 
      ticketStatus: 'confirmed' as const,
      useExistingTransaction: false,
      amount: 0,
      currency: 'MWK' as const,
      transactionStatus: 'completed' as const,
      paymentMethod: 'cash' as const,
    },
  });

  const useExistingTransaction = watch('useExistingTransaction');

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: usersService.getMembers,
  });

  const { data: unallocatedTransactions = [] } = useQuery({
    queryKey: ['unallocated-transactions', id],
    queryFn: () => eventsService.getUnallocatedTransactions(id!),
    enabled: !!id,
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['event-tickets', id],
    queryFn: () => eventsService.getEventTickets(id!),
    enabled: !!id,
  });

  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsService.getOne(id!),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = data.useExistingTransaction
        ? { 
            eventId: id!,
            memberId: data.memberId, 
            ticketStatus: data.ticketStatus, 
            useExistingTransaction: true,
            existingTransactionId: data.existingTransactionId 
          }
        : { 
            eventId: id!,
            memberId: data.memberId, 
            ticketStatus: data.ticketStatus, 
            amount: data.amount || 0, 
            currency: data.currency || 'MWK', 
            transactionStatus: data.transactionStatus || 'completed', 
            paymentMethod: data.paymentMethod || 'cash', 
            reference: data.reference, 
            notes: data.notes 
          };
      console.log('Sending payload:', payload);
      return eventsService.createManualTicket(id!, payload);
    },
    onSuccess: (newTicket) => {
      toast.success('Ticket created successfully');
      const ticketForList = { 
        ...newTicket, 
        transaction: newTicket.transaction ? {
          amount: newTicket.transaction.amount,
          currency: newTicket.transaction.currency,
          paymentMethod: newTicket.transaction.paymentMethod
        } : null
      };
      qc.setQueryData(['event-tickets', id], (old: any) => old ? [ticketForList, ...old] : [ticketForList]);
      qc.invalidateQueries({ queryKey: ['event', id] });
      setCreateOpen(false);
      reset();
    },
    onError: (err: any) => {
      console.error('Error creating ticket:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    },
  });

  const canCreate = hasPermission('tickets:create');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/events')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold">Event Tickets</h1>
            {event && <p className="text-xs sm:text-sm text-muted-foreground">{event.title} - {tickets.length} tickets</p>}
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <ExportImportButtons
            data={tickets.map((t: any) => ({
              ticketNumber: t.ticketNumber,
              attendee: t.isGuest ? (t.guestName || 'Guest') : `${t.user?.firstName} ${t.user?.lastName}`,
              email: t.isGuest ? (t.guestEmail || '') : '',
              type: t.isGuest ? 'Guest' : 'Member',
              status: t.status,
              amount: t.transaction?.amount || 0,
              currency: t.transaction?.currency || '',
              paymentMethod: t.transaction?.paymentMethod || '',
              date: new Date(t.createdAt).toLocaleDateString(),
            }))}
            filename={`event-tickets-${event?.title || 'export'}`}
            headers={[
              { label: 'Ticket Number', key: 'ticketNumber' },
              { label: 'Attendee', key: 'attendee' },
              { label: 'Email', key: 'email' },
              { label: 'Type', key: 'type' },
              { label: 'Status', key: 'status' },
              { label: 'Amount', key: 'amount' },
              { label: 'Currency', key: 'currency' },
              { label: 'Payment Method', key: 'paymentMethod' },
              { label: 'Date', key: 'date' },
            ]}
            pdfTitle={`Event Tickets - ${event?.title || 'Report'}`}
          />
          {canCreate && event?.requiresTicket && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-8 text-xs sm:h-9 sm:text-sm">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-sm sm:text-base">Create Manual Ticket</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(data => createMutation.mutate(data))} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs sm:text-sm">Member *</Label>
                    <Select onValueChange={v => { setValue('memberId', v); }}>
                      <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="Select member" /></SelectTrigger>
                      <SelectContent>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.firstName} {m.lastName} {m.memberId ? `(${m.memberId})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="checkbox" 
                        id="useExisting" 
                        {...register('useExistingTransaction')} 
                        className="h-4 w-4" 
                      />
                      <Label htmlFor="useExisting" className="cursor-pointer text-xs sm:text-sm">Use Existing Transaction</Label>
                    </div>
                  </div>

                  {useExistingTransaction ? (
                    <div className="col-span-2">
                      <Label className="text-xs sm:text-sm">Select Transaction *</Label>
                      <Select onValueChange={v => setValue('existingTransactionId', v)}>
                        <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue placeholder="Select unallocated transaction" /></SelectTrigger>
                        <SelectContent>
                          {unallocatedTransactions.map((t: any) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.reference || t.id} - {t.currency} {t.amount} ({t.user?.firstName} {t.user?.lastName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                  <div>
                    <Label className="text-xs sm:text-sm">Ticket Status *</Label>
                    <Select defaultValue="confirmed" onValueChange={v => setValue('ticketStatus', v as any)}>
                      <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm">Amount *</Label>
                    <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="h-8 text-xs sm:h-10 sm:text-sm" />
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm">Currency *</Label>
                    <Select defaultValue="MWK" onValueChange={v => setValue('currency', v as any)}>
                      <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MWK">MWK</SelectItem>
                        <SelectItem value="KSH">KSH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm">Transaction Status *</Label>
                    <Select defaultValue="completed" onValueChange={v => setValue('transactionStatus', v as any)}>
                      <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm">Payment Method *</Label>
                    <Select defaultValue="cash" onValueChange={v => setValue('paymentMethod', v as any)}>
                      <SelectTrigger className="h-8 text-xs sm:h-10 sm:text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs sm:text-sm">Reference (Optional)</Label>
                    <Input {...register('reference')} placeholder="Leave empty to auto-generate" className="h-8 text-xs sm:h-10 sm:text-sm" />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs sm:text-sm">Notes (Optional)</Label>
                    <Textarea {...register('notes')} placeholder="Additional notes" rows={3} className="text-xs sm:text-sm" />
                  </div>
                    </>
                  )}
                </div>
                
                <Button type="submit" disabled={createMutation.isPending} className="w-full h-8 text-xs sm:h-10 sm:text-sm">
                  {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full min-w-[700px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-xs sm:text-sm font-medium">Ticket #</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium">Attendee</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium">Type</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium">Status</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium">Amount</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium">Payment</th>
                <th className="text-left p-3 text-xs sm:text-sm font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket: any) => (
                <React.Fragment key={ticket.id}>
                  <tr className="border-t hover:bg-muted/50">
                    <td className="p-3 text-xs sm:text-sm">
                      <button onClick={() => handleToggleExpand(ticket.id)} className="flex items-center gap-1">
                        {expandedTicket === ticket.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <span className="font-mono">{ticket.ticketNumber}</span>
                      </button>
                    </td>
                    <td className="p-3 text-xs sm:text-sm whitespace-nowrap">
                      {ticket.isGuest ? (ticket.guestName || 'Guest') : `${ticket.user?.firstName} ${ticket.user?.lastName}`}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {ticket.isGuest
                        ? <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">Guest</span>
                        : <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">Member</span>
                      }
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        ticket.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'used' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs sm:text-sm whitespace-nowrap">
                      {ticket.transaction ? `${ticket.transaction.currency} ${ticket.transaction.baseAmount ?? ticket.transaction.amount}` : event?.isFree ? 'Free' : '-'}
                    </td>
                    <td className="p-3 text-xs sm:text-sm capitalize whitespace-nowrap">{ticket.transaction?.paymentMethod?.replace('_', ' ') || '-'}</td>
                    <td className="p-3 text-xs sm:text-sm whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  </tr>
                  {expandedTicket === ticket.id && (
                    <tr key={`${ticket.id}-details`} className="border-t bg-muted/30">
                      <td colSpan={6} className="p-4">
                        {isLoadingTransaction ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading transaction details...</span>
                          </div>
                        ) : transactionData ? (
                          <div className="space-y-2 text-sm">
                            <h4 className="font-semibold">Transaction Details</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {transactionData.gateway && <div><span className="font-medium">Gateway:</span> <span className="capitalize">{transactionData.gateway}</span></div>}
                              {transactionData.baseAmount && <div><span className="font-medium">Base Amount:</span> {transactionData.currency} {transactionData.baseAmount}</div>}
                              {(transactionData.convenienceFee || transactionData.systemFeeAmount) && <div><span className="font-medium">Transaction Cost:</span> {transactionData.currency} {((transactionData.convenienceFee ?? 0) + (transactionData.systemFeeAmount ?? 0)).toLocaleString()}</div>}
                              {transactionData.totalAmount && <div><span className="font-medium">Total Amount:</span> {transactionData.currency} {transactionData.totalAmount}</div>}
                              <div><span className="font-medium">Status:</span> <span className="capitalize">{transactionData.status}</span></div>
                              <div><span className="font-medium">Payment Method:</span> <span className="capitalize">{transactionData.paymentMethod?.replace('_', ' ')}</span></div>
                              {transactionData.reference && <div><span className="font-medium">Reference:</span> <span className="font-mono text-xs">{transactionData.reference}</span></div>}
                              {transactionData.type && <div><span className="font-medium">Type:</span> <span className="capitalize">{transactionData.type?.replace('_', ' ')}</span></div>}
                              {transactionData.channel && <div><span className="font-medium">Channel:</span> <span className="capitalize">{transactionData.channel}</span></div>}
                              {transactionData.paidAt && <div><span className="font-medium">Paid At:</span> {new Date(transactionData.paidAt).toLocaleString()}</div>}
                              {transactionData.subaccountName && <div><span className="font-medium">Subaccount:</span> {transactionData.subaccountName}</div>}
                              {transactionData.customerEmail && <div><span className="font-medium">Email:</span> {transactionData.customerEmail}</div>}
                              {transactionData.customerPhone && <div><span className="font-medium">Phone:</span> {transactionData.customerPhone}</div>}
                              {transactionData.isManual !== undefined && <div><span className="font-medium">Manual:</span> {transactionData.isManual ? 'Yes' : 'No'}</div>}
                              {transactionData.createdAt && <div><span className="font-medium">Created:</span> {new Date(transactionData.createdAt).toLocaleString()}</div>}
                              {transactionData.notes && (
                                <div className="col-span-2 md:col-span-3"><span className="font-medium">Notes:</span> {transactionData.notes}</div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {tickets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No tickets found for this event.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
