import apiClient from '@/lib/api-client';

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export const uploadService = {
  uploadCommunicationFiles: async (files: File[]): Promise<UploadedFile[]> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const { data } = await apiClient.post('/upload/communication', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.files;
  },

  uploadDiscipleshipFile: async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/upload/discipleship', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.file;
  },
  
  deleteFile: async (fileUrl: string): Promise<void> => {
    await apiClient.delete('/upload/delete', { data: { fileUrl } });
  },
};
