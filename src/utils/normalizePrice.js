/**
 * Utility to normalize price values into min, max, and average numeric fields.
 */

function normalizePrice(val, minVal, maxVal) {
  let min = 0;
  let max = 0;
  let average = 0;

  if (typeof val === 'number') {
    average = val;
    min = minVal !== undefined ? minVal : val;
    max = maxVal !== undefined ? maxVal : val;
  } else if (typeof val === 'string') {
    // Clean currency prefixes/units
    const cleanStr = val.replace(/Rs\.?|LKR|\/kg|kg/gi, '').trim();
    if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
      if (parts.length >= 2) {
        min = parts[0];
        max = parts[1];
        average = Math.round((min + max) / 2);
      } else if (parts.length === 1) {
        min = max = average = parts[0];
      }
    } else {
      const parsed = parseFloat(cleanStr);
      if (!isNaN(parsed)) {
        min = max = average = parsed;
      }
    }
  }

  if (minVal !== undefined && !isNaN(parseFloat(minVal))) {
    min = parseFloat(minVal);
  }
  if (maxVal !== undefined && !isNaN(parseFloat(maxVal))) {
    max = parseFloat(maxVal);
  }

  if (average === 0 && (min > 0 || max > 0)) {
    average = Math.round((min + max) / 2);
  }

  return {
    min: min || average,
    max: max || average,
    average: average || 0
  };
}

module.exports = {
  normalizePrice
};
