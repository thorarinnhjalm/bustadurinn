/**
 * Vitest Test Setup
 * Configures global test environment with Testing Library and custom matchers
 */

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// jsdom does not implement HTMLDialogElement.showModal/close
if (typeof HTMLDialogElement !== 'undefined') {
    HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
        this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
        this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
        if (!this.hasAttribute('open')) return;
        this.removeAttribute('open');
        if (returnValue !== undefined) this.returnValue = returnValue;
        this.dispatchEvent(new Event('close'));
    };
}

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock Firebase Auth
vi.mock('@/lib/firebase', () => ({
    auth: {
        currentUser: null,
        onAuthStateChanged: vi.fn(),
        signInWithEmailAndPassword: vi.fn(),
        createUserWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
    },
    db: {
        collection: vi.fn(),
        doc: vi.fn(),
    },
    storage: {
        ref: vi.fn(),
    },
}));

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
    value: {
        MODE: 'test',
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
    },
});
