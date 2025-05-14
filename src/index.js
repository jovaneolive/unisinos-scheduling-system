require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const session = require('express-session');

const { connectDB } = require('./config/database');
const logger = require('./config/logger');

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'unisinos-scheduling-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const User = require('./models/User');
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Routes
app.use('/api/auth', require('./api/routes/auth.routes'));
app.use('/api/admin', require('./api/routes/admin.routes'));
app.use('/api/students', require('./api/routes/student.routes'));
app.use('/api/professors', require('./api/routes/professor.routes'));

// Serve static files from the React frontend app if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    }
  });
});

// Setup task to process scheduled emails
const emailService = require('./services/EmailService');
const setupEmailProcessing = () => {
  const processEmails = async () => {
    try {
      await emailService.processScheduledEmails();
    } catch (error) {
      logger.error(`Error in email processing job: ${error.message}`);
    }
  };
  
  // Process emails every 15 minutes
  setInterval(processEmails, 15 * 60 * 1000);
  
  // Also process immediately on startup
  processEmails();
  
  logger.info('Email processing job scheduled');
};

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  setupEmailProcessing();
}); 