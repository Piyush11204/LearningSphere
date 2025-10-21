import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Brain,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  XCircle,
  Zap,
  AlertCircle,
  LogOut,
  Maximize
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const ExamInterface = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sessionData, setSessionData] = useState(location.state || null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [examStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const [progress, setProgress] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    currentAccuracy: 0
  });
  const [error, setError] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const duration = sessionData?.duration || 20; // Duration in minutes
  const totalSeconds = duration * 60;

  // Auto-end exam when time expires
  const autoEndExam = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/end/${sessionData.sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          saveResults: true,
          timeExpired: true
        })
      });

      const data = await response.json();

      if (data.success && data.results) {
        navigate('/adaptive-exam/results', {
          state: {
            sessionId: sessionData.sessionId,
            results: data.results,
            timeExpired: true
          }
        });
      } else {
        navigate('/adaptive-exam');
      }
    } catch (error) {
      console.error('Error auto-ending exam:', error);
      navigate('/adaptive-exam');
    }
  }, [sessionData.sessionId, navigate]);

  // Timer effect with auto-end
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
      setElapsedTime(elapsed);

      // Check if time expired and auto-end exam
      if (elapsed >= totalSeconds && !timeExpired) {
        setTimeExpired(true);
        // Clear interval to stop timer
        clearInterval(timer);
        
        // Auto-end the exam
        autoEndExam();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [examStartTime, totalSeconds, timeExpired, autoEndExam]);

  // Fullscreen effect
  useEffect(() => {
    // Request fullscreen on mount
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error entering fullscreen:', err);
      }
    };

    enterFullscreen();

    // Handle fullscreen change
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);

      // If user exits fullscreen, show warning
      if (!isCurrentlyFullscreen) {
        alert('Please stay in fullscreen mode during the exam. Click the maximize button to re-enter fullscreen.');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Exit fullscreen on unmount
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.log(err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionData) {
      navigate('/adaptive-exam');
      return;
    }
    
    setCurrentQuestion(sessionData.question);
    setQuestionStartTime(Date.now());
  }, [sessionData, navigate]);

  // Prevent accidental navigation away from exam
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only show warning if exam is still active and time hasn't expired
      if (!timeExpired && currentQuestion) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave the exam? Your progress will be saved but you cannot resume the session.';
        
        // Attempt to save progress before user leaves
        try {
          navigator.sendBeacon(`${API_BASE_URL}/api/adaptive-exam/end/${sessionData.sessionId}`, 
            JSON.stringify({
              saveResults: true,
              abandonedViaClose: true
            })
          );
        } catch (error) {
          console.error('Failed to send beacon for session cleanup:', error);
        }
        
        return e.returnValue;
      }
    };

    const handlePopstate = () => {
      // Only prevent navigation if exam is still active
      if (!timeExpired && currentQuestion) {
        const confirmExit = window.confirm(
          'Are you sure you want to leave the exam? Your progress will be saved but you cannot resume the session.'
        );
        
        if (!confirmExit) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.pathname);
          return;
        }
        
        // If user confirms, end the exam and clean up
        autoEndExam();
      }
    };

    const handleVisibilityChange = () => {
      // Warn user if they switch tabs or minimize browser
      if (document.hidden && !timeExpired && currentQuestion) {
        console.warn('User left exam tab - visibility changed');
        // Could implement additional security measures here
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopstate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Push initial state to handle back button
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopstate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoEndExam, timeExpired, currentQuestion, sessionData.sessionId]);

  const handleAnswerSelect = (answer) => {
    if (!showFeedback && !timeExpired) {
      setSelectedAnswer(answer);
    }
  };



  const handleExitExam = async () => {
    const confirmExit = window.confirm(
      'Are you sure you want to exit the exam?\n\n' +
      'Your progress will be saved and you can view your results.'
    );
    
    if (!confirmExit) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/end/${sessionData.sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          saveResults: true
        })
      });

      const data = await response.json();

      if (data.success && data.results) {
        navigate('/adaptive-exam/results', {
          state: {
            sessionId: data.results.sessionId,
            results: data.results
          }
        });
      } else {
        navigate('/adaptive-exam');
      }
    } catch (error) {
      console.error('Error exiting exam:', error);
      navigate('/adaptive-exam');
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    return Math.max(0, totalSeconds - elapsedTime);
  };

  const getTimerColor = () => {
    const remaining = getRemainingTime();
    const percentage = (remaining / totalSeconds) * 100;
    
    if (percentage <= 10) return 'from-red-500 to-red-600';
    if (percentage <= 25) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-orange-500';
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null) {
      setError('Please select an answer');
      return;
    }

    if (timeExpired) {
      setError('Exam time has expired. Redirecting to results...');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const timeSpent = (Date.now() - questionStartTime) / 1000; // Convert to seconds

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/adaptive-exam/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          questionId: currentQuestion.id,
          answer: selectedAnswer,
          timeSpent,
          questionText: currentQuestion.question,
          questionOptions: currentQuestion.options,
          difficulty: currentQuestion.difficulty,
          difficultyNumeric: currentQuestion.difficultyNumeric
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show feedback
        setFeedbackData({
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          userAbility: data.userAbility
        });
        setShowFeedback(true);

        // Update progress
        if (data.progress) {
          setProgress(data.progress);
        }

        // Check if exam is complete
        if (data.quizComplete) {
          // Wait a moment to show feedback, then navigate to results
          setTimeout(() => {
            navigate('/adaptive-exam/results', {
              state: {
                sessionId: sessionData.sessionId,
                results: data.results
              }
            });
          }, 2000);
        } else {
          // Prepare for next question
          setTimeout(() => {
            setCurrentQuestion(data.nextQuestion);
            setSelectedAnswer(null);
            setShowFeedback(false);
            setFeedbackData(null);
            setQuestionStartTime(Date.now());
            setSessionData(prev => ({
              ...prev,
              question: data.nextQuestion,
              userAbility: data.userAbility
            }));
          }, 2000);
        }
      } else {
        setError(data.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Very Easy': 'text-green-600 bg-green-100',
      'Easy': 'text-blue-600 bg-blue-100',
      'Moderate': 'text-yellow-600 bg-yellow-100',
      'Difficult': 'text-red-600 bg-red-100'
    };
    return colors[difficulty] || 'text-gray-600 bg-gray-100';
  };

  const getAbilityLevel = (ability) => {
    if (ability < 0.5) return { label: 'Beginner', color: 'text-green-600' };
    if (ability < 1.0) return { label: 'Intermediate', color: 'text-blue-600' };
    if (ability < 1.5) return { label: 'Advanced', color: 'text-purple-600' };
    if (ability < 2.0) return { label: 'Expert', color: 'text-orange-600' };
    return { label: 'Master', color: 'text-red-600' };
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  const abilityInfo = getAbilityLevel(sessionData.userAbility);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Top Bar with Timer and Exit Button */}
        <div className={`bg-gradient-to-r ${getTimerColor()} text-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between`}>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-6 h-6" />
              <div>
                <p className="text-xs opacity-90">Time Remaining</p>
                <p className="text-xl font-bold">{formatTime(getRemainingTime())}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 border-l border-white/30 pl-6">
              <Clock className="w-5 h-5 opacity-75" />
              <div>
                <p className="text-xs opacity-90">Elapsed</p>
                <p className="text-lg font-semibold">{formatTime(elapsedTime)}</p>
              </div>
            </div>
            {!isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                <Maximize className="w-4 h-4" />
                <span className="text-sm font-medium">Enter Fullscreen</span>
              </button>
            )}
          </div>
          <button
            onClick={handleExitExam}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Exit Exam</span>
          </button>
        </div>

        {/* Header Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Exam #{sessionData.examNumber}</p>
              <p className="text-2xl font-bold text-gray-900">Question {progress.questionsAnswered + 1}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-green-600">{progress.currentAccuracy.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Ability Level</p>
              <p className={`text-2xl font-bold ${abilityInfo.color}`}>{sessionData.userAbility.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{abilityInfo.label}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Correct Answers</p>
              <p className="text-2xl font-bold text-blue-600">{progress.correctAnswers}/{progress.questionsAnswered}</p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
          {/* Difficulty Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${getDifficultyColor(currentQuestion.difficulty)}`}>
              <Zap className="w-4 h-4 mr-2" />
              {currentQuestion.difficulty}
            </div>
            <div className="flex items-center text-gray-500">
              <Brain className="w-5 h-5 mr-2" />
              <span className="text-sm">Adaptive Question</span>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            {Object.entries(currentQuestion.options).map(([key, value], index) => {
              const isSelected = selectedAnswer === key || selectedAnswer === index;
              const isCorrect = showFeedback && (feedbackData.correctAnswer === key || feedbackData.correctAnswer === index);
              const isWrong = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={key}
                  onClick={() => handleAnswerSelect(key)}
                  disabled={showFeedback || loading || timeExpired}
                  className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-200 ${
                    timeExpired
                      ? 'border-gray-300 bg-gray-100 opacity-50'
                      : isCorrect
                      ? 'border-green-500 bg-green-50'
                      : isWrong
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  } ${showFeedback || loading || timeExpired ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isCorrect
                          ? 'bg-green-500 text-white'
                          : isWrong
                          ? 'bg-red-500 text-white'
                          : isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {key.toUpperCase()}
                      </div>
                      <span className={`text-lg ${
                        isCorrect || isWrong ? 'font-semibold' : ''
                      }`}>
                        {value}
                      </span>
                    </div>
                    {showFeedback && (
                      <div>
                        {isCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
                        {isWrong && <XCircle className="w-6 h-6 text-red-500" />}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback Message */}
          {showFeedback && (
            <div className={`mt-6 p-4 rounded-lg ${
              feedbackData.isCorrect 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="flex items-center">
                {feedbackData.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mr-3" />
                )}
                <div>
                  <p className={`font-bold ${feedbackData.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {feedbackData.isCorrect ? 'Correct!' : 'Incorrect'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Your ability: {feedbackData.userAbility.toFixed(2)} 
                    {feedbackData.isCorrect ? ' ↑' : ' ↓'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Time Expired Message */}
          {timeExpired && (
            <div className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-center justify-center">
                <Clock className="w-8 h-8 text-red-600 mr-3" />
                <div className="text-center">
                  <p className="text-xl font-bold text-red-800 mb-2">Time Expired!</p>
                  <p className="text-red-700">Your exam session has ended. Redirecting to results...</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!showFeedback && !timeExpired && (
            <div className="mt-8">
              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null || loading || timeExpired}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Exam Progress</span>
            <span className="text-sm font-medium text-blue-600">
              {progress.correctAnswers} correct out of {progress.questionsAnswered} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(progress.questionsAnswered / 20) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Adaptive difficulty adjusts based on your performance
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
