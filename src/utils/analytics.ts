/**
 * Google Analytics Event Tracking Helper
 * Track custom events in GA4
 */

import { logger } from './logger';

// Declare fbq function for TypeScript
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
        fbq?: (...args: any[]) => void;
    }
}

export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    // Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, eventParams);
    }

    // Facebook Pixel
    if (typeof window !== 'undefined' && window.fbq) {
        // Map GA4 events to standard Facebook events where possible
        if (eventName === 'signup_completed') {
            window.fbq('track', 'CompleteRegistration');
        } else if (eventName === 'purchase' || eventName === 'subscribe') {
            window.fbq('track', 'Purchase', { currency: 'ISK', value: eventParams?.value || 0 });
        } else if (eventName === 'contact_form_submitted') {
            window.fbq('track', 'Contact');
        } else {
            // Default custom event
            window.fbq('trackCustom', eventName, eventParams);
        }
    }

    logger.debug('Analytics Event:', eventName, eventParams);
};

// Common events
export const analytics = {
    // Signup / Auth
    signupStarted: () => trackEvent('signup_started'),
    signupCompleted: (method?: string) => trackEvent('signup_completed', { method }),
    loginCompleted: (method?: string) => trackEvent('login', { method }),

    // Contact
    contactFormSubmitted: (source?: string) => trackEvent('contact_form_submitted', { source }),

    // Bookings
    bookingCreated: (type?: string) => trackEvent('booking_created', { booking_type: type }),
    bookingViewed: () => trackEvent('booking_viewed'),

    // Engagement
    featureViewed: (feature: string) => trackEvent('feature_viewed', { feature_name: feature }),
    pricingViewed: () => trackEvent('pricing_viewed'),
    sandboxAccessed: () => trackEvent('sandbox_accessed'),

    // Onboarding Funnel
    onboardingStep: (step: string) => trackEvent('onboarding_step', { step_name: step }),
    onboardingCompleted: () => {
        trackEvent('onboarding_completed');
        trackEvent('trial_started'); // High-level conversion
    },

    // Conversion
    trialStarted: () => trackEvent('trial_started'),
    subscribed: (plan: 'monthly' | 'annual') => trackEvent('subscribe', { plan }),

    // Funnel & Errors
    loginStarted: (method?: string) => trackEvent('login_started', { method }),
    error: (context: string, message: string, code?: string) => trackEvent('error', { context, message, code }),
    funnelDropoff: (step: string, reason?: string) => trackEvent('funnel_dropoff', { step_name: step, reason }),

    // Generic
    track: (eventName: string, params?: Record<string, any>) => trackEvent(eventName, params),
};
