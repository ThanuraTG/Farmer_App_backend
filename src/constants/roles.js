/**
 * User Roles and Permissions
 * Define role hierarchies and basic access levels
 */

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DATA_ENTRY: 'data_entry',
  FARMER: 'farmer'
};

// Role hierarchy (higher number = higher privilege)
const ROLE_HIERARCHY = {
  admin: 4,
  manager: 3,
  data_entry: 2,
  farmer: 1
};

// Basic role permissions
const ROLE_PERMISSIONS = {
  admin: [
    'manage_users',
    'manage_crops',
    'manage_locations',
    'manage_markets',
    'view_analytics',
    'manage_content',
    'manage_system'
  ],
  manager: [
    'manage_crops',
    'manage_locations',
    'view_analytics',
    'manage_content'
  ],
  data_entry: [
    'add_crops',
    'add_market_prices',
    'add_weather_data'
  ],
  farmer: [
    'view_recommendations',
    'create_cultivation_plan',
    'view_market_prices',
    'view_weather',
    'save_crops'
  ]
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS
};
