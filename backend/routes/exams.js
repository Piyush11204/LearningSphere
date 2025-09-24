const express = require('express');
const { createExam, submitExam, getExam, getAllExams, updateExamStatus, startExam, cleanupAbandonedExams, getExamStatusForUser, getUserExamHistory, deleteExam } = require('../controllers/examController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Get all exams (public access for viewing)
router.get('/', getAllExams);

// Get user's exam history (authenticated users only)
router.get('/history', auth, getUserExamHistory);

// Create exam (admin/tutor, with Gemini AI questions)
router.post('/', auth, roleCheck(['admin', 'tutor']), createExam);

// Submit exam attempt (public access for taking exams)
router.post('/:id/submit', submitExam);

// Start exam (public access for taking exams)
router.post('/:id/start', startExam);

// Get exam status for user (public access)
router.get('/:id/status', getExamStatusForUser);

// Update exam status (admin/tutor)
router.put('/:id/status', auth, roleCheck(['admin', 'tutor']), updateExamStatus);

// Delete exam (admin/tutor)
router.delete('/:id', auth, roleCheck(['admin', 'tutor']), deleteExam);

// Cleanup abandoned exams (admin/tutor)
router.post('/cleanup/abandoned', auth, roleCheck(['admin', 'tutor']), cleanupAbandonedExams);

// Get exam details (public access for viewing)
router.get('/:id', getExam);

module.exports = router;
