const Session = require('../models/Session');
const LiveSession = require('../models/LiveSession');

module.exports = (io) => {
  // Connection middleware for logging
  io.use((socket, next) => {
    console.log(`Socket attempting connection: ${socket.id}`);
    next();
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Join regular session room
    socket.on('joinSession', async ({ sessionId, userId }) => {
      try {
        const session = await Session.findById(sessionId);
        if (!session) throw new Error('Session not found');

        socket.join(sessionId);
        socket.to(sessionId).emit('userJoined', { userId, socketId: socket.id });

        // Send existing users
        const users = await Session.findById(sessionId).populate('tutor learners', 'profile.name');
        socket.emit('sessionUsers', users);
      } catch (error) {
        console.error('Join session socket error:', error);
        socket.emit('error', { msg: 'Failed to join session' });
      }
    });

    // Join live session room
    socket.on('joinLiveSession', async ({ sessionId, userId, userName }) => {
      try {
        console.log(`=== USER JOINING LIVE SESSION ===`);
        console.log(`User: ${userId} (${userName})`);
        console.log(`Session: ${sessionId}`);
        console.log(`Socket ID: ${socket.id}`);

        const session = await LiveSession.findOne({ sessionId });
        if (!session) throw new Error('Live session not found');

        socket.join(sessionId);
        socket.userId = userId;
        socket.userName = userName;
        socket.sessionId = sessionId;

        console.log(`Socket properties set:`, {
          userId: socket.userId,
          userName: socket.userName,
          sessionId: socket.sessionId
        });

        // Notify others in the room
        socket.to(sessionId).emit('userJoined', {
          userId,
          userName,
          socketId: socket.id,
          timestamp: new Date()
        });

        // Send current participants to the new user
        const participants = await LiveSession.findOne({ sessionId })
          .populate('participants.userId', 'profile.name');

        console.log(`Sending liveSessionUsers to new user with ${participants.participants.length} participants`);

        socket.emit('liveSessionUsers', {
          participants: participants.participants,
          session: {
            title: session.title,
            isActive: session.isActive
          }
        });

        console.log(`User ${userName} successfully joined live session ${sessionId}`);
      } catch (error) {
        console.error('Join live session socket error:', error);
        socket.emit('error', { msg: 'Failed to join live session' });
      }
    });

    // Real-time chat for live sessions
    socket.on('sendMessage', async ({ sessionId, message, userId, userName }) => {
      try {
        console.log(`Chat message from ${userName} in session ${sessionId}: ${message}`);

        // Save message to database
        const session = await LiveSession.findOne({ sessionId });
        if (!session) return;

        const chatMessage = {
          userId,
          username: userName,
          message: message.trim(),
          timestamp: new Date()
        };

        session.chatMessages.push(chatMessage);
        await session.save();

        // Broadcast message to all participants in the room
        io.to(sessionId).emit('newMessage', chatMessage);
        console.log(`Message broadcasted to session ${sessionId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { msg: 'Failed to send message' });
      }
    });

    // WebRTC signaling for live sessions
    socket.on('webrtc-offer', ({ sessionId, targetUserId, offer }) => {
      console.log(`=== WEBRTC OFFER RECEIVED ===`);
      console.log(`From: ${socket.userId} (${socket.userName})`);
      console.log(`To: ${targetUserId}`);
      console.log(`Session: ${sessionId}`);
      console.log(`Offer type: ${offer.type}`);

      // Find the target user's socket and send the offer
      const targetSocket = Array.from(io.sockets.sockets.values()).find(s =>
        s.userId === targetUserId && s.sessionId === sessionId
      );

      if (targetSocket) {
        console.log(`Forwarding offer to target socket: ${targetSocket.id}`);
        targetSocket.emit('webrtc-offer', {
          offer,
          fromUserId: socket.userId,
          fromUserName: socket.userName
        });
        console.log(`WebRTC offer forwarded successfully`);
      } else {
        console.error(`Target socket not found for user ${targetUserId} in session ${sessionId}`);
        console.log(`Available sockets in session ${sessionId}:`, Array.from(io.sockets.sockets.values())
          .filter(s => s.sessionId === sessionId)
          .map(s => ({ id: s.id, userId: s.userId, userName: s.userName })));
      }
    });

    socket.on('webrtc-answer', ({ sessionId, targetUserId, answer }) => {
      console.log(`=== WEBRTC ANSWER RECEIVED ===`);
      console.log(`From: ${socket.userId} (${socket.userName})`);
      console.log(`To: ${targetUserId}`);
      console.log(`Session: ${sessionId}`);
      console.log(`Answer type: ${answer.type}`);

      // Find the target user's socket and send the answer
      const targetSocket = Array.from(io.sockets.sockets.values()).find(s =>
        s.userId === targetUserId && s.sessionId === sessionId
      );

      if (targetSocket) {
        console.log(`Forwarding answer to target socket: ${targetSocket.id}`);
        targetSocket.emit('webrtc-answer', {
          answer,
          fromUserId: socket.userId
        });
        console.log(`WebRTC answer forwarded successfully`);
      } else {
        console.error(`Target socket not found for user ${targetUserId} in session ${sessionId}`);
      }
    });

    socket.on('webrtc-ice-candidate', ({ sessionId, targetUserId, candidate }) => {
      console.log(`=== WEBRTC ICE CANDIDATE RECEIVED ===`);
      console.log(`From: ${socket.userId} (${socket.userName})`);
      console.log(`To: ${targetUserId}`);
      console.log(`Session: ${sessionId}`);
      console.log(`Candidate type: ${candidate?.type}`);

      // Find the target user's socket and send the ICE candidate
      const targetSocket = Array.from(io.sockets.sockets.values()).find(s =>
        s.userId === targetUserId && s.sessionId === sessionId
      );

      if (targetSocket) {
        console.log(`Forwarding ICE candidate to target socket: ${targetSocket.id}`);
        targetSocket.emit('webrtc-ice-candidate', {
          candidate,
          fromUserId: socket.userId
        });
        console.log(`WebRTC ICE candidate forwarded successfully`);
      } else {
        console.error(`Target socket not found for user ${targetUserId} in session ${sessionId}`);
      }
    });

    // Screen sharing signaling
    socket.on('screenShareStarted', ({ sessionId, userId }) => {
      console.log(`Screen sharing started by ${socket.userName} in session ${sessionId}`);
      socket.to(sessionId).emit('screenShareStarted', {
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        userId
      });
    });

    socket.on('screenShareStopped', ({ sessionId, userId }) => {
      console.log(`Screen sharing stopped by ${socket.userName} in session ${sessionId}`);
      socket.to(sessionId).emit('screenShareStopped', {
        fromUserId: socket.userId,
        userId
      });
    });

    // Session started by tutor
    socket.on('sessionStarted', ({ sessionId }) => {
      console.log(`Session ${sessionId} started by tutor ${socket.userName}`);
      socket.to(sessionId).emit('sessionStarted', {
        sessionId,
        startedBy: socket.userId
      });
    });

    // Offer/Answer exchange for WebRTC (legacy)
    socket.on('offer', ({ sessionId, offer, toSocketId }) => {
      socket.to(toSocketId).emit('offer', { offer, fromSocketId: socket.id });
    });

    socket.on('answer', ({ sessionId, answer, toSocketId }) => {
      socket.to(toSocketId).emit('answer', { answer, fromSocketId: socket.id });
    });

    // ICE candidates (legacy)
    socket.on('iceCandidate', ({ sessionId, candidate, toSocketId }) => {
      socket.to(toSocketId).emit('iceCandidate', { candidate, fromSocketId: socket.id });
    });

    // Leave session
    socket.on('leaveSession', ({ sessionId }) => {
      console.log(`User ${socket.userName} leaving session ${sessionId}`);
      socket.leave(sessionId);
      socket.to(sessionId).emit('userLeft', {
        userId: socket.userId,
        userName: socket.userName,
        socketId: socket.id
      });
    });

    // Leave live session
    socket.on('leaveLiveSession', ({ sessionId }) => {
      console.log(`User ${socket.userName} leaving live session ${sessionId}`);
      socket.leave(sessionId);
      socket.to(sessionId).emit('userLeft', {
        userId: socket.userId,
        userName: socket.userName,
        socketId: socket.id
      });
    });

    // Handle chat messages
    socket.on('sendChatMessage', (messageData) => {
      console.log('📨 Chat message received:', messageData);
      
      // Broadcast the message to all users in the session except sender
      socket.to(messageData.sessionId).emit('chatMessage', {
        userId: messageData.userId,
        userName: messageData.userName,
        message: messageData.message,
        timestamp: messageData.timestamp
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Notify others if user was in a session
      if (socket.sessionId) {
        socket.to(socket.sessionId).emit('userLeft', {
          userId: socket.userId,
          userName: socket.userName,
          socketId: socket.id
        });
      }
    });
  });
};
