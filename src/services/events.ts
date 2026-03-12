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
  imageUrl?: string;
  churchId: string;
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
  getAll: async (churchId?: string): Promise<ChurchEvent[]> => {
    const params = churchId ? { churchId } : {};
    const { data } = await apiClient.get('/events', { params });
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
};
