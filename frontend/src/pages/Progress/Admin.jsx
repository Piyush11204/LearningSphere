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
  Globe,
  Download
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

  // Exam history state
  const [examHistory, setExamHistory] = useState([]);

  // Fetch badge-related data
  const fetchBadgeData = async (token) => {
    try {
      // Fetch all progress data to calculate badge stats
      const progressResponse = await fetch('https://learningsphere-1fgj.onrender.com/api/progress/leaderboard?limit=1000', {
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

      const response = await fetch('https://learningsphere-1fgj.onrender.com/api/progress/admin/award-badge', {
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
        const analyticsResponse = await fetch('https://learningsphere-1fgj.onrender.com/api/admin/analytics', {
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
        const usersResponse = await fetch('https://learningsphere-1fgj.onrender.com/api/admin/users', {
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
        const sessionsResponse = await fetch('https://learningsphere-1fgj.onrender.com/api/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let sessionsData = [];
        if (sessionsResponse.ok) {
          sessionsData = await sessionsResponse.json();
        }

        // Fetch exam history for reports
        const examHistoryResponse = await fetch('https://learningsphere-1fgj.onrender.com/api/admin/exam-history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let examHistoryData = [];
        if (examHistoryResponse.ok) {
          examHistoryData = await examHistoryResponse.json();
          setExamHistory(examHistoryData.examHistory || []);
        }

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
              { id: 'badges', label: 'Badge Manager', icon: Award },
              { id: 'reports', label: 'Reports', icon: Eye }
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

        {/* Add Reports Tab for Learners */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Comprehensive Exam Reports & Analytics</h3>
                  <p className="text-sm text-gray-600">Detailed exam history, performance analytics, and student insights</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>View All Reports</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Exam Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{examHistory?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Exams Taken</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{examHistory?.filter(exam => exam.passed).length || 0}</p>
                <p className="text-sm text-gray-600">Exams Passed</p>
                <p className="text-xs text-green-600">
                  {examHistory?.length > 0 ? Math.round((examHistory.filter(exam => exam.passed).length / examHistory.length) * 100) : 0}% Pass Rate
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{examHistory?.filter(exam => !exam.passed).length || 0}</p>
                <p className="text-sm text-gray-600">Exams Failed</p>
                <p className="text-xs text-red-600">
                  {examHistory?.length > 0 ? Math.round((examHistory.filter(exam => !exam.passed).length / examHistory.length) * 100) : 0}% Fail Rate
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {examHistory?.length > 0 ? Math.round(examHistory.reduce((sum, exam) => sum + exam.score, 0) / examHistory.length) : 0}%
                </p>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-xs text-gray-500">
                  Platform Average
                </p>
              </div>
            </div>

            {/* Performance Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
                <div className="space-y-3">
                  {[
                    { range: '90-100%', count: examHistory?.filter(exam => exam.score >= 90).length || 0, color: 'bg-green-500' },
                    { range: '80-89%', count: examHistory?.filter(exam => exam.score >= 80 && exam.score < 90).length || 0, color: 'bg-blue-500' },
                    { range: '70-79%', count: examHistory?.filter(exam => exam.score >= 70 && exam.score < 80).length || 0, color: 'bg-yellow-500' },
                    { range: '60-69%', count: examHistory?.filter(exam => exam.score >= 60 && exam.score < 70).length || 0, color: 'bg-orange-500' },
                    { range: '0-59%', count: examHistory?.filter(exam => exam.score < 60).length || 0, color: 'bg-red-500' }
                  ].map((range, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 w-16">{range.range}</span>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${range.color}`}
                            style={{ width: `${examHistory?.length > 0 ? (range.count / examHistory.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{range.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
                <div className="space-y-3">
                  {(() => {
                    const subjectStats = {};
                    examHistory?.forEach(exam => {
                      if (!subjectStats[exam.subject]) {
                        subjectStats[exam.subject] = { total: 0, passed: 0, avgScore: 0 };
                      }
                      subjectStats[exam.subject].total++;
                      if (exam.passed) subjectStats[exam.subject].passed++;
                      subjectStats[exam.subject].avgScore += exam.score;
                    });

                    Object.keys(subjectStats).forEach(subject => {
                      subjectStats[subject].avgScore = Math.round(subjectStats[subject].avgScore / subjectStats[subject].total);
                    });

                    return Object.entries(subjectStats).map(([subject, stats]) => (
                      <div key={subject} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{subject}</p>
                          <p className="text-sm text-gray-600">{stats.passed}/{stats.total} passed</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{stats.avgScore}%</p>
                          <p className="text-xs text-gray-500">avg score</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Recent Exam Results with Enhanced Details */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Exam Results</h3>
                <p className="text-sm text-gray-600">Comprehensive exam attempts with question-level analysis</p>
              </div>
              <div className="divide-y">
                {examHistory && examHistory.length > 0 ? (
                  examHistory.map((exam, index) => (
                    <div key={exam.examId || index} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{exam.title}</h4>
                          <p className="text-sm text-gray-600">
                            Student: {exam.userName} ({exam.userEmail})
                          </p>
                          <p className="text-sm text-gray-600">
                            Submitted on {new Date(exam.submittedAt).toLocaleDateString()} at {new Date(exam.submittedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${exam.score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                            {exam.score}%
                          </div>
                          <div className="text-sm text-gray-600">
                            {exam.correctAnswers}/{exam.totalQuestions} Correct
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            exam.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {exam.passed ? 'Passed' : 'Failed'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Subject</div>
                          <div className="font-semibold">{exam.subject}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Time Taken</div>
                          <div className="font-semibold">{Math.floor(exam.timeTaken / 60)}:{(exam.timeTaken % 60).toString().padStart(2, '0')}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Duration</div>
                          <div className="font-semibold">{exam.duration} minutes</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Difficulty</div>
                          <div className="font-semibold">{exam.difficulty || 'Medium'}</div>
                        </div>
                      </div>

                      {/* Question Details with Enhanced Analysis */}
                      {exam.questionResults && exam.questionResults.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-gray-900">Question Analysis:</h5>
                            <div className="text-sm text-gray-600">
                              {exam.questionResults.filter(q => q.isCorrect).length} correct, {exam.questionResults.filter(q => !q.isCorrect).length} incorrect
                            </div>
                          </div>

                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {exam.questionResults.map((result, qIndex) => (
                              <div key={qIndex} className={`border rounded-lg p-4 ${result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="font-medium text-gray-900">Q{qIndex + 1}.</span>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {result.isCorrect ? 'Correct' : 'Incorrect'}
                                      </span>
                                    </div>
                                    <p className="font-medium text-gray-900 mb-2">
                                      {result.questionText || 'Question text not available'}
                                    </p>
                                    <div className="space-y-1">
                                      <p className="text-sm text-gray-600">
                                        <strong>Your answer:</strong>
                                        <span className={`ml-1 font-medium ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                          {result.userAnswer || 'Not answered'}
                                        </span>
                                      </p>
                                      {!result.isCorrect && (
                                        <p className="text-sm text-gray-600">
                                          <strong>Correct answer:</strong>
                                          <span className="ml-1 font-medium text-green-600">{result.correctAnswer}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {result.explanation && (
                                  <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
                                    <p className="text-sm text-gray-700">
                                      <strong>Explanation:</strong> {result.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Performance Summary */}
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h6 className="font-semibold text-gray-900 mb-2">Performance Summary</h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="ml-1 font-medium">{exam.score}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Questions:</span>
                            <span className="ml-1 font-medium">{exam.totalQuestions}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Correct:</span>
                            <span className="ml-1 font-medium text-green-600">{exam.correctAnswers}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Time Efficiency:</span>
                            <span className="ml-1 font-medium">
                              {exam.timeTaken <= exam.duration ? 'Good' : 'Slow'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No exam results available</p>
                    <p className="text-sm">Exam results will appear here once students take exams</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}




      </div>
    </div>
  );
};

export default Admin;