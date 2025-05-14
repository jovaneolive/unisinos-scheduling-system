const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professor.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication and professor role check to all routes
router.use(authMiddleware, roleMiddleware('professor'));

// Availability management routes
router.get('/subjects/assigned', professorController.getAssignedSubjects);
router.post('/availability', professorController.registerAvailability);
router.get('/availability', professorController.getRegisteredAvailabilities);
router.put('/availability/:id', professorController.updateAvailability);
router.delete('/availability/:id', professorController.deleteAvailability);

module.exports = router; 