import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Phone, 
  Users, 
  MessageCircle, 
  Send, 
  Settings,
  MoreVertical,
  X
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
      if (event.candidate) {
        console.log('📤 Sending ICE candidate to:', remoteUserId);
        socketRef.current.emit('webrtc-ice-candidate', {
          sessionId: sessionId,
          targetUserId: remoteUserId,
          candidate: event.candidate
        });
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`Connection state changed for ${remoteUserId}:`, state);
    };

    setPeerConnections(prev => {
      const newMap = new Map(prev);
      newMap.set(remoteUserId, pc);
      return newMap;
    });

    return pc;
  }, [localStream, sessionId, iceServers, peerConnections]);

  // Handle WebRTC offer
  const handleWebRTCOffer = useCallback(async (data) => {
    try {
      const { offer, fromUserId } = data;
      console.log('📥 Received WebRTC offer from:', fromUserId);
      
      let pc = peerConnections.get(fromUserId);
      if (!pc) {
        pc = initializePeerConnection(fromUserId);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit('webrtc-answer', {
        sessionId: sessionId,
        targetUserId: fromUserId,
        answer: answer
      });

      console.log('📤 Sent answer to:', fromUserId);
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  }, [peerConnections, initializePeerConnection, sessionId]);

  // Handle WebRTC answer
  const handleWebRTCAnswer = useCallback(async (data) => {
    try {
      const { answer, fromUserId } = data;
      const pc = peerConnections.get(fromUserId);
      
      if (pc && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Set remote description from answer:', fromUserId);
      }
    } catch (error) {
      console.error('❌ Error handling answer:', error);
    }
  }, [peerConnections]);

  // Handle ICE candidate
  const handleICECandidate = useCallback(async (data) => {
    try {
      const { candidate, fromUserId } = data;
      const pc = peerConnections.get(fromUserId);
      
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ Added ICE candidate from:', fromUserId);
      }
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }, [peerConnections]);

  // Start local stream
  const startLocalStream = useCallback(async () => {
    try {
      console.log('Starting local stream...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      console.log('Local stream started successfully');
    } catch (error) {
      console.error('Error starting local stream:', error);
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('userJoined', (data) => {
      console.log('User joined:', data);
      console.log('Current userId:', localStorage.getItem('userId'));
      console.log('Incoming userId:', data.userId);
      setParticipants(prev => {
        console.log('Previous participants:', prev);
        const updated = [...prev, data];
        console.log('Updated participants:', updated);
        return updated;
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
      console.log('User left:', data);
      setParticipants(prev => prev.filter(p => p.userId._id !== data.userId));
      
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
      console.log('Received chat message:', messageData);
      setMessages(prev => [...prev, messageData]);
    });

    // Handle initial participants list
    socketRef.current.on('liveSessionUsers', (users) => {
      console.log('Received live session users:', users);
      setParticipants(users);
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
      console.log('Joining live session:', sessionId);
      socketRef.current.emit('joinLiveSession', {
        sessionId,
        userId: localStorage.getItem('userId'),
        userName: userName
      });

      startLocalStream();
    }
  }, [sessionId, userName, startLocalStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  // Send chat message
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

  // Toggle chat
  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  // Debug function
  const showDebugInfo = useCallback(() => {
    console.log('=== DEBUG INFO ===');
    console.log('Local Stream:', localStream);
    console.log('Participants:', participants);
    console.log('Peer Connections:', Array.from(peerConnections.entries()));
    console.log('Remote Streams:', Array.from(remoteStreams.entries()));
    
    // Show connection states
    peerConnections.forEach((pc, userId) => {
      console.log(`User ${userId}: Connection=${pc.connectionState}, ICE=${pc.iceConnectionState}`);
    });
  }, [localStream, participants, peerConnections, remoteStreams]);

  return (
    <div className="flex h-full bg-gray-900">
      {/* Main Video Area */}
      <div className="flex flex-col flex-1">
        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-gray-400 text-sm">Starting camera...</div>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
            {userName} (You)
          </div>
        </div>

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
          const participant = participants.find(p => p.userId._id === userId);
          const name = participant?.userId.profile.name || `User ${userId.slice(-4)}`;
          
          return (
            <div key={userId} className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                ref={(video) => {
                  if (video && video.srcObject !== stream) {
                    video.srcObject = stream;
                  }
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                {name}
              </div>
            </div>
          );
        })}

        {/* Placeholder for when no remote participants */}
        {participants.length === 0 && localStream && (
          <div className="col-span-2 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <div className="text-gray-400 text-lg mb-2">No other participants yet</div>
              <div className="text-gray-500 text-sm">Waiting for others to join...</div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-4 p-4 bg-gray-800">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        <button
          onClick={showDebugInfo}
          className="p-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          title="Show debug info"
        >
          <Bug className="w-6 h-6" />
        </button>

        <button
          onClick={toggleChat}
          className={`p-3 rounded-full ${
            isChatOpen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors relative`}
          title="Toggle chat"
        >
          <MessageCircle className="w-6 h-6" />
          {messages.length > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </button>

        <div className="mx-4 h-8 w-px bg-gray-600" />

        <button className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors">
          <Phone className="w-6 h-6" />
        </button>
      </div>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Chat</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.userId === localStorage.getItem('userId') ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.userId === localStorage.getItem('userId') 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 text-white'
                  }`}>
                    <div className="text-xs opacity-75 mb-1">
                      {msg.userName} - {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    <div>{msg.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
