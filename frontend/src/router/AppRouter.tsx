// frontend/src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import RequireAuth from '../components/RequireAuth'
import IdleTimeoutWatcher from '../components/IdleTimeoutWatcher'
import Layout from '../components/layout/Layout'
import LoginPage from '../components/pages/LoginPage'
import SignUpPage from '../components/pages/SignUpPage'
import WelcomePage from '../components/pages/WelcomePage'
import UsersPage from '../components/pages/UsersPage'
import PlaceholderPage from '../components/pages/PlaceholderPage'
import BatchKhususPage from '../components/pages/BatchKhususPage'
import ReportBatchKhususPage from '../components/pages/ReportBatchKhususPage'
import BatchOverfilledPage from '../components/pages/BatchOverfilledPage'
import ReportBatchOverfilledPage from '../components/pages/ReportBatchOverfilledPage'
import LogAktivitasPage from '../components/pages/LogAktivitasPage'
import UnauthorizedPage from '../components/pages/UnauthorizedPage'

import AdminBatchKhususPage from '../components/pages/AdminBKPage'
import AdminBatchOverfilledPage from '../components/pages/AdminBOPage'

import AdminReportTemplatePage from '../components/pages/AdminUpTemplatePage'
import DownloadReportPage from '../components/pages/DownloadReportPage'



export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <IdleTimeoutWatcher />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/" element={<Navigate to="/welcome" replace />} />

            {/* Protected routes */}
            <Route
              path="/welcome"
              element={
                <RequireAuth>
                  <Layout>
                    <WelcomePage />
                  </Layout>
                </RequireAuth>
              }
            />

            <Route
              path="/admin/batch-khusus"
              element={
                <RequireAuth roles={['admin']}>
                  <Layout>
                    <AdminBatchKhususPage />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/batch-overfilled"
              element={
                <RequireAuth roles={['admin']}>
                  <Layout>
                    <AdminBatchOverfilledPage />
                  </Layout>
                </RequireAuth>
              }
            />
            
            {/* Perhitungan – admin + produksi + qa */}
            <Route
              path="/perhitungan/batch-overfilled"
              element={
                <RequireAuth roles={['admin', 'produksi', 'qa']}>
                  <Layout>
                    <BatchOverfilledPage />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/perhitungan/batch-khusus"
              element={
                <RequireAuth roles={['admin', 'produksi', 'qa']}>
                  <Layout>
                    <BatchKhususPage />
                  </Layout>
                </RequireAuth>
              }
            />

            {/* Report – all roles */}
            <Route
              path="/report/batch-overfilled"
              element={
                <RequireAuth roles={['admin', 'produksi', 'qa']}>
                  <Layout>
                    <ReportBatchOverfilledPage />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/report/batch-khusus"
              element={
                <RequireAuth roles={['admin', 'produksi', 'qa']}>
                  <Layout>
                    <ReportBatchKhususPage />
                  </Layout>
                </RequireAuth>
              }
            />

            // Admin only
            <Route
              path="/admin/report-templates"
              element={
                <RequireAuth roles={['admin']}>
                  <Layout>
                    <AdminReportTemplatePage />
                  </Layout>
                </RequireAuth>
              }
            />

            // All roles (user bisa download)
            <Route
              path="/download-report"
              element={
                <RequireAuth roles={['admin', 'produksi', 'qa']}>
                  <Layout>
                    <DownloadReportPage />
                  </Layout>
                </RequireAuth>
              }
            />
            {/* Admin-only */}
            <Route
              path="/users"
              element={
                <RequireAuth roles={['admin']}>
                  <Layout>
                    <UsersPage />
                  </Layout>
                </RequireAuth>
              }
            />
            <Route
              path="/log-aktivitas"
              element={
                <RequireAuth roles={['admin']}>
                  <Layout>
                    <LogAktivitasPage />
                  </Layout>
                </RequireAuth>
              }
            />

            {/* Unauthorized */}
            <Route
              path="/unauthorized"
              element={
                <RequireAuth>
                  <Layout>
                    <UnauthorizedPage />
                  </Layout>
                </RequireAuth>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}