import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import VideoCall from './VideoCall.jsx';
import { Play, Users, Calendar, MessageCircle } from 'lucide-react';

const Session = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSession = useCallback(async () => {
    try {
      console.log('Fetching session with ID:', sessionId);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/livesessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Session data received:', response.data);
      setSession(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching session:', error);
      setError('Session not found or access denied');
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleJoin = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/livesessions/${sessionId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsJoined(true);
      console.log('Successfully joined session:', response.data);
    } catch (error) {
      console.error('Error joining session:', error);
      alert(error.response?.data?.msg || 'Failed to join session');
    }
  };

  const handleStart = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/livesessions/${sessionId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession({ ...session, isActive: true });
    } catch (error) {
      console.error('Error starting session:', error);
      alert(error.response?.data?.msg || 'Failed to start session');
    }
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center"><p className="text-gray-600">Loading...</p></div>;
  if (error) return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center"><p className="text-red-500">{error}</p></div>;

  const userName = localStorage.getItem('username') || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {!isJoined && !session?.isActive ? (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">1-on-1 Live Session</h1>
            <p className="text-gray-600 mb-6">{session?.description}</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium">Participants</p>
                  <p className="text-sm text-gray-600">{session?.participants?.length || 0}/{session?.maxParticipants || 20}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="font-medium">Starts</p>
                  <p className="text-sm text-gray-600">{session?.scheduledTime ? new Date(session.scheduledTime).toLocaleString() : 'Soon'}</p>
                </div>
              </div>
            </div>

            {localStorage.getItem('role') === 'tutor' ? (
              <button
                onClick={handleStart}
                disabled={!session || session.isActive}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-lg font-medium text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
              >
                <Play className="w-5 h-5 inline mr-2" />
                Start Session
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={isJoined}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-medium text-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
              >
                <Users className="w-5 h-5 inline mr-2" />
                Join Session
              </button>
            )}
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Share this link:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={`${window.location.origin}/session/${sessionId}`}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-white"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/session/${sessionId}`)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <VideoCall sessionId={sessionId} userName={userName} />
      )}
    </div>
  );
};

export default Session;