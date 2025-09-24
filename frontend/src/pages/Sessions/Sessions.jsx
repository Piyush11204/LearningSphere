import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  Video,
  BookOpen,
  Star,
  MapPin,
  User,
  Play,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sessionsData = response.data || [];
      setSessions(sessionsData);
      setFilteredSessions(sessionsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter and sort sessions
  useEffect(() => {
    let filtered = sessions.filter(session => {
      const matchesSearch = session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.tutor?.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      const matchesType = typeFilter === 'all' || session.sessionType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort sessions
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'startTime':
          aValue = new Date(a.startTime);
          bValue = new Date(b.startTime);
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'tutor':
          aValue = a.tutor?.profile?.name?.toLowerCase() || '';
          bValue = b.tutor?.profile?.name?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const handleJoinSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/sessions/${sessionId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchSessions();
      if (response.data.meetingLink) {
        window.open(response.data.meetingLink, '_blank', 'noopener,noreferrer');
      } else if (response.data.status === 'live') {
        navigate(`/video-call/${sessionId}`);
      }
    } catch (error) {
      console.error('Error joining session:', error);
      setError('Failed to join session');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'live':
        return <Play className="w-4 h-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const isEnrolled = (session) => {
    const userId = localStorage.getItem('userId');
    return session.learners?.some(learner => learner._id === userId || learner === userId);
  };

  const isTutor = (session) => {
    const userId = localStorage.getItem('userId');
    return session.tutor?._id === userId || session.tutor === userId;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
              <p className="mt-1 text-sm text-gray-600">Manage your tutoring sessions and enrollments</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className={`mt-6 space-y-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="sm:w-48">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="video">Video Call</option>
                  <option value="voice">Voice Call</option>
                </select>
              </div>

              {/* Sort */}
              <div className="sm:w-48">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="startTime-asc">Date (Earliest)</option>
                  <option value="startTime-desc">Date (Latest)</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="tutor-asc">Tutor (A-Z)</option>
                  <option value="tutor-desc">Tutor (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'You haven\'t enrolled in any sessions yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <div key={session._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Session Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {session.title || 'Untitled Session'}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <User className="w-4 h-4 mr-1" />
                        {session.tutor?.profile?.name || 'Unknown Tutor'}
                      </div>
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)}
                      <span className="ml-1 capitalize">{session.status}</span>
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(session.startTime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Video className="w-4 h-4 mr-2" />
                      {session.sessionType === 'video' ? 'Video Call' : 'Voice Call'}
                    </div>
                    {session.meetingLink && (isEnrolled(session) || isTutor(session)) && session.status !== 'cancelled' && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Video className="w-4 h-4 mr-2" />
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                    {session.learners && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {session.learners.length} learner{session.learners.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {session.description && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                      {session.description}
                    </p>
                  )}
                </div>

                {/* Session Actions */}
                <div className="px-6 pb-6">
                  <div className="flex space-x-3">
                    {isTutor(session) ? (
                      <button
                        onClick={() => navigate(`/tutor/my-sessions`)}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Manage
                      </button>
                    ) : isEnrolled(session) ? (
                      <>
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                        {session.status === 'live' && (
                          <button
                            onClick={() => handleJoinSession(session._id)}
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Join Now
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => handleJoinSession(session._id)}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Join Session
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Session Details Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setSelectedSession(null)}>
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedSession.title}</h3>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-gray-600 mt-1">{selectedSession.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Tutor</h4>
                    <p className="text-gray-600">{selectedSession.tutor?.profile?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Type</h4>
                    <p className="text-gray-600 capitalize">{selectedSession.sessionType}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Start Time</h4>
                    <p className="text-gray-600">{new Date(selectedSession.startTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">End Time</h4>
                    <p className="text-gray-600">{new Date(selectedSession.endTime).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Meeting Link</h4>
                    {selectedSession.meetingLink ? (
                      <a
                        href={selectedSession.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Join Meeting
                      </a>
                    ) : (
                      <p className="text-gray-600">No meeting link provided</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Learners</h4>
                  <div className="mt-2 space-y-2">
                    {selectedSession.learners?.map((learner, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        {learner.profile?.name || learner.email || 'Unknown Learner'}
                      </div>
                    )) || <p className="text-gray-500">No learners enrolled yet</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedSession.status === 'live' && (
                  <button
                    onClick={() => {
                      setSelectedSession(null);
                      handleJoinSession(selectedSession._id);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Join Session
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;