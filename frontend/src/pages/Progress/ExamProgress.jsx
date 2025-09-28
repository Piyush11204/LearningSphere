import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const ExamProgress = () => {
  const [progress, setProgress] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProgressAndProfile();
  }, []);

  const fetchProgressAndProfile = async () => {
    try {
      const [progressResponse, userResponse] = await Promise.all([
        api.get('/progress/my'),
        api.get('/auth/profile')
      ]);
      
      setProgress(progressResponse.data);
      setUser(userResponse.data.user);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load progress data');
      setLoading(false);
    }
  };

  const getBadgeColor = (badgeType) => {
    const colors = {
      'First Exam': 'bg-blue-100 text-blue-800',
      'Quiz Master': 'bg-green-100 text-green-800',
      'Perfect Score': 'bg-yellow-100 text-yellow-800',
      'Speed Demon': 'bg-red-100 text-red-800',
      'Consistent Performer': 'bg-purple-100 text-purple-800',
      'High Achiever': 'bg-indigo-100 text-indigo-800',
      'Exam Warrior': 'bg-gray-100 text-gray-800',
      'Perfectionist': 'bg-pink-100 text-pink-800',
      'Lightning Fast': 'bg-orange-100 text-orange-800',
      'Academic Excellence': 'bg-emerald-100 text-emerald-800'
    };
    return colors[badgeType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading progress...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Exam Progress & Achievements</h1>
        <p className="mt-2 text-gray-600">Track your exam performance and unlock new badges!</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📝</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Exams</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user?.examStats?.totalExams || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user?.examStats?.averageScore?.toFixed(1) || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🏆</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Perfect Scores</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user?.examStats?.perfectScores || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">🎯</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Current Streak</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user?.examStats?.currentStreak || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exam Badges */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Exam Badges</h2>
            <p className="text-sm text-gray-600">Badges earned through exam achievements</p>
          </div>
          <div className="px-6 py-4">
            {progress?.badges?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {progress.badges
                  .filter(badge => badge.type.includes('Exam') || badge.type.includes('Perfect') || badge.type.includes('Speed') || badge.type.includes('Quiz'))
                  .map((badge, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{badge.icon || '🏅'}</span>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{badge.type}</p>
                        <p className="text-xs text-gray-600">
                          Earned {new Date(badge.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(badge.type)}`}>
                          +{badge.xpReward} XP
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl">🎯</span>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No exam badges yet</h3>
                <p className="mt-1 text-sm text-gray-500">Take your first exam to start earning badges!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Exam History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Exams</h2>
            <p className="text-sm text-gray-600">Your latest exam attempts</p>
          </div>
          <div className="px-6 py-4">
            {user?.examHistory?.length > 0 ? (
              <div className="space-y-4">
                {user.examHistory.slice(-5).map((exam, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{exam.title || 'Exam'}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(exam.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        exam.score >= 90 ? 'bg-green-100 text-green-800' :
                        exam.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {exam.score}%
                      </span>
                      <span className="text-xs text-gray-500">
                        +{exam.xpEarned || 0} XP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl">📚</span>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No exam history</h3>
                <p className="mt-1 text-sm text-gray-500">Your completed exams will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      {progress && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Experience Points</h3>
            <span className="text-sm text-gray-600">{progress.xp} XP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${Math.min((progress.xp % 1000) / 10, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Level {Math.floor(progress.xp / 1000) + 1} • {1000 - (progress.xp % 1000)} XP to next level
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamProgress;