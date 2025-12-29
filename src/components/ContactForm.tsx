/**
 * Contact Form - Simple form that sends email via Resend
 */

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { analytics } from '@/utils/analytics';

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Villa kom upp');
        }
    };

    return (
        <div className="card max-w-lg">
            <h2 className="text-2xl font-serif mb-6">Hafðu samband</h2>

            {status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-green-900">Skilaboð send!</p>
                        <p className="text-sm text-green-700 mt-1">Við svörum innan sólarhrings.</p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-900">Villa</p>
                        <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">Nafn</label>
                    <input
                        type="text"
                        className="input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={status === 'loading'}
                    />
                </div>

                <div>
                    <label className="label">Netfang</label>
                    <input
                        type="email"
                        className="input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={status === 'loading'}
                    />
                </div>

                <div>
                    <label className="label">Skilaboð</label>
                    <textarea
                        className="input min-h-[120px]"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        disabled={status === 'loading'}
                        placeholder="Segðu okkur frá því sem er á hjarta þér..."
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                    disabled={status === 'loading'}
                >
                    {status === 'loading' ? (
                        <>Sending...</>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Senda skilaboð
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
