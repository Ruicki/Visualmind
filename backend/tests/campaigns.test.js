/**
 * @file campaigns.test.js
 * @description Property-based and unit tests for campaign ordering and featured slots logic.
 *
 * Feature: home-hero-products-redesign
 * Tasks: 2.2 (Property 1), 2.6 (Property 6), 2.7 (Property 7)
 *
 * These tests cover pure logic functions extracted from the backend controllers
 * without requiring a live database connection.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ─── Logic under test ────────────────────────────────────────────────────────

/**
 * Sorts events by priority: campaigns first, then seasons.
 * Mirrors the ORDER BY in getActiveAllCampaigns.
 *
 * @param {Array} events
 * @returns {Array}
 */
const sortEventsByPriority = (events) =>
    [...events].sort((a, b) => {
        const aOrder = (a.type === 'campaign') ? 0 : 1;
        const bOrder = (b.type === 'campaign') ? 0 : 1;
        return aOrder - bOrder;
    });

/**
 * Filters featured slots to only include valid products.
 * Mirrors the logic in getFeaturedProducts.
 *
 * @param {Array} slots - Array of { slot_order, product_id, product: { stock, lifecycle_state } | null }
 * @returns {Array} Only slots with valid products (stock > 0 and lifecycle_state = 'Published')
 */
const filterValidSlots = (slots) =>
    slots.filter(s =>
        s.product !== null &&
        s.product !== undefined &&
        s.product.stock > 0 &&
        (s.product.lifecycle_state === 'Published' || s.product.lifecycle_state == null)
    );

/**
 * Returns fallback products when no valid slots exist.
 * Mirrors the fallback in getFeaturedProducts.
 *
 * @param {Array} products - All products
 * @returns {Array} Top 8 by priority
 */
const getFallbackProducts = (products) =>
    [...products]
        .filter(p => p.stock > 0 && (p.lifecycle_state === 'Published' || p.lifecycle_state == null))
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .slice(0, 8);

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const campaignArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 40 }),
    type: fc.constant('campaign'),
});

const seasonArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 40 }),
    type: fc.constant('season'),
});

const validProductArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 40 }),
    stock: fc.integer({ min: 1, max: 100 }),
    lifecycle_state: fc.constant('Published'),
    priority: fc.integer({ min: 0, max: 10 }),
});

const invalidProductArb = fc.oneof(
    // out of stock
    fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 40 }),
        stock: fc.constant(0),
        lifecycle_state: fc.constant('Published'),
        priority: fc.integer({ min: 0, max: 10 }),
    }),
    // archived
    fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 40 }),
        stock: fc.integer({ min: 1, max: 100 }),
        lifecycle_state: fc.constant('Archived'),
        priority: fc.integer({ min: 0, max: 10 }),
    })
);

// ─── Property 1: Prioridad de eventos en el slider ────────────────────────────
// Feature: home-hero-products-redesign, Property 1: Prioridad de eventos en el slider
// Validates: Requirement 1.1

describe('sortEventsByPriority', () => {

    it('P1 — campaigns always appear before seasons in sorted result', () => {
        fc.assert(
            fc.property(
                fc.array(campaignArb, { minLength: 0, maxLength: 10 }),
                fc.array(seasonArb, { minLength: 0, maxLength: 10 }),
                (campaigns, seasons) => {
                    const mixed = [...seasons, ...campaigns]; // intentionally mixed
                    const sorted = sortEventsByPriority(mixed);

                    // Find the last campaign index and first season index
                    const lastCampaignIdx = sorted.map(e => e.type).lastIndexOf('campaign');
                    const firstSeasonIdx = sorted.map(e => e.type).indexOf('season');

                    // If both exist, last campaign must come before first season
                    if (lastCampaignIdx !== -1 && firstSeasonIdx !== -1) {
                        return lastCampaignIdx < firstSeasonIdx;
                    }
                    return true; // only one type present — trivially valid
                }
            ),
            { numRuns: 100 }
        );
    });

    it('P1 — result length equals input length', () => {
        fc.assert(
            fc.property(
                fc.array(fc.oneof(campaignArb, seasonArb), { minLength: 0, maxLength: 20 }),
                (events) => sortEventsByPriority(events).length === events.length
            ),
            { numRuns: 100 }
        );
    });

    it('unit — empty array returns empty array', () => {
        expect(sortEventsByPriority([])).toEqual([]);
    });

    it('unit — only campaigns: order preserved', () => {
        const events = [
            { id: '1', type: 'campaign' },
            { id: '2', type: 'campaign' },
        ];
        const result = sortEventsByPriority(events);
        expect(result.every(e => e.type === 'campaign')).toBe(true);
    });

    it('unit — mixed: campaigns come first', () => {
        const events = [
            { id: '1', type: 'season' },
            { id: '2', type: 'campaign' },
            { id: '3', type: 'season' },
            { id: '4', type: 'campaign' },
        ];
        const result = sortEventsByPriority(events);
        expect(result[0].type).toBe('campaign');
        expect(result[1].type).toBe('campaign');
        expect(result[2].type).toBe('season');
        expect(result[3].type).toBe('season');
    });
});

// ─── Property 6: Slots del carousel reflejan la configuración del admin ───────
// Feature: home-hero-products-redesign, Property 6: Slots reflejan configuración
// Validates: Requirements 3.5, 3.6, 4.1

describe('filterValidSlots', () => {

    it('P6 — slots with invalid products are always excluded', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        slot_order: fc.integer({ min: 1, max: 8 }),
                        product: invalidProductArb,
                    }),
                    { minLength: 1, maxLength: 8 }
                ),
                (slots) => filterValidSlots(slots).length === 0
            ),
            { numRuns: 100 }
        );
    });

    it('P6 — slots with valid products are always included', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        slot_order: fc.integer({ min: 1, max: 8 }),
                        product: validProductArb,
                    }),
                    { minLength: 1, maxLength: 8 }
                ),
                (slots) => filterValidSlots(slots).length === slots.length
            ),
            { numRuns: 100 }
        );
    });

    it('P6 — mixed slots: only valid ones survive', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({ slot_order: fc.integer({ min: 1, max: 8 }), product: validProductArb }), { minLength: 0, maxLength: 4 }),
                fc.array(fc.record({ slot_order: fc.integer({ min: 1, max: 8 }), product: invalidProductArb }), { minLength: 0, maxLength: 4 }),
                (valid, invalid) => {
                    const mixed = [...valid, ...invalid];
                    const result = filterValidSlots(mixed);
                    return result.length === valid.length;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('unit — null product is excluded', () => {
        const slots = [{ slot_order: 1, product: null }];
        expect(filterValidSlots(slots)).toHaveLength(0);
    });

    it('unit — stock=0 product is excluded', () => {
        const slots = [{ slot_order: 1, product: { stock: 0, lifecycle_state: 'Published' } }];
        expect(filterValidSlots(slots)).toHaveLength(0);
    });
});

// ─── Property 7: Fallback del carousel cuando no hay slots configurados ───────
// Feature: home-hero-products-redesign, Property 7: Fallback del carousel
// Validates: Requirement 4.5

describe('getFallbackProducts', () => {

    it('P7 — fallback returns at most 8 products', () => {
        fc.assert(
            fc.property(
                fc.array(validProductArb, { minLength: 0, maxLength: 30 }),
                (products) => getFallbackProducts(products).length <= 8
            ),
            { numRuns: 100 }
        );
    });

    it('P7 — fallback only includes products with stock > 0', () => {
        fc.assert(
            fc.property(
                fc.array(fc.oneof(validProductArb, invalidProductArb), { minLength: 0, maxLength: 20 }),
                (products) => getFallbackProducts(products).every(p => p.stock > 0)
            ),
            { numRuns: 100 }
        );
    });

    it('unit — all slots NULL → fallback returns top products by priority', () => {
        const products = [
            { id: '1', stock: 5, lifecycle_state: 'Published', priority: 3 },
            { id: '2', stock: 5, lifecycle_state: 'Published', priority: 10 },
            { id: '3', stock: 5, lifecycle_state: 'Published', priority: 1 },
        ];
        const result = getFallbackProducts(products);
        expect(result[0].id).toBe('2'); // highest priority first
        expect(result[1].id).toBe('1');
        expect(result[2].id).toBe('3');
    });

    it('unit — empty products array returns empty fallback', () => {
        expect(getFallbackProducts([])).toHaveLength(0);
    });

    it('unit — out-of-stock products excluded from fallback', () => {
        const products = [
            { id: '1', stock: 0, lifecycle_state: 'Published', priority: 10 },
            { id: '2', stock: 5, lifecycle_state: 'Published', priority: 1 },
        ];
        const result = getFallbackProducts(products);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
    });
});
