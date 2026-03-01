import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const allowedRoutes = useAuthStore(s => s.allowedRoutes);
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
  const isAllowed =
    location.pathname === '/dashboard' ||
    allowedRoutes.some(r => r === location.pathname || location.pathname.startsWith(r + '/'));

  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
