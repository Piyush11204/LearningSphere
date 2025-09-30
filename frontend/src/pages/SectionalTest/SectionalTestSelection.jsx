import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Target, Clock, Award, AlertCircle } from 'lucide-react';
import { API_URLS } from '../../config/api';

const SectionalTestSelection = () => {
  const navigate = useNavigate();
  const [selectedSections, setSelectedSections] = useState({
    veryEasy: false,
    easy: false,
    moderate: false,
    difficult: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sections = [
    {
      id: 'veryEasy',
      key: 'veryEasy',
      title: 'Very Easy',
      description: 'Basic concepts and fundamentals',
      questions: 10,
      timeLimit: 30,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      icon: '🌱'
    },
    {
      id: 'easy',
      key: 'easy',
      title: 'Easy',
      description: 'Straightforward questions with clear answers',
      questions: 10,
      timeLimit: 30,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      icon: '📘'
    },
    {
      id: 'moderate',
      key: 'moderate',
      title: 'Moderate',
      description: 'Intermediate level with some complexity',
      questions: 10,
      timeLimit: 30,
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'from-yellow-50 to-orange-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      icon: '⚖️'
    },
    {
      id: 'difficult',
      key: 'difficult',
      title: 'Difficult',
      description: 'Advanced questions requiring deep understanding',
      questions: 10,
      timeLimit: 30,
      color: 'from-red-500 to-pink-600',
      bgColor: 'from-red-50 to-pink-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      icon: '🔥'
    }
  ];

  // Fullscreen enforcement removed - only enforced during actual test taking

  const handleSectionToggle = (sectionKey) => {
    setSelectedSections(prev => {
      const newState = {
        ...prev,
        [sectionKey]: !prev[sectionKey]
      };

      // If moderate is being selected, also select easy and very easy
      if (sectionKey === 'moderate' && !prev.moderate) {
        newState.easy = true;
        newState.veryEasy = true;
      }

      // If moderate is being deselected, also deselect easy and very easy
      if (sectionKey === 'moderate' && prev.moderate) {
        newState.easy = false;
        newState.veryEasy = false;
      }

      return newState;
    });
  };

  const getSelectedCount = () => {
    return Object.values(selectedSections).filter(Boolean).length;
  };

  const getTotalQuestions = () => {
    return getSelectedCount() * 10;
  };

  const getTotalTime = () => {
    return getSelectedCount() * 30;
  };

  const handleStartTest = async () => {
    const selectedCount = getSelectedCount();
    if (selectedCount === 0) {
      setError('Please select at least one section to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get the first selected section to start with
      const selectedSectionKeys = Object.keys(selectedSections).filter(key => selectedSections[key]);

      // Map frontend difficulty keys to backend difficulty values
      const difficultyMap = {
        veryEasy: 'Very easy',
        easy: 'Easy',
        moderate: 'Moderate',
        difficult: 'Difficult'
      };

      // Prepare all selected sections for the backend
      const selectedSectionsData = selectedSectionKeys.map(key => {
        const section = sections.find(s => s.key === key);
        return {
          sectionId: section.id,
          difficulty: difficultyMap[key]
        };
      });

      // Start the sectional test with all selected sections
      const response = await fetch(`${API_URLS.PRACTICE}/sectional/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sections: selectedSectionsData,
          sectionIndex: 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Navigate to the test page with the session ID and all selected sections info
        navigate(`/sectional-test/take/${data.sessionId}`, {
          state: {
            selectedSections,
            sections: sections.filter(s => selectedSections[s.key]),
            currentSectionIndex: 0,
            sessionData: data
          }
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start the test. Please try again.');
      }

    } catch (error) {
      console.error('Error starting sectional test:', error);
      setError('Failed to start the test. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Sectional Test Selection
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the difficulty sections you want to test. Each section contains 10 questions and requires 40% accuracy to pass.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Section Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer ${
                selectedSections[section.key]
                  ? `${section.borderColor} shadow-xl transform scale-105`
                  : 'border-gray-200 hover:shadow-xl hover:transform hover:scale-102'
              }`}
              onClick={() => handleSectionToggle(section.key)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${section.color} rounded-xl flex items-center justify-center text-white text-xl`}>
                      {section.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                      <p className="text-gray-600">{section.description}</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedSections[section.key]
                      ? `bg-gradient-to-r ${section.color} border-transparent`
                      : 'border-gray-300'
                  }`}>
                    {selectedSections[section.key] && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>{section.questions} questions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{section.timeLimit} min</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span>50 XP</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Test Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Test Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{getSelectedCount()}</div>
              <div className="text-gray-600">Sections Selected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{getTotalQuestions()}</div>
              <div className="text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{getTotalTime()}</div>
              <div className="text-gray-600">Minutes</div>
            </div>
          </div>

          {getSelectedCount() > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Estimated Rewards</h4>
                  <p className="text-sm text-gray-600">For completing all selected sections</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">{getSelectedCount() * 50} XP</div>
                  <div className="text-sm text-gray-600">Experience Points</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Start Test Button */}
        <div className="text-center">
          <button
            onClick={handleStartTest}
            disabled={isLoading || getSelectedCount() === 0}
            className={`inline-flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              getSelectedCount() > 0 && !isLoading
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-2xl hover:scale-105'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Starting Test...</span>
              </>
            ) : (
              <>
                <span>Start Sectional Test</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {getSelectedCount() === 0 && (
            <p className="text-gray-500 mt-4">Please select at least one section to continue</p>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">How Sectional Tests Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</div>
                <p className="text-gray-700">Select the difficulty sections you want to test</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</div>
                <p className="text-gray-700">Answer 10 questions per section within 30 minutes</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">3</div>
                <p className="text-gray-700">Score at least 40% to pass and unlock the next section</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">4</div>
                <p className="text-gray-700">Earn XP and badges for your achievements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionalTestSelection;