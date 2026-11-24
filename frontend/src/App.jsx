import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Public Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Candidate Portal Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateProfile from './pages/candidate/CandidateProfile';
import CandidateResumeUpload from './pages/candidate/CandidateResumeUpload';
import CandidateJobs from './pages/candidate/CandidateJobs';
import CandidateApplications from './pages/candidate/CandidateApplications';
import CandidateInterviews from './pages/candidate/CandidateInterviews';

// Admin Portal Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminJobs from './pages/admin/AdminJobs';
import AdminBulkUpload from './pages/admin/AdminBulkUpload';
import AdminCandidates from './pages/admin/AdminCandidates';
import AdminAIMatching from './pages/admin/AdminAIMatching';
import AdminSemanticSearch from './pages/admin/AdminSemanticSearch';
import AdminShortlist from './pages/admin/AdminShortlist';
import AdminInterviews from './pages/admin/AdminInterviews';

// Interviewer Portal Pages
import InterviewerDashboard from './pages/interviewer/InterviewerDashboard';
import InterviewerAssigned from './pages/interviewer/InterviewerAssigned';
import InterviewerFeedback from './pages/interviewer/InterviewerFeedback';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}/dashboard`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontSize: '13px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Candidate Portal */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute roles={['candidate']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<CandidateDashboard />} />
            <Route path="profile" element={<CandidateProfile />} />
            <Route path="resume" element={<CandidateResumeUpload />} />
            <Route path="jobs" element={<CandidateJobs />} />
            <Route path="applications" element={<CandidateApplications />} />
            <Route path="interviews" element={<CandidateInterviews />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Admin Recruitment Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="resumes" element={<AdminBulkUpload />} />
            <Route path="candidates" element={<AdminCandidates />} />
            <Route path="matching" element={<AdminAIMatching />} />
            <Route path="search" element={<AdminSemanticSearch />} />
            <Route path="shortlist" element={<AdminShortlist />} />
            <Route path="interviews" element={<AdminInterviews />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Interviewer Portal */}
          <Route
            path="/interviewer"
            element={
              <ProtectedRoute roles={['interviewer']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<InterviewerDashboard />} />
            <Route path="interviews" element={<InterviewerAssigned />} />
            <Route path="feedback" element={<InterviewerFeedback />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
