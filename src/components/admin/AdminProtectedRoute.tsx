import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Shield } from 'lucide-react';

function AdminAuthLoader() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Shield className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">ICIMS Admin</p>
            <p className="mt-0.5 text-xs text-muted-foreground">System Console</p>
          </div>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    </div>
  );
}

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <AdminAuthLoader />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.roleName !== 'system_admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
