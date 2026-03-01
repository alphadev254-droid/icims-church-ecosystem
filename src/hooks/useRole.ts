import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/stores/permissions';

/**
 * useRole — read the current user's role and check DB-driven permissions.
 *
 * Permissions come from the backend (DB) and are stored in Zustand via user.permissions[].
 * Role convenience helpers (isNational, isLocal, etc.) are derived from user.roleName.
 *
 * Usage:
 *   const { hasPermission, isLocal, roleName } = useRole();
 *   if (hasPermission('members:create')) { ... }
 *   if (isLocal) { ... }
 */
export function useRole() {
  const user = useAuthStore(s => s.user);
  const roleName = (user?.roleName ?? user?.role) as UserRole | undefined;
  const permissions: string[] = user?.permissions ?? [];

  return {
    roleName,
    /** @deprecated use hasPermission() instead — checks DB-driven permissions */
    role: roleName,
    /** Check if the user has a specific permission (sourced from DB) */
    hasPermission: (perm: string) => permissions.includes(perm),
    /** Check if the user has ALL of the listed permissions */
    hasAllPermissions: (...perms: string[]) => perms.every(p => permissions.includes(p)),
    /** Check if the user has ANY of the listed permissions */
    hasAnyPermission: (...perms: string[]) => perms.some(p => permissions.includes(p)),
    /** Role name convenience checks */
    isNational:   roleName === 'national_admin',
    isRegional:   roleName === 'regional_leader',
    isDistrict:   roleName === 'district_overseer',
    isLocal:      roleName === 'local_admin',
    isMember:     roleName === 'member',
    isUpperLevel: roleName === 'national_admin' || roleName === 'regional_leader',
    isAdmin:      roleName !== 'member' && !!roleName,
    permissions,
  };
}
