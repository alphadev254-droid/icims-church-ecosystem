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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/giving')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">Donations/Giving</h1>
            <p className="text-sm text-muted-foreground">{donations.length} total donations</p>
          </div>
        </div>
        <ExportImportButtons
          data={donations.map((d: any) => ({
            donor: d.isAnonymous ? 'Anonymous' : (d.donorName || `${d.user?.firstName} ${d.user?.lastName}`),
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
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Donor</th>
                <th className="text-left p-3 text-sm font-medium">Campaign</th>
                <th className="text-left p-3 text-sm font-medium">Church</th>
                <th className="text-left p-3 text-sm font-medium">Amount</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Date</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation: any) => (
                <React.Fragment key={donation.id}>
                  <tr className="border-t hover:bg-muted/50">
                    <td className="p-3">
                      {donation.isAnonymous ? (
                        <span className="text-muted-foreground">Anonymous</span>
                      ) : (
                        <div>
                          <div className="font-medium">
                            {donation.donorName || `${donation.user?.firstName} ${donation.user?.lastName}`}
                          </div>
                          {donation.donorEmail && (
                            <div className="text-xs text-muted-foreground">{donation.donorEmail}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{donation.campaign?.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{donation.campaign?.category}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{donation.church?.name || 'N/A'}</div>
                    </td>
                    <td className="p-3 font-medium">
                      {donation.currency} {donation.amount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge variant={donation.status === 'completed' ? 'default' : 'secondary'}>
                        {donation.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleExpand(donation.id)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        {expandedDonation === donation.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedDonation === donation.id && (
                    <tr className="border-t bg-muted/30">
                      <td colSpan={7} className="p-4">
                        {isLoadingTransaction ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                          </div>
                        ) : transactionData ? (
                          <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Transaction Details</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {transactionData.gateway && (
                                <div>
                                  <div className="text-muted-foreground">Gateway</div>
                                  <div className="font-medium capitalize">{transactionData.gateway}</div>
                                </div>
                              )}
                              {transactionData.baseAmount !== undefined && (
                                <div>
                                  <div className="text-muted-foreground">Base Amount</div>
                                  <div className="font-medium">
                                    {transactionData.currency} {transactionData.baseAmount?.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {transactionData.convenienceFee !== undefined && (
                                <div>
                                  <div className="text-muted-foreground">Transaction Cost</div>
                                  <div className="font-medium">
                                    {transactionData.currency} {transactionData.convenienceFee?.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {transactionData.taxAmount !== undefined && (
                                <div>
                                  <div className="text-muted-foreground">Tax</div>
                                  <div className="font-medium">
                                    {transactionData.currency} {transactionData.taxAmount?.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {transactionData.totalAmount !== undefined && (
                                <div>
                                  <div className="text-muted-foreground">Total Amount</div>
                                  <div className="font-medium">
                                    {transactionData.currency} {transactionData.totalAmount?.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="text-muted-foreground">Payment Method</div>
                                <div className="font-medium capitalize">{transactionData.paymentMethod}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Reference</div>
                                <div className="font-medium text-xs break-all">{transactionData.reference}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Status</div>
                                <Badge variant={transactionData.status === 'completed' ? 'default' : 'secondary'}>
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
                                  <div className="font-medium text-xs">
                                    {new Date(transactionData.paidAt).toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {transactionData.customerEmail && (
                                <div>
                                  <div className="text-muted-foreground">Customer Email</div>
                                  <div className="font-medium text-xs">{transactionData.customerEmail}</div>
                                </div>
                              )}
                              {transactionData.subaccountName && (
                                <div>
                                  <div className="text-muted-foreground">Subaccount</div>
                                  <div className="font-medium text-xs">{transactionData.subaccountName}</div>
                                </div>
                              )}
                            </div>
                            {donation.notes && (
                              <div>
                                <div className="text-muted-foreground text-sm">Notes</div>
                                <div className="text-sm">{donation.notes}</div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No transaction details available</div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {donations.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No donations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
