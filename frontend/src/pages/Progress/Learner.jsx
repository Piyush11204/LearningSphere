import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Target,
  Clock,
  Users,
  Star,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Zap,
  Medal,
  Crown,
  Flame,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const Learner = () => {
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProgressData = async () => {
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

        // Fetch user progress
        const progressResponse = await fetch(`http://localhost:5000/api/progress/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!progressResponse.ok) {
          if (progressResponse.status === 404) {
            // Progress not found, create it
            await createProgressForUser(userId, token);
            // Retry fetching
            const retryResponse = await fetch(`http://localhost:5000/api/progress/${userId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            if (retryResponse.ok) {
              const progressData = await retryResponse.json();
              setProgress(progressData);
            }
          } else {
            throw new Error(`Failed to fetch progress: ${progressResponse.status}`);
          }
        } else {
          const progressData = await progressResponse.json();
          setProgress(progressData);
        }

        // Fetch leaderboard
        const leaderboardResponse = await fetch('http://localhost:5000/api/progress/leaderboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          setLeaderboard(leaderboardData.leaderboard || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        setError(error.message || 'Failed to load progress data');
        setLoading(false);
      }
    };

    const createProgressForUser = async (userId, token) => {
      try {
        const response = await fetch('http://localhost:5000/api/progress', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });

        if (!response.ok) {
          throw new Error('Failed to create progress record');
        }
      } catch (error) {
        console.error('Error creating progress:', error);
      }
    };

    fetchProgressData();
  }, []);

  const getNextLevelXP = (currentLevel) => currentLevel * 1000;
  const getCurrentLevelXP = (currentLevel) => (currentLevel - 1) * 1000;
  const getProgressToNextLevel = (xp, currentLevel) => {
    const currentLevelXP = getCurrentLevelXP(currentLevel);
    const nextLevelXP = getNextLevelXP(currentLevel);
    return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
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
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Error Loading Progress</h2>
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

  if (!progress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">No Progress Data</h2>
          <p className="text-gray-500">Start learning to track your progress!</p>
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
              <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
              <p className="text-sm text-gray-600">Track your learning journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Level {progress.currentLevel}</div>
                <div className="text-lg font-bold text-blue-600">{progress.experiencePoints} XP</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {progress.currentLevel}
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
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
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
                    <p className="text-3xl font-bold text-gray-900">{progress.sessionsCompleted}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {progress.normalSessionsCompleted || 0} normal • {progress.liveSessionsAttended || 0} live
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                    <p className="text-3xl font-bold text-gray-900">{progress.totalHours}h</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Level</p>
                    <p className="text-3xl font-bold text-gray-900">{progress.currentLevel}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {progress.experiencePoints} XP
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Learning Streak</p>
                    <p className="text-3xl font-bold text-gray-900">{progress.streak?.current || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Best: {progress.streak?.longest || 0} days
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Level Progress</h3>
                <span className="text-sm text-gray-600">
                  {progress.experiencePoints - getCurrentLevelXP(progress.currentLevel)} / {getNextLevelXP(progress.currentLevel) - getCurrentLevelXP(progress.currentLevel)} XP to next level
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressToNextLevel(progress.experiencePoints, progress.currentLevel)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Level {progress.currentLevel}</span>
                <span>Level {progress.currentLevel + 1}</span>
              </div>
            </div>

            {/* Recent Milestones */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Milestones</h3>
              <div className="space-y-4">
                {progress.milestones.slice(-3).map((milestone, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{milestone.milestone}</p>
                      <p className="text-sm text-gray-600">{new Date(milestone.achievedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-8">
            {/* Badge Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{progress.badges?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Badges</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {progress.badges?.filter(b => b.category === 'experience').length || 0}
                </p>
                <p className="text-sm text-gray-600">Experience Badges</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {progress.badges?.filter(b => b.category === 'session').length || 0}
                </p>
                <p className="text-sm text-gray-600">Session Badges</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {progress.badges?.filter(b => b.category === 'admin').length || 0}
                </p>
                <p className="text-sm text-gray-600">Admin Badges</p>
              </div>
            </div>

            {/* Earned Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Your Badges
              </h3>
              {progress.badges && progress.badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {progress.badges.map((badge, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{badge.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{badge.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              {badge.category}
                            </span>
                            <span className="text-green-600 font-medium">+{badge.xpReward} XP</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Earned {new Date(badge.earnedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Complete sessions and gain experience to earn your first badge!</p>
                </div>
              )}
            </div>

            {/* Available Badges Preview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Badges</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🌱</span>
                    <div>
                      <p className="font-medium text-gray-900">Noobie</p>
                      <p className="text-sm text-gray-600">Start your learning journey</p>
                      <p className="text-xs text-blue-600">0 XP required</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🐦</span>
                    <div>
                      <p className="font-medium text-gray-900">Early Bird</p>
                      <p className="text-sm text-gray-600">Making great progress!</p>
                      <p className="text-xs text-green-600">500 XP required</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <p className="font-medium text-gray-900">Expert</p>
                      <p className="text-sm text-gray-600">Mastered the fundamentals</p>
                      <p className="text-xs text-purple-600">2000 XP required</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {/* Leaderboard Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Global Leaderboard</h3>
                  <p className="text-sm text-gray-600">Top learners across all metrics</p>
                </div>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="xp">Experience Points</option>
                  <option value="sessions">Total Sessions</option>
                  <option value="hours">Learning Hours</option>
                  <option value="level">Current Level</option>
                </select>
              </div>
            </div>

            {/* Leaderboard List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y">
                {leaderboard.map((item, index) => (
                  <div key={index} className={`p-6 ${item.user?.profile?.name === progress.user?.profile?.name ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.leaderboardRank || (index + 1)}
                      </div>

                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                        {(item.user?.profile?.name || 'U').charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-900">{item.user?.profile?.name || 'Unknown User'}</p>
                          {index < 3 && (
                            <span className={`${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              'text-orange-500'
                            }`}>
                              {index === 0 ? <Crown className="w-5 h-5" /> :
                               index === 1 ? <Medal className="w-5 h-5" /> :
                               <Award className="w-5 h-5" />}
                            </span>
                          )}
                        </div>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium text-blue-600">{item.experiencePoints || 0}</span>
                            <span className="ml-1">XP</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">{item.sessionsCompleted || 0}</span>
                            <span className="ml-1">Sessions</span>
                          </div>
                          <div>
                            <span className="font-medium text-purple-600">{item.stats?.liveSessionsAttended || 0}</span>
                            <span className="ml-1">Live</span>
                          </div>
                          <div>
                            <span className="font-medium text-orange-600">{item.stats?.badgeCount || 0}</span>
                            <span className="ml-1">Badges</span>
                          </div>
                        </div>
                      </div>

                      {/* Level */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">Level {item.currentLevel}</div>
                        <div className="text-xs text-gray-500">
                          Streak: {item.stats?.currentStreak || 0} days
                        </div>
                      </div>
                    </div>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="font-medium">5 sessions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium">18 sessions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average per Week</span>
                    <span className="font-medium">4.2 sessions</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Morning (6AM-12PM)</span>
                    <span className="font-medium">35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Afternoon (12PM-6PM)</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Evening (6PM-12AM)</span>
                    <span className="font-medium">20%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Trends</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Chart visualization would go here</p>
                  <p className="text-sm">Showing XP growth over time</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Learner;
