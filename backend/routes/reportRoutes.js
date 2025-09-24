const express = require('express');
const { generateStudentReport, generateExamReport } = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Generate student performance report (admin or self)
router.get('/user/:userId?', protect, generateStudentReport);

// Generate exam summary report (admin only)
router.get('/exam/:examId', protect, restrictTo('admin'), generateExamReport);

module.exports = router;
