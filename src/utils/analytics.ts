/**
 * Google Analytics Event Tracking Helper
 * Track custom events in GA4
 */

import { logger } from './logger';

// Declare gtag function for TypeScript
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
    }
}

export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, eventParams);
        logger.debug('GA Event:', eventName, eventParams);
    }
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
};
