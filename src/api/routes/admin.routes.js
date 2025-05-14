const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

// Apply authentication and admin role check to all routes
router.use(authMiddleware, roleMiddleware('admin'));

// Subject management routes
router.post('/subjects', adminController.createSubject);
router.get('/subjects', adminController.getAllSubjects);
router.get('/subjects/:id', adminController.getSubjectById);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);
router.post('/subjects/:id/prerequisites', adminController.addPrerequisites);
router.post('/subjects/:id/professors', adminController.linkProfessorsToSubject);

// Email scheduling routes
router.post('/emails/schedule', adminController.scheduleEmail);
router.get('/emails/schedule', adminController.getScheduledEmails);

// Schedule suggestion routes
router.post('/schedule/suggest', adminController.generateScheduleSuggestion);
router.get('/schedule/suggestions', adminController.getScheduleSuggestions);
router.put('/schedule/suggestions/:id/status', adminController.updateScheduleApprovalStatus);

module.exports = router; 