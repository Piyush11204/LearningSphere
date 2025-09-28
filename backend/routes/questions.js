const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import the full auth module (matching 
const {
  getAllQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');
const roleCheck = require('../middleware/roleCheck');


// Get all questions (accessible to authenticated users)
router.get('/',auth, getAllQuestions);

// Get single question (accessible to authenticated users)
router.get('/:id',auth, getQuestion);

// Create question (tutors only - added requireTutor as per other tutor-only routes)
router.post('/',auth, roleCheck(['admin', 'tutor']), createQuestion);

// Update question (tutors only - added requireTutor as per other tutor-only routes)
router.put('/:id',auth, roleCheck(['admin', 'tutor']), updateQuestion);

// Delete question (tutors only - added requireTutor as per other tutor-only routes)
router.delete('/:id',auth, roleCheck(['admin', 'tutor']), deleteQuestion);

module.exports = router;