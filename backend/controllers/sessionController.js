const mongoose = require('mongoose');
const Session = require('../models/Session');
const { sendLiveSessionInvitation, sendLiveSessionConfirmation } = require('../utils/emailTemplates');
const LiveSession = require('../models/LiveSession');
const User = require('../models/User');
const Progress = require('../models/Progress');
const transporter = require('../config/nodemailer');
const cloudinary = require('../config/cloudinary');
const { sendSessionReminder } = require('../utils/emailTemplates');

// Create/Schedule session
exports.createSession = async (req, res) => {
  try {
    const { title, description, startTime, endTime, sessionType, learners, meetingLink } = req.body;
    const tutor = req.user.id;

    // Validate tutor
    if (req.user.role !== 'tutor' && !req.user.isTutor) {
      return res.status(403).json({ msg: 'Must be in tutor mode to create session' });
    }

    // Validate learners
    const learnerUsers = await User.find({ email: { $in: learners } });
    if (learnerUsers.length !== learners.length) {
      return res.status(400).json({ msg: 'One or more learners not found' });
    }

    // Extract user IDs from found users
    const learnerIds = learnerUsers.map(user => user._id);

    const session = new Session({
      title,
      description,
      tutor,
      learners: learnerIds,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      sessionType,
      meetingLink: meetingLink || undefined
    });
    await session.save();

    // Send reminder emails
    const reminderTime = new Date(session.startTime.getTime() - 30 * 60 * 1000);  // 30 min before
    setTimeout(async () => {
      const learnerEmails = learnerUsers.map(user => user.email);
      const tutorUser = await User.findById(req.user.id).select('email profile.name');

      // Send to learners
      for (const email of learnerEmails) {
        await sendSessionReminder(email, session, tutorUser.profile?.name || 'Your Tutor');
      }

      // Send to tutor as well
      await sendSessionReminder(tutorUser.email, session, tutorUser.profile?.name || 'You');
    }, reminderTime - Date.now());

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ msg: 'Server error creating session', error: error.message });
  }
};

// Create live session
exports.createLiveSession = async (req, res) => {
  try {
    const { title, description, startTime, endTime, studentEmail } = req.body;
    const tutor = req.user.id;

    // Validate tutor
    if (req.user.role !== 'tutor' && !req.user.isTutor) {
      return res.status(403).json({ msg: 'Must be in tutor mode to create live session' });
    }

    // Validate student email
    if (!studentEmail) {
      return res.status(400).json({ msg: 'Student email is required for one-on-one sessions' });
    }

    // Find student by email
    const student = await User.findOne({ email: studentEmail });
    if (!student) {
      return res.status(400).json({ msg: 'Student not found with this email address' });
    }

    // Check if student is not the tutor
    if (student._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ msg: 'Cannot create session with yourself' });
    }

    console.log('Tutor ID:', req.user.id);
    console.log('Student ID:', student._id);

    // Create session data object
    const sessionData = {
      title,
      description,
      tutor: new mongoose.Types.ObjectId(req.user.id), // Ensure proper ObjectId format
      maxParticipants: 2, // Tutor + 1 student for one-on-one session
      invitedStudent: student._id,
      invitedStudentEmail: studentEmail,
      status: 'live', // Make sessions live/active by default
      isActive: true, // Make sessions active immediately
      participants: [req.user.id, student._id] // Add both tutor and student as participants immediately
    };

    // Add dates only if provided
    if (startTime) {
      sessionData.startTime = new Date(startTime);
    }
    if (endTime) {
      sessionData.endTime = new Date(endTime);
    }

    console.log('Session data to save:', sessionData);

    const liveSession = new LiveSession(sessionData);
    await liveSession.save();

    // Send invitation email to student
    const tutorUser = await User.findById(req.user.id).select('email profile.name');
    const studentUser = await User.findById(student._id).select('profile.name');
    const sessionDetails = {
      title: liveSession.title,
      description: liveSession.description,
      startTime: liveSession.startTime,
      endTime: liveSession.endTime,
      _id: liveSession._id
    };

    // Send email to student
    await sendLiveSessionInvitation(
      studentEmail,
      sessionDetails,
      tutorUser.profile?.name || tutorUser.email,
      studentUser.profile?.name || student.email
    );

    // Send confirmation to tutor
    await sendLiveSessionConfirmation(
      tutorUser.email,
      sessionDetails,
      studentUser.profile?.name || student.email,
      tutorUser.profile?.name || tutorUser.email
    );

    res.status(201).json({
      liveSession,
      message: 'Live session created successfully. Student has been notified via email.'
    });
  } catch (error) {
    console.error('Create live session error:', error);
    res.status(500).json({ msg: 'Server error creating live session', error: error.message });
  }
};

// Get all sessions (user's own or public)
exports.getAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, type } = req.query;

    const query = { $or: [{ tutor: userId }, { learners: userId }] };
    if (status) query.status = status;
    if (type) query.sessionType = type;

    const sessions = await Session.find(query).populate('tutor learners', 'profile.name email');
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ msg: 'Server error fetching sessions', error: error.message });
  }
};

// Get session by ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('tutor learners', 'profile.name email');
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Check access
    const userId = req.user.id;
    if (session.tutor.toString() !== userId && !session.learners.some(l => l.toString() === userId)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session by ID error:', error);
    res.status(500).json({ msg: 'Server error fetching session', error: error.message });
  }
};

// Update session (e.g., add learners, change time)
exports.updateSession = async (req, res) => {
  try {
    const updates = req.body;
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('tutor learners');

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Check tutor access
    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only tutor can update' });
    }

    res.json(session);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ msg: 'Server error updating session', error: error.message });
  }
};

// Delete/Cancel session
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only tutor can cancel' });
    }

    // Send cancellation emails
    const users = await User.find({ _id: { $in: [session.tutor, ...session.learners] } });
    await transporter.sendMail({
      to: users.map(u => u.email),
      subject: `Session "${session.title}" Cancelled`,
      text: 'The session has been cancelled.'
    });

    await Session.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Session cancelled successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ msg: 'Server error cancelling session', error: error.message });
  }
};

// Join session (update status to live, generate meeting link)
exports.joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Generate WebRTC room ID if not exists
    if (!session.meetingLink) {
      session.meetingLink = `room_${session._id}_${Date.now()}`;
      await session.save();
    }

    // Add user if learner and award XP
    if (!session.learners.some(l => l.toString() === req.user.id)) {
      session.learners.push(req.user.id);
      await session.save();
      
      // Award 100 XP for joining a session
      let progress = await Progress.findOne({ user: req.user.id });
      if (!progress) {
        // Create progress entry if doesn't exist (shouldn't happen after registration)
        const badgeDefinitions = Progress.getBadgeDefinitions();
        const noobieBadge = badgeDefinitions['noobie'];
        
        progress = new Progress({
          user: req.user.id,
          experiencePoints: noobieBadge.xpReward,
          currentLevel: 1,
          badges: [{
            id: noobieBadge.id,
            name: noobieBadge.name,
            description: noobieBadge.description,
            category: noobieBadge.category,
            icon: noobieBadge.icon,
            xpReward: noobieBadge.xpReward,
            earnedAt: new Date()
          }]
        });
      }
      
      // Award 100 XP for joining
      progress.experiencePoints += 100;
      progress.sessionsCompleted += 1;
      progress.currentLevel = Math.floor(progress.experiencePoints / 1000) + 1;
      
      // Check and award badges
      const newBadges = progress.checkAndAwardBadges();
      await progress.save();
      
      if (newBadges.length > 0) {
        console.log(`User ${req.user.email} earned badges: ${newBadges.map(b => b.name).join(', ')}`);
      }
      
      console.log(`User ${req.user.email} joined session and earned 100 XP (Total: ${progress.experiencePoints} XP)`);
    }

    // Set to live if tutor
    if (session.tutor.toString() === req.user.id) {
      session.status = 'live';
      await session.save();
    }

    res.json({ meetingLink: session.meetingLink, status: session.status });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({ msg: 'Server error joining session', error: error.message });
  }
};

// Get all live sessions
exports.getLiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find sessions where user is either the tutor or the invited student
    const query = {
      $or: [
        { tutor: userId }, // Sessions created by this user (tutor)
        { invitedStudent: userId } // Sessions where this user is invited as student
      ]
    };

    const liveSessions = await LiveSession.find(query)
      .populate('tutor', 'profile.name email')
      .populate('invitedStudent', 'profile.name email')
      .populate('participants', 'profile.name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${liveSessions.length} live sessions for user ${userId}`);
    res.json(liveSessions);
  } catch (error) {
    console.error('Get live sessions error:', error);
    res.status(500).json({ msg: 'Server error fetching live sessions', error: error.message });
  }
};

// Join live session
exports.joinLiveSession = async (req, res) => {
  try {
    const liveSession = await LiveSession.findById(req.params.id);
    if (!liveSession) {
      return res.status(404).json({ msg: 'Live session not found' });
    }

    // Check if user is the invited student or the tutor
    const userId = req.user.id;
    const isTutor = liveSession.tutor.toString() === userId;
    const isInvitedStudent = liveSession.invitedStudent && liveSession.invitedStudent.toString() === userId;

    if (!isTutor && !isInvitedStudent) {
      return res.status(403).json({ msg: 'You are not invited to this session' });
    }

    // Check if session is full (shouldn't happen for one-on-one, but safety check)
    if (liveSession.participants.length >= liveSession.maxParticipants && !liveSession.participants.some(p => p.toString() === userId)) {
      return res.status(400).json({ msg: 'Session is full' });
    }

    // Add participant if not already joined (only for students, tutor is already added)
    if (!liveSession.participants.some(p => p.toString() === userId)) {
      liveSession.participants.push(userId);
      await liveSession.save();

      // Award XP for joining live session (only for students)
      if (!isTutor) {
        let progress = await Progress.findOne({ user: userId });
        if (!progress) {
          // Create progress entry if doesn't exist
          const badgeDefinitions = Progress.getBadgeDefinitions();
          const noobieBadge = badgeDefinitions['noobie'];

          progress = new Progress({
            user: userId,
            experiencePoints: noobieBadge.xpReward,
            currentLevel: 1,
            badges: [{
              id: noobieBadge.id,
              name: noobieBadge.name,
              description: noobieBadge.description,
              category: noobieBadge.category,
              icon: noobieBadge.icon,
              xpReward: noobieBadge.xpReward,
              earnedAt: new Date()
            }]
          });
        }

        // Award 150 XP for joining live session
        progress.experiencePoints += 150;
        progress.liveSessionsAttended += 1;
        progress.sessionsCompleted += 1;
        progress.currentLevel = Math.floor(progress.experiencePoints / 1000) + 1;

        // Check and award badges
        const newBadges = progress.checkAndAwardBadges();
        await progress.save();

        if (newBadges.length > 0) {
          const user = await User.findById(userId);
          console.log(`User ${user.email} earned badges from live session: ${newBadges.map(b => b.name).join(', ')}`);
        }

        console.log(`User ${req.user.email} joined live session and earned 150 XP (Total: ${progress.experiencePoints} XP)`);
      }
    }

    // Generate meeting room for live session
    if (!liveSession.meetingLink) {
      liveSession.meetingLink = `live_room_${liveSession._id}_${Date.now()}`;
      await liveSession.save();
    }

    res.json({
      meetingLink: liveSession.meetingLink,
      participantCount: liveSession.participants.length,
      maxParticipants: liveSession.maxParticipants,
      isTutor,
      sessionDetails: {
        title: liveSession.title,
        description: liveSession.description,
        startTime: liveSession.startTime,
        endTime: liveSession.endTime
      }
    });
  } catch (error) {
    console.error('Join live session error:', error);
    res.status(500).json({ msg: 'Server error joining live session', error: error.message });
  }
};

// Complete session and award XP
exports.completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Only tutor can mark session as completed
    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only tutor can complete session' });
    }

    // Update session status
    session.status = 'completed';
    await session.save();

    // Award XP to all learners who joined
    const learnerIds = session.learners;
    const sessionDuration = (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60); // hours
    
    for (const learnerId of learnerIds) {
      let progress = await Progress.findOne({ user: learnerId });
      if (progress) {
        // Award completion XP (50 XP) + time-based XP (25 XP per hour)
        const completionXP = 50;
        const timeXP = Math.floor(sessionDuration * 25);
        const totalSessionXP = completionXP + timeXP;
        
        progress.experiencePoints += totalSessionXP;
        progress.totalHours += sessionDuration;
        
        // Track session type
        if (session.sessionType === 'live') {
          progress.liveSessionsAttended += 1;
        } else {
          progress.normalSessionsCompleted += 1;
        }
        
        // Update level
        progress.currentLevel = Math.floor(progress.experiencePoints / 1000) + 1;
        
        // Update streak
        const today = new Date();
        const lastActivity = progress.streak.lastActivity;
        if (!lastActivity || lastActivity.toDateString() !== today.toDateString()) {
          if (lastActivity && (today - lastActivity) <= 24 * 60 * 60 * 1000) {
            progress.streak.current += 1;
          } else {
            progress.streak.current = 1;
          }
          progress.streak.longest = Math.max(progress.streak.longest, progress.streak.current);
          progress.streak.lastActivity = today;
        }
        
        // Check and award badges
        const newBadges = progress.checkAndAwardBadges();
        await progress.save();
        
        if (newBadges.length > 0) {
          const user = await User.findById(learnerId);
          console.log(`User ${user.email} earned badges on session completion: ${newBadges.map(b => b.name).join(', ')}`);
        }
        
        console.log(`Session completed: User earned ${totalSessionXP} XP (${completionXP} completion + ${timeXP} time-based)`);
      }
    }

    res.json({ msg: 'Session completed successfully', session });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ msg: 'Server error completing session', error: error.message });
  }
};

// Upload recording (post-session)
exports.uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'LearningSphere/sessions'
    });

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { recordingUrl: result.secure_url, status: 'completed' },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    res.json({ recordingUrl: result.secure_url });
  } catch (error) {
    console.error('Upload recording error:', error);
    res.status(500).json({ msg: 'Server error uploading recording', error: error.message });
  }
};
