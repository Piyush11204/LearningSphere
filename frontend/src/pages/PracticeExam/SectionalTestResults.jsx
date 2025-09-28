import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  AlertCircle,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Star
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { API_URLS } from '../../config/api';

const SectionalTestResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sections = [
    { id: 'very-easy', name: 'Very Easy', icon: BookOpen, color: '#10B981' },
    { id: 'easy', name: 'Easy', icon: Target, color: '#22C55E' },
    { id: 'moderate', name: 'Moderate', icon: TrendingUp, color: '#F59E0B' },
    { id: 'difficult', name: 'Difficult', icon: AlertCircle, color: '#EF4444' }
  ];

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.PRACTICE}/sectional/results/${sessionId}`, {
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

  const getSectionIcon = (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.icon : BookOpen;
  };

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

  const getStudyRecommendations = (failedSection) => {
    const recommendations = {
      'very-easy': [
        'Review basic concepts and fundamentals',
        'Practice simple problem-solving techniques',
        'Focus on understanding core principles',
        'Complete beginner-level tutorials'
      ],
      'easy': [
        'Strengthen understanding of basic applications',
        'Practice more easy-level problems',
        'Review fundamental concepts thoroughly',
        'Work on basic problem patterns'
      ],
      'moderate': [
        'Focus on intermediate concepts and analysis',
        'Practice moderate-level problem solving',
        'Review complex relationships between concepts',
        'Work on analytical thinking skills'
      ],
      'difficult': [
        'Master advanced topics and complex problems',
        'Practice difficult-level questions extensively',
        'Focus on critical thinking and problem-solving strategies',
        'Review edge cases and complex scenarios'
      ]
    };

    return recommendations[failedSection] || [];
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

  const failedSection = location.state?.failedSection;
  const isTestFailed = failedSection && results.sections?.some(s => s.sectionId === failedSection && !s.passed);
  const passedSections = results.sections?.filter(s => s.passed) || [];
  const totalAccuracy = results.sections?.length > 0
    ? results.sections.reduce((acc, s) => acc + s.accuracy, 0) / results.sections.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isTestFailed ? (
                <AlertCircle className="w-8 h-8 text-red-600" />
              ) : (
                getPerformanceIcon(totalAccuracy)
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isTestFailed ? 'Test Failed' : 'Sectional Test Results'}
                </h1>
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
                onClick={() => navigate('/practice-exam/sectional')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Status */}
        <div className={`rounded-xl shadow-lg p-6 mb-8 ${isTestFailed ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${isTestFailed ? 'bg-red-100' : 'bg-green-100'}`}>
              {isTestFailed ? (
                <XCircle className={`w-8 h-8 ${isTestFailed ? 'text-red-600' : 'text-green-600'}`} />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-2 ${isTestFailed ? 'text-red-900' : 'text-green-900'}`}>
                {isTestFailed ? 'Test Not Completed' : 'Test Completed Successfully!'}
              </h2>
              <p className={`${isTestFailed ? 'text-red-700' : 'text-green-700'}`}>
                {isTestFailed
                  ? `You failed the ${sections.find(s => s.id === failedSection)?.name} section and cannot proceed further.`
                  : `Congratulations! You passed all selected sections.`
                }
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${isTestFailed ? 'text-red-600' : 'text-green-600'}`}>
                {passedSections.length}/{results.sections?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Sections Passed</div>
            </div>
          </div>
        </div>

        {/* Section Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {results.sections?.map((section, index) => {
            const SectionIcon = getSectionIcon(section.sectionId);
            const sectionInfo = sections.find(s => s.id === section.sectionId);

            return (
              <div key={section.sectionId} className={`bg-white rounded-xl shadow-lg p-6 ${!section.passed ? 'border-2 border-red-200' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${section.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                      <SectionIcon className={`w-5 h-5 ${section.passed ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{sectionInfo?.name}</h3>
                      <p className="text-sm text-gray-600">Section {index + 1}</p>
                    </div>
                  </div>
                  {section.passed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Score:</span>
                    <span className="font-medium">{section.correct}/{section.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Accuracy:</span>
                    <span className={`font-medium ${getPerformanceColor(section.accuracy)}`}>
                      {Math.round(section.accuracy)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Required:</span>
                    <span className="font-medium">40%</span>
                  </div>
                </div>

                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      section.passed ? 'bg-green-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(section.accuracy, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Study Recommendations - Only show if failed */}
        {isTestFailed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-8 h-8 text-yellow-600 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-yellow-900 mb-4">
                  Study Recommendations
                </h2>
                <p className="text-yellow-800 mb-4">
                  Based on your performance, here are some recommendations to help you improve:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getStudyRecommendations(failedSection).map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <ArrowRight className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-yellow-800">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Summary */}
        {!isTestFailed && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Stats */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Overall Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Sections:</span>
                    <span className="font-medium">{results.sections?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Sections Passed:</span>
                    <span className="font-medium text-green-600">{passedSections.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Average Accuracy:</span>
                    <span className={`font-medium ${getPerformanceColor(totalAccuracy)}`}>
                      {Math.round(totalAccuracy)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">XP Earned:</span>
                    <span className="font-medium text-purple-600">{results.xpEarned || 0} XP</span>
                  </div>
                </div>
              </div>

              {/* Achievement Badge */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Achievement</h3>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 text-white text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-2" />
                  <h4 className="text-lg font-semibold">Sectional Test Master!</h4>
                  <p className="text-sm opacity-90">
                    Completed all sections successfully
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Review - Only show for completed sections */}
        {results.questions && results.questions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Question Review</h2>
              <p className="text-sm text-gray-600 mt-1">
                Review of all questions from completed sections
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {results.questions.map((question, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {question.correct ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
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
                        </div>

                        <p className="text-gray-900 mb-3">{question.question_text}</p>

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
                      </div>
                    </div>
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

export default SectionalTestResults;