import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '../formatters.js';

describe('Frontend Formatters Utility Test Suite', () => {

    describe('1. formatCurrency', () => {
        it('should format positive currency numbers as USD with 2 decimal places', () => {
            const formatted = formatCurrency(1234.5);
            // $1,234.50
            expect(formatted).toContain('1,234.50');
            expect(formatted).toContain('$');
        });

        it('should format 0 and negative amounts accurately', () => {
            const zeroFormatted = formatCurrency(0);
            expect(zeroFormatted).toContain('0.00');

            const negFormatted = formatCurrency(-500.25);
            expect(negFormatted).toContain('500.25');
        });

        it('should handle null, undefined, or non-numeric strings safely defaulting to $0.00', () => {
            expect(formatCurrency(null)).toContain('0.00');
            expect(formatCurrency(undefined)).toContain('0.00');
            expect(formatCurrency('abc')).toContain('0.00');
        });
    });

    describe('2. formatDate', () => {
        it('should format valid ISO date strings to long Spanish date representation', () => {
            const dateStr = '2026-08-21T12:00:00Z';
            const formatted = formatDate(dateStr);

            expect(formatted).toContain('2026');
            expect(formatted).toMatch(/agosto/i);
        });

        it('should return empty string for null, undefined, or empty date input', () => {
            expect(formatDate(null)).toBe('');
            expect(formatDate(undefined)).toBe('');
            expect(formatDate('')).toBe('');
        });
    });
});
