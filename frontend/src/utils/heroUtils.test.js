/**
 * @file heroUtils.test.js
 * @description Property-based and unit tests for heroUtils functions.
 *
 * Feature: home-hero-products-redesign
 * Tasks: 4.2 (Property 4), 4.4 (Property 5)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { getTimeLeft, validateSecondaryImages } from './heroUtils';

// ─── Property 4: Countdown en tiempo real ────────────────────────────────────
// Feature: home-hero-products-redesign, Property 4: Countdown en tiempo real
// Validates: Requirement 1.6

describe('getTimeLeft', () => {
    const MS = { second: 1000, minute: 60_000, hour: 3_600_000, day: 86_400_000 };

    it('P4 — returns null for dates in the past', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 365 * MS.day }).map(ms => new Date(Date.now() - ms).toISOString()),
                (pastDate) => getTimeLeft(pastDate) === null
            ),
            { numRuns: 100 }
        );
    });

    it('P4 — days value equals floor(diff / 86400000) for future dates', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 30 }).map(days => {
                    const end = Date.now() + days * MS.day + MS.hour; // +1h buffer
                    return { iso: new Date(end).toISOString(), days };
                }),
                ({ iso, days }) => {
                    const result = getTimeLeft(iso);
                    return result !== null && result.days === days;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('P4 — all units are non-negative integers for future dates', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 365 * MS.day }).map(ms => new Date(Date.now() + ms).toISOString()),
                (futureDate) => {
                    const result = getTimeLeft(futureDate);
                    if (result === null) return true; // edge case: date passed during test
                    return (
                        Number.isInteger(result.days) && result.days >= 0 &&
                        Number.isInteger(result.hours) && result.hours >= 0 && result.hours < 24 &&
                        Number.isInteger(result.minutes) && result.minutes >= 0 && result.minutes < 60 &&
                        Number.isInteger(result.seconds) && result.seconds >= 0 && result.seconds < 60
                    );
                }
            ),
            { numRuns: 100 }
        );
    });

    it('unit — returns null for a date 1ms in the past', () => {
        expect(getTimeLeft(new Date(Date.now() - 1).toISOString())).toBeNull();
    });

    it('unit — returns correct breakdown for exactly 1 day + 2 hours + 3 minutes + 4 seconds', () => {
        const diff = MS.day + 2 * MS.hour + 3 * MS.minute + 4 * MS.second;
        const end = new Date(Date.now() + diff).toISOString();
        const result = getTimeLeft(end);
        expect(result).not.toBeNull();
        expect(result.days).toBe(1);
        expect(result.hours).toBe(2);
        expect(result.minutes).toBe(3);
        // seconds may be 3 or 4 due to execution time
        expect(result.seconds).toBeGreaterThanOrEqual(3);
        expect(result.seconds).toBeLessThanOrEqual(4);
    });
});

// ─── Property 5: Imágenes secundarias requeridas para collage ─────────────────
// Feature: home-hero-products-redesign, Property 5: Imágenes secundarias para collage
// Validates: Requirements 2.3, 2.4

describe('validateSecondaryImages', () => {
    const urlArb = fc.string({ minLength: 5, maxLength: 60 }).map(s => `uploads/campaigns/${s}.jpg`);

    it('P5 — collage-3 is valid only with exactly 2 images', () => {
        fc.assert(
            fc.property(
                fc.array(urlArb, { minLength: 0, maxLength: 6 }),
                (images) => {
                    const result = validateSecondaryImages('collage-3', images);
                    return result === (images.length === 2);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('P5 — collage-4 is valid only with exactly 3 images', () => {
        fc.assert(
            fc.property(
                fc.array(urlArb, { minLength: 0, maxLength: 6 }),
                (images) => {
                    const result = validateSecondaryImages('collage-4', images);
                    return result === (images.length === 3);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('P5 — all other template types are always valid regardless of image count', () => {
        const otherTemplates = ['single', 'split', 'cinematic', 'magazine', 'ticker'];
        fc.assert(
            fc.property(
                fc.constantFrom(...otherTemplates),
                fc.array(urlArb, { minLength: 0, maxLength: 6 }),
                (templateType, images) => validateSecondaryImages(templateType, images) === true
            ),
            { numRuns: 100 }
        );
    });

    it('unit — collage-3 with 2 images returns true', () => {
        expect(validateSecondaryImages('collage-3', ['a.jpg', 'b.jpg'])).toBe(true);
    });

    it('unit — collage-3 with 1 image returns false', () => {
        expect(validateSecondaryImages('collage-3', ['a.jpg'])).toBe(false);
    });

    it('unit — collage-4 with 3 images returns true', () => {
        expect(validateSecondaryImages('collage-4', ['a.jpg', 'b.jpg', 'c.jpg'])).toBe(true);
    });

    it('unit — collage-4 with 2 images returns false', () => {
        expect(validateSecondaryImages('collage-4', ['a.jpg', 'b.jpg'])).toBe(false);
    });

    it('unit — non-array input returns false for collage types', () => {
        expect(validateSecondaryImages('collage-3', null)).toBe(false);
        expect(validateSecondaryImages('collage-4', undefined)).toBe(false);
    });
});
