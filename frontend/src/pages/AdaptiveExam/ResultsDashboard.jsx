import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Trophy,
  TrendingUp,
  Target,
  Clock,
  Zap,
  Award,
  BarChart3,
  Brain,
  CheckCircle,
  XCircle,
  ArrowRight,
  Home,
  RefreshCw
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const ResultsDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sessionId = location.state?.sessionId;

  useEffect(() => {
    if (!sessionId) {
      navigate('/adaptive-exam');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/analytics/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setAnalytics(data.analytics);
        } else {
          setError(data.error || 'Failed to load analytics');
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load exam results');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [sessionId, navigate]);

  const getPerformanceLevel = (accuracy) => {
    if (accuracy >= 90) return { label: 'Exceptional', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (accuracy >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (accuracy >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (accuracy >= 60) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getAbilityLevel = (ability) => {
    if (ability < 0.5) return { label: 'Beginner', color: 'text-green-600' };
    if (ability < 1.0) return { label: 'Intermediate', color: 'text-blue-600' };
    if (ability < 1.5) return { label: 'Advanced', color: 'text-purple-600' };
    if (ability < 2.0) return { label: 'Expert', color: 'text-orange-600' };
    return { label: 'Master', color: 'text-red-600' };
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'veryEasy': 'bg-green-500',
      'easy': 'bg-blue-500',
      'moderate': 'bg-yellow-500',
      'difficult': 'bg-red-500'
    };
    return colors[difficulty] || 'bg-gray-500';
  };

  const startNewExam = () => {
    navigate('/adaptive-exam');
  };

  const goHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-800 mb-4">{error}</p>
          <button
            onClick={() => navigate('/adaptive-exam')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Adaptive Exam
          </button>
        </div>
      </div>
    );
  }

  const performanceLevel = getPerformanceLevel(analytics.accuracy);
  const abilityInfo = getAbilityLevel(analytics.finalAbility);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 shadow-lg">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Exam Complete!</h1>
          <p className="text-xl text-gray-600">Here's your detailed performance analysis</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Accuracy */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-600" />
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${performanceLevel.bg} ${performanceLevel.color}`}>
                {performanceLevel.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Accuracy</p>
            <p className="text-4xl font-bold text-green-600">{analytics.accuracy.toFixed(1)}%</p>
            <p className="text-sm text-gray-500 mt-2">
              {analytics.correctAnswers}/{analytics.totalQuestions} correct
            </p>
          </div>

          {/* Ability Level */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-8 h-8 text-purple-600" />
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-purple-100 ${abilityInfo.color}`}>
                {abilityInfo.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Final Ability</p>
            <p className="text-4xl font-bold text-purple-600">{analytics.finalAbility.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">
              {analytics.abilityChange >= 0 ? '↑' : '↓'} 
              {Math.abs(analytics.abilityChange).toFixed(2)} from start
            </p>
          </div>

          {/* XP Earned */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">XP Earned</p>
            <p className="text-4xl font-bold text-blue-600">+{analytics.xpEarned}</p>
            <p className="text-sm text-gray-500 mt-2">Experience Points</p>
          </div>

          {/* Time Spent */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Time</p>
            <p className="text-4xl font-bold text-orange-600">
              {Math.floor(analytics.totalTimeSpent / 60)}m {Math.floor(analytics.totalTimeSpent % 60)}s
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Avg: {(analytics.averageTimePerQuestion || 0).toFixed(1)}s/question
            </p>
          </div>
        </div>

        {/* Badges Earned */}
        {analytics.earnedBadges && analytics.earnedBadges.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <Award className="w-6 h-6 text-yellow-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Badges Earned!</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.earnedBadges.map((badge, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                  <div className="text-4xl">{badge.icon}</div>
                  <div>
                    <p className="font-bold text-gray-900">{badge.name}</p>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Difficulty Breakdown</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(analytics.difficultyBreakdown).map(([difficulty, stats]) => (
              <div key={difficulty} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 capitalize">
                    {difficulty.replace('veryEasy', 'Very Easy').replace('easy', 'Easy').replace('moderate', 'Moderate').replace('difficult', 'Difficult')}
                  </h3>
                  <div className={`w-3 h-3 rounded-full ${getDifficultyColor(difficulty)}`}></div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.attempted > 0 ? ((stats.correct / stats.attempted) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-sm text-gray-600">
                  {stats.correct}/{stats.attempted} correct
                </p>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getDifficultyColor(difficulty)}`}
                    style={{ width: `${stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Response Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Response Timeline</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.responses && analytics.responses.map((response, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  response.isCorrect 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    response.isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {response.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <XCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Question {index + 1}</p>
                    <p className="text-sm text-gray-600">
                      {response.difficulty} • {response.timeSpent.toFixed(1)}s
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      Ability: {response.abilityAfter.toFixed(2)}
                    </p>
                    <p className={`text-xs ${
                      response.abilityAfter >= response.abilityBefore 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {response.abilityAfter >= response.abilityBefore ? '↑' : '↓'}
                      {Math.abs(response.abilityAfter - response.abilityBefore).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Statistics */}
        {analytics.timeStats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-orange-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Time Statistics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Fastest Response</p>
                <p className="text-3xl font-bold text-orange-600">
                  {analytics.timeStats.fastest.toFixed(1)}s
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Average Response</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.timeStats.average.toFixed(1)}s
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Slowest Response</p>
                <p className="text-3xl font-bold text-red-600">
                  {analytics.timeStats.slowest.toFixed(1)}s
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={startNewExam}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-600 hover:to-purple-700 transition duration-200 shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Take Another Exam</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={goHome}
            className="flex items-center justify-center space-x-2 bg-white text-gray-700 font-bold py-4 px-8 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition duration-200 shadow-lg"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
