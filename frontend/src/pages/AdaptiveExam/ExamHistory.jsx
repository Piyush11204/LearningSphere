import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Calendar,
  Eye,
  Filter,
  ChevronRight,
  Award,
  Zap,
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const ExamHistory = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, abandoned, time_expired
  const [stats, setStats] = useState(null);

  const fetchExamHistory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE_URL}/api/adaptive-exam/history?limit=50`;
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
    } catch (error) {
      console.error('Error fetching exam history:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchExamHistory();
    fetchStats();
  }, [fetchExamHistory, fetchStats]);

  const viewExamDetails = (sessionId) => {
    navigate('/adaptive-exam/results', {
      state: { sessionId }
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: {
        icon: CheckCircle,
        text: 'Completed',
        className: 'bg-green-100 text-green-800 border-green-300'
      },
      time_expired: {
        icon: Clock,
        text: 'Time Expired',
        className: 'bg-orange-100 text-orange-800 border-orange-300'
      },
      abandoned: {
        icon: XCircle,
        text: 'Abandoned',
        className: 'bg-red-100 text-red-800 border-red-300'
      },
      active: {
        icon: AlertCircle,
        text: 'In Progress',
        className: 'bg-blue-100 text-blue-800 border-blue-300'
      }
    };

    const badge = badges[status] || badges.completed;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!endTime) return 'In Progress';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  if (loading && exams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <History className="w-10 h-10 mr-3 text-blue-600" />
                Exam History
              </h1>
              <p className="text-gray-600 mt-2">
                View all your past adaptive exam sessions and track your progress
              </p>
            </div>
            <button
              onClick={() => navigate('/adaptive-exam')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-200 flex items-center space-x-2 shadow-lg"
            >
              <span>Start New Exam</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Exams</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalExams}</p>
                </div>
                <Trophy className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg. Accuracy</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageAccuracy.toFixed(1)}%</p>
                </div>
                <Target className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg. Ability</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageAbility.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total XP</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalXP}</p>
                </div>
                <Zap className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                filter === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('time_expired')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                filter === 'time_expired'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Time Expired
            </button>
            <button
              onClick={() => setFilter('abandoned')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                filter === 'abandoned'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Abandoned
            </button>
          </div>
        </div>

        {/* Exam List */}
        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Exams Found</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? "You haven't taken any adaptive exams yet."
                  : `No ${filter} exams found.`}
              </p>
              <button
                onClick={() => navigate('/adaptive-exam')}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition duration-200"
              >
                Start Your First Exam
              </button>
            </div>
          ) : (
            exams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-xl">
                      #{exam.examNumber}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Adaptive Exam #{exam.examNumber}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(exam.startTime)}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Duration: {formatDuration(exam.startTime, exam.endTime)}
                        </span>
                        {exam.duration && (
                          <span className="text-sm text-gray-600">
                            (Limit: {exam.duration} mins)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(exam.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Questions</p>
                    <p className="text-2xl font-bold text-blue-600">{exam.totalQuestions}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-green-600">{exam.accuracy.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Ability</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(exam.finalAbility || exam.currentAbility || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">XP Earned</p>
                    <p className="text-2xl font-bold text-yellow-600">{exam.xpEarned || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Correct</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {exam.correctAnswers}/{exam.totalQuestions}
                    </p>
                  </div>
                </div>

                {exam.badgesEarned && exam.badgesEarned.length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm font-semibold text-gray-700">
                        {exam.badgesEarned.length} Badge{exam.badgesEarned.length !== 1 ? 's' : ''} Earned!
                      </span>
                    </div>
                  </div>
                )}

                {(exam.status === 'completed' || exam.status === 'time_expired') && (
                  <button
                    onClick={() => viewExamDetails(exam.sessionId)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-200 flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-5 h-5" />
                    <span>View Detailed Results</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamHistory;
