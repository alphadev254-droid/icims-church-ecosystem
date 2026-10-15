import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, authCheckError } = useAuth();
  const fetchMe = useAuthStore(s => s.fetchMe);
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

  if (authCheckError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold">{authCheckError.retryable ? 'Unable to verify your session' : 'Account access unavailable'}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{authCheckError.message}</p>
          {authCheckError.retryable ? (
            <button
              type="button"
              onClick={() => void fetchMe()}
              className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Retry
            </button>
          ) : (
            <Link to="/login" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">
              Return to sign in
            </Link>
          )}
        </div>
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
