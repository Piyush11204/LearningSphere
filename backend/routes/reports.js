const express = require('express');
const { generateStudentReport, generateExamReport } = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Generate student performance report (admin or self)
router.get('/user/:userId?', auth, generateStudentReport);

// Generate exam summary report (admin/tutor)
router.get('/exam/:examId', auth, roleCheck(['admin', 'tutor']), generateExamReport);

module.exports = router;
