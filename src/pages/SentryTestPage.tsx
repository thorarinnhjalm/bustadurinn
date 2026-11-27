import { useState } from 'react';
import * as Sentry from '@sentry/react';
import SEO from '@/components/SEO';

export default function SentryTestPage() {
    const [status, setStatus] = useState('');

    const triggerError = () => {
        // This will trigger a Sentry error
        throw new Error('Sentry Test Error - If you see this in Sentry, setup is successful!');
    };

    const triggerCaptureException = () => {
        try {
            // Simulate an error
            throw new Error('Manually captured Sentry test exception');
        } catch (error) {
            Sentry.captureException(error);
            setStatus('Undantekning send til Sentry. Skoðaðu Sentry-stjórnborðið.');
        }
    };

    const testPerformanceSpan = () => {
        Sentry.startSpan(
            {
                op: 'ui.click',
                name: 'Test Button Click - Performance Monitoring',
            },
            (span) => {
                span.setAttribute('test', 'performance-monitoring');
                span.setAttribute('timestamp', new Date().toISOString());

                // Simulate some work
                const start = Date.now();
                while (Date.now() - start < 100) {
                    // Busy wait for 100ms
                }

                setStatus('Frammistöðuspan búið til. Skoðaðu Performance í Sentry.');
            }
        );
    };

    return (
        <div style={{
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Internal diagnostics page — crawlable and indexable until now. */}
            <SEO
                title="Sentry test"
                description="Innri prófunarsíða."
                noIndex
            />
            <h1 style={{ marginBottom: '20px' }}>Sentry prófunarsíða</h1>

            <div style={{
                backgroundColor: '#f5f5f5',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h2 style={{ marginTop: 0 }}>Prófa Sentry-tengingu</h2>
                <p>Smelltu á hnappana hér að neðan til að prófa mismunandi Sentry-eiginleika:</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button
                    type="button"
                    onClick={triggerError}
                    style={{
                        padding: '15px 30px',
                        fontSize: '16px',
                        backgroundColor: '#b42318',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    1. Kasta ófönginni villu (síðan hrynur)
                </button>

                <button
                    type="button"
                    onClick={triggerCaptureException}
                    style={{
                        padding: '15px 30px',
                        fontSize: '16px',
                        backgroundColor: '#1d4ed8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    2. Senda undantekningu (örugg, hrynur ekki)
                </button>

                <button
                    type="button"
                    onClick={testPerformanceSpan}
                    style={{
                        padding: '15px 30px',
                        fontSize: '16px',
                        backgroundColor: '#166534',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    3. Prófa frammistöðumælingu
                </button>
            </div>

            <p role="status" style={{ marginTop: '20px', minHeight: '1.5em' }}>{status}</p>

            <div style={{
                marginTop: '30px',
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px'
            }}>
                <h3 style={{ marginTop: 0 }}>Hvað á að skoða í Sentry:</h3>
                <ul>
                    <li><strong>Issues:</strong> Villur birtast undir Issues</li>
                    <li><strong>Performance:</strong> Span birtast undir Performance</li>
                    <li><strong>Replays:</strong> Upptökur af notkun (ef virkar) sýna aðgerðir notanda</li>
                </ul>
            </div>
        </div>
    );
}
