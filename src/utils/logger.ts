/**
 * Environment-Aware Logger Utility
 * Prevents sensitive data leakage in production via console.log
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    timestamp: string;
    level: LogLevel;
    environment: string;
}

const createLogContext = (level: LogLevel): LogContext => ({
    timestamp: new Date().toISOString(),
    level,
    environment: import.meta.env.MODE,
});

export const logger = {
    /**
     * Debug logs - only shown in development
     * Use for development debugging, never for production
     */
    debug: (...args: any[]): void => {
        if (import.meta.env.MODE === 'development') {
            const context = createLogContext('debug');
            console.debug(`[${context.timestamp}] [DEBUG]`, ...args);
        }
    },

    /**
     * Info logs - shown in all environments
     * Use for important application events
     */
    info: (...args: any[]): void => {
        const context = createLogContext('info');
        console.info(`[${context.timestamp}] [INFO]`, ...args);
    },

    /**
     * Warning logs - shown in all environments
     * Use for recoverable errors or deprecation notices
     */
    warn: (...args: any[]): void => {
        const context = createLogContext('warn');
        console.warn(`[${context.timestamp}] [WARN]`, ...args);
    },

    /**
     * Error logs - shown in all environments + sent to monitoring
     * Use for unrecoverable errors or critical issues
     */
    error: (...args: any[]): void => {
        const context = createLogContext('error');
        console.error(`[${context.timestamp}] [ERROR]`, ...args);

        // TODO: Send to Sentry in Phase 6
        if (import.meta.env.MODE === 'production') {
            // Sentry.captureException(args[0]);
        }
    },
};

// Development-only assertion helper
export const assert = (condition: boolean, message: string): void => {
    if (import.meta.env.MODE === 'development' && !condition) {
        logger.error('Assertion failed:', message);
        throw new Error(`Assertion failed: ${message}`);
    }
};
