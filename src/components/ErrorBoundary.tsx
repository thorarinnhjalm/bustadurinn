/**
 * Global Error Boundary Component
 * Catches React component errors and displays fallback UI
 */

import React, { Component, type ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log error details
        logger.error('Component Error Boundary caught an error:', {
            error: error.toString(),
            componentStack: errorInfo.componentStack,
        });

        this.setState({
            error,
            errorInfo,
        });

        // TODO: Send to Sentry in Phase 6
        // if (import.meta.env.MODE === 'production') {
        //   Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
        // }
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen bg-bone flex items-center justify-center p-6">
                    <div className="card max-w-lg text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-serif mb-4">Eitthvað fór úrskeiðis</h2>
                        <p className="text-grey-dark mb-6">
                            Því miður kom upp villa í kerfinu. Við höfum verið látin vita og
                            lögum þetta eins fljótt og kostur er.
                        </p>

                        {import.meta.env.MODE === 'development' && this.state.error && (
                            <details className="text-left mb-6 bg-grey-light p-4 rounded">
                                <summary className="cursor-pointer font-semibold mb-2">
                                    Tæknilegar upplýsingar
                                </summary>
                                <pre className="text-xs overflow-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="btn btn-secondary"
                            >
                                Reyna aftur
                            </button>
                            <button
                                onClick={() => (window.location.href = '/')}
                                className="btn btn-primary"
                            >
                                Fara á forsíðu
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
