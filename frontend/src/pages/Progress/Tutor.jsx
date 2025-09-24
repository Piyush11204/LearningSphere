import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Clock,
  Star,
  TrendingUp,
  Award,
  MessageSquare,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Crown,
  CheckCircle,
  AlertCircle,
  Eye,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';

const Tutor = () => {
  const [tutorStats, setTutorStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }

        // Fetch tutor's sessions
        const sessionsResponse = await fetch('http://localhost:5000/api/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!sessionsResponse.ok) {
          throw new Error(`Failed to fetch sessions: ${sessionsResponse.status}`);
        }

        const sessionsData = await sessionsResponse.json();

        // Calculate tutor statistics from session data
        const tutorSessions = sessionsData.filter(session => session.tutor._id === userId || session.tutor === userId);

        const stats = calculateTutorStats(tutorSessions);
        setTutorStats(stats);
        setSessions(tutorSessions);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching tutor data:', error);
        setError(error.message || 'Failed to load tutor data');
        setLoading(false);
      }
    };

    fetchTutorData();
  }, []);

  const calculateTutorStats = (sessions) => {
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalHours = completedSessions.reduce((acc, session) => {
      const duration = session.endTime && session.startTime
        ? (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60)
        : 1; // Default 1 hour if times not available
      return acc + duration;
    }, 0);

    const totalStudents = new Set();
    completedSessions.forEach(session => {
      session.learners?.forEach(learner => {
        totalStudents.add(learner._id || learner);
      });
    });

    // Earnings and ratings will be implemented with payment and review systems
    const earnings = 0; // Placeholder - will be calculated from actual payments
    const averageRating = null; // Placeholder - will be calculated from actual reviews

    return {
      totalSessions: sessions.length,
      totalStudents: totalStudents.size,
      totalHours: Math.round(totalHours * 10) / 10,
      averageRating,
      totalReviews: 0, // Placeholder - will be calculated from actual reviews
      monthlyEarnings: earnings,
      activeStudents: Math.floor(totalStudents.size * 0.7), // Assume 70% are active
      completionRate: sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0,
      averageAttendance: sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0 // Use completion rate as attendance proxy
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Error Loading Tutor Data</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!tutorStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">No Teaching Data</h2>
          <p className="text-gray-500">Start teaching to track your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teaching Dashboard</h1>
              <p className="text-sm text-gray-600">Track your teaching impact and growth</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">This Month</div>
                <div className="text-lg font-bold text-green-600">
                  {tutorStats.monthlyEarnings > 0 ? `₹${tutorStats.monthlyEarnings.toLocaleString('en-IN')}` : 'Coming Soon'}
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'sessions', label: 'My Sessions', icon: Calendar },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-3xl font-bold text-gray-900">{tutorStats.totalSessions}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{tutorStats.totalStudents}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {tutorStats.averageRating ? tutorStats.averageRating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{tutorStats.completionRate}%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Hours</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{tutorStats.totalHours}h</div>
                  <p className="text-gray-600">Total teaching time</p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>This Month</span>
                    <span>45h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Month</span>
                    <span>52h</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Engagement</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Attendance</span>
                    <span className="font-medium">{tutorStats.averageAttendance}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Students</span>
                    <span className="font-medium">{tutorStats.activeStudents}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <span className="font-medium">{tutorStats.totalReviews}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
              <div className="space-y-4">
                {sessions.slice(0, 3).map((session) => (
                  <div key={session._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{session.title}</p>
                        <p className="text-sm text-gray-600">
                          {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'Date TBD'} •
                          {session.startTime && session.endTime
                            ? ` ${Math.round((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60) * 10) / 10}h`
                            : ' Duration TBD'} •
                          {session.learners?.length || 0} students
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        {session.rating ? (
                          <>
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{session.rating}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">No rating</span>
                        )}
                      </div>
                      <p className="text-sm text-green-600 font-medium">
                        {session.earnings ? `₹${session.earnings}` : 'Earnings TBD'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Session History</h3>
                <p className="text-sm text-gray-600">All your teaching sessions</p>
              </div>
              <div className="divide-y">
                {sessions.map((session) => (
                  <div key={session._id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{session.title}</h4>
                        <p className="text-sm text-gray-600">
                          {session.startTime ? new Date(session.startTime).toLocaleDateString() : 'Date TBD'} •
                          {session.startTime && session.endTime
                            ? ` ${Math.round((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60) * 10) / 10} hours`
                            : ' Duration TBD'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          session.status === 'live' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status || 'scheduled'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{session.learners?.length || 0}</p>
                        <p className="text-sm text-gray-600">Attendees</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{session.maxParticipants || 20}</p>
                        <p className="text-sm text-gray-600">Capacity</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {session.rating ? (
                            <>
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-2xl font-bold text-gray-900">{session.rating}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">No rating</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {session.earnings ? `₹${session.earnings}` : 'TBD'}
                        </p>
                        <p className="text-sm text-gray-600">Earnings</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Attendance: {session.learners?.length > 0 ? Math.round((session.learners.length / (session.maxParticipants || 20)) * 100) : 0}%</span>
                        <span>Duration: {session.startTime && session.endTime
                          ? `${Math.round((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60) * 10) / 10}h`
                          : 'TBD'}</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tutorStats.totalStudents}</h3>
                <p className="text-gray-600">Total Students</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <Activity className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tutorStats.activeStudents}</h3>
                <p className="text-gray-600">Active Students</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <MessageSquare className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tutorStats.totalReviews}</h3>
                <p className="text-gray-600">Reviews</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Feedback</h3>
              <div className="text-center py-8">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Student reviews and feedback will be available soon.</p>
                <p className="text-sm text-gray-400">Once the review system is implemented, you'll be able to see feedback from your students here.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Coming Soon</h3>
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Detailed analytics and performance metrics will be available soon.</p>
                <p className="text-sm text-gray-400">This will include earnings trends, student engagement metrics, and teaching performance analytics.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tutor;