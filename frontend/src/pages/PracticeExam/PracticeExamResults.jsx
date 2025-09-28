import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  RotateCcw,
  Home,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { API_URLS } from '../../config/api';

const PracticeExamResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.PRACTICE}/results/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch results');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (percentage) => {
    if (percentage >= 80) return <Trophy className="w-8 h-8 text-green-600" />;
    if (percentage >= 60) return <Target className="w-8 h-8 text-yellow-600" />;
    return <AlertCircle className="w-8 h-8 text-red-600" />;
  };

  const getDifficultyTrend = (results) => {
    if (!results || !results.questions) return null;

    const difficulties = results.questions.map(q => {
      switch (q.difficulty?.toLowerCase()) {
        case 'very easy': return 0;
        case 'easy': return 1;
        case 'moderate': return 2;
        case 'difficult': return 3;
        default: return 2;
      }
    });

    const firstHalf = difficulties.slice(0, Math.floor(difficulties.length / 2));
    const secondHalf = difficulties.slice(Math.floor(difficulties.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.2) return 'increasing';
    if (secondAvg < firstAvg - 0.2) return 'decreasing';
    return 'stable';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/practice-exams')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Practice Exams
          </button>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const accuracy = results.correctAnswers / results.totalQuestions * 100;
  const trend = getDifficultyTrend(results);

  // Prepare chart data
  const difficultyData = ['Very easy', 'Easy', 'Moderate', 'Difficult'].map(difficulty => {
    const count = results.questions?.filter(q =>
      q.difficulty?.toLowerCase() === difficulty.toLowerCase()
    ).length || 0;
    const correct = results.questions?.filter(q =>
      q.difficulty?.toLowerCase() === difficulty.toLowerCase() && q.correct
    ).length || 0;

    return {
      difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
      total: count,
      correct: correct,
      accuracy: count > 0 ? Math.round((correct / count) * 100) : 0
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getPerformanceIcon(accuracy)}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Practice Session Results</h1>
                <p className="text-gray-600 mt-1">Session #{sessionId.slice(-6)}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/practice-exams')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>Back to Sessions</span>
              </button>
              <button
                onClick={() => navigate('/practice-exams')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start New Session</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Score</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(accuracy)}`}>
                  {results.correctAnswers}/{results.totalQuestions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(accuracy)}`}>
                  {Math.round(accuracy)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">XP Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.xpEarned || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                {trend === 'increasing' ? (
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                ) : trend === 'decreasing' ? (
                  <TrendingDown className="w-6 h-6 text-orange-600" />
                ) : (
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Difficulty</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trend === 'increasing' ? '↑' : trend === 'decreasing' ? '↓' : '→'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* New Achievements Section */}
        {results.newBadges && results.newBadges.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center mb-4">
              <Trophy className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-bold">New Achievements!</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.newBadges.map((badge, index) => (
                <div key={index} className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h3 className="text-lg font-semibold mb-1">{badge.name}</h3>
                  <p className="text-sm opacity-90">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* XP Gain Section */}
        {results.xpEarned > 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Award className="w-8 h-8 mr-3" />
                <div>
                  <h2 className="text-xl font-bold">Experience Points Earned!</h2>
                  <p className="text-purple-100">Great job on completing this practice session</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">+{results.xpEarned} XP</div>
                <div className="text-sm text-purple-100">
                  {results.levelUp ? `Level up! Now level ${results.newLevel}` : `Keep it up!`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Analysis */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Analysis</h2>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Question Distribution Pie Chart */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Question Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={difficultyData.filter(d => d.total > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ difficulty, total }) => `${difficulty}: ${total}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {difficultyData.filter(d => d.total > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.difficulty.toLowerCase() === 'very easy' ? '#10B981' :
                        entry.difficulty.toLowerCase() === 'easy' ? '#22C55E' :
                        entry.difficulty.toLowerCase() === 'moderate' ? '#F59E0B' : '#EF4444'
                      } />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} questions (${props.payload.accuracy}% accuracy)`, props.payload.difficulty]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Accuracy Bar Chart */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Accuracy by Difficulty</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={difficultyData.filter(d => d.total > 0)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="difficulty" angle={-45} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value, name, props) => [`${value}% (${props.payload.correct}/${props.payload.total})`, 'Accuracy']} />
                  <Bar dataKey="accuracy" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Difficulty Breakdown</h3>
              <div className="space-y-2">
                {difficultyData.map(item => (
                  <div key={item.difficulty} className="flex items-center justify-between">
                    <span className="capitalize text-gray-700">{item.difficulty}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {item.correct}/{item.total} ({item.accuracy}%)
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Based on {results.questions?.filter(q => q.answered).length || 0} answered questions
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Time Management</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Session Duration</span>
                  <span className="font-medium">
                    {results.duration >= 60
                      ? `${Math.floor(results.duration / 60)}h ${results.duration % 60}m`
                      : `${results.duration}m`
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Questions per Minute</span>
                  <span className="font-medium">
                    {results.totalQuestions > 0 && results.duration > 0
                      ? (results.totalQuestions / results.duration).toFixed(2)
                      : '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Avg Time per Question</span>
                  <span className="font-medium">
                    {results.totalQuestions > 0 && results.duration > 0
                      ? `${Math.round((results.duration * 60) / results.totalQuestions)}s`
                      : '0s'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Time Spent</span>
                  <span className="font-medium">
                    {results.questions?.filter(q => q.answered).reduce((total, q) => total + (q.timeTaken || 0), 0) || 0}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Question Review</h2>
            <p className="text-sm text-gray-600 mt-1">
              {results.questions?.filter(q => q.answered).length || 0} of {results.questions?.length || 0} questions answered
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {results.questions?.map((question, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {question.answered ? (
                      question.correct ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )
                    ) : (
                      <AlertCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Question {index + 1}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        question.difficulty?.toLowerCase() === 'very easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty?.toLowerCase() === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty?.toLowerCase() === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                      {!question.answered && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not Answered
                        </span>
                      )}
                    </div>

                    <p className="text-gray-900 mb-3">{question.question_text}</p>

                    {question.answered ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Your answer:</span>
                          <span className={`font-medium ${question.correct ? 'text-green-600' : 'text-red-600'}`}>
                            {question.userAnswer?.toUpperCase()}
                          </span>
                        </div>
                        {!question.correct && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">Correct answer:</span>
                            <span className="font-medium text-green-600">
                              {question.correctAnswer?.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        This question was not answered during the session.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeExamResults;