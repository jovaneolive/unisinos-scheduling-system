const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const logger = require('../../config/logger');

/**
 * Authentication middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token não fornecido ou formato inválido.'
      });
    }
    
    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado. Usuário não encontrado.'
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Sua conta está desativada.'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Add user info to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado.'
      });
    } else {
      logger.error(`Auth middleware error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro na autenticação.',
        error: error.message
      });
    }
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} roles - Allowed role(s)
 * @returns {Function} Middleware function
 */
const roleMiddleware = (roles) => {
  // Convert single role to array
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    try {
      // Check if user has the required role
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você não tem permissão para esta operação.'
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Role middleware error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro na verificação de permissões.',
        error: error.message
      });
    }
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware
}; 