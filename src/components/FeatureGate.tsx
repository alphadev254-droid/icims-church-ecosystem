import { ReactNode } from 'react';
import { useHasFeature } from '@/hooks/usePackageFeatures';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeMessage?: boolean;
}

export function FeatureGate({ feature, children, fallback, showUpgradeMessage = true }: FeatureGateProps) {
  const hasFeature = useHasFeature(feature);

  if (hasFeature) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradeMessage) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <Lock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          This feature is not available in your current package.{' '}
          <Link to="/dashboard/packages" className="font-medium underline">
            Upgrade now
          </Link>{' '}
          to unlock {feature.replace(/_/g, ' ')}.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
