/**
 * Error Boundary Tests
 * Tests graceful error handling and user-facing error UI
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/utils/logger';

// Mock logger
vi.mock('@/utils/logger', () => ({
    logger: {
        error: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}));

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error message');
    }
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Suppress console errors in test output
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should render children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error UI when child component throws', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should show Icelandic error message
        expect(screen.getByText(/Eitthvað fór úrskeiðis/i)).toBeInTheDocument();
    });

    it('should log errors to logger utility', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('Component Error Boundary'),
            expect.objectContaining({
                error: expect.stringContaining('Test error message'),
            })
        );
    });

    it('should show error recovery buttons', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should have buttons for recovery
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2); // "Reyna aftur" and "Fara heim"
    });
});
