import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Auth components
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout components
import AdminLayout from './components/layouts/AdminLayout';
import StudentLayout from './components/layouts/StudentLayout';
import ProfessorLayout from './components/layouts/ProfessorLayout';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import SubjectManagement from './pages/admin/SubjectManagement';
import EmailScheduling from './pages/admin/EmailScheduling';
import ScheduleSuggestions from './pages/admin/ScheduleSuggestions';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import SubjectInterests from './pages/student/SubjectInterests';

// Professor pages
import ProfessorDashboard from './pages/professor/Dashboard';
import SubjectAvailability from './pages/professor/SubjectAvailability';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="subjects" element={<SubjectManagement />} />
          <Route path="emails" element={<EmailScheduling />} />
          <Route path="schedules" element={<ScheduleSuggestions />} />
        </Route>

        {/* Student routes */}
        <Route path="/student" element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/student/dashboard" />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="interests" element={<SubjectInterests />} />
        </Route>

        {/* Professor routes */}
        <Route path="/professor" element={
          <ProtectedRoute role="professor">
            <ProfessorLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/professor/dashboard" />} />
          <Route path="dashboard" element={<ProfessorDashboard />} />
          <Route path="availability" element={<SubjectAvailability />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App; 