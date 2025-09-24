const express = require('express');
const { getAllUsers, getUserById, createUser, updateUser, deleteUser, switchMode, searchUsers } = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes (e.g., search with limits)
router.get('/search', searchUsers);

// Protected routes
router.get('/', auth, roleCheck('admin'), getAllUsers);
router.get('/:id', auth, getUserById);
router.post('/', auth, roleCheck('admin'), createUser);
router.put('/:id', auth, upload.single('avatar'), updateUser);
router.delete('/:id', auth, roleCheck('admin'), deleteUser);
router.put('/mode', auth, switchMode);

module.exports = router;
