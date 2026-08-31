const express = require('express');
const router = express.Router();
const cultivationPlanController = require('../controllers/cultivationPlanController');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.post('/', cultivationPlanController.createPlan);
router.get('/my', cultivationPlanController.getMyPlans);
router.get('/:id', cultivationPlanController.getPlanById);
router.put('/:id', cultivationPlanController.updatePlan);
router.delete('/:id', cultivationPlanController.deletePlan);

module.exports = router;
