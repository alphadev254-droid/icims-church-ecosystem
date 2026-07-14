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
  expiringSoonSubscriptions: number;
  totalPackages: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  totalPayments: number;
  malawiRevenue: number;
  malawiPayments: number;
  kenyaRevenue: number;
  kenyaPayments: number;
  mainRevenue: number;
  mainRevenueTransactions: number;
  malawiMainRevenue: number;
  malawiMainRevenueTransactions: number;
  kenyaMainRevenue: number;
  kenyaMainRevenueTransactions: number;
  withdrawalSystemRevenue: number;
  withdrawalSystemRevenueCount: number;
  packageBreakdown: Array<{
    packageId: string;
    packageName: string;
    displayName: string;
    active: number;
    expired: number;
    cancelled: number;
    total: number;
  }>;
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
  title?: string | null;
  titleOther?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  maritalStatus?: string | null;
  weddingDate?: string | null;
  residentialNeighbourhood?: string | null;
  serviceInterest?: string | null;
  membershipType?: string | null;
  memberType?: string | null;
  baptizedByImmersion?: boolean | null;
  loginEnabled?: boolean;
  roleName: string;
  role?: { id: string; name: string; displayName: string };
  roleId?: string | null;
  church?: { id: string; name: string } | null;
  churchCount?: number;
  createdAt: string;
  ministryName?: string | null;
  numberOfBranches?: number;
  currentMembership?: number;
  regions?: string[] | string | null;
  districts?: string[] | string | null;
  traditionalAuthorities?: string[] | string | null;
  resolvedCountry?: string | null;
  resolvedMinistryName?: string | null;
}

export interface AdminUserDetail extends AdminUser {
  childProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    age?: number | null;
    gender?: string | null;
    status: string;
    church?: { id: string; name: string } | null;
    guardians?: Array<{
      relationship: string;
      isPrimary: boolean;
      canPickup: boolean;
      emergencyContact: boolean;
      guardian: { id: string; firstName: string; lastName: string; email?: string | null; phone?: string | null };
    }>;
  } | null;
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
  baseAmount?: number;
  convenienceFee?: number;
  systemFeeAmount?: number;
  ceilRoundingAmount?: number;
  totalAmount?: number;
  gatewayCharge?: number;
  systemGatewayFeeRate?: number;
  systemFeeRate?: number;
  subaccountCode?: string;
  subaccountName?: string;
  customerEmail?: string;
  customerPhone?: string;
  cardLast4?: string;
  cardBank?: string;
  channel?: string;
  billingCycle?: string;
  expiresAt?: string;
  gatewayPayload?: string;
  gatewayResponse?: string;
  notes?: string;
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
  campaignName?: string | null;
  campaignCategory?: string | null;
  eventTitle?: string | null;
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
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byCurrency: Array<{
    currency: string;
    count: number;
    totalBaseAmount: number;
    totalSystemFee: number;
    totalSystemFeeOnly: number;
    totalRounding: number;
    totalGatewayFee: number;
    totalTransactionCost: number;
    totalCharged: number;
  }>;
}

export interface AdminWithdrawal {
  id: string;
  walletId: string;
  ministryAdminId: string;
  initiatedBy?: string | null;
  amount: number;
  fee: number;
  gatewayFeeAmount?: number;
  gatewayFeeRate?: number | null;
  bankFixedFeeAmount?: number;
  systemFeeAmount?: number;
  systemFeeRate?: number | null;
  netAmount: number;
  payoutAmount?: number;
  method: string;
  status: string;
  mobileOperator?: string | null;
  mobileNumber?: string | null;
  bankCode?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  chargeId?: string | null;
  gatewayPayload?: string | null;
  gatewayResponse?: string | null;
  failureReason?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  currency: string;
  church?: { id: string; name: string; ministryAdminId?: string | null } | null;
  ministryAdmin?: { id: string; firstName: string; lastName: string; email: string; ministryName?: string | null; accountCountry?: string | null } | null;
  initiatedByUser?: { id: string; firstName: string; lastName: string; email: string; phone?: string | null } | null;
}

export interface AdminWithdrawalSummary {
  total: number;
  byStatus: Record<string, number>;
  byMethod: Record<string, number>;
  byCurrencyCount: Record<string, number>;
  walletBalances: Array<{
    currency: string;
    balance: number;
    walletCount: number;
  }>;
  byCurrency: Array<{
    currency: string;
    count: number;
    totalRequested: number;
    totalFee: number;
    gatewayFee: number;
    bankFixedFee: number;
    systemFee: number;
    netAmount: number;
    payoutAmount: number;
    completedSystemRevenue: number;
    completedCount: number;
  }>;
}

export interface AdminTreasurySummary {
  currency: string;
  paychanguBalance: number;
  ministryWalletBalance: number;
  ministryWalletCount: number;
  pendingMinistryPayouts: number;
  pendingMinistryWithdrawalCount: number;
  pendingPlatformPayouts: number;
  pendingPlatformWithdrawalCount: number;
  safeAvailableBalance: number;
  systemRevenue: number;
  paychanguRaw?: unknown;
}

export interface AdminPlatformWithdrawal {
  id: string;
  initiatedBy: string;
  amount: number;
  fee: number;
  gatewayFeeAmount: number;
  gatewayFeeRate?: number | null;
  bankFixedFeeAmount: number;
  netAmount: number;
  payoutAmount: number;
  method: string;
  status: string;
  mobileOperator?: string | null;
  mobileNumber?: string | null;
  bankCode?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  chargeId?: string | null;
  gatewayPayload?: string | null;
  gatewayResponse?: string | null;
  failureReason?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentSummary {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byGateway: Record<string, number>;
  byCurrency: Array<{
    currency: string;
    count: number;
    totalCollected: number;
    packageRevenue: number;
    gatewayCost: number;
    icimsFee: number;
    feeOnly: number;
    rounding: number;
    totalRevenue: number;
    totalPaymentCost: number;
  }>;
}

export const adminApi = {
  getStats: () =>
    apiClient.get<{ success: boolean; data: AdminStats }>('/admin/stats'),

  getMinistries: () =>
    apiClient.get<{ success: boolean; data: Array<{ id: string; label: string; country: string | null }> }>('/admin/ministries'),

  getUsers: (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    country?: string;
    status?: string;
    ministry?: string;
  }) => apiClient.get<{ success: boolean; data: AdminUser[]; pagination: Pagination }>('/admin/users', { params }),

  getUser: (id: string) =>
    apiClient.get<{ success: boolean; data: AdminUserDetail }>(`/admin/users/${id}`),

  getUserRoleOptions: (id: string) =>
    apiClient.get<{ success: boolean; data: { ministryAdminId: string | null; roles: Array<{ id: string; name: string; displayName: string; isSystemRole: boolean; ministryAdminId?: string | null }> } }>(`/admin/users/${id}/role-options`),

  updateUser: (id: string, data: Partial<AdminUser> & Record<string, unknown>) =>
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

  getPackagePayments: (params: {
    page?: number;
    limit?: number;
    search?: string;
    package?: string;
    status?: string;
    country?: string;
    ministry?: string;
    gateway?: string;
    cycle?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<{ success: boolean; data: AdminPayment[]; pagination: Pagination; summary: AdminPaymentSummary }>('/admin/transactions', { params }),

  getTransactions: (params: {
    page?: number;
    limit?: number;
    search?: string;
    package?: string;
    status?: string;
    country?: string;
    ministry?: string;
    gateway?: string;
    cycle?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<{ success: boolean; data: AdminPayment[]; pagination: Pagination; summary: AdminPaymentSummary }>('/admin/transactions', { params }),

  getSystemTransactions: (params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    gateway?: string;
    country?: string;
    churchId?: string;
    ministry?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<{
    success: boolean;
    data: AdminSystemTransaction[];
    pagination: Pagination;
    summary: AdminSystemTransactionSummary;
  }>('/admin/system-transactions', { params }),

  getWithdrawals: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    method?: string;
    currency?: string;
    ministry?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<{
    success: boolean;
    data: AdminWithdrawal[];
    pagination: Pagination;
    summary: AdminWithdrawalSummary;
  }>('/admin/withdrawals', { params }),

  getTreasurySummary: () =>
    apiClient.get<{ success: boolean; data: AdminTreasurySummary }>('/admin/treasury/summary'),

  getTreasuryWithdrawals: (params: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ success: boolean; data: AdminPlatformWithdrawal[]; pagination: Pagination }>('/admin/treasury/withdrawals', { params }),

  getTreasuryBanks: () =>
    apiClient.get<{ success: boolean; data: Array<{ uuid?: string; bank_uuid?: string; id?: string | number; name?: string }> }>('/admin/treasury/banks'),

  sendTreasuryOtp: (payload: {
    amount: number;
    method: 'mobile_money' | 'bank_transfer';
    mobileOperator?: 'airtel' | 'tnm';
    mobileNumber?: string;
    bankCode?: string;
    accountName?: string;
    accountNumber?: string;
  }) => apiClient.post<{ success: boolean; message: string; expiresInSeconds?: number }>('/admin/treasury/withdraw/otp', payload),

  requestTreasuryWithdrawal: (payload: {
    amount: number;
    method: 'mobile_money' | 'bank_transfer';
    mobileOperator?: 'airtel' | 'tnm';
    mobileNumber?: string;
    bankCode?: string;
    accountName?: string;
    accountNumber?: string;
    otpCode: string;
  }) => apiClient.post<{ success: boolean; data: AdminPlatformWithdrawal }>('/admin/treasury/withdraw', payload),

  getPendingTransactions: (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    churchId?: string;
    ministry?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get<{
    success: boolean;
    data: unknown[];
    pagination: Pagination;
  }>('/admin/pending-transactions', { params }),

  // Returns all churches (for filter dropdowns)
  getAllChurches: (params?: { ministryId?: string; q?: string; page?: number; limit?: number }) =>
    apiClient.get<{ success: boolean; data: Array<{ id: string; name: string; ministryAdminId?: string; location?: string; region?: string; district?: string }>; pagination?: Pagination }>(
      '/admin/all-churches',
      { params: { ...(params?.ministryId ? { ministry: params.ministryId } : {}), q: params?.q, page: params?.page, limit: params?.limit } }
    ),
};
