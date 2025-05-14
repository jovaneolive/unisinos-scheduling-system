const winston = require('winston');
const path = require('path');

// Define log formats
const formats = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define the console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(
    ({ level, message, timestamp, ...metadata }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(metadata).length > 0 && metadata.stack !== undefined) {
        msg += `\n${metadata.stack}`;
      } else if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    }
  )
);

// Create a logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: formats,
  defaultMeta: { service: 'unisinos-scheduling-system' },
  transports: [
    // Write logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log')
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/rejections.log')
    })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
  }));
}

module.exports = logger; 