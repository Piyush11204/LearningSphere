import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Video,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Play,
  Pause,
  MessageSquare
} from 'lucide-react';

const LiveSessions = () => {
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchLiveSessions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : ''
      });

      const response = await axios.get(`http://localhost:5000/api/livesessions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLiveSessions(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching live sessions:', error);
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchLiveSessions();
  }, [fetchLiveSessions]);

  const handleModerateSession = async (sessionId, action) => {
    try {
      const token = localStorage.getItem('token');
      if (action === 'delete') {
        await axios.delete(`http://localhost:5000/api/livesessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLiveSessions(liveSessions.filter(session => session._id !== sessionId));
      } else if (action === 'start') {
        await axios.post(`http://localhost:5000/api/livesessions/${sessionId}/start`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLiveSessions(liveSessions.map(session =>
          session._id === sessionId ? { ...session, isActive: true } : session
        ));
      } else if (action === 'end') {
        await axios.post(`http://localhost:5000/api/livesessions/${sessionId}/end`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLiveSessions(liveSessions.map(session =>
          session._id === sessionId ? { ...session, isActive: false } : session
        ));
      }
    } catch (error) {
      console.error('Error moderating live session:', error);
      alert('Failed to moderate session');
    }
  };

  const getStatusColor = (session) => {
    if (session.isActive) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (session.scheduledTime && new Date(session.scheduledTime) > new Date()) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (session.scheduledTime && new Date(session.scheduledTime) <= new Date()) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (session) => {
    if (session.isActive) {
      return 'Live Now';
    } else if (session.scheduledTime && new Date(session.scheduledTime) > new Date()) {
      return 'Scheduled';
    } else if (session.scheduledTime && new Date(session.scheduledTime) <= new Date()) {
      return 'Ready to Start';
    } else {
      return 'Draft';
    }
  };

  if (loading && liveSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Session Management</h1>
          <p className="text-gray-600">Monitor and moderate live video sessions</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Live Sessions: <span className="font-semibold text-gray-900">{liveSessions.length}</span>
          </div>
          <div className="text-sm text-green-600">
            Active: <span className="font-semibold">{liveSessions.filter(s => s.isActive).length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search live sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="live">Live Now</option>
            <option value="scheduled">Scheduled</option>
            <option value="ready">Ready to Start</option>
            <option value="draft">Draft</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchLiveSessions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Live Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {liveSessions.map((session) => (
          <div key={session._id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{session.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{session.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {session.isActive && (
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(session)}`}>
                    {getStatusText(session)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{session.participants?.length || 0}/{session.maxParticipants} participants</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    {session.scheduledTime
                      ? new Date(session.scheduledTime).toLocaleString()
                      : 'Not scheduled'
                    }
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  <span>{session.chatMessages?.length || 0} messages</span>
                </div>
              </div>

              {/* Tutor Info */}
              <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xs font-medium">
                    {session.tutorId?.profile?.name?.charAt(0) || 'T'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {session.tutorId?.profile?.name || 'Unknown Tutor'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.tutorId?.email}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
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

                <div className="flex items-center space-x-2">
                  {!session.isActive && session.scheduledTime && new Date(session.scheduledTime) <= new Date() && (
                    <button
                      onClick={() => handleModerateSession(session._id, 'start')}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                      title="Start Session"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}

                  {session.isActive && (
                    <button
                      onClick={() => handleModerateSession(session._id, 'end')}
                      className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="End Session"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleModerateSession(session._id, 'delete')}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {liveSessions.length === 0 && (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No live sessions found</p>
          <p className="text-gray-500">Live sessions will appear here when created</p>
        </div>
      )}

      {/* Session Details Modal */}
      {showDetailsModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Live Session Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedSession(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
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
                  <label className="block text-sm font-medium text-gray-700">Session ID</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {selectedSession.sessionId}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scheduled Time</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedSession.scheduledTime
                      ? new Date(selectedSession.scheduledTime).toLocaleString()
                      : 'Not scheduled'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Participants</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedSession.maxParticipants}
                  </p>
                </div>
              </div>

              {/* Participants */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  Participants ({selectedSession.participants?.length || 0})
                </h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedSession.participants?.map((participant) => (
                    <div key={participant.userId._id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {participant.userId.profile?.name?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {participant.userId.profile?.name || 'Unknown Participant'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined: {new Date(participant.joinedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No participants yet</p>
                  )}
                </div>
              </div>

              {/* Recent Chat Messages */}
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

              {/* Tutor Info */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Tutor</h5>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {selectedSession.tutorId?.profile?.name?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedSession.tutorId?.profile?.name || 'Unknown Tutor'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedSession.tutorId?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessions;