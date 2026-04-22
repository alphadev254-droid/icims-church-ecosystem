import apiClient from '@/lib/api-client';

export interface AdminStats {
  totalUsers: number;
  totalChurches: number;
  totalMinistryAdmins: number;
  totalMembers: number;
  malawiUsers: number;
  kenyaUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  totalPayments: number;
  malawiRevenue: number;
  malawiPayments: number;
  kenyaRevenue: number;
  kenyaPayments: number;
  recentRegistrations: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    accountCountry: string;
    createdAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    packageName: string;
    billingCycle?: string;
    gateway?: string;
    createdAt: string;
    ministryAdminId: string;
    package?: { displayName: string } | null;
    ministryAdmin?: { id: string; firstName: string; lastName: string; email: string } | null;
  }>;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  accountCountry?: string;
  roleName: string;
  role?: { id: string; name: string; displayName: string };
  church?: { id: string; name: string } | null;
  churchCount?: number;
  createdAt: string;
  ministryName?: string;
  title?: string;
  numberOfBranches?: number;
  currentMembership?: number;
  resolvedCountry?: string | null;
}

export interface AdminUserDetail extends AdminUser {
  ownedChurches: Array<{
    id: string;
    name: string;
    location: string;
    country: string;
    region?: string;
    district?: string;
    createdAt: string;
    _count: { users: number };
  }>;
  subscription?: AdminSubscription | null;
  subscriptions: AdminSubscription[];
  payments: AdminPayment[];
}

export interface AdminSubscription {
  id: string;
  ministryAdminId: string;
  packageId: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  package: { id: string; name: string; displayName: string };
}

export interface AdminPayment {
  id: string;
  ministryAdminId: string;
  packageId?: string;
  packageName: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  billingCycle?: string;
  gateway?: string;
  paymentMethod?: string;
  reference?: string;
  paidAt?: string;
  createdAt: string;
  package?: { name: string; displayName: string } | null;
  ministryAdmin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    accountCountry?: string;
  } | null;
}

export interface AdminChurch {
  id: string;
  name: string;
  location: string;
  country: string;
  region?: string;
  district?: string;
  traditionalAuthority?: string;
  village?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  pastorName?: string;
  yearFounded?: number;
  branchCode?: string;
  createdAt: string;
  ministryAdmin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    accountCountry?: string;
  };
  _count: { users: number; events: number; givingCampaigns: number };
  users: AdminUser[];
  userPagination: { page: number; limit: number; total: number; totalPages: number };
  teams: Array<{
    id: string;
    name: string;
    description?: string;
    color?: string;
    createdAt: string;
    _count: { members: number };
    members: Array<{ isLeader: boolean; user: { id: string; firstName: string; lastName: string } }>;
  }>;
  cells: Array<{
    id: string;
    name: string;
    zone?: string;
    status: string;
    createdAt: string;
    _count: { members: number };
    members: Array<{ isLeader: boolean; isAssistant: boolean; user: { id: string; firstName: string; lastName: string } }>;
  }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminSystemTransaction {
  id: string;
  type: string;
  amount: number;
  baseAmount?: number;
  convenienceFee?: number;
  systemFeeAmount?: number;
  ceilRoundingAmount?: number;
  totalAmount?: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  gateway?: string;
  gatewayCountry?: string;
  reference?: string;
  isGuest: boolean;
  isManual: boolean;
  guestName?: string;
  guestEmail?: string;
  paidAt?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
  church?: { id: string; name: string } | null;
}

export interface AdminSystemTransactionSummary {
  total: number;
  byCurrency: Array<{
    currency: string;
    count: number;
    totalBaseAmount: number;
    totalSystemFee: number;
    totalGatewayFee: number;
    totalCharged: number;
  }>;
}

export const adminApi = {
  getStats: () =>
    apiClient.get<{ success: boolean; data: AdminStats }>('/admin/stats'),

  getUsers: (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    country?: string;
    status?: string;
  }) => apiClient.get<{ success: boolean; data: AdminUser[]; pagination: Pagination }>('/admin/users', { params }),

  getUser: (id: string) =>
    apiClient.get<{ success: boolean; data: AdminUserDetail }>(`/admin/users/${id}`),

  updateUser: (id: string, data: Partial<{ firstName: string; lastName: string; email: string; phone: string; status: string; accountCountry: string }>) =>
    apiClient.put<{ success: boolean; data: AdminUser }>(`/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/admin/users/${id}`),

  resetPassword: (id: string, password: string) =>
    apiClient.post<{ success: boolean; message: string }>(`/admin/users/${id}/reset-password`, { password }),

  sendEmail: (id: string, data: { subject: string; message: string }) =>
    apiClient.post<{ success: boolean; message: string }>(`/admin/users/${id}/send-email`, data),

  getChurch: (id: string, params?: { page?: number; search?: string; role?: string; status?: string }) =>
    apiClient.get<{ success: boolean; data: AdminChurch }>(`/admin/churches/${id}`, { params }),

  updateChurch: (id: string, data: Partial<{ name: string; location: string; pastorName: string; phone: string; email: string; website: string; address: string }>) =>
    apiClient.put<{ success: boolean; data: AdminChurch }>(`/admin/churches/${id}`, data),

  deleteChurch: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/admin/churches/${id}`),

  updateChurchUser: (id: string, data: Partial<{ status: string; firstName: string; lastName: string; email: string; phone: string }>) =>
    apiClient.put<{ success: boolean; data: AdminUser }>(`/admin/church-users/${id}`, data),

  getPackages: () =>
    apiClient.get<{ success: boolean; data: Array<{ id: string; name: string; displayName: string; isActive: boolean }> }>('/packages'),

  manageSubscription: (userId: string, data: { packageId: string; startsAt: string; expiresAt: string; status: string }) =>
    apiClient.post<{ success: boolean; data: AdminSubscription }>(`/admin/users/${userId}/subscription`, data),

  updateSubscription: (userId: string, subId: string, data: { packageId: string; startsAt: string; expiresAt: string; status: string }) =>
    apiClient.put<{ success: boolean; data: AdminSubscription }>(`/admin/users/${userId}/subscription/${subId}`, data),

  getTransactions: (params: {
    page?: number;
    limit?: number;
    search?: string;
    package?: string;
    status?: string;
    country?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<{ success: boolean; data: AdminPayment[]; pagination: Pagination }>('/admin/transactions', { params }),

  getSystemTransactions: (params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    gateway?: string;
    country?: string;
    churchId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<{
    success: boolean;
    data: AdminSystemTransaction[];
    pagination: Pagination;
    summary: AdminSystemTransactionSummary;
  }>('/admin/system-transactions', { params }),
};
