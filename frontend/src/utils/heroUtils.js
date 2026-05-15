/**
 * Utility functions for the Hero Slider and related components.
 * Feature: home-hero-products-redesign
 */

/**
 * Calculates the time remaining until a given end date.
 *
 * @param {string|Date} endDate - The target date/time.
 * @returns {{ days: number, hours: number, minutes: number, seconds: number } | null}
 *   An object with the remaining time broken down by unit, or null if the date has already passed.
 */
export function getTimeLeft(endDate) {
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return null;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

/**
 * Validates that a campaign has the correct number of secondary images
 * for its template type.
 *
 * Rules:
 *   - 'collage-3' requires exactly 2 secondary images
 *   - 'collage-4' requires exactly 3 secondary images
 *   - Any other template type does not require secondary images (always valid)
 *
 * @param {string} templateType - The campaign's template_type value.
 * @param {string[]} secondaryImages - Array of secondary image URLs/paths.
 * @returns {boolean} true if the combination is valid, false otherwise.
 */
export function validateSecondaryImages(templateType, secondaryImages) {
  if (templateType === 'collage-3') {
    return Array.isArray(secondaryImages) && secondaryImages.length === 2;
  }

  if (templateType === 'collage-4') {
    return Array.isArray(secondaryImages) && secondaryImages.length === 3;
  }

  // All other template types do not require secondary images
  return true;
}
