import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorSidebar from './TutorSidebar';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Target,
  Users,
  Award,
  Clock,
  TrendingUp,
  BarChart3,
  Eye
} from 'lucide-react';
import { API_URLS } from '../../config/api';

const PracticeExamsManagement = () => {
  const [practiceSessions, setPracticeSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchPracticeSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.PRACTICE}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const sessions = await response.json();
        setPracticeSessions(sessions || []);
      } else {
        setError('Failed to fetch practice sessions');
      }
    } catch (error) {
      console.error('Error fetching practice sessions:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPracticeSessions();
  }, []);

  const filteredSessions = practiceSessions.filter(session => {
    const matchesSearch = session._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading practice sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TutorSidebar />

      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/tutor/dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Dashboard
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Practice Exams Management</h1>
                  <p className="mt-2 text-gray-600">Monitor and analyze practice exam sessions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
              <button
                onClick={() => setError('')}
                className="float-right ml-4"
              >
                ×
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
              <button
                onClick={() => setSuccessMessage('')}
                className="float-right ml-4"
              >
                ×
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{practiceSessions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {practiceSessions.filter(s => s.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total XP Earned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {practiceSessions.reduce((acc, s) => acc + (s.xpEarned || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {practiceSessions.length > 0
                      ? Math.round(practiceSessions
                          .filter(s => s.status === 'completed')
                          .reduce((acc, s) => acc + s.accuracy, 0) /
                          practiceSessions.filter(s => s.status === 'completed').length) || 0
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Practice Sessions ({filteredSessions.length})</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <div key={session._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            Session #{session._id.slice(-6)}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Questions:</span> {session.totalQuestions || 0}
                          </div>
                          <div>
                            <span className="font-medium">Correct:</span> {session.correctAnswers || 0}
                          </div>
                          <div>
                            <span className="font-medium">Accuracy:</span> {session.accuracy ? Math.round(session.accuracy) : 0}%
                          </div>
                          <div>
                            <span className="font-medium">XP Earned:</span> {session.xpEarned || 0}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                          <span>Duration: {formatDuration(session.duration || 0)}</span>
                          <span>Started: {new Date(session.createdAt).toLocaleDateString()}</span>
                          {session.status === 'completed' && (
                            <span>Completed: {new Date(session.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => navigate(`/practice-exam/results/${session._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="View Results"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No practice sessions found</h3>
                  <p className="text-sm text-gray-500">
                    {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Students haven\'t started any practice sessions yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeExamsManagement;