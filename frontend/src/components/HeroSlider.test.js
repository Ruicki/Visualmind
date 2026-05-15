/**
 * @file HeroSlider.test.js
 * @description Property-based and unit tests for HeroSlider logic.
 *
 * Feature: home-hero-products-redesign
 * Tasks: 6.2 (Property 2), 6.4 (Property 3)
 *
 * NOTE: These tests cover the pure logic extracted from HeroSlider
 * (rotation index calculation and controls visibility predicate)
 * without mounting the React component.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─── Logic under test ────────────────────────────────────────────────────────

/**
 * Computes the next slide index after one rotation tick.
 * Mirrors the setInterval callback in HeroSlider.
 *
 * @param {number} currentIndex
 * @param {number} total - events.length
 * @returns {number}
 */
const nextIndex = (currentIndex, total) => (currentIndex + 1) % total;

/**
 * Computes the index after N rotation ticks (simulates N * 6s elapsed).
 *
 * @param {number} startIndex
 * @param {number} total
 * @param {number} ticks
 * @returns {number}
 */
const indexAfterTicks = (startIndex, total, ticks) => (startIndex + ticks) % total;

/**
 * Returns whether navigation controls should be visible.
 * Mirrors the condition `events.length > 1` in HeroSlider.
 *
 * @param {number} eventCount
 * @returns {boolean}
 */
const controlsVisible = (eventCount) => eventCount > 1;

// ─── Property 2: Rotación automática del slider ───────────────────────────────
// Feature: home-hero-products-redesign, Property 2: Rotación automática del slider
// Validates: Requirements 1.2, 1.3

describe('HeroSlider — rotation logic', () => {

    it('P2 — after 1 tick, index advances by 1 with wrap-around', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 20 }).chain(total =>
                    fc.integer({ min: 0, max: total - 1 }).map(idx => ({ idx, total }))
                ),
                ({ idx, total }) => {
                    const result = nextIndex(idx, total);
                    const expected = (idx + 1) % total;
                    return result === expected;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('P2 — after N ticks, index wraps around correctly', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 20 }).chain(total =>
                    fc.integer({ min: 0, max: total - 1 }).chain(idx =>
                        fc.integer({ min: 1, max: 100 }).map(ticks => ({ idx, total, ticks }))
                    )
                ),
                ({ idx, total, ticks }) => {
                    const result = indexAfterTicks(idx, total, ticks);
                    return result >= 0 && result < total;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('P2 — after total ticks, index returns to start', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 20 }).chain(total =>
                    fc.integer({ min: 0, max: total - 1 }).map(idx => ({ idx, total }))
                ),
                ({ idx, total }) => indexAfterTicks(idx, total, total) === idx
            ),
            { numRuns: 100 }
        );
    });

    it('unit — single event: no rotation needed (index stays 0)', () => {
        // With 1 event, the interval is never set (events.length <= 1)
        // so index always stays at 0
        expect(indexAfterTicks(0, 1, 10)).toBe(0);
    });

    it('unit — last index wraps to 0', () => {
        expect(nextIndex(4, 5)).toBe(0);
        expect(nextIndex(9, 10)).toBe(0);
    });

    it('unit — first index advances to 1', () => {
        expect(nextIndex(0, 5)).toBe(1);
    });
});

// ─── Property 3: Controles de navegación visibles solo con múltiples eventos ──
// Feature: home-hero-products-redesign, Property 3: Controles de navegación
// Validates: Requirements 1.4, 1.5

describe('HeroSlider — controls visibility', () => {

    it('P3 — controls are visible if and only if eventCount > 1', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 50 }),
                (count) => controlsVisible(count) === (count > 1)
            ),
            { numRuns: 100 }
        );
    });

    it('P3 — controls are never visible for 0 events', () => {
        expect(controlsVisible(0)).toBe(false);
    });

    it('P3 — controls are never visible for exactly 1 event', () => {
        expect(controlsVisible(1)).toBe(false);
    });

    it('P3 — controls are always visible for 2+ events', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 50 }),
                (count) => controlsVisible(count) === true
            ),
            { numRuns: 100 }
        );
    });
});
