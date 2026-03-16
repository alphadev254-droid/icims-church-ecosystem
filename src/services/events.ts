import apiClient from '@/lib/api-client';

export interface ChurchEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  time: string;
  location: string;
  type: 'service' | 'meeting' | 'conference' | 'outreach' | 'fellowship';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  attendeeCount: number;
  requiresTicket: boolean;
  isFree: boolean;
  ticketPrice?: number;
  currency?: 'MWK' | 'KSH';
  totalTickets?: number;
  ticketsSold: number;
  ticketSalesCutoff?: string;
  allowPublicTicketing: boolean;
  contactEmail?: string;
  contactPhone?: string;
  imageUrl?: string;
  churchId: string;
  churchName?: string;
  maxAttendees?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  userHasTicket?: boolean;
  userTicketId?: string;
  userTicketNumber?: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  date: string;
  endDate: string;
  time: string;
  location: string;
  type: ChurchEvent['type'];
  status?: ChurchEvent['status'];
  attendeeCount?: number;
  requiresTicket?: boolean;
  isFree?: boolean;
  ticketPrice?: number;
  currency?: 'MWK' | 'KSH';
  totalTickets?: number;
  imageUrl?: string;
  churchId: string;
}

export type UpdateEventDto = Partial<CreateEventDto>;

export const eventsService = {
  getAll: async (churchId?: string, params?: { startDate?: string; endDate?: string }): Promise<ChurchEvent[]> => {
    const queryParams: any = {};
    if (churchId) queryParams.churchId = churchId;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    const { data } = await apiClient.get('/events', { params: queryParams });
    return data.data;
  },
  getOne: async (id: string): Promise<ChurchEvent> => {
    const { data } = await apiClient.get(`/events/${id}`);
    return data.data;
  },
  create: async (dto: CreateEventDto): Promise<ChurchEvent> => {
    const { data } = await apiClient.post('/events', dto);
    return data.data;
  },
  update: async (id: string, dto: UpdateEventDto): Promise<ChurchEvent> => {
    const { data } = await apiClient.put(`/events/${id}`, dto);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },
  bookTicket: async (dto: { eventId: string; memberId?: string; paymentMethod?: string; reference?: string }) => {
    const { data } = await apiClient.post('/events/book-ticket', dto);
    return data.data;
  },
  getMyTickets: async () => {
    const { data } = await apiClient.get('/events/my-tickets');
    return data.data;
  },
  getEventTickets: async (eventId: string) => {
    const { data } = await apiClient.get(`/events/${eventId}/tickets`);
    return data.data;
  },
  getTicketTransaction: async (ticketId: string) => {
    const { data } = await apiClient.get(`/events/tickets/${ticketId}/transaction`);
    return data.data;
  },
  createManualTicket: async (eventId: string, dto: { memberId: string; paymentMethod: string; reference?: string; amount: number; currency: string; transactionStatus: string; ticketStatus: string; notes?: string }) => {
    const { data } = await apiClient.post(`/events/${eventId}/manual-ticket`, dto);
    return data.data;
  },
  getUnallocatedTransactions: async (eventId: string) => {
    const { data } = await apiClient.get(`/events/${eventId}/unallocated-transactions`);
    return data.data;
  },
  markAttendance: async (ticketId: string, attended: boolean) => {
    const { data } = await apiClient.patch(`/events/tickets/${ticketId}/attendance`, { attended });
    return data.data;
  },
  downloadTicket: async (ticketId: string, ticketNumber: string) => {
    const response = await apiClient.get(`/events/tickets/${ticketId}/download`, {
      responseType: 'blob',
    });
    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticketNumber}.pdf`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  },
  getPublicEvent: async (id: string): Promise<ChurchEvent> => {
    const { data } = await apiClient.get(`/events/${id}/public`);
    return data.data;
  },
  purchaseGuestTicket: async (dto: {
    eventId: string;
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    quantity?: number;
  }): Promise<{
    isFree?: boolean;
    ticketNumbers?: string[];
    guestEmail?: string;
    authorization_url?: string;
    reference?: string;
    baseAmount?: number;
    convenienceFee?: number;
    systemFeeAmount?: number;
    totalAmount?: number;
    currency?: string;
  }> => {
    const { data } = await apiClient.post('/payments/guest-ticket', dto);
    return data.data;
  },
  calculateGuestTicketFees: async (eventId: string): Promise<{
    currency: string;
    baseAmount: number;
    convenienceFee: number;
    systemFeeAmount: number;
    transactionCost: number;
    totalAmount: number;
  }> => {
    const { data } = await apiClient.get('/payments/guest-ticket/fees', { params: { eventId } });
    return data.data;
  },
  getTransactionByReference: async (reference: string): Promise<{
    type: string;
    isGuest: boolean;
    guestName: string | null;
    guestEmail: string | null;
    baseAmount: number | null;
    currency: string | null;
    reference: string;
    status: string;
    paidAt: string | null;
    eventTitle: string | null;
    tickets: string[];
  }> => {
    const { data } = await apiClient.get(`/payments/transaction/${reference}`);
    return data.data;
  },
};
