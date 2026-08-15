import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { AdminRoute } from '../routes/AdminRoute';
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const AIChatPage = lazy(() => import('../pages/AIChatPage'));
const AIToolPage = lazy(() => import('../pages/AIToolPage'));
const UtilitiesPage = lazy(() => import('../pages/UtilitiesPage'));
const ApiTesterPage = lazy(() => import('../pages/ApiTesterPage'));
const PromptLibraryPage = lazy(() => import('../pages/PromptLibraryPage'));
const SnippetsPage = lazy(() => import('../pages/SnippetsPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="chat" element={<AIChatPage />} />
          <Route path="code-generator" element={<AIToolPage mode="generate" />} />
          <Route path="debug-assistant" element={<AIToolPage mode="debug" />} />
          <Route path="code-explainer" element={<AIToolPage mode="explain" />} />
          <Route path="code-optimizer" element={<AIToolPage mode="optimize" />} />
          <Route path="documentation" element={<AIToolPage mode="document" />} />
          <Route path="code-converter" element={<AIToolPage mode="convert" />} />
          <Route path="sql-generator" element={<AIToolPage mode="sql" />} />
          <Route path="regex-generator" element={<AIToolPage mode="regex" />} />
          <Route path="ui-generator" element={<AIToolPage mode="ui" />} />
          <Route path="utilities" element={<UtilitiesPage />} />
          <Route path="api-tester" element={<ApiTesterPage />} />
          <Route path="prompts" element={<PromptLibraryPage />} />
          <Route path="snippets" element={<SnippetsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
