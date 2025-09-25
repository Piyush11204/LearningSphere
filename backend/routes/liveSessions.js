const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createLiveSession, getLiveSessions, joinLiveSession } = require('../controllers/sessionController');

// @route   POST api/livesessions
// @desc    Create a new live session
// @access  Private (Tutor only)
router.post('/', auth, createLiveSession);

// @route   GET api/livesessions
// @desc    Get all active sessions (for students) or my sessions (for tutors)
// @access  Private
router.get('/', auth, getLiveSessions);

// @route   GET api/livesessions/:id
// @desc    Get single session details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  const LiveSession = require('../models/LiveSession');
  console.log('Fetching session details for id:', req.params.id);
  console.log('User:', req.user);
  
  try {
    const session = await LiveSession.findById(req.params.id)
      .populate('tutor', 'profile.name email role')
      .populate('participants', 'profile.name email')
      .populate('invitedStudent', 'profile.name email');
    
    console.log('Session found:', session);
    
    if (!session) {
      console.log('Session not found');
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Check if user has access to this session (tutor or invited student)
    const userId = req.user.id;
    const isTutor = session.tutor._id.toString() === userId;
    const isInvitedStudent = session.invitedStudent && session.invitedStudent._id.toString() === userId;

    if (!isTutor && !isInvitedStudent) {
      return res.status(403).json({ msg: 'You do not have access to this session' });
    }
    
    res.json(session);
  } catch (err) {
    console.error('Error fetching session:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/livesessions/:id/join
// @desc    Join a live session
// @access  Private (Learner only)
router.post('/:id/join', auth, joinLiveSession);

// @route   POST api/livesessions/:id/start
// @desc    Start a live session
// @access  Private (Tutor only)
router.post('/:id/start', auth, async (req, res) => {
  const LiveSession = require('../models/LiveSession');
  try {
    const session = await LiveSession.findById(req.params.id);
    
    if (!session || session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    session.isActive = true;
    await session.save();
    
    await session.populate('participants', 'profile.name email');
    
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/livesessions/:id/chat
// @desc    Get chat messages for a session
// @access  Private
router.get('/:id/chat', auth, async (req, res) => {
  const LiveSession = require('../models/LiveSession');
  try {
    const session = await LiveSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Check if user is participant or tutor
    const isParticipant = session.participants.some(p =>
      p.toString() === req.user.id
    );

    if (!isParticipant && session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Return chat messages
    res.json(session.chatMessages || []);
  } catch (err) {
    console.error('Error fetching chat messages:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/livesessions/:id/chat
// @desc    Send chat message
// @access  Private
router.post('/:id/chat', auth, async (req, res) => {
  const { message } = req.body;
  const LiveSession = require('../models/LiveSession');
  
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ msg: 'Message cannot be empty' });
  }

  try {
    const session = await LiveSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }
    
    // Check if user is participant or tutor
    const isParticipant = session.participants.some(p => 
      p.toString() === req.user.id
    );
    
    if (!isParticipant && session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    const chatMessage = {
      userId: req.user.id,
      username: req.user.profile?.name || req.user.email || 'Anonymous',
      message: message.trim()
    };
    
    session.chatMessages.push(chatMessage);
    await session.save();
    
    await session.populate('chatMessages.userId', 'profile.name');
    
    res.json(chatMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/livesessions/:id/leave
// @desc    Leave a live session
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  console.log('Leave request for id:', req.params.id);
  console.log('User:', req.user);
  const LiveSession = require('../models/LiveSession');
  
  try {
    const session = await LiveSession.findById(req.params.id);
    
    if (!session) {
      console.log('Session not found');
      return res.status(404).json({ msg: 'Session not found' });
    }
    
    // Remove user from participants
    session.participants = session.participants.filter(p => 
      p.toString() !== req.user.id
    );
    
    await session.save();
    console.log('User left session successfully');
    
    res.json({ msg: 'Left session successfully' });
  } catch (err) {
    console.error('Error leaving session:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;