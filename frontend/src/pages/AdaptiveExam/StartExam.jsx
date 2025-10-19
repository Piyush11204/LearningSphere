import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock, 
  Award,
  ChevronRight,
  Zap,
  BarChart3,
  Star,
  AlertCircle,
  History
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const StartAdaptiveExam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [abandonLoading, setAbandonLoading] = useState(false);
  const [duration, setDuration] = useState(20); // Default 20 minutes
  const [showDurationModal, setShowDurationModal] = useState(false);

  useEffect(() => {
    fetchUserStats();
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/active-session`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.activeSession) {
          setActiveSession(data.activeSession);
        }
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const resumeActiveSession = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/resume/${activeSession.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to exam interface with resumed session data
        navigate('/adaptive-exam/exam', {
          state: {
            sessionId: data.sessionId,
            examNumber: data.examNumber,
            question: data.question,
            userAbility: data.userAbility,
            previousAbility: data.previousAbility
          }
        });
      } else {
        setError(data.error || 'Failed to resume exam');
      }
    } catch (error) {
      console.error('Error resuming exam:', error);
      setError('Failed to resume exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const abandonActiveSession = async () => {
    if (!window.confirm('Are you sure you want to abandon this exam? Your progress will be lost.')) {
      return;
    }

    try {
      setAbandonLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/abandon/${activeSession.sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setActiveSession(null);
        setError('');
      } else {
        setError(data.error || 'Failed to abandon exam');
      }
    } catch (error) {
      console.error('Error abandoning exam:', error);
      setError('Failed to abandon exam. Please try again.');
    } finally {
      setAbandonLoading(false);
    }
  };

  const handleStartExamClick = () => {
    setShowDurationModal(true);
  };

  const startExam = async (selectedDuration) => {
    try {
      setLoading(true);
      setError('');
      setShowDurationModal(false);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          duration: selectedDuration || duration
        })
      });

      const data = await response.json();

      if (data.success) {
        // Request fullscreen before navigating
        try {
          const elem = document.documentElement;
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
            await elem.webkitRequestFullscreen();
          } else if (elem.msRequestFullscreen) {
            await elem.msRequestFullscreen();
          }
        } catch (err) {
          console.warn('Fullscreen request failed:', err);
        }

        // Navigate to exam interface with session data
        navigate('/adaptive-exam/exam', {
          state: {
            sessionId: data.sessionId,
            examNumber: data.examNumber,
            duration: data.duration,
            question: data.question,
            userAbility: data.userAbility,
            previousAbility: data.previousAbility
          }
        });
      } else {
        setError(data.error || 'Failed to start exam');
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      setError('Failed to start exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Adaptive Learning Exam
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience intelligent testing that adapts to your skill level in real-time. 
            Challenge yourself and track your growth!
          </p>
        </div>

        {/* View History Button */}
        {stats && stats.totalExams > 0 && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={() => navigate('/adaptive-exam/history')}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition duration-200 flex items-center space-x-2 shadow-lg font-semibold"
            >
              <History className="w-5 h-5" />
              <span>View Exam History</span>
            </button>
          </div>
        )}

        {/* Stats Overview */}
        {stats && stats.totalExams > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Exams</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalExams}</p>
                </div>
                <Trophy className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg. Accuracy</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageAccuracy.toFixed(1)}%</p>
                </div>
                <Target className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Current Ability</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageAbility.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total XP</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalXP}</p>
                </div>
                <Star className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Features */}
          <div className="lg:col-span-2 space-y-6">
            {/* How It Works */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-500" />
                How Adaptive Testing Works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    1
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Start at Your Level</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {stats && stats.totalExams > 0 
                        ? `Resume from your last ability level (${stats.averageAbility.toFixed(2)})`
                        : 'Begin with moderate difficulty questions to assess your baseline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                    2
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Adaptive Difficulty</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Questions get harder when you answer correctly and easier when you struggle
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                    3
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Precise Assessment</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Our AI algorithm precisely measures your ability level in real-time
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold">
                    4
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900">Earn Rewards</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Gain XP, unlock badges, and track your progress over time
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Exams */}
            {stats && stats.recentExams && stats.recentExams.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-purple-500" />
                  Recent Performance
                </h2>
                <div className="space-y-3">
                  {stats.recentExams.map((exam, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-bold text-gray-400">
                          #{exam.examNumber}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Ability: {exam.finalAbility.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {exam.accuracy.toFixed(1)}% accuracy • {exam.xpEarned} XP
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(exam.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Start Exam */}
          <div className="space-y-6">
            {/* Active Session Warning */}
            {activeSession && (
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-2xl p-8 text-white">
                <div className="flex items-center mb-4">
                  <AlertCircle className="w-8 h-8 mr-3" />
                  <h2 className="text-2xl font-bold">Active Exam Found</h2>
                </div>
                <p className="text-orange-100 mb-6">
                  You have an active exam session in progress. You can resume it or abandon it to start a new one.
                </p>

                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-orange-100">Exam #{activeSession.examNumber}</span>
                    <span className="text-sm text-orange-100">Session ID: {activeSession.sessionId?.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-orange-100">Questions Answered:</span>
                    <span className="font-bold">{activeSession.totalQuestions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-orange-100">Current Accuracy:</span>
                    <span className="font-bold">{(activeSession.accuracy || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-orange-100">Current Ability:</span>
                    <span className="font-bold">{(activeSession.currentAbility || 0.5).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={resumeActiveSession}
                    disabled={loading}
                    className="w-full bg-white text-orange-600 font-bold py-4 px-6 rounded-lg hover:bg-orange-50 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                        <span>Resuming...</span>
                      </>
                    ) : (
                      <>
                        <span>Resume Exam</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={abandonActiveSession}
                    disabled={abandonLoading}
                    className="w-full bg-white/10 text-white font-bold py-3 px-6 rounded-lg hover:bg-white/20 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/30"
                  >
                    {abandonLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Abandoning...</span>
                      </>
                    ) : (
                      <span>Abandon & Start New</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Start New Exam Card */}
            {!activeSession && (
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Ready to Begin?</h2>
                <p className="text-blue-100 mb-6">
                  Test your knowledge with our adaptive exam system. Your progress will be saved automatically.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5" />
                    <span>~20 questions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5" />
                    <span>Adapts to your skill</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5" />
                    <span>Earn XP & badges</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500 bg-opacity-20 border border-red-300 rounded-lg p-3 mb-4">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleStartExamClick}
                  disabled={loading}
                  className="w-full bg-white text-blue-600 font-bold py-4 px-6 rounded-lg hover:bg-blue-50 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>Starting Exam...</span>
                    </>
                  ) : (
                    <>
                      <span>Start Adaptive Exam</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Duration Selection Modal */}
            {showDurationModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Select Exam Duration</h3>
                  <p className="text-gray-600 mb-6">
                    How long would you like your exam session to be?
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[10, 15, 20, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setDuration(mins)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          duration === mins
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300 text-gray-700'
                        }`}
                      >
                        <div className="text-3xl font-bold">{mins}</div>
                        <div className="text-sm">minutes</div>
                      </button>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> The exam will automatically end when time expires, 
                      and your results will be saved.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDurationModal(false)}
                      className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => startExam(duration)}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-200 disabled:opacity-50"
                    >
                      Start Exam
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Badges Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-500" />
                Upcoming Badges
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">🎯 First Attempt</span>
                  <span className="text-gray-400">1 exam</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">📚 Persistent Learner</span>
                  <span className="text-gray-400">5 exams</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">🌟 Dedicated Student</span>
                  <span className="text-gray-400">10 exams</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">🏆 Master Learner</span>
                  <span className="text-gray-400">25 exams</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartAdaptiveExam;
