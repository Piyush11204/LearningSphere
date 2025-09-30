import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Trophy,
  ArrowRight,
  Home,
  Target,
  Clock,
  RotateCcw
} from 'lucide-react';
import { API_URLS } from '../../config/api';

const SectionSummary = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [sectionData, setSectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get section data from navigation state
    const state = location.state;
    if (state && state.sectionData) {
      setSectionData(state.sectionData);
      setIsLoading(false);
    } else {
      setError('Section data not found');
      setIsLoading(false);
    }
  }, [location.state]);

  const handleContinue = async () => {
    try {
      const token = localStorage.getItem('token');

      // Switch to next section
      const response = await fetch(`${API_URLS.PRACTICE}/sectional/${sessionId}/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sectionIndex: sectionData.nextSectionIndex
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate back to test with new section data
        navigate(`/sectional-test/take/${sessionId}`, {
          state: {
            sessionData: data,
            selectedSections: location.state?.selectedSections,
            sections: location.state?.sections,
            currentSectionIndex: sectionData.nextSectionIndex
          },
          replace: true
        });
      } else {
        setError('Failed to continue to next section');
      }
    } catch (error) {
      console.error('Error continuing to next section:', error);
      setError('Network error occurred');
    }
  };

  const handleRetake = async () => {
    try {
      const token = localStorage.getItem('token');

      // Retake the current section
      const response = await fetch(`${API_URLS.PRACTICE}/sectional/${sessionId}/retake`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sectionIndex: sectionData.currentSectionIndex
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate back to test with new section data
        navigate(`/sectional-test/take/${sessionId}`, {
          state: {
            sessionData: data,
            selectedSections: location.state?.selectedSections,
            sections: location.state?.sections,
            currentSectionIndex: sectionData.currentSectionIndex
          },
          replace: true
        });
      } else {
        setError('Failed to retake section');
      }
    } catch (error) {
      console.error('Error retaking section:', error);
      setError('Network error occurred');
    }
  };

  const handleFinishTest = () => {
    navigate(`/sectional-test/results/${sessionId}`);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading section summary...</p>
        </div>
      </div>
    );
  }

  if (error || !sectionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-gray-600 max-w-md mx-auto p-8">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-4">Error Loading Summary</h2>
          <p className="mb-8">{error || 'Section data not available'}</p>
          <button
            onClick={() => navigate('/sectional-tests')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Sectional Tests
          </button>
        </div>
      </div>
    );
  }

  const { sectionInfo, score, correct, total, passed, hasNextSection, mustRetake } = sectionData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/sectional-tests')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Back to Tests</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Section Complete</h1>
                <p className="text-sm text-gray-600">{sectionInfo.title} - {sectionInfo.difficulty} Level</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-semibold ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Score Card */}
        <div className={`rounded-2xl shadow-lg p-8 mb-8 border-2 ${getScoreBgColor(score)}`}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-md">
              {passed ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            <h2 className={`text-5xl font-bold mb-2 ${getScoreColor(score)}`}>{score}%</h2>
            <p className="text-xl text-gray-600">Your Score</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 mb-1">{correct}</div>
              <p className="text-sm text-gray-600">Correct Answers</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600 mb-1">{total - correct}</div>
              <p className="text-sm text-gray-600">Wrong Answers</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-1">{total}</div>
              <p className="text-sm text-gray-600">Total Questions</p>
            </div>
          </div>
        </div>

        {/* Questions Review - Simplified for now */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Section Performance</h3>
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              You answered {correct} out of {total} questions correctly in this section.
            </p>
            <div className="bg-gray-200 rounded-full h-4 max-w-md mx-auto">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${getScoreColor(score).replace('text-', 'bg-')}`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {score >= 80 ? 'Excellent work!' : score >= 60 ? 'Good job!' : score >= 40 ? 'Keep practicing!' : 'You need at least 40% to pass this section.'}
            </p>
            {!passed && mustRetake && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <RotateCcw className="w-4 h-4 inline mr-2" />
                  You need to score at least 40% to pass this section. Please retake it to continue.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {mustRetake ? (
            <button
              onClick={handleRetake}
              className="bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Retake This Section</span>
            </button>
          ) : hasNextSection ? (
            <button
              onClick={handleContinue}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Continue to Next Section</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinishTest}
              className="bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              <Trophy className="w-5 h-5" />
              <span>View Final Results</span>
            </button>
          )}

          <button
            onClick={() => navigate('/sectional-tests')}
            className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
          >
            Back to Sectional Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionSummary;