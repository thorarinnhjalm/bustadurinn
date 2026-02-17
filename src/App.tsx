/**
 * Main App Component with Routing
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { useAppStore } from '@/store/appStore';
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import AuthHandler from '@/components/AuthHandler';
import ErrorBoundary from '@/components/ErrorBoundary';
import { captureUTMParams, sendUTMToSentry } from '@/utils/utm';

// Critical pages - loaded immediately
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';

// Lazy-loaded pages - code split for better performance
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const FinancePage = lazy(() => import('@/pages/FinancePage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const SuperAdminPage = lazy(() => import('@/pages/SuperAdminPage'));
const JoinPage = lazy(() => import('@/pages/JoinPage'));
const GuestPage = lazy(() => import('@/pages/GuestPage'));
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const SandboxPage = lazy(() => import('@/pages/SandboxPage'));
const MigrationPage = lazy(() => import('@/pages/MigrationPage'));

const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const DataDeletionPage = lazy(() => import('@/pages/DataDeletionPage'));
const SentryTestPage = lazy(() => import('@/pages/SentryTestPage'));
const ForProvidersPage = lazy(() => import('@/pages/ForProvidersPage'));
const MarketplacePage = lazy(() => import('@/pages/MarketplacePage'));
const HandbokPage = lazy(() => import('@/pages/HandbokPage'));
const BokunarkerfiPage = lazy(() => import('@/pages/handbok/BokunarkerfiPage'));
const FjarmalPage = lazy(() => import('@/pages/handbok/FjarmalPage'));
const VidhaldPage = lazy(() => import('@/pages/handbok/VidhaldPage'));
const UppsetningPage = lazy(() => import('@/pages/handbok/UppsetningPage'));

// Organization pages
const OrganizationSignupPage = lazy(() => import('@/pages/organizations/OrganizationSignupPage'));
const OrganizationDashboardPage = lazy(() => import('@/pages/organizations/OrganizationDashboardPage'));
const AccessRequestFormPage = lazy(() => import('@/pages/organizations/AccessRequestFormPage'));
const MemberDashboardPage = lazy(() => import('@/pages/organizations/MemberDashboardPage'));

// RBAC imports
import { useUserRole } from '@/hooks/useUserRole';
import { isSuperAdmin } from '@/utils/rbac';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isLoading = useAppStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-grey-mid">Hleð...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin Route Component (RBAC-protected)
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useAppStore((state) => state.currentUser);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const isLoading = useAppStore((state) => state.isLoading);
  const { systemRole, loading: roleLoading } = useUserRole(currentUser?.uid);

  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
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
          <h2 className="text-2xl font-serif mb-4">Aðgangur bannaður</h2>
          <p className="text-grey-dark mb-6">Þú hefur ekki réttindi til að skoða þessa síðu.</p>
          <button
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
};

// Feedback
import FeedbackWidget from '@/components/feedback/FeedbackWidget';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-bone">
    <div className="text-center">
      <div className="animate-spin w-12 h-12 border-4 border-charcoal border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-grey-mid">Hleð síðu...</p>
    </div>
  </div>
);

function App() {

  // Auth logic moved to AuthHandler

  // Capture UTM parameters on app load
  useEffect(() => {
    captureUTMParams();
    sendUTMToSentry();
  }, []);

  return (
    <ErrorBoundary>
      <ImpersonationProvider>
        <AuthHandler />
        <HelmetProvider>
          <Router>
            <ImpersonationBanner />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/join" element={<JoinPage />} />
                <Route path="/join/:houseId/:code" element={<JoinPage />} />
                <Route path="/guest/:token" element={<GuestPage />} />
                <Route path="/eiginleikar" element={<FeaturesPage />} />
                <Route path="/spurt-og-svarad" element={<FAQPage />} />
                <Route path="/um-okkur" element={<AboutPage />} />
                <Route path="/hafa-samband" element={<ContactPage />} />
                <Route path="/handbok" element={<HandbokPage />} />
                <Route path="/handbok/bokunarkerfi" element={<BokunarkerfiPage />} />
                <Route path="/handbok/fjarmal" element={<FjarmalPage />} />
                <Route path="/handbok/vidhald" element={<VidhaldPage />} />
                <Route path="/handbok/uppsetning" element={<UppsetningPage />} />
                <Route path="/prufa" element={<SandboxPage />} />

                <Route path="/personuvernd" element={<PrivacyPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/skilmalar" element={<TermsPage />} />
                <Route path="/data-deletion" element={<DataDeletionPage />} />
                <Route path="/gogn-eyding" element={<DataDeletionPage />} />
                <Route path="/sentry-example-page" element={<SentryTestPage />} />
                <Route path="/verktakar" element={<ForProvidersPage />} />
                <Route path="/torgid" element={<MarketplacePage />} />

                {/* Organization Routes - Public */}
                <Route path="/organizations/signup" element={<OrganizationSignupPage />} />
                <Route path="/organizations/:orgId/request-access" element={<AccessRequestFormPage />} />

                {/* Protected Routes */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/finance"
                  element={
                    <ProtectedRoute>
                      <FinancePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <TasksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizations/:orgId/admin"
                  element={
                    <ProtectedRoute>
                      <OrganizationDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizations/:orgId/dashboard"
                  element={
                    <ProtectedRoute>
                      <MemberDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/super-admin"
                  element={
                    <AdminRoute>
                      <SuperAdminPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/migrate"
                  element={
                    <AdminRoute>
                      <MigrationPage />
                    </AdminRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <FeedbackWidget />
          </Router>
        </HelmetProvider>
      </ImpersonationProvider>
    </ErrorBoundary>
  );
}

export default App;
