import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutorSidebar from './TutorSidebar';
import {
  Calendar,
  Users,
  Video,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  BookOpen,
  Plus,
  Eye,
  MessageSquare
} from 'lucide-react';

const TutorDashboard = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeStudents: 0,
    totalEarnings: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    averageRating: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch sessions data
      const sessionsResponse = await axios.get('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sessions = sessionsResponse.data || [];

      // Fetch live sessions data
      const liveSessionsResponse = await axios.get('http://localhost:5000/api/livesessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const liveSessions = liveSessionsResponse.data || [];

      // Calculate stats
      const now = new Date();
      const upcoming = sessions.filter(session =>
        new Date(session.startTime) > now && session.status === 'scheduled'
      );
      const completed = sessions.filter(session => session.status === 'completed');

      setStats({
        totalSessions: sessions.length + liveSessions.length,
        activeStudents: new Set([
          ...sessions.flatMap(s => s.learners?.map(l => l._id) || []),
          ...liveSessions.flatMap(ls => ls.participants?.map(p => p.userId) || [])
        ]).size,
        totalEarnings: completed.length * 25, // Assuming $25 per session
        upcomingSessions: upcoming.length,
        completedSessions: completed.length,
        averageRating: 4.8 // Mock data
      });

      // Set recent sessions (last 5)
      setRecentSessions([...sessions, ...liveSessions]
        .sort((a, b) => new Date(b.createdAt || b.startTime) - new Date(a.createdAt || a.startTime))
        .slice(0, 5)
      );

      // Set upcoming sessions
      setUpcomingSessions(upcoming.slice(0, 5));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const quickActions = [
    {
      title: 'Create Session',
      description: 'Schedule a new tutoring session',
      icon: Plus,
      path: '/tutor/create-session',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Start Live Session',
      description: 'Begin an immediate live session',
      icon: Video,
      path: '/tutor/create-live-session',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'View Schedule',
      description: 'Check your upcoming sessions',
      icon: Calendar,
      path: '/tutor/schedule',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Manage Students',
      description: 'View and manage your students',
      icon: Users,
      path: '/tutor/students',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded">
            {error}
          </div>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back! Here's your tutoring overview.</p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Video className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalSessions}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeStudents}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                    <dd className="text-lg font-medium text-gray-900">${stats.totalEarnings}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Upcoming</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.upcomingSessions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.completedSessions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="w-8 h-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rating</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.averageRating}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className={`flex items-center p-4 text-white rounded-lg transition-colors ${action.color}`}
                >
                  <Icon className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sessions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
            </div>
            <div className="p-6">
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <div key={session._id || session.sessionId} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Video className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{session.title}</p>
                        <p className="text-xs text-gray-500">
                          {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'Live Session'}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'live' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {session.status || 'scheduled'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent sessions</p>
              )}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Sessions</h3>
            </div>
            <div className="p-6">
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{session.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(session.startTime).toLocaleString()}
                        </p>
                      </div>
                      <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;