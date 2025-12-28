/**
 * Main App Component with Routing
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { HelmetProvider } from 'react-helmet-async';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/store/appStore';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';
import CalendarPage from '@/pages/CalendarPage';
import SettingsPage from '@/pages/SettingsPage';
import FinancePage from '@/pages/FinancePage';
import TasksPage from '@/pages/TasksPage';
import SuperAdminPage from '@/pages/SuperAdminPage';

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

function App() {
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const setLoading = useAppStore((state) => state.setLoading);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          avatar: firebaseUser.photoURL || undefined,
          house_ids: [],
          created_at: new Date(),
        };
        setCurrentUser(user);
        setAuthenticated(true);
      } else {
        // User is signed out
        setCurrentUser(null);
        setAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setCurrentUser, setAuthenticated, setLoading]);

  return (
    <HelmetProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

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
            path="/super-admin"
            element={
              <ProtectedRoute>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
