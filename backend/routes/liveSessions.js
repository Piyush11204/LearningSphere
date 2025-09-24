const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const LiveSession = require('../models/LiveSession');
const User = require('../models/User');

// @route   POST api/livesessions
// @desc    Create a new live session
// @access  Private (Tutor only)
router.post('/', auth, async (req, res) => {
  const { title, description, scheduledTime, maxParticipants } = req.body;
  
  console.log('Creating live session for user:', req.user);
  console.log('Request body:', req.body);
  
  // Check if user is a tutor (either by role or isTutor flag)
  if (req.user.role !== 'tutor' && !req.user.isTutor) {
    console.log('Access denied: User is not a tutor');
    return res.status(403).json({ msg: 'Access denied. Tutors only.' });
  }

  try {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('Generated sessionId:', sessionId);
    
    const session = new LiveSession({
      tutorId: req.user.id,
      sessionId,
      title,
      description,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      maxParticipants
    });

    await session.save();
    console.log('Session saved successfully');
    
    // Populate tutor info
    await session.populate('tutorId', 'profile.name email');
    
    console.log('Returning session:', session);
    res.json(session);
  } catch (err) {
    console.error('Error creating live session:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/livesessions
// @desc    Get all active sessions (for students) or my sessions (for tutors)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = { isActive: false }; // Default to upcoming sessions
    
    if (req.user.role === 'tutor') {
      query = { tutorId: req.user.id };
    }
    
    const sessions = await LiveSession.find(query)
      .populate('tutorId', 'profile.name email role')
      .sort({ createdAt: -1 });
    
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/livesessions/:sessionId
// @desc    Get single session details
// @access  Private
router.get('/:sessionId', auth, async (req, res) => {
  console.log('Fetching session details for sessionId:', req.params.sessionId);
  console.log('User:', req.user);
  
  try {
    const session = await LiveSession.findOne({ sessionId: req.params.sessionId })
      .populate('tutorId', 'profile.name email role')
      .populate('participants.userId', 'profile.name email');
    
    console.log('Session found:', session);
    
    if (!session) {
      console.log('Session not found');
      return res.status(404).json({ msg: 'Session not found' });
    }
    
    res.json(session);
  } catch (err) {
    console.error('Error fetching session:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/livesessions/:sessionId/join
// @desc    Join a live session
// @access  Private (Learner only)
router.post('/:sessionId/join', auth, async (req, res) => {
  console.log('Join request for sessionId:', req.params.sessionId);
  console.log('User:', req.user);

  // Allow both learners and tutors to join
  if (req.user.role !== 'learner' && req.user.role !== 'tutor') {
    console.log('Access denied: Invalid user role');
    return res.status(403).json({ msg: 'Access denied. Learners and tutors only.' });
  }

  try {
    const session = await LiveSession.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      console.log('Session not found');
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Check if session is joinable
    if (!session.isActive && !session.scheduledTime) {
      console.log('Session not available for joining');
      return res.status(400).json({ msg: 'Session is not available for joining' });
    }

    // Check if already joined
    const alreadyJoined = session.participants.some(p => 
      p.userId.toString() === req.user.id
    );

    if (alreadyJoined) {
      console.log('User already joined, allowing rejoin');
      await session.populate('participants.userId', 'profile.name email');
      return res.json(session);
    }

    // Check max participants
    if (session.participants.length >= session.maxParticipants) {
      console.log('Session is full');
      return res.status(400).json({ msg: 'Session is full' });
    }

    // Add user to participants
    session.participants.push({ userId: req.user.id });
    await session.save();
    console.log('User joined successfully');

    // Populate participants for response
    await session.populate('participants.userId', 'profile.name email');
    await session.populate('tutorId', 'profile.name email role');

    // Emit user joined event via Socket.IO
    req.io.to(session.sessionId).emit('userJoined', {
      userId: req.user.id,
      userName: req.user.profile?.name || req.user.email,
      socketId: req.socketId // Ensure socketId is available via middleware
    });

    res.json(session);
  } catch (err) {
    console.error('Error joining session:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/livesessions/:sessionId/start
// @desc    Start a live session
// @access  Private (Tutor only)
router.post('/:sessionId/start', auth, async (req, res) => {
  try {
    const session = await LiveSession.findOne({ sessionId: req.params.sessionId });
    
    if (!session || session.tutorId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    session.isActive = true;
    await session.save();
    
    await session.populate('participants.userId', 'profile.name email');
    
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/livesessions/:sessionId/chat
// @desc    Get chat messages for a session
// @access  Private
router.get('/:sessionId/chat', auth, async (req, res) => {
  try {
    const session = await LiveSession.findOne({ sessionId: req.params.sessionId });

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Check if user is participant or tutor
    const isParticipant = session.participants.some(p =>
      p.userId.toString() === req.user.id
    );

    if (!isParticipant && session.tutorId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Return chat messages
    res.json(session.chatMessages || []);
  } catch (err) {
    console.error('Error fetching chat messages:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/livesessions/:sessionId/chat
// @desc    Send chat message
// @access  Private
router.post('/:sessionId/chat', auth, async (req, res) => {
  const { message } = req.body;
  
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ msg: 'Message cannot be empty' });
  }

  try {
    const session = await LiveSession.findOne({ sessionId: req.params.sessionId });
    
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }
    
    // Check if user is participant or tutor
    const isParticipant = session.participants.some(p => 
      p.userId.toString() === req.user.id
    );
    
    if (!isParticipant && session.tutorId.toString() !== req.user.id) {
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

// @route   POST api/livesessions/:sessionId/leave
// @desc    Leave a live session
// @access  Private
router.post('/:sessionId/leave', auth, async (req, res) => {
  console.log('Leave request for sessionId:', req.params.sessionId);
  console.log('User:', req.user);
  
  try {
    const session = await LiveSession.findOne({ sessionId: req.params.sessionId });
    
    if (!session) {
      console.log('Session not found');
      return res.status(404).json({ msg: 'Session not found' });
    }
    
    // Remove user from participants
    session.participants = session.participants.filter(p => 
      p.userId.toString() !== req.user.id
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