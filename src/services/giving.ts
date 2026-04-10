import apiClient from '@/lib/api-client';

export interface GivingCampaign {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  category: 'tithe' | 'offering' | 'partnership' | 'welfare' | 'missions';
  subcategory?: string;
  targetAmount?: number;
  currency: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  imageUrl?: string;
  allowPublicDonations: boolean;
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
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  subcategory?: string;
  targetAmount?: number;
  status?: string;
  endDate?: string;
  imageUrl?: string;
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
}

export interface CreateDonationDto {
  campaignId: string;
  amount: number;
  isAnonymous?: boolean;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  notes?: string;
}

export const givingService = {
  async getPublicCampaign(id: string): Promise<GivingCampaign> {
    const { data } = await apiClient.get(`/giving/campaigns/${id}/public`);
    return data.data;
  },

  async guestDonate(dto: { campaignId: string; amount: number; guestName: string; guestEmail: string; guestPhone?: string }): Promise<any> {
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

  async getDonations(campaignId?: string, churchId?: string): Promise<DonationTransaction[]> {
    const params: any = {};
    if (campaignId) params.campaignId = campaignId;
    if (churchId) params.churchId = churchId;
    
    const { data } = await apiClient.get('/giving/donations', {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
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
  }): Promise<DonationTransaction> {
    const { data } = await apiClient.post('/giving/donations/cash', dto);
    return data.data;
  },
};
