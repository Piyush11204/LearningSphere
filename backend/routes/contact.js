const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const {
  submitContact,
  getAllContacts,
  getContactById,
  updateContact,
  addAdminNote,
  deleteContact,
  getContactStats
} = require('../controllers/contactController');

// Public route - Submit contact form
router.post('/', submitContact);

// Admin routes - Protected
router.get('/', auth, roleCheck(['admin']), getAllContacts);
router.get('/stats', auth, roleCheck(['admin']), getContactStats);
router.get('/:id', auth, roleCheck(['admin']), getContactById);
router.put('/:id', auth, roleCheck(['admin']), updateContact);
router.post('/:id/notes', auth, roleCheck(['admin']), addAdminNote);
router.delete('/:id', auth, roleCheck(['admin']), deleteContact);

module.exports = router;