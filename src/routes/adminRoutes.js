const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const { authenticateJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const authController = require('../controllers/authController');
const adminDashboardController = require('../controllers/adminDashboardController');
const locationController = require('../controllers/locationController');
const cropController = require('../controllers/cropController');
const economicCentreController = require('../controllers/economicCentreController');
const marketPriceController = require('../controllers/marketPriceController');
const weatherController = require('../controllers/weatherController');
const contentGuidelineController = require('../controllers/contentGuidelineController');
const feedbackController = require('../controllers/feedbackController');
const cultivationPlanController = require('../controllers/cultivationPlanController');
const notificationController = require('../controllers/notificationController');
const advisoryController = require('../controllers/advisoryController');

// Public Admin Login Route (No JWT check required)
router.post('/login', authController.adminLogin);

// Protected Admin Routes (Requires JWT authentication and Admin role)
router.use(authenticateJWT);
router.use(authorizeRoles('admin', 'manager'));

// Dashboard & Reports Analytics
router.get('/dashboard', adminDashboardController.getDashboardStats);
router.get('/reports', adminDashboardController.getDashboardStats);

// User Management
router.get('/users', adminDashboardController.getUsers);
router.get('/users/:id', adminDashboardController.getUserById);
router.put('/users/:id/status', adminDashboardController.updateUserStatus);

// Location Management
router.post('/locations/provinces', locationController.createProvince);
router.post('/locations/districts', locationController.createDistrict);
router.post('/locations/divisions', locationController.createDivision);

// Crop Management
router.get('/crops', cropController.adminGetCrops);
router.post('/crops', cropController.createCrop);
router.get('/crops/:id', cropController.getCropById);
router.put('/crops/:id', cropController.updateCrop);
router.delete('/crops/:id', cropController.deleteCrop);

// Economic Centre Management
router.get('/economic-centres', economicCentreController.adminGetEconomicCentres);
router.post('/economic-centres', economicCentreController.createEconomicCentre);
router.put('/economic-centres/:id', economicCentreController.updateEconomicCentre);
router.delete('/economic-centres/:id', economicCentreController.deleteEconomicCentre);

// Market Price Management & CSV Import
router.get('/market-prices', marketPriceController.adminGetMarketPrices);
router.post('/market-prices', marketPriceController.adminCreateMarketPrice);
router.put('/market-prices/:id', marketPriceController.adminUpdateMarketPrice);
router.delete('/market-prices/:id', marketPriceController.adminDeleteMarketPrice);
router.post('/market-prices/import', upload.single('file'), marketPriceController.adminImportMarketPrices);

// Weather Data Management
router.get('/weather-data', weatherController.adminGetWeatherData);
router.put('/weather-data/:id', weatherController.adminUpdateWeatherData);

// Content / Guidelines Management
router.get('/content', contentGuidelineController.adminGetContentGuidelines);
router.post('/content', contentGuidelineController.adminCreateContentGuideline);
router.put('/content/:id', contentGuidelineController.adminUpdateContentGuideline);
router.delete('/content/:id', contentGuidelineController.adminDeleteContentGuideline);

// Feedback Management
router.get('/feedback', feedbackController.adminGetFeedbacks);
router.put('/feedback/:id', feedbackController.adminUpdateFeedbackStatus);

// Cultivation Plan Management
router.get('/cultivation-plans', cultivationPlanController.adminGetPlans);
router.put('/cultivation-plans/:id/status', cultivationPlanController.adminUpdatePlanStatus);

// Notification Management
router.get('/notifications', notificationController.adminGetNotifications);
router.post('/notifications', notificationController.adminCreateNotification);
router.put('/notifications/:id', notificationController.adminUpdateNotification);
router.delete('/notifications/:id', notificationController.adminDeleteNotification);

// Advisory Management
router.get('/advisories', advisoryController.adminGetAdvisories);
router.post('/advisories', advisoryController.adminCreateAdvisory);
router.put('/advisories/:id', advisoryController.adminUpdateAdvisory);
router.delete('/advisories/:id', advisoryController.adminDeleteAdvisory);

module.exports = router;
