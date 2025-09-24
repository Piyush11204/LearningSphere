const express = require('express');
const { createExam, submitExam, getExam, getAllExams, updateExamStatus, startExam, cleanupAbandonedExams, getExamStatusForUser } = require('../controllers/examController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Get all exams (authenticated users)
router.get('/', protect, getAllExams);

// Create exam (admin/staff, with Gemini AI questions)
router.post('/', protect, restrictTo('admin', 'staff'), createExam);

// Submit exam attempt (student)
router.post('/:id/submit', protect, restrictTo('student'), submitExam);

// Start exam (student) - changes status from live to ongoing
router.post('/:id/start', protect, restrictTo('student'), startExam);

// Get exam status for user (student)
router.get('/:id/status', protect, restrictTo('student'), getExamStatusForUser);

// Update exam status (admin only)
router.put('/:id/status', protect, restrictTo('admin'), updateExamStatus);

// Cleanup abandoned exams (admin only)
router.post('/cleanup/abandoned', protect, restrictTo('admin'), cleanupAbandonedExams);

// Get exam details (admin sees all, students see own results)
router.get('/:id', protect, getExam);

module.exports = router;
