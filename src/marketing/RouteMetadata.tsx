import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteMetadata } from './pages';
import { applyPageMetadata } from './apply-head';

export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    applyPageMetadata(getRouteMetadata(pathname));
  }, [pathname]);
  return null;
}
