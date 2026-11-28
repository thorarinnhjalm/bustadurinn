import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useUserRole } from '@/hooks/useUserRole';
import { isSuperAdmin } from '@/utils/rbac';

/**
 * Admin Route Component (RBAC-protected). Lives in its own file so App.tsx can load it lazily:
 * useUserRole reads Firestore, and no public page needs that before first paint.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((state) => state.currentUser);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isLoading = useAppStore((state) => state.isLoading);
  const { systemRole, loading: roleLoading } = useUserRole(currentUser?.uid);

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center" role="status">
          <div aria-hidden="true" className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-grey-mid">Hleð...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check RBAC permission instead of email
  const isAdmin = isSuperAdmin(systemRole);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bone p-6">
        <div className="card max-w-md text-center">
          <h1 className="text-2xl font-serif mb-4">Aðgangur bannaður</h1>
          <p className="text-grey-dark mb-6">Þú hefur ekki réttindi til að skoða þessa síðu.</p>
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard'}
            className="btn btn-primary"
          >
            Til baka á stjórnborð
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
