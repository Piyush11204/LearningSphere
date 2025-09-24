import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import UserManagement from './UserManagement';
import Sessions from './Sessions';
import LiveSessions from './LiveSessions';
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

  Clock
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    totalMatches: 0,
    activeUsers: 0,
    liveSessions: 0,
    totalReviews: 0
  });
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
      }).catch(() => ({ ok: false }))
    ])
      .then(([statsRes, usersRes, sessionsRes]) => {
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

        return Promise.all(results);
      })
      .then(([statsData, usersData, sessionsData]) => {
        const usersList = usersData.users || usersData || [];
        const sessionsList = sessionsData.sessions || sessionsData || [];

        setStats({
          totalUsers: usersList.length,
          totalSessions: sessionsList.length,
          totalMatches: statsData.totalMatches || 0,
          activeUsers: usersList.filter(user => user.isVerified).length,
          liveSessions: statsData.liveSessions || 0,
          totalReviews: statsData.totalReviews || 0
        });
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
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
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                  onClick={() => navigate('/admin/contacts')}
                  className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <MessageSquare className="w-6 h-6 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-orange-900">Contact Management</p>
                    <p className="text-xs text-orange-600">Handle customer inquiries</p>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/analytics')}
                  className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-900">View Analytics</p>
                    <p className="text-xs text-green-600">Platform usage statistics</p>
                  </div>
                </button>
              </div>
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
    </Routes>
  );
};

export default Admin;