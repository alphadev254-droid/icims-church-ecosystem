import { useState } from 'react';
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { givingService } from '@/services/giving';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { ExportImportButtons } from '@/components/ExportImportButtons';
import { STALE_TIME } from '@/lib/query-config';

export default function DonationsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignId = searchParams.get('campaignId');
  const [expandedDonation, setExpandedDonation] = useState<string | null>(null);

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['donations', campaignId],
    queryFn: () => givingService.getDonations(campaignId || undefined),
    staleTime: STALE_TIME.DEFAULT,
  });

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
    </div>
  );
}
