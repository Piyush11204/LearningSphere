import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Clock,
  Star,
  TrendingUp,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Crown,
  CheckCircle,
  AlertCircle,
  Eye,
  Settings,
  UserPlus,
  Plus,
  Trophy,
  Gift ,
  Send,
  DollarSign,
  Calendar,
  MessageSquare,
  Shield,
  Database,
  Globe
} from 'lucide-react';

const Admin = () => {
  const [adminStats, setAdminStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Badge management state
  const [users, setUsers] = useState([]);
  const [badgeStats, setBadgeStats] = useState(null);
  const [recentBadgeAwards, setRecentBadgeAwards] = useState([]);
  const [badgeForm, setBadgeForm] = useState({
    userId: '',
    name: '',
    description: '',
    icon: '🏆',
    xpReward: 100
  });
  const [badgeLoading, setBadgeLoading] = useState(false);

  // Fetch badge-related data
  const fetchBadgeData = async (token) => {
    try {
      // Fetch all progress data to calculate badge stats
      const progressResponse = await fetch('http://localhost:5000/api/progress/leaderboard?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        const leaderboard = progressData.leaderboard || [];
        
        // Calculate badge statistics
        let totalBadges = 0;
        let experienceBadges = 0;
        let sessionBadges = 0;
        let achievementBadges = 0;
        let adminBadges = 0;
        let thisMonthBadges = 0;
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        
        const recentAwards = [];
        
        leaderboard.forEach(user => {
          if (user.badges && user.badges.length > 0) {
            totalBadges += user.badges.length;
            
            user.badges.forEach(badge => {
              switch(badge.category) {
                case 'experience':
                  experienceBadges++;
                  break;
                case 'session':
                  sessionBadges++;
                  break;
                case 'achievement':
                  achievementBadges++;
                  break;
                case 'admin':
                  adminBadges++;
                  break;
              }
              
              // Count badges earned this month
              const badgeDate = new Date(badge.earnedAt);
              if (badgeDate >= thisMonth) {
                thisMonthBadges++;
              }
              
              // Add to recent awards (admin badges only)
              if (badge.category === 'admin' && recentAwards.length < 10) {
                recentAwards.push({
                  user: {
                    name: user.user?.profile?.name || user.user?.email || 'Unknown User',
                    email: user.user?.email || ''
                  },
                  badge: {
                    name: badge.name,
                    icon: badge.icon,
                    xpReward: badge.xpReward
                  },
                  awardedAt: badge.earnedAt
                });
              }
            });
          }
        });
        
        setBadgeStats({
          totalBadges,
          experienceBadges,
          sessionBadges,
          achievementBadges,
          adminBadges,
          thisMonthBadges
        });
        
        // Sort recent awards by date (most recent first)
        recentAwards.sort((a, b) => new Date(b.awardedAt) - new Date(a.awardedAt));
        setRecentBadgeAwards(recentAwards);
      }
    } catch (error) {
      console.error('Error fetching badge data:', error);
    }
  };

  // Award badge to user
  const awardBadge = async () => {
    if (!badgeForm.userId || !badgeForm.name || !badgeForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    setBadgeLoading(true);
    try {
      const token = localStorage.getItem('token');
      const adminId = localStorage.getItem('userId');

      const response = await fetch('http://localhost:5000/api/progress/admin/award-badge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: badgeForm.userId,
          badgeData: {
            name: badgeForm.name,
            description: badgeForm.description,
            icon: badgeForm.icon,
            xpReward: parseInt(badgeForm.xpReward)
          },
          adminId
        })
      });

      if (response.ok) {
        alert('Badge awarded successfully!');
        setBadgeForm({
          userId: '',
          name: '',
          description: '',
          icon: '🏆',
          xpReward: 100
        });
        
        // Refresh badge data
        await fetchBadgeData(token);
      } else {
        const errorData = await response.json();
        alert(`Failed to award badge: ${errorData.msg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
      alert('Error awarding badge. Please try again.');
    } finally {
      setBadgeLoading(false);
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');

        if (!token) {
          setError('Authentication required. Please log in as admin.');
          setLoading(false);
          return;
        }

        // Fetch analytics data
        const analyticsResponse = await fetch('http://localhost:5000/api/admin/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!analyticsResponse.ok) {
          throw new Error(`Failed to fetch analytics: ${analyticsResponse.status}`);
        }

        const analyticsData = await analyticsResponse.json();

        // Fetch users data
        const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let usersData = { users: [], total: 0 };
        if (usersResponse.ok) {
          usersData = await usersResponse.json();
          setUsers(usersData.users || []);
        }

        // Fetch sessions data
        const sessionsResponse = await fetch('http://localhost:5000/api/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let sessionsData = [];
        if (sessionsResponse.ok) {
          sessionsData = await sessionsResponse.json();
        }

        // Fetch badge statistics
        await fetchBadgeData(token);

        // Calculate comprehensive admin stats
        const stats = calculateAdminStats(analyticsData, usersData, sessionsData);
        setAdminStats(stats);

        // Generate recent activity from the data
        const activity = generateRecentActivity(usersData.users, sessionsData);
        setRecentActivity(activity);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setError(error.message || 'Failed to load admin data');
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const calculateAdminStats = (analytics, users, sessions) => {
    const totalUsers = analytics.totalUsers || users.total || 0;
    const totalSessions = sessions.length || 0;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;

    // Calculate user roles
    const tutors = users.users?.filter(u => u.role === 'tutor').length || 0;
    const learners = totalUsers - tutors;

    // Calculate platform metrics
    const totalHours = completedSessions * 1.5; // Assume average 1.5 hours per session
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    const averageRating = 4.6; // Mock rating - would come from reviews
    const monthlyGrowth = 15.2; // Mock growth rate

    // Mock revenue calculation
    const totalRevenue = completedSessions * 1000; // ₹1000 per completed session

    return {
      totalUsers,
      totalTutors: tutors,
      totalLearners: learners,
      totalSessions,
      totalHours: Math.round(totalHours),
      totalRevenue,
      activeUsers: Math.floor(totalUsers * 0.7), // Assume 70% active
      completionRate,
      averageRating,
      monthlyGrowth
    };
  };

  const generateRecentActivity = (users, sessions) => {
    const activities = [];

    // Add recent user registrations
    users?.slice(0, 3).forEach(user => {
      activities.push({
        id: `user_${user._id}`,
        type: 'user_registration',
        message: `New ${user.role || 'user'} registered: ${user.profile?.name || user.email || 'Unknown'}`,
        timestamp: new Date(user.createdAt || Date.now()),
        user: user.profile?.name || user.email || 'Unknown'
      });
    });

    // Add recent sessions
    sessions?.slice(0, 3).forEach(session => {
      activities.push({
        id: `session_${session._id}`,
        type: 'session_completed',
        message: `Session "${session.title}" ${session.status}`,
        timestamp: new Date(session.updatedAt || session.createdAt || Date.now()),
        user: session.tutor?.profile?.name || 'Unknown Tutor'
      });
    });

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration': return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'session_completed': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'payment': return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'review': return <Star className="w-5 h-5 text-yellow-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
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
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Error Loading Admin Data</h2>
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

  if (!adminStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Unable to Load Admin Data</h2>
          <p className="text-gray-500">Please try again later</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Platform overview and management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Platform Health</div>
                <div className="text-lg font-bold text-green-600">98.5%</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                <Shield className="w-6 h-6" />
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
              { id: 'users', label: 'Users', icon: Users },
              { id: 'badges', label: 'Badge Manager', icon: Award },
              { id: 'sessions', label: 'Sessions', icon: BookOpen },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'system', label: 'System', icon: Settings }
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
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+{adminStats.monthlyGrowth}% this month</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.totalSessions.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+12% this month</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">₹{(adminStats.totalRevenue / 100000).toFixed(1)}L</p>
                    <p className="text-sm text-green-600">+8% this month</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{adminStats.completionRate}%</p>
                    <p className="text-sm text-green-600">+2% this month</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* User Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Learners</span>
                    </div>
                    <span className="font-medium">{adminStats.totalLearners.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Tutors</span>
                    </div>
                    <span className="font-medium">{adminStats.totalTutors.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Active Users</span>
                    </div>
                    <span className="font-medium">{adminStats.activeUsers.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{adminStats.averageRating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Hours</span>
                    <span className="font-medium">{adminStats.totalHours.toLocaleString()}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Growth</span>
                    <span className="font-medium text-green-600">+{adminStats.monthlyGrowth}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {activity.user}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                    <p className="font-medium text-gray-900">View All Users</p>
                    <p className="text-sm text-gray-600">Manage user accounts</p>
                  </button>
                  <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                    <p className="font-medium text-gray-900">User Verification</p>
                    <p className="text-sm text-gray-600">Verify tutor applications</p>
                  </button>
                  <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                    <p className="font-medium text-gray-900">User Reports</p>
                    <p className="text-sm text-gray-600">View user activity reports</p>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Statistics</h3>
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{adminStats.totalUsers}</p>
                    <p className="text-sm text-gray-600">Registered Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{adminStats.activeUsers}</p>
                    <p className="text-sm text-gray-600">Active This Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{Math.round((adminStats.activeUsers / adminStats.totalUsers) * 100)}%</p>
                    <p className="text-sm text-gray-600">Engagement Rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Growth Metrics</h3>
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">+{adminStats.monthlyGrowth}%</p>
                    <p className="text-sm text-gray-600">Monthly Growth</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">85</p>
                    <p className="text-sm text-gray-600">New This Week</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">92%</p>
                    <p className="text-sm text-gray-600">Retention Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-8">
            {/* Badge Management Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Badge Management</h3>
                  <p className="text-sm text-gray-600">Award custom badges to users and manage badge system</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Award Badge</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Badge Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{badgeStats?.totalBadges || 0}</p>
                <p className="text-sm text-gray-600">Total Badges Awarded</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{badgeStats?.experienceBadges || 0}</p>
                <p className="text-sm text-gray-600">Experience Badges</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{badgeStats?.adminBadges || 0}</p>
                <p className="text-sm text-gray-600">Admin Badges</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{badgeStats?.thisMonthBadges || 0}</p>
                <p className="text-sm text-gray-600">This Month</p>
              </div>
            </div>

            {/* Award Badge Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Award Custom Badge</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={badgeForm.userId}
                      onChange={(e) => setBadgeForm({...badgeForm, userId: e.target.value})}
                    >
                      <option value="">Choose a user...</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.profile?.name || user.email} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Badge Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Outstanding Contributor"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={badgeForm.name}
                      onChange={(e) => setBadgeForm({...badgeForm, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea 
                      placeholder="e.g., Recognized for exceptional contribution to the community"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                      value={badgeForm.description}
                      onChange={(e) => setBadgeForm({...badgeForm, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Badge Icon</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['🏆', '👑', '⭐', '🎖️', '🥇', '🎯', '💎', '🔥'].map((icon, index) => (
                        <button 
                          key={index}
                          type="button"
                          onClick={() => setBadgeForm({...badgeForm, icon})}
                          className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center text-xl hover:border-blue-500 ${
                            badgeForm.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">XP Reward</label>
                    <input 
                      type="number" 
                      placeholder="e.g., 500"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={badgeForm.xpReward}
                      onChange={(e) => setBadgeForm({...badgeForm, xpReward: e.target.value})}
                    />
                  </div>
                  
                  <button 
                    type="button"
                    onClick={awardBadge}
                    disabled={badgeLoading}
                    className={`w-full py-3 rounded-lg flex items-center justify-center space-x-2 ${
                      badgeLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {badgeLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Awarding...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Award Badge</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Badge Awards */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Badge Awards</h3>
                <p className="text-sm text-gray-600">Latest badges awarded to users</p>
              </div>
              <div className="divide-y">
                {recentBadgeAwards.length > 0 ? (
                  recentBadgeAwards.map((award, index) => (
                    <div key={index} className="p-6 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {award.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="font-semibold text-gray-900">{award.user?.name || 'Unknown User'}</p>
                          <span className="text-2xl">{award.badge?.icon || '🏆'}</span>
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                            {award.badge?.name || 'Badge'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{award.user?.email || 'No email'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Awarded by Admin • +{award.badge?.xpReward || 0} XP • {new Date(award.awardedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No recent badge awards</p>
                    <p className="text-sm">Admin-awarded badges will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{adminStats.totalSessions}</p>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">1,250</p>
                  <p className="text-sm text-gray-600">Active Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{adminStats.completionRate}%</p>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { category: 'Web Development', count: 450, percentage: 35 },
                  { category: 'Data Science', count: 320, percentage: 25 },
                  { category: 'Design', count: 280, percentage: 22 },
                  { category: 'Business', count: 170, percentage: 13 }
                ].map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900">{item.category}</h4>
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                    <p className="text-sm text-gray-600">{item.percentage}% of total</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-medium">₹{(adminStats.totalRevenue / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Revenue</span>
                    <span className="font-medium">₹1.25L</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average per User</span>
                    <span className="font-medium">₹1,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Growth Rate</span>
                    <span className="font-medium text-green-600">+15.2%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Daily Active Users</span>
                    <span className="font-medium">650</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Session Duration</span>
                    <span className="font-medium">2.5h avg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Return Rate</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Satisfaction Score</span>
                    <span className="font-medium">4.6/5</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Trends</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Advanced analytics charts would go here</p>
                  <p className="text-sm">Revenue trends, user growth, session analytics</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Server Status</span>
                    <span className="text-sm text-green-600 font-medium">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="text-sm text-green-600 font-medium">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Response</span>
                    <span className="text-sm text-green-600 font-medium">Fast</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Storage</h3>
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Used Storage</span>
                    <span className="text-sm font-medium">2.4 GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="text-sm font-medium">47.6 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Backup</span>
                    <span className="text-sm font-medium">2h ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">SSL Status</span>
                    <span className="text-sm text-green-600 font-medium">Valid</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Security Scans</span>
                    <span className="text-sm text-green-600 font-medium">Passed</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Logs</h3>
              <div className="space-y-3">
                {[
                  { time: '10:30 AM', event: 'User registration processed', type: 'info' },
                  { time: '10:25 AM', event: 'Payment transaction completed', type: 'success' },
                  { time: '10:20 AM', event: 'Session started successfully', type: 'info' },
                  { time: '10:15 AM', event: 'Database backup completed', type: 'success' }
                ].map((log, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      log.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="text-sm text-gray-600">{log.time}</span>
                    <span className="text-sm text-gray-900 flex-1">{log.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;