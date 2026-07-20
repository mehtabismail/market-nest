'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, type UserRole } from '@/contexts/auth-context';
import { PageLoader } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: ReactNode;
  loginPath: string;
  requiredRole?: UserRole | UserRole[];
  publicPaths?: string[];
}

export function AuthGuard({ children, loginPath, requiredRole, publicPaths = [] }: AuthGuardProps) {
  const { loading, isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = publicPaths.some((p) => pathname === p || pathname?.startsWith(`${p}/`));

  useEffect(() => {
    if (loading || isPublic) return;

    if (!isAuthenticated) {
      router.replace(`${loginPath}?next=${encodeURIComponent(pathname ?? '/')}`);
      return;
    }

    if (requiredRole && user) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(user.role)) {
        router.replace(loginPath);
      }
    }
  }, [loading, isAuthenticated, user, pathname, router, loginPath, requiredRole, isPublic]);

  if (isPublic) return <>{children}</>;
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <PageLoader />;

  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) return <PageLoader />;
  }

  return <>{children}</>;
}
