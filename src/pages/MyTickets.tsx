import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { eventsService } from '@/services/events';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function MyTicketsPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: eventsService.getMyTickets,
  });

  const { data: transactionData, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ['ticket-transaction', expandedTicket],
    queryFn: () => eventsService.getTicketTransaction(expandedTicket!),
    enabled: !!expandedTicket,
  });

  const filteredTickets = eventId 
    ? tickets.filter((t: any) => t.eventId === eventId)
    : tickets;

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'used': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const toggleExpand = (ticketId: string) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">My Tickets</h1>
        <p className="text-sm text-muted-foreground">{filteredTickets.length} ticket(s)</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Ticket #</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchased</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket: any) => (
                <React.Fragment key={ticket.id}>
                  <TableRow className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={() => ticket.transactionId && toggleExpand(ticket.id)}>
                      {ticket.transactionId && (
                        expandedTicket === ticket.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ticket.ticketNumber}</TableCell>
                    <TableCell className="font-medium">{ticket.event.title}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(ticket.event.date).toLocaleDateString()} • {ticket.event.time}
                    </TableCell>
                    <TableCell className="text-sm">{ticket.event.location}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(ticket.status) as any}>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                  {expandedTicket === ticket.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30">
                        {isLoadingTransaction ? (
                          <div className="text-center py-4">Loading transaction details...</div>
                        ) : transactionData ? (
                          <div className="space-y-4 p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {transactionData.baseAmount !== undefined && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Ticket Price</div>
                                  <div className="font-medium">{transactionData.currency} {transactionData.baseAmount?.toFixed(2)}</div>
                                </div>
                              )}
                              {transactionData.convenienceFee !== undefined && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Convenience Fee</div>
                                  <div>{transactionData.currency} {transactionData.convenienceFee?.toFixed(2)}</div>
                                </div>
                              )}
                              {transactionData.taxAmount !== undefined && transactionData.taxAmount > 0 && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Tax</div>
                                  <div>{transactionData.currency} {transactionData.taxAmount?.toFixed(2)}</div>
                                </div>
                              )}
                              {transactionData.totalAmount !== undefined && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Total Amount</div>
                                  <div className="font-semibold">{transactionData.currency} {transactionData.totalAmount?.toFixed(2)}</div>
                                </div>
                              )}
                              <div>
                                <div className="text-xs text-muted-foreground">Payment Method</div>
                                <div className="capitalize">{transactionData.paymentMethod?.replace('_', ' ')}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Status</div>
                                <div className="capitalize">{transactionData.status}</div>
                              </div>
                              {transactionData.reference && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Reference</div>
                                  <div className="font-mono text-xs">{transactionData.reference}</div>
                                </div>
                              )}
                              {transactionData.paidAt && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Paid At</div>
                                  <div className="text-sm">{new Date(transactionData.paidAt).toLocaleString()}</div>
                                </div>
                              )}
                              {transactionData.channel && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Channel</div>
                                  <div className="capitalize">{transactionData.channel}</div>
                                </div>
                              )}
                              {transactionData.gateway && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Gateway</div>
                                  <div className="capitalize">{transactionData.gateway}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">No transaction details</div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tickets found</p>
        </div>
      )}
    </div>
  );
}
