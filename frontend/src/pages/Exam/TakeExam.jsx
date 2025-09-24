import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Timer,
  Send,
  Maximize,
  Minimize,
  Eye,
  EyeOff
} from 'lucide-react';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingExam, setIsStartingExam] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenWarningCount, setFullscreenWarningCount] = useState(0);
  const [showManualFullscreenPrompt, setShowManualFullscreenPrompt] = useState(false);
  const examContainerRef = useRef(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = localStorage.getItem('token');

        // First check exam status for this user
        const statusRes = await axios.get(`https://p-educlud.onrender.com/api/exams/${id}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (statusRes.data.hasSubmitted) {
          toast.error('You have already submitted this exam');
          navigate('/student/exams');
          return;
        }

        if (!statusRes.data.canStart) {
          toast.error('This exam is not available for you to take');
          navigate('/student/exams');
          return;
        }

        // Now fetch exam details
        const res = await axios.get(`https://p-educlud.onrender.com/api/exams/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.exam) {
          setExam(res.data.exam);
          setTimeLeft(res.data.exam.duration * 60); // Convert minutes to seconds

          // Check if there's saved progress for this exam
          const savedProgress = localStorage.getItem(`exam_${id}_progress`);
          if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            setAnswers(progress.answers || {});
            setCurrentQuestion(progress.currentQuestion || 0);
            setExamStarted(progress.examStarted || false);

            // Check if the saved session is still valid (within 24 hours)
            const savedTime = new Date(progress.savedAt);
            const now = new Date();
            const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
              // Clear old progress
              localStorage.removeItem(`exam_${id}_progress`);
              // Initialize answers object
              const initialAnswers = {};
              res.data.exam.questions.forEach((_, index) => {
                initialAnswers[index] = '';
              });
              setAnswers(initialAnswers);
            } else {
              // Restore saved answers
              setAnswers(progress.answers || {});
            }
          } else {
            // Initialize answers object
            const initialAnswers = {};
            res.data.exam.questions.forEach((_, index) => {
              initialAnswers[index] = '';
            });
            setAnswers(initialAnswers);
          }
        }
      } catch (error) {
        console.error('Failed to load exam:', error);
        toast.error('Failed to load exam');
        navigate('/student/exams');
      }
    };

    fetchExam();
  }, [id, navigate]);

  // Enhanced fullscreen functions with better error handling
  const enterFullscreen = useCallback(async (retryCount = 0) => {
    const maxRetries = 5; // Increased retries

    try {
      console.log(`Attempting to enter fullscreen (attempt ${retryCount + 1})`);

      // Check if fullscreen is supported
      if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled && !document.msFullscreenEnabled) {
        throw new Error('Fullscreen is not supported by this browser');
      }

      // Check if already in fullscreen
      const isAlreadyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      if (isAlreadyFullscreen) {
        console.log('Already in fullscreen mode');
        setIsFullscreen(true);
        setShowFullscreenWarning(false);
        return;
      }

      // Use document.documentElement (HTML element) for fullscreen - more reliable than container refs
      let fullscreenPromise;
      let methodUsed = '';

      if (document.documentElement.requestFullscreen) {
        console.log('Using standard fullscreen API on documentElement');
        methodUsed = 'standard';
        fullscreenPromise = document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        console.log('Using webkit fullscreen API on documentElement');
        methodUsed = 'webkit';
        fullscreenPromise = document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        console.log('Using MS fullscreen API on documentElement');
        methodUsed = 'ms';
        fullscreenPromise = document.documentElement.msRequestFullscreen();
      } else {
        throw new Error('No fullscreen API available');
      }

      // Set a longer timeout for the fullscreen request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Fullscreen request timeout (${methodUsed})`)), 5000);
      });

      console.log('Waiting for fullscreen promise...');
      await Promise.race([fullscreenPromise, timeoutPromise]);

      // Wait longer to ensure fullscreen is active
      console.log('Waiting for fullscreen to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify fullscreen was actually entered
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      console.log('Fullscreen verification:', {
        isCurrentlyFullscreen,
        fullscreenElement: document.fullscreenElement,
        webkitFullscreenElement: document.webkitFullscreenElement,
        msFullscreenElement: document.msFullscreenElement
      });

      if (isCurrentlyFullscreen) {
        setIsFullscreen(true);
        setShowFullscreenWarning(false);
        console.log('✅ Successfully entered fullscreen mode');
        return;
      } else {
        throw new Error('Fullscreen request completed but not activated');
      }

    } catch (error) {
      console.error(`❌ Failed to enter fullscreen (attempt ${retryCount + 1}):`, error);

      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
        console.log(`Retrying fullscreen entry in ${delay}ms... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          enterFullscreen(retryCount + 1);
        }, delay);
      } else {
        // Final attempt failed - provide detailed error message
        setIsFullscreen(false);

        let errorMessage = 'Unable to enter fullscreen mode. ';
        if (error.message.includes('timeout')) {
          errorMessage += 'The request timed out. Please try refreshing the page.';
        } else if (error.message.includes('not supported')) {
          errorMessage += 'Your browser does not support fullscreen mode.';
        } else if (error.message.includes('permission')) {
          errorMessage += 'Fullscreen permission was denied. Please allow fullscreen in your browser settings.';
        } else {
          errorMessage += 'Please ensure fullscreen is allowed and try again.';
        }

        toast.error(errorMessage, { duration: 8000 });
        throw error;
      }
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
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Manual fullscreen trigger for user interaction
  const triggerManualFullscreen = useCallback(async () => {
    try {
      console.log('Manual fullscreen trigger activated');

      // Try to request fullscreen on documentElement directly
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }

      // Wait and check if it worked
      await new Promise(resolve => setTimeout(resolve, 500));

      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      if (isFullscreen) {
        setIsFullscreen(true);
        setShowFullscreenWarning(false);
        toast.success('Fullscreen activated successfully!');
        return true;
      } else {
        // Fallback to F11 key simulation
        const f11Event = new KeyboardEvent('keydown', {
          key: 'F11',
          keyCode: 122,
          which: 122,
          bubbles: true,
          cancelable: true
        });

        document.dispatchEvent(f11Event);

        // Wait again and check
        await new Promise(resolve => setTimeout(resolve, 500));

        const isFullscreenAfterF11 = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        );

        if (isFullscreenAfterF11) {
          setIsFullscreen(true);
          setShowFullscreenWarning(false);
          toast.success('Fullscreen activated with F11!');
          return true;
        } else {
          // Provide manual instructions
          toast.info('Please press F11 or click the fullscreen button in your browser', { duration: 5000 });
          return false;
        }
      }
    } catch (error) {
      console.error('Manual fullscreen trigger failed:', error);
      toast.error('Manual fullscreen activation failed. Please use F11 or browser controls.');
      return false;
    }
  }, []);

  // Handle manual fullscreen continue
  const handleManualContinue = async () => {
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );

    if (!isFullscreen) {
      toast.error('Please enter fullscreen mode first, then click "Continue with Exam".');
      return;
    }

    // Continue with exam start
    setIsStartingExam(true);
    setShowManualFullscreenPrompt(false);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`https://p-educlud.onrender.com/api/exams/${id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setExamStarted(true);

      if (res.data.resumed) {
        toast.info('Exam resumed! Your previous answers have been restored.');
      } else {
        toast.success('Exam started in fullscreen mode! Good luck!');
      }
    } catch (error) {
      console.error('Failed to start exam:', error);
      toast.error(error.message || 'Failed to start exam. Please try again.');
      setIsStartingExam(false);
    }
  };

  const handleSubmitExam = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      // Convert answers object to array format expected by backend
      const answersArray = Object.values(answers);

      const res = await axios.post(`https://p-educlud.onrender.com/api/exams/${id}/submit`, {
        answers: answersArray
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Exit fullscreen when exam is submitted
      if (isFullscreen) {
        exitFullscreen();
      }

      // Clear saved progress on successful submission
      localStorage.removeItem(`exam_${id}_progress`);

      toast.success('Exam submitted successfully!');
      navigate(`/student/exam/${id}/results`, {
        state: {
          exam: exam,
          results: res.data
        }
      });
    } catch (error) {
      console.error('Failed to submit exam:', error);
      toast.error(error.response?.data?.message || 'Failed to submit exam');
      setIsSubmitting(false);
    }
  }, [isSubmitting, answers, id, exam, navigate, isFullscreen, exitFullscreen]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && examStarted) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && examStarted) {
      handleSubmitExam();
    }
  }, [timeLeft, examStarted, handleSubmitExam]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers({
      ...answers,
      [questionIndex]: answer
    });
  };

  // Save progress to localStorage whenever answers change
  useEffect(() => {
    if (exam && examStarted) {
      const progress = {
        answers,
        currentQuestion,
        examStarted,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`exam_${id}_progress`, JSON.stringify(progress));
    }
  }, [answers, currentQuestion, examStarted, id, exam]);

  const handleNext = () => {
    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestion(index);
  };

  // Full screen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);

      if (isCurrentlyFullscreen) {
        // Reset warning count when entering fullscreen
        setFullscreenWarningCount(0);
        setShowFullscreenWarning(false);
      } else if (!isCurrentlyFullscreen && examStarted && !isSubmitting && fullscreenWarningCount < 3) {
        const newCount = fullscreenWarningCount + 1;
        setFullscreenWarningCount(newCount);
        setShowFullscreenWarning(true);

        if (newCount < 3) {
          // Show warning and re-enter after 2 seconds for first 2 warnings
          setTimeout(async () => {
            try {
              await enterFullscreen();
              // Double-check after 1 second
              setTimeout(() => {
                const checkFullscreen = !!(
                  document.fullscreenElement ||
                  document.webkitFullscreenElement ||
                  document.msFullscreenElement
                );
                if (!checkFullscreen) {
                  console.log('Double-checking fullscreen entry...');
                  enterFullscreen();
                }
              }, 1000);
            } catch (error) {
              console.error('Failed to re-enter fullscreen after warning:', error);
              // Force another attempt
              setTimeout(() => enterFullscreen(), 1000);
            }
          }, 2000);
        } else {
          // After 3 warnings, show final warning and re-enter after 5 seconds
          setTimeout(async () => {
            try {
              await enterFullscreen();
              // Double-check after 1 second
              setTimeout(() => {
                const checkFullscreen = !!(
                  document.fullscreenElement ||
                  document.webkitFullscreenElement ||
                  document.msFullscreenElement
                );
                if (!checkFullscreen) {
                  console.log('Double-checking fullscreen entry after final warning...');
                  enterFullscreen();
                }
              }, 1000);
            } catch (error) {
              console.error('Failed to re-enter fullscreen after final warning:', error);
              // Force another attempt
              setTimeout(() => enterFullscreen(), 1000);
            }
          }, 5000);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [examStarted, isSubmitting, enterFullscreen, fullscreenWarningCount]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (examStarted && !isSubmitting) {
        // Save current progress before leaving
        const progress = {
          answers,
          currentQuestion,
          examStarted,
          savedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        };
        localStorage.setItem(`exam_${id}_progress`, JSON.stringify(progress));

        // Show warning message
        e.preventDefault();
        e.returnValue = 'You have an ongoing exam. Are you sure you want to leave? Your progress will be saved.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [examStarted, isSubmitting, answers, currentQuestion, id]);

  // Auto-enter fullscreen when exam starts or is resumed
  useEffect(() => {
    if (examStarted && !isFullscreen) {
      console.log('Auto-entering fullscreen for started exam...');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        enterFullscreen();
      }, 100);
    }
  }, [examStarted, isFullscreen, enterFullscreen]);

  // Force fullscreen on component mount if exam is already started
  useEffect(() => {
    if (exam && examStarted) {
      const timer = setTimeout(() => {
        const isCurrentlyFullscreen = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        );

        if (!isCurrentlyFullscreen) {
          console.log('Forcing fullscreen on component mount...');
          enterFullscreen();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [exam, examStarted, enterFullscreen]);

  const handleStartExam = async () => {
    if (isStartingExam) return;

    setIsStartingExam(true);

    try {
      // Immediately attempt to enter fullscreen
      await enterFullscreen();

      // Double-check fullscreen status after a short delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        // If still not in fullscreen, try one more time
        console.log('Final fullscreen attempt...');
        await enterFullscreen();
        await new Promise(resolve => setTimeout(resolve, 500));

        const finalCheck = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
        );

        if (!finalCheck) {
          throw new Error('Unable to enter fullscreen mode');
        }
      }

      // Now start the exam since fullscreen is confirmed
      const token = localStorage.getItem('token');
      const res = await axios.post(`https://p-educlud.onrender.com/api/exams/${id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setExamStarted(true);

      // Show appropriate message based on whether exam was resumed or started fresh
      if (res.data.resumed) {
        toast.info('Exam resumed! Your previous answers have been restored.');
      } else {
        toast.success('Exam started in fullscreen mode! Good luck!');
      }

    } catch (error) {
      console.error('Failed to start exam:', error);
      toast.error(error.message || 'Failed to start exam. Please ensure fullscreen is allowed.');
      setIsStartingExam(false);
      setShowManualFullscreenPrompt(true);
    }
  };

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-slate-800 mb-4">{exam.title}</h1>
            <p className="text-slate-600 mb-6">{exam.description}</p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{exam.questions.length}</div>
                <div className="text-sm text-slate-600">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{exam.duration}</div>
                <div className="text-sm text-slate-600">Minutes</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <div className="text-left">
                  <h3 className="font-semibold text-yellow-800">Important Instructions:</h3>
                  <ul className="text-sm text-yellow-700 mt-1">
                    <li>• <strong>Auto Fullscreen:</strong> The exam will automatically enter fullscreen mode</li>
                    <li>• You have {exam.duration} minutes to complete the exam</li>
                    <li>• Answer all questions to the best of your ability</li>
                    <li>• You can navigate between questions</li>
                    <li>• Your answers will be saved automatically</li>
                    <li>• <strong>Security:</strong> Exiting fullscreen will show warnings (max 3) and auto-return after 5 seconds</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              disabled={isStartingExam}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isStartingExam ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Activating Fullscreen Mode...
                </>
              ) : (
                <>
                  <Maximize className="w-5 h-5 mr-2" />
                  Start Exam (Auto Fullscreen)
                </>
              )}
            </button>

            {/* Manual Fullscreen Prompt */}
            {showManualFullscreenPrompt && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className="font-semibold text-red-800">Fullscreen Required</h3>
                </div>
                <p className="text-red-700 text-sm mb-4">
                  The exam requires fullscreen mode for security. Please choose one of the options below:
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={async () => {
                        const success = await triggerManualFullscreen();
                        if (success) {
                          setShowManualFullscreenPrompt(false);
                          // Continue with exam start
                          setIsStartingExam(true);
                          try {
                            const token = localStorage.getItem('token');
                            const res = await axios.post(`https://p-educlud.onrender.com/api/exams/${id}/start`, {}, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            setExamStarted(true);
                            if (res.data.resumed) {
                              toast.info('Exam resumed! Your previous answers have been restored.');
                            } else {
                              toast.success('Exam started in fullscreen mode! Good luck!');
                            }
                          } catch (error) {
                            console.error('Failed to start exam:', error);
                            toast.error(error.message || 'Failed to start exam. Please try again.');
                            setIsStartingExam(false);
                          }
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Maximize className="w-4 h-4 mr-2" />
                      Try Auto Fullscreen
                    </button>
                    <span className="text-sm text-slate-600">Recommended - let us try automatically</span>
                  </div>

                  <div className="border-t border-red-200 pt-3">
                    <p className="text-sm font-medium text-red-800 mb-2">Manual Options:</p>
                    <div className="text-sm text-red-700 space-y-1">
                      <div><strong>Option 1:</strong> Press <kbd className="px-2 py-1 bg-red-100 rounded text-xs">F11</kbd> on your keyboard</div>
                      <div><strong>Option 2:</strong> Click the fullscreen button (⛶) in your browser's address bar</div>
                      <div><strong>Option 3:</strong> Use your browser's menu: View → Enter Full Screen</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleManualContinue}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  I've Entered Fullscreen - Continue with Exam
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = exam.questions[currentQuestion];
  const answeredQuestions = Object.values(answers).filter(answer => answer !== '').length;

  return (
    <div ref={examContainerRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Fullscreen Warning Overlay */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Warning {fullscreenWarningCount}/3
            </h2>
            <p className="text-slate-600 mb-6">
              {fullscreenWarningCount < 3
                ? `You exited fullscreen mode. The exam will continue in fullscreen in 2 seconds.`
                : `Final warning! You exited fullscreen mode 3 times. The exam will continue in fullscreen in 5 seconds.`
              }
            </p>
            <div className="mb-4">
              <div className="text-sm text-slate-500">
                {fullscreenWarningCount < 3
                  ? 'Re-entering fullscreen in 2 seconds...'
                  : 'Re-entering fullscreen in 5 seconds...'
                }
              </div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{exam.title}</h1>
              <p className="text-sm text-slate-600">
                Question {currentQuestion + 1} of {exam.questions.length}
              </p>
            </div>

            <div className="flex items-center space-x-6">
              {/* Fullscreen Indicator */}
              <div className="flex items-center space-x-2">
                {isFullscreen ? (
                  <Eye className="w-5 h-5 text-green-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-sm font-medium ${isFullscreen ? 'text-green-600' : 'text-red-600'}`}>
                  {isFullscreen ? 'Fullscreen' : 'Windowed'}
                </span>
                {fullscreenWarningCount > 0 && (
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    Warnings: {fullscreenWarningCount}/3
                  </span>
                )}
              </div>

              {/* Progress */}
              <div className="text-center">
                <div className="text-sm text-slate-600">Progress</div>
                <div className="text-lg font-bold text-blue-600">
                  {answeredQuestions}/{exam.questions.length}
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center space-x-2">
                <Timer className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-600' : 'text-slate-600'}`} />
                <div className={`text-lg font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Question */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">
                  Question {currentQuestion + 1}
                </h2>
                <p className="text-slate-700 text-lg leading-relaxed">
                  {currentQ.questionText}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {currentQ.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      answers[currentQuestion] === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={answers[currentQuestion] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-4 text-slate-700">{option}</span>
                  </label>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex items-center px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                <div className="text-sm text-slate-600">
                  {currentQuestion + 1} of {exam.questions.length}
                </div>

                {currentQuestion === exam.questions.length - 1 ? (
                  <button
                    onClick={handleSubmitExam}
                    disabled={isSubmitting}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Exam
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Question Navigator</h3>

              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${
                      currentQuestion === index
                        ? 'bg-blue-600 text-white'
                        : answers[index] !== ''
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                  <span className="text-slate-600">Current</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded mr-2"></div>
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-slate-100 rounded mr-2"></div>
                  <span className="text-slate-600">Not Answered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;