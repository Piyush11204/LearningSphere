const express = require('express');
const { createSession, createLiveSession, getAllSessions, getSessionById, updateSession, deleteSession, joinSession, joinLiveSession, completeSession, uploadRecording } = require('../controllers/sessionController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Protected routes
router.post('/schedule', auth, createSession);
router.post('/live', auth, createLiveSession);
router.get('/', auth, getAllSessions);
router.get('/:id', auth, getSessionById);
router.put('/:id', auth, updateSession);
router.delete('/:id', auth, deleteSession);
router.post('/:id/join', auth, joinSession);
router.post('/live/:id/join', auth, joinLiveSession);
router.post('/:id/complete', auth, completeSession);
router.post('/:id/recording', auth, upload.single('recording'), uploadRecording);

module.exports = router;
