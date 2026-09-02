# Backend Structure Restoration Summary

## Issue Resolved

The previous backend cleanup inadvertently removed critical folders (`constants/` and `jobs/`) that other modules depend on. This prevented the server from starting with multiple `MODULE_NOT_FOUND` errors.

## Restored Folders & Files

### 1. **src/constants/** (4 files)

#### `statusEnums.js`
- Exports: `CROP_STATUSES`, `PLAN_STATUSES`, `LAND_UNITS`, `NOTIFICATION_TYPES`, `USER_ROLES`, `ACCOUNT_STATUS`
- Used by: Crop.js, CultivationPlan.js, Notification.js models
- Purpose: Provides standard enumeration values for MongoDB schema validation

#### `weights.js`
- Exports: `FACTOR_WEIGHTS`
- Used by: `src/services/decisionSupport/decisionSupportEngine.js`
- Purpose: Scoring weights for recommendation engine calculations

#### `thresholds.js`
- Exports: `RECOMMENDATION_CATEGORIES`, `RECOMMENDATION_SCORE_THRESHOLDS`, `SUPPLY_RISK_THRESHOLDS`, `MARKET_TREND_THRESHOLDS`, `WEATHER_ALERT_THRESHOLDS`, `CULTIVATION_TIMINGS`
- Used by: 
  - `src/services/decisionSupport/decisionSupportEngine.js`
  - `src/services/supply/supplyAnalysisService.js`
  - `src/services/market/marketService.js`
- Purpose: Boundary values for risk analysis, alerts, and classification

#### `roles.js`
- Exports: `ROLES`, `ROLE_HIERARCHY`, `ROLE_PERMISSIONS`
- Used by: Authorization and access control systems
- Purpose: Defines user roles and their permissions

### 2. **src/jobs/** (1 file)

#### `priceSyncJob.js`
- Exports: `initPriceSyncJob()`, `runManualSync(source)`
- Used by: 
  - `src/server.js` (server startup initialization)
  - `src/controllers/priceController.js` (manual sync endpoint)
- Purpose: Manages periodic market price synchronization from external sources (HARTI, CBSL)

## Verification Status

✅ **All dependencies resolved**
- ✓ Crop model loads without errors
- ✓ CultivationPlan model loads without errors
- ✓ Notification model loads without errors
- ✓ Decision Support Service loads without errors
- ✓ Supply Analysis Service loads without errors
- ✓ Express app initializes with all routes mounted

## Why These Folders Are Essential

These folders cannot be removed without refactoring the code because:

1. **Constants** folder provides enum values used in Mongoose schema definitions
2. **Jobs** folder provides initialization functions required by server.js on startup
3. Multiple controllers and services depend on constants for business logic

## Important Note

The constants defined in these files are not "configuration" — they are structural enums used throughout the application. Any future cleanup should only remove:
- Old temporary files (scratch/, tests/)
- Deprecated code
- Unused features

But should **always preserve**:
- `constants/` folder (required by models and services)
- `jobs/` folder (required by server initialization)
- `middleware/` folder (required for authentication and authorization)
- `models/` folder (required by all controllers and services)

## Current Backend Structure (Minimal but Complete)

```
backend/src/
├── app.js
├── server.js
├── config/
│   ├── db.js
│   └── env.js
├── constants/          ← ESSENTIAL
│   ├── statusEnums.js
│   ├── weights.js
│   ├── thresholds.js
│   └── roles.js
├── controllers/
│   ├── userController.js       (NEW)
│   ├── authController.js
│   ├── priceController.js
│   └── ... (other controllers)
├── middleware/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
├── models/
│   ├── User.js
│   ├── Crop.js
│   ├── CultivationPlan.js
│   ├── Notification.js
│   └── ... (other models)
├── routes/
│   ├── userRoutes.js           (NEW)
│   ├── authRoutes.js
│   ├── priceRoutes.js
│   └── ... (other routes)
├── services/
│   ├── decisionSupport/
│   ├── market/
│   ├── supply/
│   └── ... (other services)
├── jobs/                       ← ESSENTIAL
│   └── priceSyncJob.js
├── utils/
│   ├── logger.js
│   ├── responseHandler.js
│   ├── unitConverter.js
│   └── ... (other utilities)
└── seeds/
    ├── seedAdmin.js
    ├── seedDemoData.js
    └── seedLocations.js
```

## Next Steps

1. ✅ Folders restored
2. ✅ Dependencies verified
3. Next: Run `npm start` to test server startup
4. Test the new user management API endpoints at `/api/users`
