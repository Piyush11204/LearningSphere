import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutorSidebar from './TutorSidebar';
import {
  Video,
  Calendar,
  Users,
  Clock,
  Play,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Plus,
  MessageSquare
} from 'lucide-react';

const MySessions = () => {
  const [sessions, setSessions] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const sessionsResponse = await axios.get('https://learningsphere-1fgj.onrender.com/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const liveSessionsResponse = await axios.get('https://learningsphere-1fgj.onrender.com/api/livesessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSessions(sessionsResponse.data || []);
      setLiveSessions(liveSessionsResponse.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDeleteSession = async (sessionId, isLiveSession = false) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = isLiveSession ? 'livesessions' : 'sessions';

      await axios.delete(`https://learningsphere-1fgj.onrender.com/api/${endpoint}/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (isLiveSession) {
        setLiveSessions(liveSessions.filter(session => session._id !== sessionId));
      } else {
        setSessions(sessions.filter(session => session._id !== sessionId));
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    }
  };

  const handleStartLiveSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`https://learningsphere-1fgj.onrender.com/api/livesessions/${sessionId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLiveSessions(liveSessions.map(session =>
        session._id === sessionId ? { ...session, isActive: true } : session
      ));
    } catch (error) {
      console.error('Error starting live session:', error);
      alert('Failed to start session');
    }
  };

  const handleJoinSession = async (sessionId, isLiveSession = false) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isLiveSession ? 'livesessions' : 'sessions';

      console.log('Joining session:', { sessionId, isLiveSession, endpoint });

      const response = await axios.post(`https://learningsphere-1fgj.onrender.com/api/${endpoint}/${sessionId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Join response:', response.data);

      if (response.data.meetingLink) {
        // Navigate to video call page with the meeting link
        navigate(`/video-call/${sessionId}`, { 
          state: { 
            meetingLink: response.data.meetingLink,
            sessionDetails: response.data.sessionDetails,
            isTutor: response.data.isTutor
          }
        });
      } else {
        // Fallback to session ID
        navigate(`/video-call/${sessionId}`);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert(error.response?.data?.msg || 'Failed to join session. Please check your permissions.');
    }
  };

  const filteredSessions = [...sessions, ...liveSessions].filter(session => {
    const matchesSearch = session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'scheduled' && session.status === 'scheduled') ||
                         (statusFilter === 'live' && session.isActive) ||
                         (statusFilter === 'completed' && session.status === 'completed');

    const matchesType = typeFilter === 'all' ||
                       (typeFilter === 'scheduled' && !session.sessionId) ||
                       (typeFilter === 'live' && session.sessionId);

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (session) => {
    if (session.isActive) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (session.status === 'completed') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (session.status === 'scheduled') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (session) => {
    if (session.isActive) {
      return 'Live Now';
    } else if (session.status === 'completed') {
      return 'Completed';
    } else if (session.status === 'scheduled') {
      return 'Scheduled';
    } else {
      return 'Draft';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TutorSidebar />

      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-20">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="mt-2 text-gray-600">Manage your tutoring sessions and live sessions</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Video className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
                    <dd className="text-lg font-medium text-gray-900">{sessions.length + liveSessions.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Play className="w-8 h-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Live Now</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {liveSessions.filter(s => s.isActive).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {sessions.filter(s => s.status === 'scheduled').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {new Set([
                        ...sessions.flatMap(s => s.learners?.map(l => l._id) || []),
                        ...liveSessions.flatMap(ls => ls.participants?.map(p => p.userId) || [])
                      ]).size}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="scheduled">Regular Sessions</option>
                <option value="live">Live Sessions</option>
              </select>

              <button
                onClick={() => navigate('/tutor/create-session')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </button>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-6">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <div key={session._id || session.sessionId} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(session)}`}>
                          {getStatusText(session)}
                        </span>
                        {session.sessionId && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            One-on-One Live
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{session.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {session.startTime
                          ? new Date(session.startTime).toLocaleDateString()
                          : session.scheduledTime
                            ? new Date(session.scheduledTime).toLocaleDateString()
                            : 'Not scheduled'
                        }
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {session.startTime && session.endTime
                          ? `${new Date(session.startTime).toLocaleTimeString()} - ${new Date(session.endTime).toLocaleTimeString()}`
                          : session.scheduledTime
                            ? new Date(session.scheduledTime).toLocaleTimeString()
                            : 'Flexible time'
                        }
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        {session.sessionId ? (
                          session.invitedStudentEmail ? `One-on-one with ${session.invitedStudentEmail} (2 people max)` : 'One-on-one session (2 people max)'
                        ) : (
                          `${session.learners?.length || 0} participants${session.maxParticipants ? ` / ${session.maxParticipants}` : ''}`
                        )}
                      </span>
                    </div>

                    {session.meetingLink && (session.isActive || session.status === 'scheduled') && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Video className="w-4 h-4 mr-2" />
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setShowDetailsModal(true);
                        }}
                        className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </button>

                      {session.sessionId && session.isActive && (
                        <button
                          onClick={() => handleJoinSession(session._id, true)}
                          className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Join Live
                        </button>
                      )}

                      {session.sessionId && !session.isActive && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStartLiveSession(session._id)}
                            className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Session
                          </button>
                          <button
                            onClick={() => {
                              console.log('Joining session as tutor:', session);
                              handleJoinSession(session._id, true);
                            }}
                            className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Join Now
                          </button>
                        </div>
                      )}

                      {!session.sessionId && (
                        <button
                          onClick={() => handleJoinSession(session._id, false)}
                          className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Session
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(session.sessionId ? `/tutor/create-live-session` : `/tutor/create-session`)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteSession(session._id || session.sessionId, !!session.sessionId)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No sessions found</p>
              <p className="text-gray-500">Create your first session to get started</p>
              <button
                onClick={() => navigate('/tutor/create-session')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Session
              </button>
            </div>
          )}
        </div>

        {/* Session Details Modal */}
        {showDetailsModal && selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Session Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedSession(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{selectedSession.title}</h4>
                  <p className="text-gray-600">{selectedSession.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border mt-1 ${getStatusColor(selectedSession)}`}>
                      {getStatusText(selectedSession)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedSession.sessionId ? 'Live Session' : 'Regular Session'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedSession.startTime
                        ? new Date(selectedSession.startTime).toLocaleString()
                        : selectedSession.scheduledTime
                          ? new Date(selectedSession.scheduledTime).toLocaleString()
                          : 'Not scheduled'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedSession.endTime
                        ? new Date(selectedSession.endTime).toLocaleString()
                        : 'Not applicable'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Meeting Link</label>
                    {selectedSession.meetingLink ? (
                      <a
                        href={selectedSession.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-1"
                      >
                        Join Meeting
                      </a>
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">No meeting link provided</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">
                    {selectedSession.sessionId ? 'Student Information' : `Participants (${selectedSession.learners?.length || 0})`}
                  </h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedSession.sessionId ? (
                      // One-on-one live session
                      selectedSession.invitedStudentEmail ? (
                        <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {selectedSession.invitedStudentEmail.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Invited Student</p>
                            <p className="text-xs text-gray-500">{selectedSession.invitedStudentEmail}</p>
                          </div>
                          <span className="text-xs text-blue-600 font-medium">One-on-One</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No student invited yet</p>
                      )
                    ) : (
                      // Regular session
                      (selectedSession.learners || []).length > 0 ? (
                        selectedSession.learners.map((participant, idx) => (
                          <div key={idx} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {participant.profile?.name?.charAt(0) || 'P'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {participant.profile?.name || 'Unknown Participant'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {participant.email}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No participants yet</p>
                      )
                    )}
                  </div>
                </div>

                {selectedSession.chatMessages && selectedSession.chatMessages.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Recent Chat Messages ({selectedSession.chatMessages.length})
                    </h5>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedSession.chatMessages.slice(-5).map((message, idx) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-gray-900">
                              {message.username}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySessions;