const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication and student role check to all routes
router.use(authMiddleware, roleMiddleware('student'));

// Interest management routes
router.get('/subjects/available', studentController.getAvailableSubjects);
router.post('/interests', studentController.registerInterest);
router.get('/interests', studentController.getRegisteredInterests);
router.delete('/interests/:id', studentController.deleteInterest);
router.put('/interests/priorities', studentController.updateInterestPriorities);

module.exports = router; 