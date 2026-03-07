import { useAuth } from '@/contexts/AuthContext';

interface PackageFeatures {
  [featureName: string]: number | null;
}

export function usePackageFeatures(): PackageFeatures {
  const { user } = useAuth();
  
  if (!user?.package?.features) {
    return {};
  }

  const features: PackageFeatures = {};
  for (const link of user.package.features) {
    features[link.feature.name] = link.limitValue;
  }

  return features;
}

export function useHasFeature(featureName: string): boolean {
  const features = usePackageFeatures();
  return featureName in features;
}

export function useFeatureLimit(featureName: string): number | null {
  const features = usePackageFeatures();
  return features[featureName] ?? null;
}

export function useCheckLimit(featureName: string, currentCount: number): {
  allowed: boolean;
  limit: number | null;
  message?: string;
} {
  const limit = useFeatureLimit(featureName);

  if (limit === null) {
    return { allowed: true, limit: null };
  }

  if (currentCount >= limit) {
    return {
      allowed: false,
      limit,
      message: `You have reached the maximum limit of ${limit}. Please upgrade your package.`,
    };
  }

  return { allowed: true, limit };
}
