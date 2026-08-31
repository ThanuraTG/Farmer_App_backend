/**
 * Converts land size and unit to normalized acres.
 * Supported units: 'acres', 'hectares', 'perches'
 */
const convertToAcres = (size, unit) => {
  const numericSize = Number(size);
  if (isNaN(numericSize) || numericSize <= 0) return 0;

  const normalizedUnit = (unit || 'acres').toLowerCase().trim();

  switch (normalizedUnit) {
    case 'hectares':
    case 'hectare':
    case 'ha':
      return Math.round(numericSize * 2.47105 * 1000) / 1000;
    case 'perches':
    case 'perch':
      return Math.round((numericSize / 160) * 10000) / 10000;
    case 'acres':
    case 'acre':
    default:
      return Math.round(numericSize * 10000) / 10000;
  }
};

module.exports = {
  convertToAcres
};
