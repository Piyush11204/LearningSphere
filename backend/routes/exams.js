const express = require('express');
const { createExam, submitExam, getExam, getAllExams, updateExamStatus, startExam, cleanupAbandonedExams, getExamStatusForUser } = require('../controllers/examController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Get all exams (authenticated users)
router.get('/', auth, getAllExams);

// Create exam (admin/staff, with Gemini AI questions)
router.post('/', auth, roleCheck(['admin', 'staff']), createExam);

// Submit exam attempt (student)
router.post('/:id/submit', auth, roleCheck('student'), submitExam);

// Start exam (student) - changes status from live to ongoing
router.post('/:id/start', auth, roleCheck('student'), startExam);

// Get exam status for user (student)
router.get('/:id/status', auth, roleCheck('student'), getExamStatusForUser);

// Update exam status (admin only)
router.put('/:id/status', auth, roleCheck('admin'), updateExamStatus);

// Cleanup abandoned exams (admin only)
router.post('/cleanup/abandoned', auth, roleCheck('admin'), cleanupAbandonedExams);

// Get exam details (admin sees all, students see own results)
router.get('/:id', auth, getExam);

module.exports = router;
