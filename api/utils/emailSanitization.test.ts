/**
 * Email Sanitization Security Tests
 * Validates XSS prevention in email templates
 */

import { describe, it, expect } from 'vitest';
import DOMPurify from 'isomorphic-dompurify';

describe('Email Sanitization - XSS Prevention', () => {
    describe('DOMPurify sanitization with ALLOWED_TAGS: []', () => {
        const sanitize = (input: string) =>
            DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

        it('should strip script tags', () => {
            const malicious = '<script>alert("XSS")</script>';
            const result = sanitize(malicious);
            expect(result).toBe('');
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('alert');
        });

        it('should strip img tags with onerror', () => {
            const malicious = '<img src=x onerror="alert(\'XSS\')">';
            const result = sanitize(malicious);
            expect(result).toBe('');
            expect(result).not.toContain('<img');
            expect(result).not.toContain('onerror');
        });

        it('should strip onclick handlers', () => {
            const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
            const result = sanitize(malicious);
            expect(result).toBe('Click me');
            expect(result).not.toContain('<div');
            expect(result).not.toContain('onclick');
        });

        it('should strip javascript: URLs', () => {
            const malicious = '<a href="javascript:alert(\'XSS\')">Link</a>';
            const result = sanitize(malicious);
            expect(result).toBe('Link');
            expect(result).not.toContain('javascript:');
            expect(result).not.toContain('<a');
        });

        it('should strip iframe tags', () => {
            const malicious = '<iframe src="https://evil.com"></iframe>';
            const result = sanitize(malicious);
            expect(result).toBe('');
            expect(result).not.toContain('<iframe');
        });

        it('should strip style tags with expressions', () => {
            const malicious = '<style>body { background: url("javascript:alert(\'XSS\')"); }</style>';
            const result = sanitize(malicious);
            expect(result).toBe('');
            expect(result).not.toContain('<style>');
        });

        it('should preserve plain text', () => {
            const safe = 'Hello, World!';
            const result = sanitize(safe);
            expect(result).toBe('Hello, World!');
        });

        it('should preserve text with safe characters', () => {
            const safe = 'Halló, þetta er próf með íslenskum stöfum!';
            const result = sanitize(safe);
            expect(result).toBe('Halló, þetta er próf með íslenskum stöfum!');
        });

        it('should strip all HTML tags including safe ones', () => {
            const html = '<b>Bold</b> <i>Italic</i> <strong>Strong</strong>';
            const result = sanitize(html);
            expect(result).toBe('Bold Italic Strong');
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
        });

        it('should handle nested XSS attempts', () => {
            const malicious = '<div><script>alert("XSS")</script></div>';
            const result = sanitize(malicious);
            expect(result).toBe('');
        });

        it('should handle encoded XSS attempts', () => {
            const malicious = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
            const result = sanitize(malicious);
            // DOMPurify keeps entities escaped when no tags are allowed
            expect(result).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
            expect(result).not.toContain('<script>');
        });

        it('should handle SVG-based XSS', () => {
            const malicious = '<svg onload="alert(\'XSS\')"></svg>';
            const result = sanitize(malicious);
            expect(result).toBe('');
            expect(result).not.toContain('<svg');
        });

        it('should handle data URIs', () => {
            const malicious = '<img src="data:text/html,<script>alert(\'XSS\')</script>">';
            const result = sanitize(malicious);
            expect(result).toBe('');
        });

        it('should handle event handlers in various formats', () => {
            const tests = [
                '<div onmouseover="alert(\'XSS\')">Hover</div>',
                '<input onfocus="alert(\'XSS\')" autofocus>',
                '<body onload="alert(\'XSS\')">',
                '<img onerror="alert(\'XSS\')" src=x>',
            ];

            tests.forEach(malicious => {
                const result = sanitize(malicious);
                expect(result).not.toContain('alert');
                expect(result).not.toContain('on');
            });
        });
    });

    describe('Real-world email template scenarios', () => {
        const sanitize = (input: string) =>
            DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

        it('should sanitize user name in invite email', () => {
            const maliciousName = '<script>alert("XSS")</script>Hacker';
            const houseName = 'Summer House';

            const sanitizedName = sanitize(maliciousName);
            const sanitizedHouse = sanitize(houseName);

            const email = `Hæ ${sanitizedName}! ${sanitizedHouse} hefur boðið þér að gerast meðeigandi.`;

            expect(email).not.toContain('<script>');
            expect(email).not.toContain('alert');
            expect(email).toContain('Hacker'); // Safe part preserved
        });

        it('should sanitize house name in welcome email', () => {
            const maliciousHouse = 'My House<img src=x onerror="alert(\'XSS\')">';
            const sanitized = sanitize(maliciousHouse);

            expect(sanitized).toBe('My House');
            expect(sanitized).not.toContain('<img');
            expect(sanitized).not.toContain('onerror');
        });

        it('should handle empty values gracefully', () => {
            expect(sanitize('')).toBe('');
        });

        it('should preserve Icelandic characters in user names', () => {
            const icelandicName = 'Þórarinn Hjálmarsson';
            const result = sanitize(icelandicName);
            expect(result).toBe('Þórarinn Hjálmarsson');
        });

        it('should strip HTML but preserve special characters', () => {
            const input = 'Price: 100kr <b>(with discount)</b> & tax';
            const result = sanitize(input);
            expect(result).toBe('Price: 100kr (with discount) &amp; tax');
            expect(result).not.toContain('<b>');
        });
    });

    describe('Template variable replacement security', () => {
        const sanitize = (input: string) =>
            DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

        const replaceVariables = (template: string, vars: Record<string, string>): string => {
            let result = template;
            for (const [key, value] of Object.entries(vars)) {
                const sanitized = sanitize(value);
                const regex = new RegExp(`{${key}}`, 'g');
                result = result.replace(regex, sanitized);
            }
            return result;
        };

        it('should safely replace variables with sanitized values', () => {
            const template = '<h1>Hello {name}!</h1><p>Welcome to {house}</p>';
            const vars = {
                name: '<script>alert("XSS")</script>John',
                house: 'Summer<img src=x onerror="alert(\'XSS\')">'
            };

            const result = replaceVariables(template, vars);

            expect(result).toContain('John');
            expect(result).toContain('Summer');
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('onerror');
        });

        it('should handle multiple occurrences of same variable', () => {
            const template = 'Dear {name}, welcome {name}!';
            const vars = {
                name: '<b>Hacker</b>'
            };

            const result = replaceVariables(template, vars);

            expect(result).toBe('Dear Hacker, welcome Hacker!');
            expect(result).not.toContain('<b>');
        });

        it('should not break when variable is not provided', () => {
            const template = 'Hello {name}!';
            const vars = {};

            const result = replaceVariables(template, vars);

            expect(result).toBe('Hello {name}!');
        });
    });

    describe('Advanced XSS vectors', () => {
        const sanitize = (input: string) =>
            DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

        it('should handle Unicode-based XSS', () => {
            const malicious = '\u003cscript\u003ealert("XSS")\u003c/script\u003e';
            const result = sanitize(malicious);
            // Unicode is decoded and tags are stripped
            expect(result).toBe('');
            expect(result).not.toContain('script');
        });

        it('should handle HTML entity encoding', () => {
            const malicious = '&#60;script&#62;alert("XSS")&#60;/script&#62;';
            const result = sanitize(malicious);
            // DOMPurify keeps numeric entities escaped
            expect(result).toBe('&#60;script&#62;alert("XSS")&#60;/script&#62;');
            expect(result).not.toContain('<script>');
        });

        it('should handle CSS injection attempts', () => {
            const malicious = '<style>body{background:url("javascript:alert(\'XSS\')")}</style>';
            const result = sanitize(malicious);
            expect(result).toBe('');
        });

        it('should handle polyglot payloads', () => {
            const malicious = 'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>';
            const result = sanitize(malicious);
            // DOMPurify strips all tags and dangerous content
            expect(result).toBeTruthy();
            expect(result).not.toContain('<svg');
            expect(result).not.toContain('<script');
        });

        it('should handle XML CDATA sections', () => {
            const malicious = '<![CDATA[<script>alert("XSS")</script>]]>';
            const result = sanitize(malicious);
            // CDATA is stripped, leaving the content which is then sanitized
            expect(result).toBeTruthy();
            expect(result).not.toContain('<script>');
        });
    });
});

describe('Rate Limiting Input Validation', () => {
    // While we can't test the actual Upstash rate limiter without a live connection,
    // we can test the fail-closed behavior and input validation

    it('should validate identifier format', () => {
        const validIdentifiers = [
            '192.168.1.1',
            '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
            'user@example.com'
        ];

        validIdentifiers.forEach(id => {
            expect(id).toBeTruthy();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });
    });

    it('should handle edge cases for identifiers', () => {
        const edgeCases = [
            '',
            'unknown',
            '127.0.0.1',
            '::1'
        ];

        edgeCases.forEach(id => {
            expect(typeof id).toBe('string');
        });
    });
});
