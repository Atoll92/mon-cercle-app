/**
 * Logger utility that disables console logs in production
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

// Logger object with same interface as console
export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      originalConsole.log(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, even in production
    originalConsole.error(...args);
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      originalConsole.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      originalConsole.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      originalConsole.debug(...args);
    }
  },
};

// Override global console in production
export const initializeLogger = () => {
  if (!isDevelopment) {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    // Keep console.warn in production for important warnings
    console.warn = (...args) => {
      // Only log specific warnings in production
      const warningString = args.join(' ');
      if (warningString.includes('deprecation') || warningString.includes('security')) {
        originalConsole.warn(...args);
      }
    };
    // Always keep console.error for error tracking
  }
};

// Helper to log only in development
export const devLog = (...args) => {
  if (isDevelopment) {
    originalConsole.log(...args);
  }
};

// Helper to log errors with additional context
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  originalConsole.error('Application Error:', errorInfo);
  
  // In production, send to error tracking service
  if (!isDevelopment) {
    // TODO: Send to Sentry or similar service
    // Example: Sentry.captureException(error, { extra: context });
  }
};

export default logger;