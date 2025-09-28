import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  Target,
  CheckCircle,
  X,
  AlertTriangle,
  Maximize,
  Minimize,
  Send,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Award
} from 'lucide-react';
import { API_URLS } from '../../config/api';

const TakeSectionalTest = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [fullscreenAttempts, setFullscreenAttempts] = useState(0);
  const [warningCountdown, setWarningCountdown] = useState(0);
  const maxFullscreenAttempts = 3;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  // Sectional test specific state
  const [currentSection, setCurrentSection] = useState(0);
  const [sectionResults, setSectionResults] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);

  const timerRef = useRef(null);
  const fullscreenRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  const sections = useMemo(() => [
    { id: 'very-easy', name: 'Very Easy', questions: 10, passingRate: 40 },
    { id: 'easy', name: 'Easy', questions: 10, passingRate: 40 },
    { id: 'moderate', name: 'Moderate', questions: 10, passingRate: 40 },
    { id: 'difficult', name: 'Difficult', questions: 10, passingRate: 40 }
  ], []);

  // Fullscreen handling
  const enterFullscreen = useCallback(async () => {
    try {
      if (fullscreenRef.current) {
        await fullscreenRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(currentlyFullscreen);

      if (!currentlyFullscreen && fullscreenAttempts < maxFullscreenAttempts) {
        setFullscreenAttempts(prev => prev + 1);
        setShowWarning(true);
        setWarningCountdown(10);

        const countdownInterval = setInterval(() => {
          setWarningCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setShowWarning(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        warningTimeoutRef.current = countdownInterval;
      } else if (!currentlyFullscreen && fullscreenAttempts >= maxFullscreenAttempts) {
        handleEndSessionDueToFullscreenViolation();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (warningTimeoutRef.current) {
        clearInterval(warningTimeoutRef.current);
      }
    };
  }, [fullscreenAttempts, handleEndSessionDueToFullscreenViolation]);

  // Force fullscreen on initial load
  useEffect(() => {
    if (!loading && !error && currentQuestion && !isFullscreen && fullscreenAttempts === 0) {
      setTimeout(() => {
        enterFullscreen();
      }, 500);
    }
  }, [loading, error, currentQuestion, isFullscreen, fullscreenAttempts, enterFullscreen]);

  // Initialize sectional test
  useEffect(() => {
    const initializeTest = async () => {
      try {
        const stateSelectedSections = location.state?.selectedSections || ['very-easy', 'easy', 'moderate', 'difficult'];
        setSelectedSections(stateSelectedSections);

        // Start first section
        await startSection(0, stateSelectedSections);
      } catch (error) {
        console.error('Error initializing test:', error);
        setError('Failed to initialize test');
      }
    };

    if (!sessionId) {
      initializeTest();
    } else {
      loadQuestion();
    }
  }, [location.state, loadQuestion, sessionId, startSection]);

  const startSection = useCallback(async (sectionIndex, sectionsList) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const currentSectionId = sectionsList[sectionIndex];
      const difficulty = sections.find(s => s.id === currentSectionId).name;

      const response = await fetch(`${API_URLS.PRACTICE}/sectional/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sectionId: currentSectionId,
          difficulty: difficulty,
          sectionIndex: sectionIndex
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSection(sectionIndex);
        setCurrentQuestion(data.question);
        setTimeRemaining(data.timeRemaining);
        setQuestionNumber(1);
        setSelectedAnswer('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start section');
      }
    } catch (error) {
      console.error('Error starting section:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [sections]);

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.PRACTICE}/sectional/${sessionId}/next`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userAnswer: null, timeTaken: 0 })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.completed) {
          setSessionEnded(true);
          navigate(`/practice-exam/sectional/results/${sessionId}`);
          return;
        }

        setCurrentQuestion(data.question);
        setTimeRemaining(data.timeRemaining);
        setQuestionNumber(data.questionNumber || 1);
        setSelectedAnswer('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load question');
      }
    } catch (error) {
      console.error('Error loading question:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedAnswer) {
      alert('Please select an answer before proceeding');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.PRACTICE}/sectional/${sessionId}/next`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAnswer: selectedAnswer,
          timeTaken: 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.sectionCompleted) {
          // Handle section completion
          const accuracy = (data.sectionCorrect / data.sectionTotal) * 100;
          const passed = accuracy >= 40;

          setSectionResults(prev => [...prev, {
            sectionId: selectedSections[currentSection],
            correct: data.sectionCorrect,
            total: data.sectionTotal,
            accuracy: accuracy,
            passed: passed
          }]);

          if (!passed) {
            // Failed section - end test
            setSessionEnded(true);
            navigate(`/practice-exam/sectional/results/${sessionId}`, {
              state: {
                failedSection: selectedSections[currentSection],
                sectionResults: [...sectionResults, {
                  sectionId: selectedSections[currentSection],
                  correct: data.sectionCorrect,
                  total: data.sectionTotal,
                  accuracy: accuracy,
                  passed: false
                }]
              }
            });
            return;
          } else if (currentSection < selectedSections.length - 1) {
            // Passed section and more sections available
            await startSection(currentSection + 1, selectedSections);
            return;
          } else {
            // All sections completed successfully
            setSessionEnded(true);
            navigate(`/practice-exam/sectional/results/${sessionId}`);
            return;
          }
        }

        setCurrentQuestion(data.question);
        setTimeRemaining(data.timeRemaining);
        setQuestionNumber(data.questionNumber || questionNumber + 1);
        setSelectedAnswer('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedAnswer, sessionId, navigate, questionNumber, currentSection, selectedSections, sectionResults, startSection]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !sessionEnded) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitAnswer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, sessionEnded, handleSubmitAnswer]);

  const handleEndSessionDueToFullscreenViolation = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URLS.PRACTICE}/sectional/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'fullscreen_violation',
          attempts: fullscreenAttempts
        })
      });

      alert(`Sectional test ended due to fullscreen violation. You exceeded the maximum allowed attempts (${maxFullscreenAttempts}) to exit fullscreen mode.`);
      navigate('/practice-exams');
    } catch (error) {
      console.error('Error ending session due to fullscreen violation:', error);
      navigate('/practice-exams');
    }
  }, [sessionId, fullscreenAttempts, navigate]);

  const handleEndSession = async () => {
    if (confirm('Are you sure you want to end this sectional test?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URLS.PRACTICE}/sectional/${sessionId}/end`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        navigate('/practice-exams');
      } catch (error) {
        console.error('Error ending session:', error);
      }
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

  const getCurrentSectionInfo = () => {
    if (selectedSections.length === 0) return null;
    const currentSectionId = selectedSections[currentSection];
    return sections.find(s => s.id === currentSectionId);
  };

  const getSectionIcon = (sectionId) => {
    switch (sectionId) {
      case 'very-easy': return BookOpen;
      case 'easy': return Target;
      case 'moderate': return TrendingUp;
      case 'difficult': return AlertCircle;
      default: return BookOpen;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-white text-xl mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/practice-exams')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Practice Exams
          </button>
        </div>
      </div>
    );
  }

  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-white text-xl mb-2">Test Completed!</h2>
          <p className="text-gray-400 mb-4">Redirecting to results...</p>
        </div>
      </div>
    );
  }

  const currentSectionInfo = getCurrentSectionInfo();
  const SectionIcon = currentSectionInfo ? getSectionIcon(currentSectionInfo.id) : BookOpen;

  return (
    <div ref={fullscreenRef} className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <SectionIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Sectional Test</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Section {currentSection + 1} of {selectedSections.length}</span>
                <span>•</span>
                <span>{currentSectionInfo?.name}</span>
                <span>•</span>
                <span>Question {questionNumber} of {currentSectionInfo?.questions}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-400' : 'text-green-400'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {/* End Session */}
            <button
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              End Test
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center space-x-4">
          {selectedSections.map((sectionId, index) => {
            const section = sections.find(s => s.id === sectionId);
            const isCompleted = index < currentSection;
            const isCurrent = index === currentSection;
            const IconComponent = getSectionIcon(sectionId);

            return (
              <div key={sectionId} className="flex items-center space-x-2">
                <div className={`p-1 rounded ${
                  isCompleted ? 'bg-green-600' :
                  isCurrent ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className={`text-sm ${
                  isCompleted ? 'text-green-400' :
                  isCurrent ? 'text-blue-400' : 'text-gray-500'
                }`}>
                  {section.name}
                </span>
                {index < selectedSections.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-600"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md mx-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
              <span className="font-bold text-lg">Fullscreen Required!</span>
            </div>
            <p className="mb-4">
              You exited fullscreen mode. Sectional tests must be taken in fullscreen to maintain exam integrity.
            </p>
            <div className="mb-4">
              <div className="bg-red-200 rounded p-3">
                <p className="text-sm font-semibold">
                  Attempt {fullscreenAttempts} of {maxFullscreenAttempts}
                </p>
                <p className="text-xs mt-1">
                  {maxFullscreenAttempts - fullscreenAttempts} attempts remaining before test ends.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={enterFullscreen}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <Maximize className="w-4 h-4" />
                <span>Return to Fullscreen</span>
              </button>
              <button
                onClick={() => {
                  setShowWarning(false);
                  setWarningCountdown(0);
                  if (warningTimeoutRef.current) {
                    clearInterval(warningTimeoutRef.current);
                  }
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Dismiss ({warningCountdown}s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Question */}
          <div className="bg-gray-800 rounded-lg p-8 mb-8">
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                  {currentQuestion?.difficulty}
                </span>
                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
                  {currentQuestion?.tags}
                </span>
              </div>
              <h2 className="text-2xl font-semibold leading-relaxed">
                {currentQuestion?.question_text}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-4">
              {['a', 'b', 'c', 'd'].map((option) => (
                <label
                  key={option}
                  className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAnswer === option
                      ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-blue-400 mr-3">
                      {option.toUpperCase()}.
                    </span>
                    <span className="text-gray-200">
                      {currentQuestion?.[`option_${option}`]}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <div className="text-gray-400">
              Question {questionNumber} of {currentSectionInfo?.questions}
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer || loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Next Question</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeSectionalTest;