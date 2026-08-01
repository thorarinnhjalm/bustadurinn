import * as Sentry from '@sentry/react';
import SEO from '@/components/SEO';

export default function SentryTestPage() {
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
            alert('Exception captured and sent to Sentry! Check your Sentry dashboard.');
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

                alert('Performance span created! Check Sentry Performance monitoring.');
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
            <h1 style={{ marginBottom: '20px' }}>Sentry Test Page</h1>

            <div style={{
                backgroundColor: '#f5f5f5',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h2 style={{ marginTop: 0 }}>Test Sentry Integration</h2>
                <p>Click the buttons below to test different Sentry features:</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button
                    onClick={triggerError}
                    style={{
                        padding: '15px 30px',
                        fontSize: '16px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    1. Trigger Uncaught Error (Will crash the page)
                </button>

                <button
                    onClick={triggerCaptureException}
                    style={{
                        padding: '15px 30px',
                        fontSize: '16px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    2. Capture Exception (Safe - won't crash)
                </button>

                <button
                    onClick={testPerformanceSpan}
                    style={{
                        padding: '15px 30px',
                        fontSize: '16px',
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    3. Test Performance Monitoring
                </button>
            </div>

            <div style={{
                marginTop: '30px',
                padding: '15px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px'
            }}>
                <h3 style={{ marginTop: 0 }}>What to check in Sentry:</h3>
                <ul>
                    <li><strong>Issues:</strong> Errors will appear in the Issues tab</li>
                    <li><strong>Performance:</strong> Spans will appear in the Performance tab</li>
                    <li><strong>Replays:</strong> Session replays (if enabled) will show user interactions</li>
                </ul>
            </div>
        </div>
    );
}
