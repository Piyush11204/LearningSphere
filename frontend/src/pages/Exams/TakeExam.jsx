import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchExamDetails = useCallback(async () => {
    try {
      const response = await api.get(`/exams/${examId}`);
      const examData = response.data.exam;
      setExam(examData);
      setTimeLeft(examData.duration * 60); // Convert minutes to seconds
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exam:', error);
      setError('Failed to load exam');
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExamDetails();
  }, [fetchExamDetails]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, handleSubmitExam]);



  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmitExam = useCallback(async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const submissionData = {
        answers: Object.entries(answers).map(([questionIndex, answer]) => ({
          questionIndex: parseInt(questionIndex),
          answer
        }))
      };

      const response = await api.post(`/exams/${examId}/submit`, submissionData);
      console.log('Exam submitted:', response.data);
      
      // Navigate to results or dashboard with success message
      navigate('/exams', { 
        state: { 
          message: 'Exam submitted successfully!',
          score: response.data.score 
        }
      });
    } catch (error) {
      console.error('Error submitting exam:', error);
      setError('Failed to submit exam. Please try again.');
      setSubmitting(false);
    }
  }, [examId, answers, submitting, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 600) return 'text-green-600'; // More than 10 minutes
    if (timeLeft > 300) return 'text-yellow-600'; // More than 5 minutes
    return 'text-red-600'; // Less than 5 minutes
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading exam...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;
  if (!exam) return <div className="text-center">Exam not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{exam.title}</h1>
              <p className="text-sm text-gray-600">Subject: {exam.subject}</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getTimeColor()}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-sm text-gray-600">Time Remaining</p>
            </div>
          </div>
        </div>
        
        {exam.instructions && (
          <div className="px-6 py-4 bg-blue-50">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h3>
            <p className="text-sm text-blue-800">{exam.instructions}</p>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {exam.questions.map((question, index) => (
          <div key={index} className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Question {index + 1}
              </h3>
              <p className="text-gray-700">{question.questionText}</p>
            </div>
            
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={String.fromCharCode(65 + optionIndex)} // A, B, C, D
                    checked={answers[index] === String.fromCharCode(65 + optionIndex)}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-700">
                    {String.fromCharCode(65 + optionIndex)}. {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Section */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              Answered: {Object.keys(answers).length} / {exam.questions.length} questions
            </p>
          </div>
          <button
            onClick={handleSubmitExam}
            disabled={submitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;