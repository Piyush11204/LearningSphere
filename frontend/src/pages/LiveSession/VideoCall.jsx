import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Phone, 
  MessageCircle, 
  Send, 
  Settings,
  MoreVertical,
  X,
  Users
} from 'lucide-react';
import io from 'socket.io-client';

const VideoCall = ({ sessionId, userName }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [peerConnections, setPeerConnections] = useState(new Map());
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // ICE servers configuration
  const iceServers = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  }), []);

  // Auto-scroll chat messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize peer connection
  const initializePeerConnection = useCallback((remoteUserId) => {
    if (peerConnections.has(remoteUserId)) {
      return peerConnections.get(remoteUserId);
    }

    console.log('🔗 Initializing peer connection for:', remoteUserId);
    const pc = new RTCPeerConnection(iceServers);

    // Add local stream tracks if available
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
        console.log(`Added ${track.kind} track to connection`);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('🎬 Received remote track from:', remoteUserId);
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(remoteUserId, remoteStream);
        return newMap;
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('🧊 Sending ICE candidate to:', remoteUserId);
        socketRef.current.emit('webrtc-ice-candidate', {
          sessionId: sessionId,
          targetUserId: remoteUserId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection with ${remoteUserId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed') {
        console.log('Connection failed, attempting to restart ICE');
        pc.restartIce();
      }
    };

    // Store the peer connection
    setPeerConnections(prev => {
      const newMap = new Map(prev);
      newMap.set(remoteUserId, pc);
      return newMap;
    });

    return pc;
  }, [iceServers, localStream, sessionId, peerConnections, setPeerConnections]);

  // WebRTC signal handlers
  const handleWebRTCOffer = useCallback(async ({ offer, fromUserId }) => {
    console.log('📨 Received WebRTC offer from:', fromUserId);
    const pc = initializePeerConnection(fromUserId);

    try {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit('webrtc-answer', {
        sessionId: sessionId,
        targetUserId: fromUserId,
        answer: answer
      });
      console.log('📤 Sent answer to:', fromUserId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [initializePeerConnection, sessionId]);

  const handleWebRTCAnswer = useCallback(async ({ answer, fromUserId }) => {
    console.log('📨 Received WebRTC answer from:', fromUserId);
    const pc = peerConnections.get(fromUserId);
    
    if (pc) {
      try {
        await pc.setRemoteDescription(answer);
        console.log('✅ Set remote description for answer');
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }, [peerConnections]);

  const handleICECandidate = useCallback(async ({ candidate, fromUserId }) => {
    console.log('🧊 Received ICE candidate from:', fromUserId);
    const pc = peerConnections.get(fromUserId);
    
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(candidate);
        console.log('✅ Added ICE candidate');
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, [peerConnections]);

  // Start local media stream
  const startLocalStream = useCallback(async () => {
    try {
      console.log('🎥 Starting local media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      console.log('✅ Local stream started');
      return stream;
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      return null;
    }
  }, []);

  // Socket connection and event handlers
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('userJoined', (data) => {
      console.log('👤 User joined:', data);
      setParticipants(prev => {
        // Check if user already exists
        const exists = prev.find(p => p.userId === data.userId);
        if (exists) return prev;
        return [...prev, data];
      });
      
      // If this is not our own user joining, create a peer connection and send offer
      if (data.userId !== localStorage.getItem('userId')) {
        const pc = initializePeerConnection(data.userId);
        
        // Create and send offer if we have local stream
        if (localStream && pc) {
          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
            socketRef.current.emit('webrtc-offer', {
              sessionId: sessionId,
              targetUserId: data.userId,
              offer: offer
            });
            console.log('📤 Sent offer to:', data.userId);
          }).catch(console.error);
        }
      }
    });

    socketRef.current.on('userLeft', (data) => {
      console.log('👋 User left:', data);
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      
      // Clean up peer connection
      const pc = peerConnections.get(data.userId);
      if (pc) {
        pc.close();
        setPeerConnections(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      }
      
      // Remove remote stream
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
    });

    // WebRTC signaling events
    socketRef.current.on('webrtc-offer', handleWebRTCOffer);
    socketRef.current.on('webrtc-answer', handleWebRTCAnswer);
    socketRef.current.on('webrtc-ice-candidate', handleICECandidate);

    // Chat message handler
    socketRef.current.on('chatMessage', (messageData) => {
      console.log('💬 Received chat message:', messageData);
      setMessages(prev => [...prev, messageData]);
    });

    // Handle initial participants list
    socketRef.current.on('liveSessionUsers', (data) => {
      console.log('👥 Received live session users:', data);
      if (data.participants) {
        setParticipants(data.participants.map(p => ({
          userId: p.userId._id || p.userId,
          userName: p.userId.profile?.name || p.userId.email || 'User'
        })));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializePeerConnection, handleWebRTCOffer, handleWebRTCAnswer, handleICECandidate, peerConnections, localStream, sessionId]);

  // Join session and start stream
  useEffect(() => {
    if (socketRef.current && sessionId) {
      console.log('🚀 Joining live session:', sessionId);
      socketRef.current.emit('joinLiveSession', {
        sessionId,
        userId: localStorage.getItem('userId'),
        userName: userName
      });

      startLocalStream();
    }
  }, [sessionId, userName, startLocalStream]);

  // Media control functions
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  const sendMessage = useCallback(() => {
    if (newMessage.trim() && socketRef.current) {
      const messageData = {
        sessionId,
        userId: localStorage.getItem('userId'),
        userName: userName,
        message: newMessage.trim(),
        timestamp: new Date()
      };
      
      socketRef.current.emit('sendChatMessage', messageData);
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
    }
  }, [newMessage, sessionId, userName]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
          setScreenStream(null);
        }
        setIsScreenSharing(false);
        
        // Switch back to camera
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            // Replace the screen track with camera track in all peer connections
            peerConnections.forEach((pc) => {
              const sender = pc.getSenders().find(s => s.track?.kind === 'video');
              if (sender) {
                sender.replaceTrack(videoTrack);
              }
            });
          }
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        setScreenStream(screenStream);
        setIsScreenSharing(true);
        
        // Replace camera track with screen track in all peer connections
        const screenTrack = screenStream.getVideoTracks()[0];
        peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });
        
        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [isScreenSharing, screenStream, localStream, peerConnections]);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-white text-lg font-medium">1-on-1 Live Session</h1>
          <span className="text-gray-400 text-sm">
            {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Video Layout - One-on-One */}
          <div className="h-full p-6">
            {participants.length === 0 ? (
              // Only local video when alone
              <div className="h-full flex items-center justify-center">
                <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full aspect-video">
                  {localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-2xl font-bold">
                            {userName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-lg mb-2">{userName || 'You'}</p>
                        <p className="text-gray-400">Waiting for participant...</p>
                      </div>
                    </div>
                  )}
                  {/* User name overlay */}
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {userName || 'You'}
                    </div>
                  </div>
                  {/* Muted indicator */}
                  {isMuted && (
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-red-600 p-2 rounded-full">
                        <MicOff className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  {/* Video off indicator */}
                  {isVideoOff && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-gray-600 p-2 rounded-full">
                        <VideoOff className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  {/* Screen sharing indicator */}
                  {isScreenSharing && (
                    <div className="absolute top-4 left-4">
                      <div className="bg-green-600 p-2 rounded-full">
                        <Monitor className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // One-on-one layout - side by side
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Local Video */}
                <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                  {localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white text-lg font-bold">
                            {userName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{userName || 'You'}</p>
                        <p className="text-gray-500 text-xs">Camera starting...</p>
                      </div>
                    </div>
                  )}
                  {/* User name overlay */}
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                      {userName || 'You'}
                    </div>
                  </div>
                  {/* Muted indicator */}
                  {isMuted && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-red-600 p-1 rounded-full">
                        <MicOff className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                  {/* Screen sharing indicator */}
                  {isScreenSharing && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-green-600 p-1 rounded-full">
                        <Monitor className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Remote Video - Only show first participant for one-on-one */}
                {Array.from(remoteStreams.entries()).slice(0, 1).map(([userId, stream]) => {
                  const participant = participants.find(p => p.userId === userId);
                  const name = participant?.userName || `User ${userId.slice(-4)}`;
                  
                  return (
                    <div key={userId} className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                      <video
                        autoPlay
                        playsInline
                        ref={(video) => {
                          if (video && stream) {
                            video.srcObject = stream;
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                      {/* User name overlay */}
                      <div className="absolute bottom-3 left-3">
                        <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                          {name}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show connecting state if no remote stream yet */}
                {remoteStreams.size === 0 && participants.length > 0 && (
                  <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-white text-lg font-bold">
                            {participants[0]?.userName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{participants[0]?.userName || 'Participant'}</p>
                        <p className="text-gray-500 text-xs">Connecting...</p>
                      </div>
                    </div>
                    {/* User name overlay */}
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                        {participants[0]?.userName || 'Participant'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meeting Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-gray-800 rounded-full px-6 py-3 shadow-2xl border border-gray-700">
              {/* Microphone */}
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera */}
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isVideoOff 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isScreenSharing 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
              >
                <Monitor className="w-5 h-5" />
              </button>

              {/* Chat Toggle */}
              <button
                onClick={toggleChat}
                className={`p-3 rounded-full transition-all duration-200 relative ${
                  isChatOpen 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                title="Toggle chat"
              >
                <MessageCircle className="w-5 h-5" />
                {messages.length > 0 && !isChatOpen && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {messages.length > 9 ? '9+' : messages.length}
                  </span>
                )}
              </button>

              {/* Leave Call */}
              <button
                className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                title="Leave call"
                onClick={() => window.history.back()}
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-gray-900 font-medium">In-call messages</h3>
              <button
                onClick={toggleChat}
                className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatMessagesRef}>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Messages can only be seen by people in the call</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {msg.userName === userName ? 'You' : msg.userName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 bg-gray-100 rounded-lg px-3 py-2 break-words">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Send a message to everyone"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;