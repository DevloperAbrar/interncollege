
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import UnauthorizedPage from './components/auth/UnauthorizedPage'

import StudentProgressPage from './pages/StudentProgressPage'
import LogsPage from './pages/LogsPage'
// ─── Dept Admin ───────────────────────────────────────────────────────────
import DeptAdminDashboard from './components/deptAdmin/DeptAdminDashboard'
import BranchManagement from './components/deptAdmin/BranchManagement'
import DeptMentorManagement from './components/deptAdmin/MentorManagement'

// ─── Admin ────────────────────────────────────────────────────────────────
import DepartmentManagement from './components/admin/DepartmentManagement'
import DeptAdminManagement from './components/admin/DeptAdminManagement'
import AdminDashboard from './components/admin/AdminDashboard'
import MentorManagement from './components/admin/MentorManagement'
import BulkUpload from './components/admin/BulkUpload'
import SystemOverview from './components/admin/SystemOverview'

// ─── Mentor ───────────────────────────────────────────────────────────────
import MentorDashboard from './components/mentor/MentorDashboard'
import AssignedStudents from './components/mentor/AssignedStudents'
import ReviewSubmissions from './components/mentor/ReviewSubmissions'
import ProgressMonitoring from './components/mentor/ProgressMonitoring'
import AddStudents from './components/mentor/AddStudents'

// ─── Student ──────────────────────────────────────────────────────────────
import StudentDashboard from './components/student/StudentDashboard'
import ChoiceForm from './components/student/ChoiceForm'
import InternshipForm from './components/student/InternshipForm'
import ProjectForm from './components/student/ProjectForm'
import MonthlySubmission from './components/student/MonthlySubmission'
import ProgressView from './components/student/ProgressView'
import RegistrationForm from './components/student/RegistrationForm'
import MPRSubmission from './components/student/MPRSubmission'
import FinalReportForm from './components/student/FinalReportForm'

// ─── Public Pages ─────────────────────────────────────────────────────────
import LandingPage from './landing page/Landingpage'
import Analytics from './landing page/Analytics'
import FeaturesPage from './pages/FeaturesPage'
import DeveloperPage from './pages/DeveloperPage'
import AboutPage from './pages/AboutPage'

// ─── Auth ─────────────────────────────────────────────────────────────────
import Login from './components/auth/Login'
import Adminlogin from './components/auth/AdminLogin'
import ProtectedRoute from './components/auth/ProtectedRoute'

// ─── Common ───────────────────────────────────────────────────────────────
import Header from './components/common/Header'
import Sidebar from './components/common/Sidebar'

// ─── Role → path map ──────────────────────────────────────────────────────
const ROLE_HOME = {
  admin: '/admin/dashboard',
  dept_admin: '/dept-admin/dashboard',
  mentor: '/mentor/dashboard',
  student: '/student/dashboard',
}

// ─── Layout wrapper ───────────────────────────────────────────────────────
const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Header />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  </div>
)

// ─── Landing wrapper ──────────────────────────────────────────────────────
const LandingWrapper = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) {
    const home = ROLE_HOME[user.role] || '/login'
    return <Navigate to={home} replace />
  }

  return <LandingPage onNavigateToLogin={() => navigate('/login')} />
}

// ─── App ──────────────────────────────────────────────────────────────────
function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  const userHome = user ? (ROLE_HOME[user.role] || '/login') : '/login'

  return (
    <Router>
      <Routes>

        {/* ── Public ───────────────────────────────────────────────── */}
        <Route path="/" element={<LandingWrapper />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/developer" element={<DeveloperPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={
          user ? <Navigate to={userHome} replace /> : <Login />
        } />
        <Route path="/admin-login" element={
          user ? <Navigate to={userHome} replace /> : <Adminlogin />
        } />

        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── Admin ────────────────────────────────────────────────── */}

        <Route path="/admin/logs" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><LogsPage /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/student-progress" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><StudentProgressPage /></AppLayout>
          </ProtectedRoute>
        } />

// Dept Admin
        <Route path="/dept-admin/student-progress" element={
          <ProtectedRoute allowedRoles={['dept_admin']}>
            <AppLayout><StudentProgressPage /></AppLayout>
          </ProtectedRoute>
        } />

// Mentor
        <Route path="/mentor/student-progress" element={
          <ProtectedRoute allowedRoles={['mentor']}>
            <AppLayout><StudentProgressPage /></AppLayout>
          </ProtectedRoute>
        } />

// Student
        <Route path="/student/progress" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><StudentProgressPage /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/mentors" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><MentorManagement /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/departments" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><DepartmentManagement /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/dept-admins" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><DeptAdminManagement /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/bulk-upload" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><BulkUpload /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/system-overview" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout><SystemOverview /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* ── Dept Admin ───────────────────────────────────────────── */}
        <Route path="/dept-admin/dashboard" element={
          <ProtectedRoute allowedRoles={['dept_admin']}>
            <AppLayout><DeptAdminDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dept-admin/branches" element={
          <ProtectedRoute allowedRoles={['dept_admin']}>
            <AppLayout><BranchManagement /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dept-admin/mentors" element={
          <ProtectedRoute allowedRoles={['dept_admin']}>
            <AppLayout><DeptMentorManagement /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dept-admin" element={<Navigate to="/dept-admin/dashboard" replace />} />

        {/* ── Mentor ───────────────────────────────────────────────── */}
        <Route path="/mentor/dashboard" element={
          <ProtectedRoute allowedRoles={['mentor']}>
            <AppLayout><MentorDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/mentor/students" element={
          <ProtectedRoute allowedRoles={['mentor']}>
            <AppLayout><AssignedStudents /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/mentor/submissions" element={
          <ProtectedRoute allowedRoles={['mentor']}>
            <AppLayout><ReviewSubmissions /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/mentor/monitoring" element={
          <ProtectedRoute allowedRoles={['mentor']}>
            <AppLayout><ProgressMonitoring /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/mentor/add-students" element={
          <ProtectedRoute allowedRoles={['mentor']}>
            <AppLayout><AddStudents /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/mentor" element={<Navigate to="/mentor/dashboard" replace />} />

        {/* ── Student ──────────────────────────────────────────────── */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><StudentDashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/choice" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><ChoiceForm /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/registration" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><RegistrationForm /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/mpr" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><MPRSubmission /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/final-report" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><FinalReportForm /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/internship" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><InternshipForm /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/project" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><ProjectForm /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/monthly" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><MonthlySubmission /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student/progress" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout><ProgressView /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

        {/* ── Catch-all ────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  )
}

export default App