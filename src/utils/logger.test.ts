/**
 * Logger Utility Tests
 * Tests logging functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/utils/logger';

describe('logger utility', () => {
    let consoleSpy: any;

    beforeEach(() => {
        // Spy on console methods
        consoleSpy = {
            debug: vi.spyOn(console, 'debug').mockImplementation(() => { }),
            log: vi.spyOn(console, 'log').mockImplementation(() => { }),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
            error: vi.spyOn(console, 'error').mockImplementation(() => { }),
        };
    });

    afterEach(() => {
        // Restore console methods
        Object.values(consoleSpy).forEach((spy: any) => spy.mockRestore());
    });

    it('should have debug method', () => {
        expect(logger.debug).toBeDefined();
        expect(typeof logger.debug).toBe('function');
    });

    it('should have info method', () => {
        expect(logger.info).toBeDefined();
        expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
        expect(logger.warn).toBeDefined();
        expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
        expect(logger.error).toBeDefined();
        expect(typeof logger.error).toBe('function');
    });

    it('should log warnings', () => {
        logger.warn('test warning');
        expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log errors', () => {
        logger.error('test error');
        expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle multiple arguments in error logs', () => {
        const errorData = { code: 500, message: 'Server error' };
        logger.error('API failed', errorData);
        expect(consoleSpy.error).toHaveBeenCalled();
        const call = consoleSpy.error.mock.calls[0];
        // Should include timestamp (ISO format) and level
        expect(call[0]).toMatch(/\[.*\] \[ERROR\]/);
        expect(call).toContain('API failed');
        expect(call).toContain(errorData);
    });

    it('should format error log output correctly', () => {
        logger.error('Critical failure');
        const call = consoleSpy.error.mock.calls[0];
        expect(call[0]).toContain('[ERROR]');
        expect(call[1]).toBe('Critical failure');
    });
});
