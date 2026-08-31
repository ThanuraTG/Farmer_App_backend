# Farmer Aswanna - Single Shared Backend REST API Documentation

This document provides comprehensive API specifications for both the **Flutter Farmer Mobile App** and the **React Web Admin Panel**.

---

## Base URL & General Headers

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **Authorization**: `Bearer <JWT_TOKEN>`

---

## Response Formats

### Standard Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Standard Error Response

```json
{
  "success": false,
  "message": "Human readable error message",
  "errors": ["Specific validation error detail"]
}
```

---

## Authentication Endpoints (`/api/auth`)

### 1. Farmer Registration
- **POST** `/api/auth/register`
- **Auth**: Public
- **Body**:
  ```json
  {
    "fullName": "Saman Kumara",
    "mobile": "0771234567",
    "password": "FarmerPassword123!",
    "preferredLanguage": "si",
    "province": "654321...",
    "district": "654322...",
    "division": "654323...",
    "farmSize": 2.5
  }
  ```
- **Response**: Returns created user object and JWT `token`.

### 2. User Login
- **POST** `/api/auth/login`
- **Auth**: Public
- **Body**:
  ```json
  {
    "mobile": "0771234567",
    "password": "FarmerPassword123!"
  }
  ```
- **Response**: Returns user details and JWT `token`.

### 3. Get Authenticated User Profile
- **GET** `/api/auth/me`
- **Auth**: Authenticated (`Bearer <token>`)

---

## Location Endpoints (`/api/locations`)

### 1. Get Provinces
- **GET** `/api/locations/provinces`

### 2. Get Districts
- **GET** `/api/locations/districts?provinceId=<PROVINCE_ID>`

### 3. Get Divisions
- **GET** `/api/locations/divisions?districtId=<DISTRICT_ID>`

---

## Crop Endpoints (`/api/crops`)

### 1. List Crops
- **GET** `/api/crops?search=carrot&category=Vegetables&status=active&page=1&limit=20`

### 2. Get Crop Details
- **GET** `/api/crops/:id`

### 3. Get Rule-Based Decision Support
- **GET** `/api/crops/:cropId/decision-support?districtId=<DISTRICT_ID>&plantingDate=2026-09-01&landSize=1.5&landUnit=acres`
- **Auth**: Authenticated Farmer
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "crop": { "id": "...", "name": { "en": "Carrot" } },
      "overall": { "score": 74, "status": "recommended_with_caution" },
      "weather": { "score": 85, "status": "good", "reasons": [] },
      "market": { "score": 70, "trend": "stable", "latestPrice": 180, "average30": 182, "reasons": [] },
      "supply": { "score": 90, "risk": "low", "estimatedExpectedSupplyKg": 15000, "referenceSupplyKg": 50000 },
      "season": { "score": 90, "status": "suitable", "reasons": [] },
      "location": { "score": 75, "status": "suitable", "reasons": [] },
      "profitability": { "score": 75, "estimatedRevenue": 1440000, "estimatedCost": 225000, "estimatedProfit": 1215000, "roi": 540, "isEstimate": true },
      "risks": [],
      "missingData": [],
      "disclaimer": "This decision-support result is an explainable indicative assessment based on available weather, historical market, cultivation-plan, and crop-reference data."
    }
  }
  ```

---

## Alternative Recommendations (`/api/recommendations`)

### 1. Get Top Alternative Crop Recommendations
- **GET** `/api/recommendations/alternatives?districtId=<DISTRICT_ID>&plantingDate=2026-09-01&landSize=1.5&excludeCropId=<CROP_ID>&limit=3`
- **Auth**: Authenticated Farmer

---

## Market Price Endpoints (`/api/market-prices`)

### 1. Get Latest Market Price
- **GET** `/api/market-prices/latest?cropId=<CROP_ID>&centreId=<CENTRE_ID>`

### 2. Get Historical Market Prices
- **GET** `/api/market-prices/history?cropId=<CROP_ID>&days=30`

### 3. Get Historical Price Trend Analysis
- **GET** `/api/market-prices/summary?cropId=<CROP_ID>`

---

## Weather Endpoints (`/api/weather`)

### 1. Get Current Weather
- **GET** `/api/weather/current?districtId=<DISTRICT_ID>`

### 2. Get Weather Forecast
- **GET** `/api/weather/forecast?districtId=<DISTRICT_ID>`

---

## Cultivation Plan Endpoints (`/api/cultivation-plans`)

### 1. Create Cultivation Plan
- **POST** `/api/cultivation-plans`
- **Auth**: Authenticated Farmer
- **Body**:
  ```json
  {
    "cropId": "...",
    "districtId": "...",
    "landSize": 2.0,
    "landUnit": "acres",
    "plantingDate": "2026-09-01"
  }
  ```

### 2. Get My Cultivation Plans
- **GET** `/api/cultivation-plans/my`

### 3. Update Cultivation Plan
- **PUT** `/api/cultivation-plans/:id`

### 4. Delete Cultivation Plan
- **DELETE** `/api/cultivation-plans/:id`

---

## Admin Endpoints (`/api/admin`)

- **Auth Requirement**: `Bearer <token>` with `role: "admin"`

### 1. Get Dashboard Analytics
- **GET** `/api/admin/dashboard`

### 2. User Management
- **GET** `/api/admin/users?search=...&status=...&page=1&limit=20`
- **PUT** `/api/admin/users/:id/status` (Body: `{ "status": "suspended" }`)

### 3. CSV Market Price Import
- **POST** `/api/admin/market-prices/import`
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file` (CSV file with headers: `cropName,centreName,date,minPrice,maxPrice,averagePrice,unit,source`)
