import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  RotateCcw,
  BookOpen,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  AlertCircle,
  Lightbulb,
  Star,
  Zap
} from 'lucide-react';

const ExamResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [exam, setExam] = useState(null);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    if (location.state) {
      setResults(location.state.results);
      setExam(location.state.exam);
    } else {
      // If no state, redirect back to exams
      navigate('/student/exams');
    }
  }, [location.state, navigate]);

  if (!results || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const { score, totalQuestions, correctAnswers, questionResults = [], timeTaken, averageTimePerQuestion } = results;
  const percentage = Math.round((score / totalQuestions) * 100);
  const incorrectAnswers = totalQuestions - correctAnswers;

  // Calculate additional metrics
  const accuracyRate = Math.round((correctAnswers / totalQuestions) * 100);
  const avgTimePerQuestion = averageTimePerQuestion || Math.round(timeTaken / totalQuestions);
  const questionsPerMinute = Math.round((totalQuestions / timeTaken) * 60);

  // Performance analysis
  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: Star };
    if (percentage >= 80) return { level: 'Very Good', color: 'text-green-600', bgColor: 'bg-green-100', icon: Award };
    if (percentage >= 70) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingUp };
    if (percentage >= 60) return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Target };
    if (percentage >= 50) return { level: 'Below Average', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertCircle };
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-100', icon: Zap };
  };

  const performanceInfo = getPerformanceLevel(percentage);

  // Difficulty analysis
  const difficultyStats = questionResults.reduce((acc, result) => {
    const difficulty = result.difficulty || 'medium';
    if (!acc[difficulty]) acc[difficulty] = { total: 0, correct: 0 };
    acc[difficulty].total++;
    if (result.isCorrect) acc[difficulty].correct++;
    return acc;
  }, {});

  // Time analysis
  const timeEfficiency = timeTaken <= (exam.duration * 60 * 0.8) ? 'Efficient' :
                        timeTaken <= (exam.duration * 60) ? 'Good' : 'Slow';

  const getRecommendations = () => {
    const recommendations = [];
    if (percentage < 70) {
      recommendations.push("Review the topics you struggled with and practice more questions");
    }
    if (timeEfficiency === 'Slow') {
      recommendations.push("Work on time management - try to answer questions more quickly");
    }
    if (Object.keys(difficultyStats).includes('hard') && difficultyStats.hard.correct / difficultyStats.hard.total < 0.5) {
      recommendations.push("Focus on difficult questions - they need more attention");
    }
    if (recommendations.length === 0) {
      recommendations.push("Great job! Keep up the excellent work and maintain this performance level");
    }
    return recommendations;
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const gradeInfo = getGrade(percentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-slate-200 shadow-sm">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Exam Results
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-slate-800">
            {exam.title}
          </h1>
          <p className="text-lg text-slate-600">Your performance summary</p>
        </div>

        {/* Main Results Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Score Overview */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${performanceInfo.bgColor} mb-4`}>
              <performanceInfo.icon className={`w-8 h-8 ${performanceInfo.color}`} />
            </div>

            <div className="text-6xl font-bold text-slate-800 mb-2">
              {percentage}%
            </div>

            <div className="text-xl text-slate-600 mb-4">
              {score} out of {totalQuestions} questions correct
            </div>

            <div className="text-lg font-semibold mb-6">
              <span className={performanceInfo.color}>{performanceInfo.level} Performance</span>
            </div>

            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-slate-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
                <div className="text-sm text-slate-600">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">{totalQuestions}</div>
                <div className="text-sm text-slate-600">Total</div>
              </div>
            </div>
          </div>

          {/* Enhanced Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-800">{accuracyRate}%</div>
              <div className="text-sm text-blue-600">Accuracy Rate</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-green-800">{Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}</div>
              <div className="text-sm text-green-600">Time Taken</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-purple-800">{avgTimePerQuestion}s</div>
              <div className="text-sm text-purple-600">Avg per Question</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center">
              <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-orange-800">{questionsPerMinute}</div>
              <div className="text-sm text-orange-600">Questions/Min</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="border-t border-slate-200 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Detailed Breakdown</h3>
              <button
                onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200"
              >
                {showDetailedBreakdown ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                {showDetailedBreakdown ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Correct Answers */}
              <div className="bg-green-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                  <h4 className="text-lg font-semibold text-green-800">Correct Answers</h4>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">{correctAnswers}</div>
                <div className="text-sm text-green-700">
                  {accuracyRate}% accuracy rate
                </div>
              </div>

              {/* Incorrect Answers */}
              <div className="bg-red-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <XCircle className="w-6 h-6 text-red-600 mr-3" />
                  <h4 className="text-lg font-semibold text-red-800">Incorrect Answers</h4>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-2">{incorrectAnswers}</div>
                <div className="text-sm text-red-700">
                  {Math.round((incorrectAnswers / totalQuestions) * 100)}% of total questions
                </div>
              </div>
            </div>

            {/* Question-by-Question Breakdown */}
            {showDetailedBreakdown && questionResults.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-4">Question Analysis</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {questionResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        result.isCorrect
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : 'bg-red-50 border-red-200 hover:bg-red-100'
                      }`}
                      onClick={() => setSelectedQuestion(selectedQuestion === index ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {result.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mr-3" />
                          )}
                          <span className="font-medium text-slate-800">
                            Question {index + 1}
                          </span>
                          <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                            result.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            result.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {result.difficulty || 'medium'}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {result.timeSpent || avgTimePerQuestion}s
                          {selectedQuestion === index ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                        </div>
                      </div>

                      {selectedQuestion === index && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <p className="text-slate-700 mb-3">{exam.questions[index]?.questionText}</p>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-medium text-slate-600">Your Answer: </span>
                              <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                {result.userAnswer || 'Not answered'}
                              </span>
                            </div>
                            {!result.isCorrect && (
                              <div className="text-sm">
                                <span className="font-medium text-slate-600">Correct Answer: </span>
                                <span className="text-green-600">{result.correctAnswer}</span>
                              </div>
                            )}
                            {result.explanation && (
                              <div className="text-sm mt-3 p-3 bg-blue-50 rounded-lg">
                                <span className="font-medium text-blue-800">Explanation: </span>
                                <span className="text-blue-700">{result.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty Analysis */}
            {Object.keys(difficultyStats).length > 0 && (
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-4">Difficulty Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(difficultyStats).map(([difficulty, stats]) => (
                    <div key={difficulty} className="text-center">
                      <div className="text-lg font-semibold text-slate-800 capitalize mb-2">{difficulty}</div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {Math.round((stats.correct / stats.total) * 100)}%
                      </div>
                      <div className="text-sm text-slate-600">
                        {stats.correct}/{stats.total} correct
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Performance Analysis & Recommendations */}
          <div className="border-t border-slate-200 pt-8 mt-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Performance Analysis & Recommendations</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Time Analysis */}
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Clock className="w-6 h-6 text-slate-600 mr-3" />
                  <h4 className="text-lg font-semibold text-slate-800">Time Management</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Time:</span>
                    <span className="font-medium text-slate-800">{Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Avg per Question:</span>
                    <span className="font-medium text-slate-800">{avgTimePerQuestion}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Efficiency:</span>
                    <span className={`font-medium ${timeEfficiency === 'Efficient' ? 'text-green-600' : timeEfficiency === 'Good' ? 'text-blue-600' : 'text-red-600'}`}>
                      {timeEfficiency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exam Summary */}
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <BookOpen className="w-6 h-6 text-slate-600 mr-3" />
                  <h4 className="text-lg font-semibold text-slate-800">Exam Summary</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subject:</span>
                    <span className="font-medium text-slate-800">{exam.subject || 'General'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Duration:</span>
                    <span className="font-medium text-slate-800">{exam.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Questions:</span>
                    <span className="font-medium text-slate-800">{exam.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Completed:</span>
                    <span className="font-medium text-slate-800">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Lightbulb className="w-6 h-6 text-blue-600 mr-3" />
                <h4 className="text-lg font-semibold text-blue-800">Recommendations for Improvement</h4>
              </div>
              <ul className="space-y-2">
                {getRecommendations().map((recommendation, index) => (
                  <li key={index} className="flex items-start text-blue-700">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/student/exams')}
            className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Exams
          </button>

          <button
            onClick={() => navigate('/student')}
            className="flex items-center justify-center px-8 py-4 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all duration-200"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            View Dashboard
          </button>
        </div>

        {/* Encouragement Message */}
        <div className="text-center mt-8">
          <div className={`inline-block px-6 py-3 rounded-full text-sm font-medium ${
            percentage >= 80
              ? 'bg-green-100 text-green-800'
              : percentage >= 60
              ? 'bg-blue-100 text-blue-800'
              : percentage >= 40
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {percentage >= 80
              ? "� Outstanding performance! You're excelling in this subject!"
              : percentage >= 60
              ? "👍 Good job! You're on the right track with consistent effort."
              : percentage >= 40
              ? "💪 Keep pushing! Review the areas you struggled with and try again."
              : "📚 Focus on understanding the fundamentals. Practice makes perfect!"
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;