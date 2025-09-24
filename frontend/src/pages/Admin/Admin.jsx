import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import UserManagement from './UserManagement';
import Sessions from './Sessions';
import LiveSessions from './LiveSessions';
import ExamManagement from './ExamManagement';
import ContactManagement from '../../components/admin/ContactManagement';
import {
  BarChart3,
  Users,
  Video,
  MessageSquare,
  Shield,
  Settings,
  TrendingUp,
  Activity,
  UserCheck,
  MessageCircle,
  Clock,
  BookOpen
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    totalMatches: 0,
    activeUsers: 0,
    liveSessions: 0,
    totalReviews: 0,
    totalExams: 0,
    liveExams: 0
  });
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch admin stats
    Promise.all([
      fetch('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => ({ ok: false })),
      fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => ({ ok: false })),
      fetch('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => ({ ok: false })),
      fetch('http://localhost:5000/api/exams', {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => ({ ok: false }))
    ])
      .then(([statsRes, usersRes, sessionsRes, examsRes]) => {
        const results = [];

        if (statsRes.ok) {
          results.push(statsRes.json());
        } else {
          results.push(Promise.resolve({}));
        }

        if (usersRes.ok) {
          results.push(usersRes.json());
        } else {
          results.push(Promise.resolve([]));
        }

        if (sessionsRes.ok) {
          results.push(sessionsRes.json());
        } else {
          results.push(Promise.resolve([]));
        }

        if (examsRes.ok) {
          results.push(examsRes.json());
        } else {
          results.push(Promise.resolve({ exams: [] }));
        }

        return Promise.all(results);
      })
      .then(([statsData, usersData, sessionsData, examsData]) => {
        const usersList = usersData.users || usersData || [];
        const sessionsList = sessionsData.sessions || sessionsData || [];
        const examsList = examsData.exams || [];

        setStats({
          totalUsers: usersList.length,
          totalSessions: sessionsList.length,
          totalMatches: statsData.totalMatches || 0,
          activeUsers: usersList.filter(user => user.isVerified).length,
          liveSessions: statsData.liveSessions || 0,
          totalReviews: statsData.totalReviews || 0,
          totalExams: examsList.length,
          liveExams: examsList.filter(exam => exam.status === 'live' || exam.status === 'ongoing').length
        });

        setExams(examsList.slice(0, 5)); // Show latest 5 exams
        setLoading(false);
      })
      .catch((err) => {
        console.error('Admin data fetch error:', err);
        setError('Failed to load admin data. You may not have admin privileges.');
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage users, sessions, and platform analytics</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.activeUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Video className="w-8 h-8 text-purple-600" />
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
                      <Activity className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Live Sessions</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.liveSessions}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Matches</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalMatches}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MessageSquare className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Reviews</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalReviews}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-teal-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Exams</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalExams}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="w-8 h-8 text-pink-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Live Exams</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.liveExams}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/admin/users')}
                  className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Users className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Manage Users</p>
                    <p className="text-xs text-blue-600">View and edit user accounts</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/sessions')}
                  className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <Video className="w-6 h-6 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Manage Sessions</p>
                    <p className="text-xs text-purple-600">Monitor and moderate sessions</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/live-sessions')}
                  className="flex items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Activity className="w-6 h-6 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Live Sessions</p>
                    <p className="text-xs text-red-600">Monitor live video sessions</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/create-exam')}
                  className="flex items-center p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                >
                  <BookOpen className="w-6 h-6 text-teal-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-teal-900">Create Exam</p>
                    <p className="text-xs text-teal-600">Add new AI-powered exams</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/exams')}
                  className="flex items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <BookOpen className="w-6 h-6 text-indigo-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Manage Exams</p>
                    <p className="text-xs text-indigo-600">Control exam statuses and settings</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/contacts')}
                  className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-6 h-6 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">Contact Management</p>
                    <p className="text-xs text-orange-600">Handle customer inquiries</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Exams */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Exams</h3>
                <button
                  onClick={() => navigate('/create-exam')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create New Exam
                </button>
              </div>
              {exams.length > 0 ? (
                <div className="space-y-4">
                  {exams.map((exam) => (
                    <div key={exam._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{exam.title}</p>
                          <p className="text-xs text-gray-500">
                            {exam.subject} • {exam.duration} minutes • {exam.questions?.length || 0} questions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          exam.status === 'live' ? 'bg-green-100 text-green-800' :
                          exam.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          exam.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(exam.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No exams created yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Get started by creating your first AI-powered exam</p>
                  <button
                    onClick={() => navigate('/create-exam')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Create First Exam
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/users" element={
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar />
          <div className="flex-1 p-8">
            <UserManagement />
          </div>
        </div>
      } />
      <Route path="/sessions" element={
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar />
          <div className="flex-1 p-8">
            <Sessions />
          </div>
        </div>
      } />
      <Route path="/live-sessions" element={
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar />
          <div className="flex-1 p-8">
            <LiveSessions />
          </div>
        </div>
      } />
      {/* Placeholder routes for future components */}
      <Route path="/analytics" element={
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar />
          <div className="flex-1 p-8">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">Analytics component coming soon...</p>
            </div>
          </div>
        </div>
      } />
      <Route path="/reviews" element={
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar />
          <div className="flex-1 p-8">
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Review Management</h3>
              <p className="text-gray-600">Review management component coming soon...</p>
            </div>
          </div>
        </div>
      } />
      <Route path="/moderation" element={
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar />
          <div className="flex-1 p-8">
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Content Moderation</h3>
              <p className="text-gray-600">Moderation component coming soon...</p>
            </div>
          </div>
        </div>
      } />
      <Route path="/settings" element={
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar />
          <div className="flex-1 p-8">
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Settings</h3>
              <p className="text-gray-600">Settings component coming soon...</p>
            </div>
          </div>
        </div>
      } />
      <Route path="/contacts" element={
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar />
          <div className="flex-1">
            <ContactManagement />
          </div>
        </div>
      } />
      <Route path="/exams" element={
        <div className="min-h-screen bg-gray-50 flex">
          <AdminSidebar />
          <div className="flex-1 p-8">
            <ExamManagement />
          </div>
        </div>
      } />
    </Routes>
  );
};

export default Admin;