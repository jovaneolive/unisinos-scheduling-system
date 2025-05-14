import axios from 'axios';
import jwt_decode from 'jwt-decode';

// API URL
const API_URL = '/api/auth';

/**
 * Initialize authentication by checking for token in localStorage
 * @returns {Object|null} The current user if logged in, or null
 */
const initAuth = () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    try {
      // Verify token is valid and not expired
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired, remove it
        logout();
        return null;
      }
      
      // Set token in axios defaults
      setAuthToken(token);
      
      return {
        token,
        user: decoded
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      logout();
      return null;
    }
  }
  
  return null;
};

/**
 * Set authentication token in axios headers
 * @param {string} token - JWT token
 */
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

/**
 * Login with token
 * @param {string} token - JWT token
 * @returns {Object} Auth data
 */
const loginWithToken = (token) => {
  localStorage.setItem('token', token);
  setAuthToken(token);
  
  const decoded = jwt_decode(token);
  
  return {
    token,
    user: decoded
  };
};

/**
 * Verify current token and get user data
 * @returns {Promise<Object>} User data
 */
const verifyToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/verify`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Logout user
 */
const logout = async () => {
  try {
    // Call logout endpoint if user is authenticated
    if (axios.defaults.headers.common['Authorization']) {
      await axios.post(`${API_URL}/logout`);
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
  
  // Remove token from localStorage and axios headers
  localStorage.removeItem('token');
  setAuthToken(null);
};

/**
 * Get login URL for SAML authentication
 * @param {string} redirectTo - URL to redirect after login
 * @returns {string} Login URL
 */
const getSamlLoginUrl = (redirectTo) => {
  const baseUrl = `${API_URL}/saml`;
  
  if (redirectTo) {
    return `${baseUrl}?redirectTo=${encodeURIComponent(redirectTo)}`;
  }
  
  return baseUrl;
};

/**
 * Get user role
 * @returns {string|null} User role or null if not logged in
 */
const getUserRole = () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    try {
      const decoded = jwt_decode(token);
      return decoded.role;
    } catch (error) {
      return null;
    }
  }
  
  return null;
};

const authService = {
  initAuth,
  loginWithToken,
  verifyToken,
  logout,
  getSamlLoginUrl,
  getUserRole
};

export default authService; 