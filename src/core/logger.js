/**
 * 🔍 SolAI Enterprise Logger
 * Professional logging system with multiple transports
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

class Logger {
  constructor(component = 'SolAI') {
    this.component = component;
    
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, component: comp, ...meta }) => {
          const componentName = comp || this.component;
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${componentName}] ${level}: ${message}${metaStr}`;
        })
      ),
      transports: [
        // Console output with colors
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, component: comp, ...meta }) => {
              const componentName = comp || this.component;
              const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
              return `${timestamp} [${componentName}] ${level}: ${message}${metaStr}`;
            })
          )
        }),
        
        // File output for all logs
        new winston.transports.File({
          filename: path.join(logsDir, 'solai.log'),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        }),
        
        // Error-specific file
        new winston.transports.File({
          filename: path.join(logsDir, 'solai-error.log'),
          level: 'error',
          maxsize: 5 * 1024 * 1024, // 5MB
          maxFiles: 3,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ]
    });

    // Handle uncaught exceptions and unhandled rejections
    this.logger.exceptions.handle(
      new winston.transports.File({
        filename: path.join(logsDir, 'solai-exceptions.log'),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 2
      })
    );

    this.logger.rejections.handle(
      new winston.transports.File({
        filename: path.join(logsDir, 'solai-rejections.log'),
        maxsize: 5 * 1024 * 1024,
        maxFiles: 2
      })
    );
  }

  // Convenience methods with automatic component context
  debug(message, meta = {}) {
    this.logger.debug(message, { component: this.component, ...meta });
  }

  info(message, meta = {}) {
    this.logger.info(message, { component: this.component, ...meta });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { component: this.component, ...meta });
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      }
    } : {};
    
    this.logger.error(message, { 
      component: this.component, 
      ...errorMeta, 
      ...meta 
    });
  }

  // Performance tracking
  startTimer(label) {
    const startTime = process.hrtime.bigint();
    return {
      end: (message = `${label} completed`) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to ms
        this.info(message, { 
          component: this.component,
          duration: `${duration.toFixed(2)}ms`,
          label 
        });
        return duration;
      }
    };
  }

  // Create child logger with different component name
  child(childComponent) {
    return new Logger(`${this.component}:${childComponent}`);
  }

  // Log conversation events
  conversation(sessionId, event, data = {}) {
    this.info(`Conversation ${event}`, {
      component: `${this.component}:Conversation`,
      sessionId: sessionId?.substring(0, 8) + '...',
      event,
      ...data
    });
  }

  // Log performance metrics
  performance(metric, value, unit = 'ms') {
    this.info(`Performance metric: ${metric}`, {
      component: `${this.component}:Performance`,
      metric,
      value,
      unit,
      timestamp: new Date().toISOString()
    });
  }

  // Log business events
  business(event, data = {}) {
    this.info(`Business event: ${event}`, {
      component: `${this.component}:Business`,
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Admin monitoring specific logging
  apiOptimization(intent, toolsCalled, duration, optimized = true) {
    this.info(`API optimization tracking`, {
      component: `${this.component}:APIOptimization`,
      intent,
      toolsCalled,
      duration: `${duration}ms`,
      optimized,
      timestamp: new Date().toISOString(),
      category: optimized ? 'optimized' : (toolsCalled === 0 ? 'conversational' : 'normal')
    });
  }

  businessLogic(eventType, data = {}) {
    this.info(`Business logic event: ${eventType}`, {
      component: `${this.component}:BusinessLogic`,
      eventType,
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  appointmentSafety(sessionId, action, details = {}) {
    this.warn(`Appointment safety check: ${action}`, {
      component: `${this.component}:AppointmentSafety`,
      sessionId: sessionId?.substring(0, 8) + '...',
      action,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  smartAssumption(sessionId, context, assumptions = []) {
    this.info(`Smart assumptions applied`, {
      component: `${this.component}:SmartAssumptions`,
      sessionId: sessionId?.substring(0, 8) + '...',
      context,
      assumptionsCount: assumptions.length,
      assumptions: assumptions.slice(0, 3), // Limit to first 3 for brevity
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = Logger;