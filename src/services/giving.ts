import apiClient from '@/lib/api-client';

export interface GivingCampaign {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  category: 'tithe' | 'offering' | 'fellowship_offering' | 'partnership' | 'welfare' | 'missions';
  subcategory?: string;
  targetAmount?: number;
  currency: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  imageUrl?: string;
  allowPublicDonations: boolean;
  allowPledging: boolean;
  cellId?: string;
  createdAt: string;
  updatedAt: string;
  church?: { name: string };
  totalRaised?: number;
  donorCount?: number;
  userHasDonated?: boolean;
  userTotalDonated?: number;
}

export interface CreateCampaignDto {
  churchId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  targetAmount?: number;
  currency?: string;
  endDate?: string;
  imageUrl?: string;
  allowPublicDonations?: boolean;
  allowPledging?: boolean;
  cellId?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  currency?: string;
  targetAmount?: number;
  status?: string;
  endDate?: string | null;
  imageUrl?: string;
  allowPublicDonations?: boolean;
  allowPledging?: boolean;
}

export interface DonationTransaction {
  id: string;
  campaignId: string;
  userId: string;
  churchId: string;
  amount: number;
  currency: string;
  transactionId?: string;
  paymentMethod?: string;
  reference?: string;
  status: string;
  isAnonymous: boolean;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  notes?: string;
  createdAt: string;
  campaign?: { name: string; category: string };
  user?: { firstName: string; lastName: string; email: string };
  cell?: { name: string };
}

export interface CreateDonationDto {
  campaignId: string;
  amount: number;
  isAnonymous?: boolean;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  notes?: string;
  cellId?: string;
  pledgeId?: string;
}

// ─── Pledge types ─────────────────────────────────────────────────────────────

export type PledgeStatus = 'pending' | 'partial' | 'fulfilled' | 'overdue';

export interface Pledge {
  id: string;
  campaignId: string;
  churchId: string;
  userId?: string;
  pledgerName?: string;
  pledgerEmail?: string;
  pledgerPhone?: string;
  pledgedAmount: number;
  currency: string;
  amountPaid: number;
  status: PledgeStatus;
  fulfillmentDeadline?: string;
  notes?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  campaign?: { id: string; name: string; category: string; currency: string; status: string; allowPledging?: boolean };
  church?: { name: string };
  user?: { firstName: string; lastName: string; email: string; phone?: string };
  payments?: { id: string; amount: number; currency: string; createdAt: string; paymentMethod?: string; reference?: string }[];
}

export interface CreatePledgeDto {
  campaignId: string;
  pledgedAmount: number;
  fulfillmentDeadline?: string;
  notes?: string;
}

export interface GivingSummary {
  totalRaised: number;
  donorCount: number;
  topCampaigns: Array<{
    campaignId: string;
    currency: string;
    totalRaised: number;
    donationCount: number;
    campaign: { id: string; name: string; category: string; church?: { name: string } } | null;
  }>;
}

export interface UpdatePledgeDto {
  pledgedAmount?: number;
  fulfillmentDeadline?: string | null;
  notes?: string | null;
}

export const givingService = {
  async getPublicCampaign(id: string): Promise<GivingCampaign> {
    const { data } = await apiClient.get(`/giving/campaigns/${id}/public`);
    return data.data;
  },

  async getPublicCampaignCells(campaignId: string): Promise<{ id: string; name: string; zone?: string | null }[]> {
    const { data } = await apiClient.get(`/giving/campaigns/${campaignId}/cells`);
    return data.data;
  },

  async guestDonate(dto: { campaignId: string; amount: number; guestName: string; guestEmail: string; guestPhone?: string; cellId?: string }): Promise<any> {
    const { data } = await apiClient.post('/giving/guest-donate', dto);
    return data.data;
  },

  async createCampaign(dto: CreateCampaignDto): Promise<GivingCampaign> {
    const { data } = await apiClient.post('/giving/campaigns', dto);
    return data.data;
  },

  async getCampaigns(params?: { churchId?: string; category?: string; status?: string }): Promise<GivingCampaign[]> {
    const { data } = await apiClient.get('/giving/campaigns', { params });
    return data.data;
  },

  async getSummary(params?: { churchId?: string; category?: string; startDate?: string; endDate?: string }): Promise<GivingSummary> {
    const { data } = await apiClient.get('/giving/summary', { params });
    return data.data;
  },

  async getCampaign(id: string): Promise<GivingCampaign> {
    const { data } = await apiClient.get(`/giving/campaigns/${id}`);
    return data.data;
  },

  async updateCampaign(id: string, dto: UpdateCampaignDto): Promise<GivingCampaign> {
    const { data } = await apiClient.put(`/giving/campaigns/${id}`, dto);
    return data.data;
  },

  async deleteCampaign(id: string): Promise<void> {
    await apiClient.delete(`/giving/campaigns/${id}`);
  },

  async getDonations(campaignId?: string, churchId?: string, params?: { limit?: number; page?: number; export?: boolean; category?: string; cellId?: string; startDate?: string; endDate?: string }): Promise<DonationTransaction[]> {
    const queryParams: any = {};
    if (campaignId) queryParams.campaignId = campaignId;
    if (churchId) queryParams.churchId = churchId;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.page) queryParams.page = params.page;
    if (params?.export) queryParams.export = 'true';
    if (params?.category) queryParams.category = params.category;
    if (params?.cellId) queryParams.cellId = params.cellId;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    
    const { data } = await apiClient.get('/giving/donations', {
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });
    // export=true returns { success, data[], pagination } — return full response so
    // callers can read pagination.totalPages for batch‑export page nav
    if (params?.export) return data;
    return data.data;
  },

  async donate(dto: CreateDonationDto): Promise<any> {
    const { data } = await apiClient.post('/giving/donate', dto);
    return data.data;
  },

  async getDonationTransaction(donationId: string): Promise<any> {
    const { data } = await apiClient.get(`/giving/donations/${donationId}/transaction`);
    return data.data;
  },

  async recordCashDonation(dto: {
    campaignId: string;
    donorType: 'member' | 'guest' | 'anonymous';
    memberId?: string;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    amount: number;
    currency: string;
    date: string;
    reference?: string;
    notes?: string;
    cellId?: string;
  }): Promise<DonationTransaction> {
    const { data } = await apiClient.post('/giving/donations/cash', dto);
    return data.data;
  },

  // ─── Pledges ───────────────────────────────────────────────────────────────

  async createPledge(dto: CreatePledgeDto): Promise<Pledge> {
    const { data } = await apiClient.post('/giving/pledges', dto);
    return data.data;
  },

  async getMyPledges(params?: { status?: string; sortBy?: string; page?: number; limit?: number }): Promise<{
    data: Pledge[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { data } = await apiClient.get('/giving/pledges/my', { params });
    return data;
  },

  async getMinistryPledges(params?: { campaignId?: string; status?: string; churchId?: string; sortBy?: string; startDate?: string; endDate?: string; page?: number; limit?: number; export?: boolean }): Promise<{
    data: Pledge[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    summary: { totalPledged: number; totalPaid: number; outstanding: number; count: number };
  }> {
    const queryParams: any = { ...params };
    if (params?.export) queryParams.export = 'true';
    const { data } = await apiClient.get('/giving/pledges', { params: queryParams });
    return data;
  },

  async getPledge(id: string): Promise<Pledge> {
    const { data } = await apiClient.get(`/giving/pledges/${id}`);
    return data.data;
  },

  async updatePledge(id: string, dto: UpdatePledgeDto): Promise<Pledge> {
    const { data } = await apiClient.put(`/giving/pledges/${id}`, dto);
    return data.data;
  },
};
