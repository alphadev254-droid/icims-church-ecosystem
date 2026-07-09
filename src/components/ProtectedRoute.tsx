import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const allowedRoutes = useAuthStore(s => s.allowedRoutes);
  const navItems = useAuthStore(s => s.navItems);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // Not logged in → send to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but this route is not in their allowed routes → send to dashboard root
  const fallbackRoute = navItems[0]?.to ?? allowedRoutes[0];
  const isAllowed = allowedRoutes.some(r => r === location.pathname || location.pathname.startsWith(r + '/'));

  if (!isAllowed && fallbackRoute) return <Navigate to={fallbackRoute} replace />;

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold">No pages assigned</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your role has no page permissions yet. Ask your ministry administrator to update this role.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
