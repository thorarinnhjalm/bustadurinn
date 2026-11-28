/**
 * Contact Form - Simple form that sends email via Resend
 */

import { useId, useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { analytics } from '@/utils/analytics';
import { logger } from '@/utils/logger';
import { getUserMessage } from '@/utils/userMessages';

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const nameId = useId();
    const emailId = useId();
    const messageId = useId();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status === 'loading') return;
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            setStatus('success');
            setFormData({ name: '', email: '', message: '' });

            // Track in Google Analytics
            analytics.contactFormSubmitted('about_page');

            // Reset after 3 seconds
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error: unknown) {
            logger.error('Contact form error', error);
            setStatus('error');
            setErrorMessage(getUserMessage(error, 'Villa kom upp'));
        }
    };

    return (
        <div className="card max-w-lg">
            <h2 className="text-2xl font-serif mb-6">Hafðu samband</h2>

            <div role="status">
                {status === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <CheckCircle aria-hidden="true" className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-green-900">Skilaboð send!</p>
                            <p className="text-sm text-green-700 mt-1">Við svörum innan sólarhrings.</p>
                        </div>
                    </div>
                )}
            </div>

            <div role="alert">
                {status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertCircle aria-hidden="true" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-900">Villa</p>
                            <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" aria-busy={status === 'loading'}>
                <p className="text-sm text-stone-500">
                    Reitir merktir með <span aria-hidden="true">*</span><span className="sr-only">stjörnu</span> eru nauðsynlegir.
                </p>
                <div>
                    <label htmlFor={nameId} className="label">Nafn <span aria-hidden="true">*</span></label>
                    <input
                        id={nameId}
                        type="text"
                        autoComplete="name"
                        className="input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        readOnly={status === 'loading'}
                    />
                </div>

                <div>
                    <label htmlFor={emailId} className="label">Netfang <span aria-hidden="true">*</span></label>
                    <input
                        id={emailId}
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        className="input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        readOnly={status === 'loading'}
                    />
                </div>

                <div>
                    <label htmlFor={messageId} className="label">Skilaboð <span aria-hidden="true">*</span></label>
                    <textarea
                        id={messageId}
                        className="input min-h-[120px]"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        readOnly={status === 'loading'}
                        placeholder="Segðu okkur frá því sem er á hjarta þér..."
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                    aria-busy={status === 'loading'}
                >
                    {status === 'loading' ? (
                        <>Sendi...</>
                    ) : (
                        <>
                            <Send aria-hidden="true" className="w-4 h-4" />
                            Senda skilaboð
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
