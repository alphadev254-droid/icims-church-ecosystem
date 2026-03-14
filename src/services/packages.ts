import apiClient from '@/lib/api-client';

export interface PackageFeature {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  category: string;
  sortOrder: number;
}

export interface PackageTier {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly: number;
  isActive: boolean;
  sortOrder: number;
  features: Array<{ feature: PackageFeature; limitValue?: number | null }>;
}

export interface Payment {
  id: string;
  churchId: string;
  packageId?: string | null;
  amount: number;
  currency: string;
  type: string;
  status: string;
  packageName: string;
  reference?: string | null;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  package?: { name: string; displayName: string } | null;
}

export const packagesService = {
  // Package tiers
  getAll: async (): Promise<PackageTier[]> => {
    const { data } = await apiClient.get('/packages');
    return data.data;
  },
  getCurrent: async (): Promise<{ church: { id: string; name: string; package: string }; package: PackageTier | null }> => {
    const { data } = await apiClient.get('/packages/current');
    return data.data;
  },

  // Features
  getFeatures: async (): Promise<(PackageFeature & { packages: { packageId: string }[] })[]> => {
    const { data } = await apiClient.get('/packages/features');
    return data.data;
  },
  createFeature: async (dto: { name: string; displayName: string; description?: string; category?: string; sortOrder?: number }): Promise<PackageFeature> => {
    const { data } = await apiClient.post('/packages/features', dto);
    return data.data;
  },
  deleteFeature: async (id: string): Promise<void> => {
    await apiClient.delete(`/packages/features/${id}`);
  },

  // Feature links
  setPackageFeatures: async (packageId: string, featureIds: string[]): Promise<PackageTier> => {
    const { data } = await apiClient.put(`/packages/${packageId}/features`, { featureIds });
    return data.data;
  },

  // Payments
  getPayments: async (): Promise<Payment[]> => {
    const { data } = await apiClient.get('/packages/payments');
    return data.data;
  },
  calculateFees: async (packageId: string, billingCycle: string): Promise<{
    currency: string;
    baseAmount: number;
    convenienceFee: number;
    systemFeeAmount: number;
    transactionCost: number;
    totalAmount: number;
  }> => {
    const { data } = await apiClient.get('/packages/calculate-fees', { params: { packageId, billingCycle } });
    return data.data;
  },
  createPayment: async (dto: {
    amount: number;
    currency?: string;
    type: string;
    packageName: string;
    reference?: string;
    notes?: string;
    status?: string;
  }): Promise<Payment> => {
    const { data } = await apiClient.post('/packages/payments', dto);
    return data.data;
  },
  updatePayment: async (id: string, status: string): Promise<Payment> => {
    const { data } = await apiClient.put(`/packages/payments/${id}`, { status });
    return data.data;
  },
};
