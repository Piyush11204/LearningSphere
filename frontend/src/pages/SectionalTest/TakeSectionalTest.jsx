import { useState, useE  const [selectedSections, setSelectedSections] = useState({});
  const [sections, setSections] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);eCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Maximize,
  Minimize
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
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [sections, setSections] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [selectedSections, setSelectedSections] = useState({});
  const [sections, setSections] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get data from navigation state
    const state = location.state;
    if (state) {
      setSelectedSections(state.selectedSections || {});
      setSections(state.sections || []);
      setCurrentSection(state.currentSectionIndex || 0);

      // Use the session data if available (first question already loaded)
      if (state.sessionData) {
        setCurrentQuestion(state.sessionData.question);
        setTimeRemaining(state.sessionData.timeRemaining);
        setQuestionNumber(state.sessionData.questionNumber || 1);
        setTotalQuestions(state.sessionData.totalQuestions || 10);
        setCurrentSection(state.sessionData.currentSection || 0);
        setIsLoading(false);
        return;
      }
    }

    // Only load question if we don't have session data
    loadQuestion();

    // Timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuestion = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.PRACTICE}/sectional/${sessionId}/next`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userAnswer: null, timeTaken: 0 }) // Initial load
      });

      if (response.ok) {
        const data = await response.json();
        if (data.completed) {
          setSessionEnded(true);
          navigate(`/sectional-test/results/${sessionId}`);
          return;
        }

        setCurrentQuestion(data.question);
        setTimeRemaining(data.timeRemaining);
        setQuestionNumber(data.questionNumber || 1);
        // Don't update currentSection from API - maintain it as index in frontend
        setSections(data.sections || []);
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
  };

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
          timeTaken: 0 // You can track actual time taken if needed
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.sectionCompleted) {
          // Section completed - show summary page
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
            // Test is completely finished - go to final results
            navigate(`/sectional-test/results/${sessionId}`, {
              state: {
                selectedSections: selectedSections,
                sections: sections
              }
            });
          } else {
            // Show section summary
            navigate(`/sectional-test/section-summary/${sessionId}`, {
              state: {
                sectionData: sectionData,
                selectedSections: selectedSections,
                sections: sections,
                currentSectionIndex: currentSection
              }
            });
          }
          return;
        } else if (data.testCompleted) {
          // Test is completely finished
          navigate(`/sectional-test/results/${sessionId}`, {
            state: {
              selectedSections: selectedSections,
              sections: sections
            }
          });
        } else {
          // Continue with next question in current section
          setCurrentQuestion(data.question);
          setTimeRemaining(data.timeRemaining);
          setQuestionNumber(data.questionNumber || questionNumber + 1);
          // Don't update currentSection from API
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

  const handleTimeUp = () => {
    // Auto-submit current answer if selected, otherwise move to next
    if (selectedAnswer) {
      handleAnswerSubmit();
    } else {
      // Submit with no answer
      handleAnswerSubmit();
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

  const getCurrentSectionInfo = () => {
    return sections[currentSection] || {};
  };

  const getCurrentSectionName = () => {
    const selectedSectionKeys = Object.keys(selectedSections).filter(key => selectedSections[key]);
    const currentKey = selectedSectionKeys[currentSection];
    const sectionNames = {
      veryEasy: 'Very Easy',
      easy: 'Easy',
      moderate: 'Moderate',
      difficult: 'Difficult'
    };
    return sectionNames[currentKey] || 'Current Section';
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
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

      {/* Progress Bar */}
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

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Question */}
          <div className="bg-gray-800 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6 leading-relaxed">
              {currentQuestion.question_text}
            </h3>

            {/* Options */}
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
                      {currentQuestion[`option_${option}`]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
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
    </div>
  );
};

export default TakeSectionalTest;