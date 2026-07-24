/**
 * Environment-Aware Logger Utility
 * Prevents sensitive data leakage in production via console.log
 */

import * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// The production build strips every literal `console.*` call
// (vite.config.ts -> esbuild.drop). Reaching the real console through an
// alias survives that transform, so warn/error keep working in production —
// which is what the rest of the codebase (and CLAUDE.md) already assumed.
// `debug`/`info` deliberately keep using literal console.* so they DO get
// dropped from production bundles.
const consoleRef: Console | undefined =
    typeof globalThis !== 'undefined' ? (globalThis as any).console : undefined;

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
        consoleRef?.warn(`[${context.timestamp}] [WARN]`, ...args);
    },

    /**
     * Error logs - shown in all environments + sent to monitoring
     * Use for unrecoverable errors or critical issues
     */
    error: (...args: any[]): void => {
        const context = createLogContext('error');
        consoleRef?.error(`[${context.timestamp}] [ERROR]`, ...args);

        // Sentry is initialised in main.tsx; forward the first Error-like arg
        // so production failures are actually reportable somewhere.
        const candidate = args.find((a) => a instanceof Error);
        if (candidate) {
            Sentry.captureException(candidate);
        } else if (args.length > 0) {
            Sentry.captureMessage(args.map((a) => String(a)).join(' '), 'error');
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
