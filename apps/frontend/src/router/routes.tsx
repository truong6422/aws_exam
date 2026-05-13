import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppShell from '@/layouts/app-shell'
import AuthLayout from '@/layouts/auth-layout'

// Auth pages
import LoginPage from '@/pages/auth/login-page'
import RegisterPage from '@/pages/auth/register-page'

// Main pages
import DashboardPage from '@/pages/dashboard/dashboard-page'
import HistoryPage from '@/pages/history/history-page'
import AnalyticsPage from '@/pages/analytics/analytics-page'
// WALLET_FEATURE: import WalletPage from '@/pages/wallet/wallet-page'
import ChatPage from '@/pages/chat/chat-page'

// Exam pages
import ExamSetupPage from '@/pages/exam/exam-setup-page'
import ExamSessionPage from '@/pages/exam/exam-session-page'
import ExamResultPage from '@/pages/exam/exam-result-page'

// Practice pages
import PracticeSetupPage from '@/pages/practice/practice-setup-page'
import PracticeSessionPage from '@/pages/practice/practice-session-page'

// Admin pages
import AdminLayout from '@/layouts/admin-layout'
import AdminDashboardPage from '@/pages/admin/admin-dashboard-page'
import AdminUsersPage from '@/pages/admin/admin-users-page'
import AdminImportPage from '@/pages/admin/admin-import-page'
import AdminExamsPage from '@/pages/admin/admin-exams-page'
import AdminFeedbackPage from '@/pages/admin/admin-feedback-page'
// WALLET_FEATURE: import AdminWalletPage from '@/pages/admin/admin-wallet-page'
import AdminChatPage from '@/pages/admin/admin-chat-page'
import AdminSettingsPage from '@/pages/admin/admin-settings-page'

// Guards
import ProtectedRoute from '@/router/protected-route'
import AdminRoute from '@/router/admin-route'

// Error
import NotFoundPage from '@/pages/not-found-page'

export const router = createBrowserRouter([
  // Public auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // App routes
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/practice/setup" replace /> },

      // Publicly accessible routes
      { path: '/practice/setup', element: <PracticeSetupPage /> },
      { path: '/practice', element: <PracticeSessionPage /> },
      { path: '/practice/:sessionId', element: <PracticeSessionPage /> },

      // Protected app routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/history', element: <HistoryPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          // WALLET_FEATURE: { path: '/wallet', element: <WalletPage /> },
          { path: '/chat', element: <ChatPage /> },

          // Exam flow
          { path: '/exam/setup', element: <ExamSetupPage /> },
          { path: '/exam/:sessionId', element: <ExamSessionPage /> },
          { path: '/exam/:sessionId/result', element: <ExamResultPage /> },
          { path: '/exam/:sessionId/review', element: <ExamResultPage /> },

          // Admin — nested under AppShell, guarded separately
          {
            element: <AdminRoute />,
            children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/dashboard" replace /> },
              { path: 'dashboard', element: <AdminDashboardPage /> },
              { path: 'users', element: <AdminUsersPage /> },
              { path: 'exams', element: <AdminExamsPage /> },
              { path: 'feedback', element: <AdminFeedbackPage /> },
              // WALLET_FEATURE: { path: 'wallet', element: <AdminWalletPage /> },
              { path: 'chat', element: <AdminChatPage /> },
              { path: 'settings', element: <AdminSettingsPage /> },
              { path: 'import', element: <AdminImportPage /> },
            ],
          },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])
