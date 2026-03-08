import apiClient from '@/lib/api-client';

export interface KPI {
  id: string;
  name: string;
  description?: string;
  category: string;
  metricType: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string;
  startDate: string;
  endDate: string;
  status: string;
  nationalAdminId: string;
  churchId?: string;
  church?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateKPIData {
  name: string;
  description?: string;
  category: string;
  metricType: string;
  targetValue: number;
  unit: string;
  period: string;
  startDate: string;
  endDate: string;
  churchId: string;
}

export const kpiService = {
  async getAll(params?: { churchId?: string; category?: string; status?: string; period?: string }) {
    const { data } = await apiClient.get<KPI[]>('/kpis', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get<KPI>(`/kpis/${id}`);
    return data;
  },

  async create(kpiData: CreateKPIData) {
    const { data } = await apiClient.post<KPI>('/kpis', kpiData);
    return data;
  },

  async update(id: string, updates: Partial<CreateKPIData> & { status?: string }) {
    const { data } = await apiClient.put<KPI>(`/kpis/${id}`, updates);
    return data;
  },

  async delete(id: string) {
    const { data } = await apiClient.delete(`/kpis/${id}`);
    return data;
  },

  async calculate() {
    const { data } = await apiClient.get('/kpis/calculate');
    return data;
  },
};
