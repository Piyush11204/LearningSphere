import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const LiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/livesessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center"><p className="text-gray-600">Loading sessions...</p></div>;
  if (error) return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center"><p className="text-red-500">Error: {error}</p></div>;

  const userRole = localStorage.getItem('role') || 'learner'; // Assume role is stored in localStorage after login

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">1-on-1 Live Sessions</h1>
          {userRole === 'tutor' && (
            <Link
              to="/create-session"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Create New Session
            </Link>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div key={session._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{session.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{session.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">
                    {session.isActive ? 'Live Now' : session.scheduledTime ? new Date(session.scheduledTime).toLocaleString() : 'Upcoming'}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {session.participants.length}/{session.maxParticipants}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                  <span>By</span>
                  <span className="font-medium">{session.tutorId.profile.name}</span>
                </div>
                <Link
                  to={`/session/${session.sessionId}`}
                  className="w-full block bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg text-center font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  {userRole === 'tutor' ? 'Manage' : 'Join Session'}
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No sessions available</p>
            {userRole === 'tutor' && (
              <Link
                to="/create-session"
                className="mt-4 inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Create Your First Session
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSessions;