import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import VideoCall from './VideoCall.jsx';

const VideoCallWrapper = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  
  // Get user info from localStorage or location state
  const userName = localStorage.getItem('username') || 
                   localStorage.getItem('userName') || 
                   location.state?.userName || 
                   'User';

  console.log('VideoCallWrapper:', { sessionId, userName, locationState: location.state });

  if (!sessionId) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-xl mb-4">Session not found</h1>
          <p className="text-gray-400">The session ID is missing or invalid.</p>
        </div>
      </div>
    );
  }

  return <VideoCall sessionId={sessionId} userName={userName} />;
};

export default VideoCallWrapper;