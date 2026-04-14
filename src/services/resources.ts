import apiClient from '@/lib/api-client';

export interface ResourceFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string | null;
  category: 'bible' | 'devotional' | 'study_plan' | 'sermon' | 'worship' | 'general';
  type: 'article' | 'video' | 'audio' | 'document' | 'link';
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  filesJson?: string | null;  // JSON array of ResourceFile
  duration?: string | null;
  author?: string | null;
  tags?: string | null;
  churchId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export function parseResourceFiles(resource: Resource): ResourceFile[] {
  if (!resource.filesJson) return [];
  try { return JSON.parse(resource.filesJson); } catch { return []; }
}

export interface CreateResourceDto {
  title: string;
  description?: string;
  category: Resource['category'];
  type: Resource['type'];
  author?: string;
  duration?: string;
  tags?: string;
  fileUrl?: string;
  files?: File[];
  churchId: string;
}

export interface UpdateResourceDto {
  title?: string;
  description?: string;
  category?: Resource['category'];
  type?: Resource['type'];
  author?: string;
  duration?: string;
  tags?: string;
  fileUrl?: string;
  files?: File[];
  keepFilesJson?: string; // JSON array of existing file URLs to keep
  churchId?: string;
}

const BASE = '/resources';

export const resourcesService = {
  getAll: async (params?: { churchId?: string; category?: string }): Promise<Resource[]> => {
    const { data } = await apiClient.get(BASE, { params });
    return data.data;
  },

  create: async (dto: CreateResourceDto): Promise<Resource> => {
    const form = new FormData();
    (dto.files ?? []).forEach(f => form.append('files', f));
    Object.entries(dto).forEach(([k, v]) => {
      if (k === 'files') return;
      if (v !== undefined && v !== null) form.append(k, String(v));
    });
    const { data } = await apiClient.post(BASE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  update: async (id: string, dto: UpdateResourceDto): Promise<Resource> => {
    const form = new FormData();
    (dto.files ?? []).forEach(f => form.append('files', f));
    Object.entries(dto).forEach(([k, v]) => {
      if (k === 'files') return;
      if (v !== undefined && v !== null) form.append(k, String(v));
    });
    const { data } = await apiClient.put(`${BASE}/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  recordView: async (id: string): Promise<void> => {
    await apiClient.post(`${BASE}/${id}/view`);
  },

  getViewStats: async (id: string): Promise<{ count: number }> => {
    const { data } = await apiClient.get(`${BASE}/${id}/view-stats`);
    return data.data;
  },

  getViewers: async (id: string, search?: string): Promise<import('./communication').ContentViewer[]> => {
    const { data } = await apiClient.get(`${BASE}/${id}/viewers`, { params: search ? { search } : undefined });
    return data.data;
  },
};
