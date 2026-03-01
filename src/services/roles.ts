import apiClient from '@/lib/api-client';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  userCount: number;
  permissions: Permission[];
}

export const rolesService = {
  getRoles: async (): Promise<Role[]> => {
    const { data } = await apiClient.get('/roles');
    return data.data;
  },
  getAllPermissions: async (): Promise<Permission[]> => {
    const { data } = await apiClient.get('/roles/permissions');
    return data.data;
  },
  updateRolePermissions: async (roleId: string, permissions: string[]): Promise<Role> => {
    const { data } = await apiClient.put(`/roles/${roleId}/permissions`, { permissions });
    return data.data;
  },
  assignRole: async (userId: string, roleName: string): Promise<void> => {
    await apiClient.post('/roles/assign', { userId, roleName });
  },
};
