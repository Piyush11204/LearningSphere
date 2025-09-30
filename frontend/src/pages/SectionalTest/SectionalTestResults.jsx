import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock, TrendingUp, Award, ArrowLeft, Share2, AlertCircle } from 'lucide-react';
import { API_URLS } from '../../config/api';

const SectionalTestResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getSectionName = useCallback((sectionId) => {
    const sectionNames = {
      'veryEasy': 'Very Easy',
      'easy': 'Easy',
      'moderate': 'Moderate',
      'difficult': 'Difficult'
    };
    return sectionNames[sectionId] || sectionId;
  }, []);

  const generateRecommendations = useCallback((sections) => {
    const recommendations = [];
    const validSections = sections || [];
    const passedSections = validSections.filter(s => s && s.passed);
    const failedSections = validSections.filter(s => s && !s.passed);

    if (failedSections.length > 0) {
      recommendations.push(`Focus more on ${failedSections.map(s => getSectionName(s.sectionId)).join(', ')} concepts`);
    }

    if (passedSections.length > 0) {
      recommendations.push(`Excellent performance in ${passedSections.map(s => getSectionName(s.sectionId)).join(', ')}!`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Keep practicing to maintain your performance.');
    }

    return recommendations;
  }, [getSectionName]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_URLS.PRACTICE}/sectional/results/${sessionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();

          // Transform the data to match the expected format
          const transformedResults = {
            sessionId: data.sessionId,
            totalScore: (data.sections || []).length > 0 ?
              Math.round(((data.sections.reduce((total, section) => total + (section?.correct || 0), 0) || 0) / 
                         (data.sections.reduce((total, section) => total + (section?.total || 0), 0) || 1)) * 100) : 0,
            totalQuestions: (data.sections || []).reduce((total, section) => total + (section?.total || 0), 0),
            correctAnswers: (data.sections || []).reduce((total, section) => total + (section?.correct || 0), 0),
            timeTaken: (data.duration || 0) * 60, // Convert minutes to seconds
            sections: (data.sections || []).map(section => ({
              name: getSectionName(section.sectionId),
              score: (section.total || 0) > 0 ? Math.round(((section.correct || 0) / (section.total || 0)) * 100) : 0,
              questions: section.total || 0,
              correct: section.correct || 0,
              timeSpent: data.duration * 60 / (data.sections?.length || 1), // Distribute time equally
              difficulty: section.difficulty || 'Easy'
            })),
            xpEarned: data.xpEarned || 0,
            badgesEarned: (data.newBadges || []).map(badge => badge.name),
            recommendations: generateRecommendations(data.sections),
            percentile: 78, // This would need to be calculated based on user performance
            rank: 1250 // This would need to be calculated based on user performance
          };

          setResults(transformedResults);
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          setError(errorData.message || `Failed to load results (${response.status})`);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        setError('Failed to load test results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchResults();
    }
  }, [sessionId, navigate, getSectionName, generateRecommendations]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 80) return 'bg-blue-50 border-blue-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-gray-600 max-w-md mx-auto p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-4">Error Loading Results</h2>
          <p className="mb-8">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors block w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/sectional-tests')}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Back to Sectional Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/sectional-tests')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Tests</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sectional Test Results</h1>
                <p className="text-sm text-gray-600">Session ID: {sessionId}</p>
              </div>
            </div>
            <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Overall Score Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">{results.totalScore}%</h2>
            <p className="text-lg text-gray-600">Overall Score</p>
            <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>{results.correctAnswers}/{results.totalQuestions} Correct</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{formatTime(results.timeTaken)} Time Taken</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">+{results.xpEarned} XP</div>
              <p className="text-sm text-gray-600">Experience Points</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{results.percentile}th</div>
              <p className="text-sm text-gray-600">Percentile Rank</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">#{results.rank}</div>
              <p className="text-sm text-gray-600">Global Rank</p>
            </div>
          </div>
        </div>

        {/* Badges Earned */}
        {results.badgesEarned.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Award className="w-6 h-6 mr-3 text-yellow-500" />
              Badges Earned
            </h3>
            <div className="flex flex-wrap gap-4">
              {results.badgesEarned.map((badge, index) => (
                <div key={index} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-semibold shadow-md">
                  {badge}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section-wise Performance */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-blue-500" />
            Section-wise Performance
          </h3>
          <div className="space-y-4">
            {results.sections.map((section, index) => (
              <div key={index} className={`border-2 rounded-xl p-6 ${getScoreBgColor(section.score)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{section.name}</h4>
                    <p className="text-sm text-gray-600">{section.difficulty} Level</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(section.score)}`}>
                      {section.score}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {section.correct}/{section.questions} Correct
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Time Spent: {formatTime(section.timeSpent)}</span>
                  <span>Avg. {Math.round(section.timeSpent / section.questions)}s per question</span>
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getScoreColor(section.score).replace('text-', 'bg-')}`}
                    style={{ width: `${section.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recommendations</h3>
          <div className="space-y-3">
            {results.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/sectional-tests')}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Take Another Test
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionalTestResults;