import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

function PublicPageLoader() {
  return (
    <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Suspense fallback={<PublicPageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
