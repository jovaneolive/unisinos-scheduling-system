const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: SamlStrategy } = require('passport-saml');
const { User } = require('../../models');
const logger = require('../../config/logger');

/**
 * Controller for authentication operations
 */
class AuthController {
  constructor() {
    this.setupSamlStrategy();
  }

  /**
   * Setup SAML authentication strategy
   */
  setupSamlStrategy() {
    try {
      const samlOptions = {
        callbackUrl: process.env.SAML_CALLBACK_URL,
        entryPoint: process.env.SAML_ENTRY_POINT,
        issuer: process.env.SAML_ISSUER,
        cert: process.env.SAML_CERT,
        acceptedClockSkewMs: 5000,
        disableRequestedAuthnContext: true
      };

      passport.use(
        new SamlStrategy(samlOptions, async (profile, done) => {
          try {
            // Extract user info from SAML profile
            const email = profile.email || profile['urn:oid:0.9.2342.19200300.100.1.3'];
            const name = profile.displayName || profile['urn:oid:2.16.840.1.113730.3.1.241'];
            const role = this.determineUserRole(email);
            const samlId = profile.nameID || profile.nameId;

            if (!email || !samlId) {
              return done(null, false, {
                message: 'Informações incompletas no perfil SAML'
              });
            }

            // Find or create user
            let user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
              // Update SAML ID if not already set
              if (!user.samlId) {
                user.samlId = samlId;
                await user.save();
              }
            } else {
              // Create new user
              user = new User({
                email: email.toLowerCase(),
                name: name || email.split('@')[0],
                role,
                samlId
              });
              await user.save();
              logger.info(`New user created via SAML: ${user.email} (${user.role})`);
            }

            // Check if user is active
            if (!user.isActive) {
              return done(null, false, {
                message: 'Conta desativada. Entre em contato com o administrador.'
              });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            return done(null, user);
          } catch (error) {
            logger.error(`SAML authentication error: ${error.message}`);
            return done(error);
          }
        })
      );

      logger.info('SAML strategy configured successfully');
    } catch (error) {
      logger.error(`Error setting up SAML strategy: ${error.message}`);
    }
  }

  /**
   * Determine user role based on email domain and pattern
   * @param {string} email - User email
   * @returns {string} User role
   */
  determineUserRole(email) {
    if (!email) return 'student';

    const lowerEmail = email.toLowerCase();

    // Check for admin emails
    if (lowerEmail.includes('admin') || lowerEmail.includes('coord')) {
      return 'admin';
    }

    // Check for professor emails
    // Professors typically have @unisinos.br (not .edu)
    if (lowerEmail.endsWith('@unisinos.br') && !lowerEmail.endsWith('edu.unisinos.br')) {
      return 'professor';
    }

    // Default to student
    return 'student';
  }

  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Initiate SAML login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  samlLogin(req, res, next) {
    passport.authenticate('saml', {
      successRedirect: '/api/auth/saml/success',
      failureRedirect: '/api/auth/saml/failure'
    })(req, res, next);
  }

  /**
   * Handle SAML callback
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  samlCallback(req, res, next) {
    passport.authenticate('saml', async (err, user, info) => {
      try {
        if (err) {
          logger.error(`SAML callback error: ${err.message}`);
          return res.redirect('/login?error=auth_error');
        }

        if (!user) {
          return res.redirect(`/login?error=${encodeURIComponent(info.message || 'Unknown error')}`);
        }

        // Generate JWT token
        const token = this.generateToken(user);

        // Store token in session for the success endpoint to use
        req.session.jwt = token;

        // Redirect to success endpoint
        return res.redirect('/api/auth/saml/success');
      } catch (error) {
        logger.error(`SAML callback processing error: ${error.message}`);
        return res.redirect('/login?error=server_error');
      }
    })(req, res, next);
  }

  /**
   * Handle successful SAML login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  samlSuccess(req, res) {
    try {
      // Get token from session
      const token = req.session.jwt;
      
      // Clear token from session (not needed anymore)
      delete req.session.jwt;
      
      // Check for redirect URL from query params
      const redirectTo = req.query.redirectTo || this.getDefaultRedirectByRole(req.user.role);
      
      // Redirect to frontend with token
      return res.redirect(`${process.env.FRONTEND_URL}${redirectTo}?token=${token}`);
    } catch (error) {
      logger.error(`SAML success processing error: ${error.message}`);
      return res.redirect('/login?error=redirect_error');
    }
  }

  /**
   * Handle failed SAML login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  samlFailure(req, res) {
    return res.redirect('/login?error=authentication_failed');
  }

  /**
   * Get default redirect URL based on user role
   * @param {string} role - User role
   * @returns {string} Redirect URL
   */
  getDefaultRedirectByRole(role) {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'professor':
        return '/professor/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/login';
    }
  }

  /**
   * Verify token and return user info
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  verifyToken(req, res) {
    try {
      // User should be attached to request by auth middleware
      const { _id, name, email, role } = req.user;
      
      return res.status(200).json({
        success: true,
        data: {
          id: _id,
          name,
          email,
          role
        }
      });
    } catch (error) {
      logger.error(`Verify token error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar token',
        error: error.message
      });
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logout(req, res) {
    try {
      req.logout();
      return res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao realizar logout',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController(); 