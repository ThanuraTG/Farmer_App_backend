/**
 * Status Enumerations for the Farmer App Backend
 * Define standard status values used throughout the application
 */

const CROP_STATUSES = ['active', 'inactive', 'seasonal', 'experimental'];

const PLAN_STATUSES = ['planned', 'active', 'harvesting', 'completed', 'abandoned'];

const LAND_UNITS = ['acres', 'hectares', 'perches', 'square_meters'];

const NOTIFICATION_TYPES = [
  'weather_alert',
  'pest_disease_warning',
  'market_price_update',
  'advisory_recommendation',
  'crop_stage_reminder',
  'irrigation_reminder',
  'harvest_ready',
  'supply_risk_alert',
  'system_notification'
];

const USER_ROLES = ['farmer', 'admin', 'manager', 'data_entry'];

const ACCOUNT_STATUS = ['active', 'inactive', 'suspended', 'deleted'];

module.exports = {
  CROP_STATUSES,
  PLAN_STATUSES,
  LAND_UNITS,
  NOTIFICATION_TYPES,
  USER_ROLES,
  ACCOUNT_STATUS
};
