const express = require('express');
const multer = require('multer');
const marketPriceController = require('../controllers/marketPriceController');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

const router = express.Router();
const adminOnly = [authenticateJWT, authorizeRoles('admin', 'manager')];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const supported = file.mimetype === 'application/pdf' || file.mimetype === 'text/csv' || /\.(csv|pdf)$/i.test(file.originalname);
    callback(supported ? null : new Error('Only CSV and PDF files are supported'), supported);
  }
});

router.get('/', ...adminOnly, marketPriceController.adminGetMarketPrices);
router.post('/', ...adminOnly, marketPriceController.adminCreateMarketPrice);
router.put('/:id', ...adminOnly, marketPriceController.adminUpdateMarketPrice);
router.delete('/:id', ...adminOnly, marketPriceController.adminDeleteMarketPrice);
router.post('/import', ...adminOnly, upload.single('file'), marketPriceController.adminImportMarketPrices);

module.exports = router;
