import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Play,
  Info
} from 'lucide-react';

const SectionalTestSelection = () => {
  const navigate = useNavigate();

  const [selectedSections, setSelectedSections] = useState({
    'very-easy': true,
    'easy': true,
    'moderate': true,
    'difficult': true
  });

  const sections = [
    {
      id: 'very-easy',
      name: 'Very Easy',
      description: 'Basic concepts and fundamentals',
      questions: 10,
      icon: BookOpen,
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50',
      passingRate: 40
    },
    {
      id: 'easy',
      name: 'Easy',
      description: 'Simple applications and understanding',
      questions: 10,
      icon: Target,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      bgColor: 'bg-blue-50',
      passingRate: 40
    },
    {
      id: 'moderate',
      name: 'Moderate',
      description: 'Intermediate concepts and analysis',
      questions: 10,
      icon: TrendingUp,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      bgColor: 'bg-yellow-50',
      passingRate: 40
    },
    {
      id: 'difficult',
      name: 'Difficult',
      description: 'Advanced topics and complex problems',
      questions: 10,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
      bgColor: 'bg-red-50',
      passingRate: 40
    }
  ];

  const handleSectionToggle = (sectionId) => {
    setSelectedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getSelectedSectionsCount = () => {
    return Object.values(selectedSections).filter(Boolean).length;
  };

  const getTotalQuestions = () => {
    return sections
      .filter(section => selectedSections[section.id])
      .reduce((total, section) => total + section.questions, 0);
  };

  const handleStartTest = () => {
    const selectedSectionIds = Object.keys(selectedSections).filter(id => selectedSections[id]);

    if (selectedSectionIds.length === 0) {
      alert('Please select at least one section to continue.');
      return;
    }

    // Navigate to sectional test with selected sections
    navigate('/practice-exam/sectional/start', {
      state: {
        selectedSections: selectedSectionIds
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sectional Practice Test</h1>
                <p className="text-gray-600 mt-1">Choose sections and test your knowledge progressively</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/practice-exams')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Practice Exams
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How Sectional Testing Works</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Each section contains 10 questions of the same difficulty level</li>
                <li>• You must achieve at least 40% accuracy in a section to unlock the next one</li>
                <li>• If you fail a section, you'll receive study recommendations</li>
                <li>• Progress through sections in order: Very Easy → Easy → Moderate → Difficult</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Sections to Test</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => {
              const IconComponent = section.icon;
              const isSelected = selectedSections[section.id];

              return (
                <div
                  key={section.id}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? `${section.color} ${section.bgColor} border-opacity-100`
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => handleSectionToggle(section.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${isSelected ? 'bg-white bg-opacity-80' : 'bg-white'}`}>
                      <IconComponent className={`w-6 h-6 ${isSelected ? 'text-gray-700' : 'text-gray-600'}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>

                      <p className="text-gray-600 mb-3">{section.description}</p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {section.questions} questions
                        </span>
                        <span className="text-gray-500">
                          Passing: {section.passingRate}%+
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'bg-green-600 border-green-600' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {getSelectedSectionsCount()}
              </div>
              <div className="text-gray-600">Sections Selected</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {getTotalQuestions()}
              </div>
              <div className="text-gray-600">Total Questions</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {getSelectedSectionsCount() * 40}%
              </div>
              <div className="text-gray-600">Minimum Passing Rate</div>
            </div>
          </div>
        </div>

        {/* Start Test Button */}
        <div className="text-center">
          <button
            onClick={handleStartTest}
            disabled={getSelectedSectionsCount() === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-3 mx-auto"
          >
            <Play className="w-6 h-6" />
            <span>Start Sectional Test</span>
          </button>

          {getSelectedSectionsCount() === 0 && (
            <p className="text-gray-500 mt-2">Please select at least one section to begin</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionalTestSelection;