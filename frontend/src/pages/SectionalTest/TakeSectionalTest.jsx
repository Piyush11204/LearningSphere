import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Maximize,
  Minimize,
  AlertTriangle
} from 'lucide-react';
import { API_URLS } from '../../config/api';

const TakeSectionalTest = () => {
  const [selectedSections, setSelectedSections] = useState({});
  const [sections, setSections] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [fullscreenAttempts, setFullscreenAttempts] = useState(0);
  const [warningCountdown, setWarningCountdown] = useState(0);
  
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fullscreenRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const maxFullscreenAttempts = 3;

  // Fullscreen enforcement functions
  const enterFullscreen = useCallback(async () => {
    try {
      if (fullscreenRef.current) {
        if (fullscreenRef.current.requestFullscreen) {
          await fullscreenRef.current.requestFullscreen();
        } else if (fullscreenRef.current.webkitRequestFullscreen) {
          await fullscreenRef.current.webkitRequestFullscreen();
        } else if (fullscreenRef.current.msRequestFullscreen) {
          await fullscreenRef.current.msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  const checkFullscreen = useCallback(() => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
    setIsFullscreen(isCurrentlyFullscreen);
    return isCurrentlyFullscreen;
  }, []);

  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = checkFullscreen();
    
    if (!isCurrentlyFullscreen && !sessionEnded) {
      setFullscreenAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= maxFullscreenAttempts) {
          // End session if too many fullscreen exits
          setSessionEnded(true);
          setError('Session ended due to multiple fullscreen exits. Please restart the test.');
          return newAttempts;
        } else {
          // Show warning and force fullscreen
          setShowWarning(true);
          setWarningCountdown(10);
          
          if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
          }
          
          warningTimeoutRef.current = setTimeout(() => {
            setShowWarning(false);
            enterFullscreen();
          }, 10000);
          
          return newAttempts;
        }
      });
    } else if (isCurrentlyFullscreen) {
      setFullscreenAttempts(0);
      setShowWarning(false);
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    }
  }, [checkFullscreen, sessionEnded, maxFullscreenAttempts, enterFullscreen]);

  // Initialize fullscreen when questions are loaded (not on component mount)
  useEffect(() => {
    // Remove automatic fullscreen initialization - only manual toggle allowed
    // Add fullscreen change listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Check fullscreen status periodically
    const fullscreenCheckInterval = setInterval(() => {
      checkFullscreen();
    }, 1000);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      clearInterval(fullscreenCheckInterval);
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [handleFullscreenChange, checkFullscreen]);

  // Warning countdown effect
  useEffect(() => {
    if (showWarning && warningCountdown > 0) {
      const countdownInterval = setInterval(() => {
        setWarningCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [showWarning, warningCountdown]);

  const getCurrentSectionInfo = useCallback(() => {
    if (!sections || sections.length === 0) {
      return { title: 'Loading...', difficulty: 'Unknown' };
    }
    return sections[currentSection] || { title: 'Unknown Section', difficulty: 'Unknown' };
  }, [sections, currentSection]);

  const getCurrentSectionName = useCallback(() => {
    if (!selectedSections) {
      return 'Loading...';
    }
    const selectedSectionKeys = Object.keys(selectedSections).filter(key => selectedSections[key]);
    const currentKey = selectedSectionKeys[currentSection];
    const sectionNames = {
      veryEasy: 'Very Easy',
      easy: 'Easy',
      moderate: 'Moderate',
      difficult: 'Difficult'
    };
    return sectionNames[currentKey] || 'Current Section';
  }, [selectedSections, currentSection]);

  const loadQuestion = useCallback(async () => {
    try {
      setIsLoading(true);
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
          navigate(`/sectional-test/results/${sessionId}`);
          return;
        }

        setCurrentQuestion(data.question || null);
        setTimeRemaining(data.timeRemaining || 0);
        setQuestionNumber(data.questionNumber || 1);
        if (data.totalQuestions) {
          setTotalQuestions(data.totalQuestions);
        }
        setSelectedAnswer('');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        setError(errorData.message || `Failed to load question (${response.status})`);
      }
    } catch (error) {
      console.error('Error loading question:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, navigate]);

  const handleTimeUp = useCallback(async () => {
    // Auto-submit current answer or empty answer if time is up
    const answerToSubmit = selectedAnswer || '';
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.PRACTICE}/sectional/${sessionId}/next`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAnswer: answerToSubmit,
          timeTaken: 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.sectionCompleted) {
          const sectionInfo = getCurrentSectionInfo();
          const sectionData = {
            sectionInfo: {
              title: sectionInfo.title || getCurrentSectionName(),
              difficulty: sectionInfo.difficulty || 'Unknown'
            },
            score: Math.round((data.sectionCorrect / data.sectionTotal) * 100),
            correct: data.sectionCorrect,
            total: data.sectionTotal,
            passed: data.passed,
            hasNextSection: data.hasNextSection || false,
            nextSectionIndex: data.nextSectionIndex
          };

          if (data.testCompleted) {
            navigate(`/sectional-test/results/${sessionId}`, {
              state: {
                selectedSections,
                sections
              }
            });
          } else {
            navigate(`/sectional-test/section-summary/${sessionId}`, {
              state: {
                sectionData,
                selectedSections,
                sections,
                currentSectionIndex: currentSection
              }
            });
          }
          return;
        } else if (data.testCompleted) {
          navigate(`/sectional-test/results/${sessionId}`, {
            state: {
              selectedSections,
              sections
            }
          });
        } else {
          setCurrentQuestion(data.question || null);
          setTimeRemaining(data.timeRemaining || 0);
          setQuestionNumber(data.questionNumber || 1);
          setSelectedAnswer('');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        setError(errorData.message || `Failed to submit answer (${response.status})`);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAnswer, sessionId, navigate, selectedSections, sections, currentSection, getCurrentSectionInfo, getCurrentSectionName]);

  useEffect(() => {
    const state = location.state;
    if (state) {
      setSelectedSections(state.selectedSections || {});
      setSections(state.sections || []);
      setCurrentSection(state.currentSectionIndex || 0);

      if (state.sessionData) {
        setCurrentQuestion(state.sessionData.question || null);
        setTimeRemaining(state.sessionData.timeRemaining || 0);
        setQuestionNumber(state.sessionData.questionNumber || 1);
        setTotalQuestions(state.sessionData.totalQuestions || 10);
        setCurrentSection(state.sessionData.currentSection || 0);
        setIsLoading(false);
        return;
      }
    }

    loadQuestion();
  }, [location.state, loadQuestion]);

  // Separate timer effect that runs continuously
  useEffect(() => {
    if (timeRemaining > 0 && !sessionEnded) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, sessionEnded, handleTimeUp]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer) return;

    try {
      setIsLoading(true);
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
        console.log('Answer submission response:', data);
        
        if (data.sectionCompleted) {
          const sectionInfo = getCurrentSectionInfo();
          const sectionData = {
            sectionInfo: {
              title: sectionInfo.title || getCurrentSectionName(),
              difficulty: sectionInfo.difficulty || 'Unknown'
            },
            score: Math.round((data.sectionCorrect / data.sectionTotal) * 100),
            correct: data.sectionCorrect,
            total: data.sectionTotal,
            passed: data.passed,
            hasNextSection: data.hasNextSection || false,
            nextSectionIndex: data.nextSectionIndex
          };

          if (data.testCompleted) {
            navigate(`/sectional-test/results/${sessionId}`, {
              state: {
                selectedSections,
                sections
              }
            });
          } else {
            navigate(`/sectional-test/section-summary/${sessionId}`, {
              state: {
                sectionData,
                selectedSections,
                sections,
                currentSectionIndex: currentSection
              }
            });
          }
          return;
        } else if (data.testCompleted) {
          navigate(`/sectional-test/results/${sessionId}`, {
            state: {
              selectedSections,
              sections
            }
          });
        } else {
          setCurrentQuestion(data.question || null);
          setTimeRemaining(data.timeRemaining || 0);
          setQuestionNumber(data.questionNumber || 1);
          setSelectedAnswer('');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error:', errorData);
        setError(errorData.message || `Failed to submit answer (${response.status})`);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Initializing Sectional Test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900 border border-red-700 rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Error Occurred</h2>
          <p className="text-lg text-red-200 mb-8">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => {
                setError(null);
                loadQuestion();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              Retry
            </button>
            <br />
            <button
              onClick={() => navigate('/sectional-tests')}
              className="text-gray-400 hover:text-white underline"
            >
              Back to Sectional Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl">No question available</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={fullscreenRef}
      className="min-h-screen bg-gray-900 text-white"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto'
      }}
    >
      <div className="bg-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Target className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold">Sectional Test</h2>
              <p className="text-sm text-gray-300">
                Section {currentSection + 1} of {Object.keys(selectedSections).filter(key => selectedSections[key]).length}: {getCurrentSectionInfo().title || getCurrentSectionName()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-mono font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>

            <div className="text-sm text-gray-300">
              Question {questionNumber} of {totalQuestions || 'Unknown'}
            </div>

            <button
              onClick={toggleFullscreen}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
              <span className="text-sm">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 px-4 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalQuestions ? (questionNumber / totalQuestions) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6 leading-relaxed">
              {currentQuestion.question_text}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['a', 'b', 'c', 'd'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedAnswer === option
                      ? 'border-blue-500 bg-blue-500/20 text-blue-100'
                      : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === option ? 'border-blue-400 bg-blue-400' : 'border-gray-500'
                    }`}>
                      {selectedAnswer === option && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-lg">
                      <span className="font-semibold mr-2">{option.toUpperCase()}.</span>
                      {currentQuestion[`option_${option}`] || 'N/A'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {!isFullscreen && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Fullscreen mode recommended for best experience</span>
                </div>
              )}
            </div>

            <button
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                selectedAnswer
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <span>
                {questionNumber === totalQuestions ? 'Complete Section' : 'Next Question'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Warning Overlay */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-red-900 border-2 border-red-500 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Fullscreen Required</h3>
            <p className="text-red-200 mb-6">
              You must remain in fullscreen mode to continue the test. 
              The test will resume automatically in {warningCountdown} seconds.
            </p>
            <div className="text-sm text-red-300">
              Attempt {fullscreenAttempts} of {maxFullscreenAttempts}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeSectionalTest;