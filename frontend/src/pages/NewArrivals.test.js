/**
 * @file NewArrivals.test.js
 * @description Property-based and unit tests for NewArrivals page logic.
 *
 * Feature: home-hero-products-redesign
 * Tasks: 12.3 (Property 9), 12.5 (Property 8)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─── Logic under test ────────────────────────────────────────────────────────
// These functions mirror the filtering logic in NewArrivals.jsx so we can test
// them in isolation without mounting the full React component.

/**
 * Filters out expired events: is_active=true but end_date < NOW.
 * Mirrors the filter applied in fetchData inside NewArrivals.jsx.
 *
 * @param {Array} events
 * @param {Date}  now
 * @returns {Array}
 */
const filterExpiredEvents = (events, now = new Date()) =>
    events.filter(ev => {
        if (!ev.end_date) return true;
        return new Date(ev.end_date) >= now;
    });

/**
 * Classifies an event as "upcoming" when its start_date is in the future.
 * The backend returns upcoming events via /campaigns/upcoming, but we test
 * the classification predicate here.
 *
 * @param {Object} event
 * @param {Date}   now
 * @returns {boolean}
 */
const isUpcoming = (event, now = new Date()) => {
    if (!event.start_date) return false;
    return new Date(event.start_date) > now;
};

/**
 * Classifies an event as "active" (not upcoming, not expired).
 *
 * @param {Object} event
 * @param {Date}   now
 * @returns {boolean}
 */
const isActive = (event, now = new Date()) => {
    if (isUpcoming(event, now)) return false;
    if (event.end_date && new Date(event.end_date) < now) return false;
    return true;
};

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Generates a random ISO date string offset by `offsetMs` from `base`. */
const isoDate = (base, offsetMs) =>
    new Date(base.getTime() + offsetMs).toISOString();

const NOW = new Date('2025-01-15T12:00:00Z');

/** Generates an event with an end_date in the past (expired). */
const expiredEventArb = fc.record({
    id:        fc.uuid(),
    name:      fc.string({ minLength: 1, maxLength: 40 }),
    is_active: fc.constant(true),
    // end_date is between 1ms and 365 days in the past
    end_date:  fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 })
                 .map(ms => isoDate(NOW, -ms)),
    start_date: fc.option(
        fc.integer({ min: 1, max: 30 * 24 * 60 * 60 * 1000 })
          .map(ms => isoDate(NOW, -(ms + 1))),
        { nil: null }
    ),
});

/** Generates an event with an end_date in the future (not expired). */
const activeEventArb = fc.record({
    id:        fc.uuid(),
    name:      fc.string({ minLength: 1, maxLength: 40 }),
    is_active: fc.constant(true),
    // end_date is between 1ms and 365 days in the future
    end_date:  fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 })
                 .map(ms => isoDate(NOW, ms)),
    start_date: fc.option(
        fc.integer({ min: 1, max: 30 * 24 * 60 * 60 * 1000 })
          .map(ms => isoDate(NOW, -(ms + 1))),
        { nil: null }
    ),
});

/** Generates an event with no end_date (never expires). */
const noEndDateEventArb = fc.record({
    id:        fc.uuid(),
    name:      fc.string({ minLength: 1, maxLength: 40 }),
    is_active: fc.constant(true),
    end_date:  fc.constant(null),
    start_date: fc.option(
        fc.integer({ min: 1, max: 30 * 24 * 60 * 60 * 1000 })
          .map(ms => isoDate(NOW, -(ms + 1))),
        { nil: null }
    ),
});

/** Generates an event with start_date in the future (upcoming). */
const upcomingEventArb = fc.record({
    id:        fc.uuid(),
    name:      fc.string({ minLength: 1, maxLength: 40 }),
    is_active: fc.constant(false),
    // start_date is between 1ms and 365 days in the future
    start_date: fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 })
                  .map(ms => isoDate(NOW, ms)),
    end_date:  fc.option(
        fc.integer({ min: 366, max: 730 }).map(days => isoDate(NOW, days * 24 * 60 * 60 * 1000)),
        { nil: null }
    ),
});

/** Generates an event with start_date in the past (not upcoming). */
const pastStartEventArb = fc.record({
    id:        fc.uuid(),
    name:      fc.string({ minLength: 1, maxLength: 40 }),
    is_active: fc.constant(true),
    start_date: fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 })
                  .map(ms => isoDate(NOW, -ms)),
    end_date:  fc.option(
        fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 })
          .map(ms => isoDate(NOW, ms)),
        { nil: null }
    ),
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NewArrivals — filterExpiredEvents', () => {

    // ── Property 8: Novedades excluye eventos expirados ──────────────────────
    // Feature: home-hero-products-redesign, Property 8: Novedades excluye expirados
    // Validates: Requirement 5.7

    /**
     * Validates: Requirements 5.7
     * Property 8: Novedades excluye eventos expirados
     */
    it('P8 — never includes events whose end_date is in the past', () => {
        fc.assert(
            fc.property(
                fc.array(expiredEventArb, { minLength: 1, maxLength: 20 }),
                (expiredEvents) => {
                    const result = filterExpiredEvents(expiredEvents, NOW);
                    // All expired events must be excluded
                    return result.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Validates: Requirements 5.7
     * Property 8 (complement): active events with future end_date are always kept
     */
    it('P8 — always includes events whose end_date is in the future', () => {
        fc.assert(
            fc.property(
                fc.array(activeEventArb, { minLength: 1, maxLength: 20 }),
                (events) => {
                    const result = filterExpiredEvents(events, NOW);
                    return result.length === events.length;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Validates: Requirements 5.7
     * Events with no end_date are never filtered out
     */
    it('P8 — events with no end_date are never excluded', () => {
        fc.assert(
            fc.property(
                fc.array(noEndDateEventArb, { minLength: 1, maxLength: 20 }),
                (events) => {
                    const result = filterExpiredEvents(events, NOW);
                    return result.length === events.length;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Mixed array: expired events are removed, active events are kept
     */
    it('P8 — mixed array: only non-expired events survive', () => {
        fc.assert(
            fc.property(
                fc.array(expiredEventArb, { minLength: 0, maxLength: 10 }),
                fc.array(activeEventArb,  { minLength: 0, maxLength: 10 }),
                (expired, active) => {
                    const mixed = [...expired, ...active];
                    const result = filterExpiredEvents(mixed, NOW);
                    // Result must contain exactly the active events (by id)
                    const activeIds = new Set(active.map(e => e.id));
                    const resultIds = new Set(result.map(e => e.id));
                    // Every result id must be in active
                    for (const id of resultIds) {
                        if (!activeIds.has(id)) return false;
                    }
                    // Every active id must be in result
                    for (const id of activeIds) {
                        if (!resultIds.has(id)) return false;
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ── Unit tests ────────────────────────────────────────────────────────────

    it('unit — empty array returns empty array', () => {
        expect(filterExpiredEvents([], NOW)).toEqual([]);
    });

    it('unit — event with end_date exactly equal to now is kept', () => {
        const event = { id: '1', end_date: NOW.toISOString() };
        expect(filterExpiredEvents([event], NOW)).toHaveLength(1);
    });

    it('unit — event with end_date 1ms before now is excluded', () => {
        const event = { id: '1', end_date: new Date(NOW.getTime() - 1).toISOString() };
        expect(filterExpiredEvents([event], NOW)).toHaveLength(0);
    });
});

describe('NewArrivals — isUpcoming / isActive', () => {

    // ── Property 9: Novedades muestra eventos futuros como "upcoming" ─────────
    // Feature: home-hero-products-redesign, Property 9: Novedades upcoming
    // Validates: Requirement 5.2

    /**
     * Validates: Requirements 5.2
     * Property 9: Any event with start_date in the future is classified as upcoming
     */
    it('P9 — events with future start_date are always upcoming', () => {
        fc.assert(
            fc.property(
                upcomingEventArb,
                (event) => isUpcoming(event, NOW) === true
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Validates: Requirements 5.2
     * Property 9 (complement): events with past start_date are never upcoming
     */
    it('P9 — events with past start_date are never upcoming', () => {
        fc.assert(
            fc.property(
                pastStartEventArb,
                (event) => isUpcoming(event, NOW) === false
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Validates: Requirements 5.2
     * Upcoming events must not be classified as active
     */
    it('P9 — upcoming events are never classified as active', () => {
        fc.assert(
            fc.property(
                upcomingEventArb,
                (event) => isActive(event, NOW) === false
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Validates: Requirements 5.2
     * Active events (past start, future end) are never classified as upcoming
     */
    it('P9 — active events (past start, future end) are never upcoming', () => {
        fc.assert(
            fc.property(
                activeEventArb,
                (event) => {
                    // Only test events that have a past start_date
                    if (!event.start_date) return true;
                    if (new Date(event.start_date) > NOW) return true; // skip if start is future
                    return isUpcoming(event, NOW) === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    // ── Unit tests ────────────────────────────────────────────────────────────

    it('unit — event with no start_date is not upcoming', () => {
        expect(isUpcoming({ id: '1', start_date: null }, NOW)).toBe(false);
        expect(isUpcoming({ id: '1' }, NOW)).toBe(false);
    });

    it('unit — event with start_date 1ms in the future is upcoming', () => {
        const event = { id: '1', start_date: new Date(NOW.getTime() + 1).toISOString() };
        expect(isUpcoming(event, NOW)).toBe(true);
    });

    it('unit — event with start_date exactly equal to now is not upcoming', () => {
        const event = { id: '1', start_date: NOW.toISOString() };
        expect(isUpcoming(event, NOW)).toBe(false);
    });

    it('unit — event with past start and future end is active', () => {
        const event = {
            id: '1',
            start_date: new Date(NOW.getTime() - 1000).toISOString(),
            end_date:   new Date(NOW.getTime() + 1000).toISOString(),
        };
        expect(isActive(event, NOW)).toBe(true);
        expect(isUpcoming(event, NOW)).toBe(false);
    });

    it('unit — expired event is neither active nor upcoming', () => {
        const event = {
            id: '1',
            start_date: new Date(NOW.getTime() - 2000).toISOString(),
            end_date:   new Date(NOW.getTime() - 1000).toISOString(),
        };
        expect(isActive(event, NOW)).toBe(false);
        expect(isUpcoming(event, NOW)).toBe(false);
    });
});
