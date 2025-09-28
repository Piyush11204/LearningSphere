import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Award,
  Zap,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { API_URLS } from '../../config/api';

const PracticeExams = () => {
  const [practiceSessions, setPracticeSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    fetchPracticeSessions();
    fetchUserStats();
  }, []);

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
        const data = await response.json();
        setPracticeSessions(data);
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

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.USERS}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const startPracticeSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.PRACTICE}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ duration: sessionDuration })
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to take practice exam with session data
        window.location.href = `/practice-exam/take/${data.sessionId}`;
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to start practice session');
      }
    } catch (error) {
      console.error('Error starting practice session:', error);
      alert('Network error occurred');
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Practice Exams</h1>
              <p className="text-gray-600 mt-1">Adaptive learning sessions to improve your skills</p>
            </div>
            <button
              onClick={() => setShowStartModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Start Practice Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <CheckCircle className="w-6 h-6 text-green-600" />
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
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {practiceSessions.length > 0
                    ? Math.round(practiceSessions
                        .filter(s => s.status === 'completed')
                        .reduce((acc, s) => acc + (s.correctAnswers / s.totalQuestions * 100), 0) /
                        practiceSessions.filter(s => s.status === 'completed').length) || 0
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total XP</p>
                <p className="text-2xl font-bold text-gray-900">
                  {practiceSessions.reduce((acc, s) => acc + (s.xpEarned || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        {userStats?.badges && userStats.badges.filter(badge => badge.category === 'practice').length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Practice Badges</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {userStats.badges
                .filter(badge => badge.category === 'practice')
                .map((badge, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-2xl">
                      {badge.icon}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">{badge.name}</h3>
                    <p className="text-xs text-gray-600">{badge.description}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Level and XP Section */}
        {userStats?.experiencePoints && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Level {userStats.experiencePoints.level}</h2>
                <p className="text-blue-100">
                  {userStats.experiencePoints.total} Total XP • {userStats.experiencePoints.fromPractice} from Practice
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {Math.floor((userStats.experiencePoints.total % 1000) / 10)}%
                </div>
                <div className="text-sm text-blue-100">
                  to Level {userStats.experiencePoints.level + 1}
                </div>
              </div>
            </div>
            <div className="mt-4 bg-white bg-opacity-20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-300"
                style={{ width: `${(userStats.experiencePoints.total % 1000) / 10}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Practice Sessions List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Practice Sessions</h2>
          </div>

          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Error Loading Sessions</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <button
                onClick={fetchPracticeSessions}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : practiceSessions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Practice Sessions Yet</h3>
              <p className="text-gray-500 mb-6">Start your first adaptive practice session to begin learning</p>
              <button
                onClick={() => setShowStartModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Start Your First Session
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {practiceSessions.map((session) => (
                <div key={session._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          Practice Session #{session._id.slice(-6)}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(session.duration)}</span>
                        </div>
                        {session.status === 'completed' && (
                          <>
                            <div className="flex items-center space-x-1">
                              <Target className="w-4 h-4" />
                              <span>{session.correctAnswers}/{session.totalQuestions}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4" />
                              <span>{Math.round(session.correctAnswers / session.totalQuestions * 100)}%</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {session.status === 'completed' && (
                        <Link
                          to={`/practice-exam/results/${session._id}`}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          View Results
                        </Link>
                      )}
                      {session.status === 'active' && (
                        <Link
                          to={`/practice-exam/take/${session._id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Continue
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Start Session Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Practice Session</h3>
            <p className="text-gray-600 mb-6">
              Choose your session duration. Questions will adapt to your performance level.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Duration
              </label>
              <select
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startPracticeSession}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-colors"
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeExams;