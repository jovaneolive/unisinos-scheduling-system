import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * Protected route component that verifies user authentication and role
 * @param {Object} props - Component props
 * @param {string} props.role - Required role for accessing the route
 * @param {React.ReactNode} props.children - Child components
 */
const ProtectedRoute = ({ role, children }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check if user is authenticated
        const auth = authService.initAuth();
        
        if (!auth) {
          setIsAuthenticated(false);
          setHasRequiredRole(false);
          setIsVerifying(false);
          return;
        }
        
        // Verify token with server
        const userData = await authService.verifyToken();
        
        if (!userData) {
          setIsAuthenticated(false);
          setHasRequiredRole(false);
        } else {
          setIsAuthenticated(true);
          
          // Check user role if specific role is required
          if (role) {
            setHasRequiredRole(userData.role === role);
          } else {
            setHasRequiredRole(true);
          }
        }
      } catch (error) {
        console.error('Authentication verification error:', error);
        setIsAuthenticated(false);
        setHasRequiredRole(false);
        
        // Log user out if there was an authentication error
        authService.logout();
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyAuth();
  }, [role]);

  if (isVerifying) {
    // Return loading state while verifying
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasRequiredRole) {
    // Redirect based on user role if they don't have required role
    const userRole = authService.getUserRole();
    
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'professor':
        return <Navigate to="/professor/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // User is authenticated and has required role, render children
  return children;
};

export default ProtectedRoute; 