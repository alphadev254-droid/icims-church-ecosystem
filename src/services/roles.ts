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
  description?: string | null;
  userCount: number;
  permissions: Permission[];
  scope?: RoleScope | null;
  isEditable?: boolean;
  isGlobal?: boolean;
  isSystemRole?: boolean;
  ministryAdminId?: string | null;
}

export interface RoleScope {
  id?: string;
  scopeType: 'all_ministry' | 'specific_churches' | 'regions' | 'districts' | 'traditional_authorities' | 'own_church';
  churchIds?: string[];
  regions?: string[];
  districts?: string[];
  traditionalAuthorities?: string[];
}

export interface RolePayload {
  displayName: string;
  description?: string | null;
  permissions: string[];
  scope: RoleScope;
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
  createRole: async (payload: RolePayload): Promise<Role> => {
    const { data } = await apiClient.post('/roles', payload);
    return data.data;
  },
  updateRole: async (roleId: string, payload: Partial<RolePayload>): Promise<Role> => {
    const { data } = await apiClient.put(`/roles/${roleId}`, payload);
    return data.data;
  },
  deleteRole: async (roleId: string): Promise<void> => {
    await apiClient.delete(`/roles/${roleId}`);
  },
  assignRole: async (userId: string, roleName: string): Promise<void> => {
    await apiClient.post('/roles/assign', { userId, roleName });
  },
  assignRoleById: async (userId: string, roleId: string): Promise<void> => {
    await apiClient.post('/roles/assign', { userId, roleId });
  },
};
