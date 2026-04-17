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

  // Protected app routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/history', element: <HistoryPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },

          // Exam flow
          { path: '/exam/setup', element: <ExamSetupPage /> },
          { path: '/exam/:sessionId', element: <ExamSessionPage /> },
          { path: '/exam/:sessionId/result', element: <ExamResultPage /> },
          { path: '/exam/:sessionId/review', element: <ExamResultPage /> },

          // Practice flow
          { path: '/practice/setup', element: <PracticeSetupPage /> },
          { path: '/practice', element: <PracticeSessionPage /> },
          { path: '/practice/:sessionId', element: <PracticeSessionPage /> },

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
