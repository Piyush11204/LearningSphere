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
  AlertCircle,
  Download,
  FileText,
  LineChart,
  User 
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Area,
  AreaChart
} from 'recharts';

const Learner = () => {
  const [progress, setProgress] = useState(null);
  const [examHistory, setExamHistory] = useState([]);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [sectionalHistory, setSectionalHistory] = useState([]);
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
        const progressResponse = await fetch(`https://learningsphere-1fgj.onrender.com/api/progress/${userId}`, {
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
            const retryResponse = await fetch(`https://learningsphere-1fgj.onrender.com/api/progress/${userId}`, {
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
        const leaderboardResponse = await fetch('https://learningsphere-1fgj.onrender.com/api/progress/leaderboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          setLeaderboard(leaderboardData.leaderboard || []);
        }

        // Fetch exam history
        const examHistoryResponse = await fetch('https://learningsphere-1fgj.onrender.com/api/exams/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (examHistoryResponse.ok) {
          const examHistoryData = await examHistoryResponse.json();
          setExamHistory(examHistoryData.examHistory || []);
        }

        // Fetch practice history
        const practiceHistoryResponse = await fetch('https://learningsphere-1fgj.onrender.com/api/practice/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (practiceHistoryResponse.ok) {
          const practiceHistoryData = await practiceHistoryResponse.json();
          setPracticeHistory(practiceHistoryData || []);
        }

        // Fetch sectional test history
        const sectionalHistoryResponse = await fetch('https://learningsphere-1fgj.onrender.com/api/practice/sectional/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (sectionalHistoryResponse.ok) {
          const sectionalHistoryData = await sectionalHistoryResponse.json();
          setSectionalHistory(sectionalHistoryData || []);
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
        const response = await fetch('https://learningsphere-1fgj.onrender.com/api/progress', {
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

  // Helper functions for reports
  const generateXPProgressData = () => {
    // Generate mock XP progress data for the last 30 days
    const data = [];
    let currentXP = Math.max(0, progress.experiencePoints - 500);
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      currentXP += Math.floor(Math.random() * 50) + 10;
      if (currentXP > progress.experiencePoints) currentXP = progress.experiencePoints;
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        xp: currentXP
      });
    }
    return data;
  };

  const generateExamPerformanceData = () => {
    return examHistory.slice(-10).map((exam, index) => ({
      exam: `Exam ${index + 1}`,
      score: exam.score,
      subject: exam.subject
    }));
  };

  const generateBadgeDistributionData = () => {
    const categories = ['experience', 'session', 'achievement', 'admin'];
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    
    return categories.map((category, index) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: progress.badges?.filter(badge => badge.category === category).length || 0,
      color: colors[index]
    })).filter(item => item.value > 0);
  };

  const generateRecentActivityData = () => {
    // Generate mock recent activity data
    const activities = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      activities.push({
        date: date.toISOString(),
        activity: i === 0 ? 'Completed exam' : i === 1 ? 'Attended live session' : 'Completed session',
        xp: Math.floor(Math.random() * 100) + 25,
        badges: Math.random() > 0.7 ? 1 : 0
      });
    }
    return activities;
  };

  const generateAndDownloadReport = (format) => {
    if (format === 'pdf') {
      // Create a simple PDF-like text report
      const reportData = {
        title: 'Learning Progress Report',
        generatedAt: new Date().toLocaleString(),
        user: 'Current User',
        summary: {
          totalXP: progress.experiencePoints,
          level: progress.currentLevel,
          sessionsCompleted: progress.sessionsCompleted,
          examsTaken: examHistory.length,
          practiceSessions: practiceHistory.length,
          sectionalTests: sectionalHistory.length,
          badgesEarned: progress.badges?.length || 0
        },
        examHistory: examHistory.slice(-5),
        practiceHistory: practiceHistory.slice(-5),
        sectionalHistory: sectionalHistory.slice(-5),
        recentActivity: generateRecentActivityData()
      };

      // Create downloadable text file (simulating PDF)
      const reportText = `
LEARNING PROGRESS REPORT
Generated: ${reportData.generatedAt}

SUMMARY
=======
Total XP: ${reportData.summary.totalXP}
Current Level: ${reportData.summary.level}
Sessions Completed: ${reportData.summary.sessionsCompleted}
Exams Taken: ${reportData.summary.examsTaken}
Practice Sessions: ${reportData.summary.practiceSessions}
Sectional Tests: ${reportData.summary.sectionalTests}
Badges Earned: ${reportData.summary.badgesEarned}

RECENT EXAMS
============
${reportData.examHistory.map(exam => 
  `${exam.title}: ${exam.score}% (${exam.correctAnswers}/${exam.totalQuestions}) - ${exam.passed ? 'PASSED' : 'FAILED'}`
).join('\n')}

RECENT PRACTICE SESSIONS
========================
${reportData.practiceHistory.map(session => 
  `Session: ${session.correctAnswers}/${session.totalQuestions} correct (${session.accuracy}%) - ${session.xpEarned} XP`
).join('\n')}

RECENT SECTIONAL TESTS
======================
${reportData.sectionalHistory.map(test => 
  `Test: ${test.completedSections}/${test.totalSections} sections passed - ${test.xpEarned} XP`
).join('\n')}

RECENT ACTIVITY
===============
${reportData.recentActivity.map(activity => 
  `${new Date(activity.date).toLocaleDateString()}: ${activity.activity} (+${activity.xp} XP)`
).join('\n')}
      `;

      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Generate CSV data
      const csvData = [
        ['Date', 'Activity', 'XP Earned', 'Badges Earned'],
        ...generateRecentActivityData().map(activity => [
          new Date(activity.date).toLocaleDateString(),
          activity.activity,
          activity.xp,
          activity.badges
        ])
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learning-activity-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'exams', label: 'Exams', icon: BookOpen }
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

        {activeTab === 'reports' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Comprehensive Learning Reports</h3>
                  <p className="text-sm text-gray-600">Detailed exam history, performance analytics, and progress insights</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => generateAndDownloadReport('pdf')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </button>
                  <button
                    onClick={() => generateAndDownloadReport('csv')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export Data
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
                  Overall Performance
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

            {/* XP Progress Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Experience Points Growth</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateXPProgressData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="xp" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Exam Performance Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Exam Performance Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={generateExamPerformanceData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={3} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Badge Distribution Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Badge Category Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={generateBadgeDistributionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {generateBadgeDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Exam Results */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Exam History</h3>
                <p className="text-sm text-gray-600">Complete exam attempts with question-level analysis and performance insights</p>
              </div>
              <div className="divide-y">
                {examHistory && examHistory.length > 0 ? (
                  examHistory.map((exam, index) => (
                    <div key={exam.examId || index} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{exam.title}</h4>
                          <p className="text-sm text-gray-600">
                            Subject: {exam.subject} • Duration: {exam.duration} minutes
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
                          <div className="text-sm text-gray-600">Time Taken</div>
                          <div className="font-semibold">{Math.floor(exam.timeTaken / 60)}:{(exam.timeTaken % 60).toString().padStart(2, '0')}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Difficulty</div>
                          <div className="font-semibold">{exam.difficulty || 'Medium'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Questions</div>
                          <div className="font-semibold">{exam.totalQuestions}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-600">Accuracy</div>
                          <div className="font-semibold">{exam.score}%</div>
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
                    <p className="text-sm">Take your first exam to see detailed performance analytics here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Learning Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Learning Consistency</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round((progress.streak?.current || 0) / Math.max(progress.streak?.longest || 1, 1) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Streak vs Best</p>
                  </div>
                  <Flame className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">XP Efficiency</p>
                    <p className="text-2xl font-bold text-green-600">
                      {progress.sessionsCompleted > 0 ? Math.round(progress.experiencePoints / progress.sessionsCompleted) : 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">XP per Session</p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Time Investment</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(progress.totalHours / Math.max(progress.sessionsCompleted, 1) * 10) / 10}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Hours per Session</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Achievement Rate</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {progress.badges?.length > 0 ? Math.round((progress.badges.length / Math.max(progress.sessionsCompleted, 1)) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Badges per Session</p>
                  </div>
                  <Trophy className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exams' && (
          <div className="space-y-8">
            {/* Exam Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Exams Taken</p>
                    <p className="text-3xl font-bold text-gray-900">{progress.examsCompleted || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-3xl font-bold text-gray-900">{progress.examAverageScore ? Math.round(progress.examAverageScore) : 0}%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Best Score</p>
                    <p className="text-3xl font-bold text-gray-900">{progress.examBestScore || 0}%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {progress.examsCompleted > 0 ? Math.round((progress.examsPassed / progress.examsCompleted) * 100) : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Exam Achievements
              </h3>
              {progress.badges && progress.badges.filter(badge => badge.category === 'exam').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {progress.badges.filter(badge => badge.category === 'exam').map((badge, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{badge.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{badge.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Exam
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
                  <p className="text-gray-500 mb-4">Take your first exam to start earning achievement badges!</p>
                  <a
                    href="/student/exams"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Exams
                  </a>
                </div>
              )}
            </div>

            {/* Recent Exam History */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Exam History</h3>
              {examHistory && examHistory.length > 0 ? (
                <div className="space-y-4">
                  {examHistory.slice(0, 5).map((exam, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          exam.score >= 80 ? 'bg-green-100' :
                          exam.score >= 60 ? 'bg-blue-100' :
                          exam.score >= 40 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {exam.score >= 80 ? <CheckCircle className="w-6 h-6 text-green-600" /> :
                           exam.score >= 60 ? <Target className="w-6 h-6 text-blue-600" /> :
                           exam.score >= 40 ? <AlertCircle className="w-6 h-6 text-yellow-600" /> :
                           <XCircle className="w-6 h-6 text-red-600" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{exam.title}</h4>
                          <p className="text-sm text-gray-600">
                            Subject: {exam.subject} • Duration: {exam.duration} min
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted {new Date(exam.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          exam.score >= 80 ? 'text-green-600' :
                          exam.score >= 60 ? 'text-blue-600' :
                          exam.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {exam.score}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {exam.score >= 40 ? 'Passed' : 'Failed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No exams taken yet. Start your first exam to track your progress!</p>
                  <a
                    href="/student/exams"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Take Your First Exam
                  </a>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Ready for More Challenges?</h3>
              <p className="mb-6 opacity-90">Continue your learning journey with AI-powered assessments and earn more achievements.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/student/exams"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Browse Available Exams
                </a>
                <a
                  href="/student/reports"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-all"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Detailed Reports
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Learner;
