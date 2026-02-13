/**
 * UTM Parameter Tracking Utility
 * Captures marketing attribution data from URL parameters
 */

import * as Sentry from '@sentry/react';

export interface UTMParams {
    utm_source?: string;      // e.g., 'facebook', 'google'
    utm_medium?: string;       // e.g., 'cpc', 'social', 'email'
    utm_campaign?: string;     // e.g., 'summer_promo_2025'
    utm_term?: string;         // Keywords for paid search
    utm_content?: string;      // A/B test variations
    captured_at: string;       // ISO timestamp
    landing_page?: string;     // Where they landed
}

const UTM_STORAGE_KEY = 'utm_params';

/**
 * Extract UTM parameters from URL query string
 */
function extractUTMFromURL(): UTMParams | null {
    const urlParams = new URLSearchParams(window.location.search);

    const params: Partial<UTMParams> = {
        utm_source: urlParams.get('utm_source') || undefined,
        utm_medium: urlParams.get('utm_medium') || undefined,
        utm_campaign: urlParams.get('utm_campaign') || undefined,
        utm_term: urlParams.get('utm_term') || undefined,
        utm_content: urlParams.get('utm_content') || undefined,
    };

    // Check if at least one UTM parameter exists
    const hasUTM = Object.values(params).some(val => val !== undefined);

    if (hasUTM) {
        return {
            ...params,
            captured_at: new Date().toISOString(),
            landing_page: window.location.pathname,
        } as UTMParams;
    }

    return null;
}

/**
 * Capture UTM parameters from the current URL and store them in sessionStorage
 * Call this on app initialization
 */
export function captureUTMParams(): void {
    try {
        const utmParams = extractUTMFromURL();

        if (utmParams) {
            sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
            console.log('UTM params captured:', utmParams);
        }
    } catch (error) {
        console.error('Error capturing UTM params:', error);
    }
}

/**
 * Retrieve stored UTM parameters from sessionStorage
 * Returns null if no UTM data exists
 */
export function getStoredUTMParams(): UTMParams | null {
    try {
        const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error retrieving UTM params:', error);
    }
    return null;
}

/**
 * Clear stored UTM parameters
 * Useful after user signup is complete
 */
export function clearUTMParams(): void {
    try {
        sessionStorage.removeItem(UTM_STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing UTM params:', error);
    }
}

/**
 * Send UTM parameters to Sentry as context
 * This helps correlate errors with specific campaigns
 */
export function sendUTMToSentry(): void {
    try {
        const utmParams = getStoredUTMParams();

        if (utmParams) {
            Sentry.setContext('marketing', {
                utm_source: utmParams.utm_source,
                utm_medium: utmParams.utm_medium,
                utm_campaign: utmParams.utm_campaign,
                utm_term: utmParams.utm_term,
                utm_content: utmParams.utm_content,
                landing_page: utmParams.landing_page,
                captured_at: utmParams.captured_at,
            });
        }
    } catch (error) {
        console.error('Error sending UTM to Sentry:', error);
    }
}
