import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import AdminSidebar from './AdminSidebar';
import TutorSidebar from './TutorSidebar';
import { API_URLS } from '../../config/api';
import { toast } from 'react-toastify';

const TutorExam = () => {
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    numQuestions: 10,
    difficulty: 'medium',
    duration: 60,
    scheduledDate: '',
    instructions: '',
    targetAudience: 'all',
    isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      // Validate all required fields
      const validationErrors = {};

      if (!examData.title.trim()) {
        validationErrors.title = 'Exam title is required';
      } else if (examData.title.trim().length < 3) {
        validationErrors.title = 'Title must be at least 3 characters';
      }

      if (!examData.subject.trim()) {
        validationErrors.subject = 'Subject is required';
      } else if (examData.subject.trim().length < 2) {
        validationErrors.subject = 'Subject must be at least 2 characters';
      }

      if (!examData.scheduledDate) {
        validationErrors.scheduledDate = 'Scheduled date and time is required';
      } else if (new Date(examData.scheduledDate) <= new Date()) {
        validationErrors.scheduledDate = 'Scheduled date must be in the future';
      }

      const duration = parseInt(examData.duration);
      if (!examData.duration || isNaN(duration)) {
        validationErrors.duration = 'Duration is required';
      } else if (duration < 5) {
        validationErrors.duration = 'Duration must be at least 5 minutes';
      } else if (duration > 300) {
        validationErrors.duration = 'Duration cannot exceed 300 minutes';
      }

      const numQuestions = parseInt(examData.numQuestions);
      if (!examData.numQuestions || isNaN(numQuestions)) {
        validationErrors.numQuestions = 'Number of questions is required';
      } else if (numQuestions < 5) {
        validationErrors.numQuestions = 'Must have at least 5 questions';
      } else if (numQuestions > 50) {
        validationErrors.numQuestions = 'Cannot have more than 50 questions';
      }

      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        throw new Error('Please fix the validation errors above');
      }

      const token = localStorage.getItem('token');
      const requestData = {
        title: examData.title.trim(),
        description: examData.instructions.trim() || 'Complete the exam within the given time.',
        subject: examData.subject.trim(),
        scheduledDate: examData.scheduledDate,
        duration: duration,
        numQuestions: numQuestions,
        difficulty: examData.difficulty,
        targetAudience: examData.targetAudience,
        isPublic: examData.isPublic
      };

      const response = await axios.post(`${API_URLS.EXAMS}`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Exam created:', response.data);
      toast.success('Exam created successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error creating exam:', error);

      let errorMessage = 'Failed to create exam';

      if (error.response) {
        // Server responded with error
        const { status, data } = error.response;

        if (status === 400 && data.errors) {
          // Validation errors from backend
          if (Array.isArray(data.errors)) {
            setFieldErrors({});
            errorMessage = data.errors.join(', ');
          }
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          localStorage.removeItem('token');
          navigate('/login');
        } else if (status === 403) {
          errorMessage = 'You do not have permission to create exams.';
        } else if (status === 422) {
          errorMessage = 'Invalid data provided. Please check all fields.';
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Client-side error (our validation)
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };

    switch (name) {
      case 'title': {
        if (!value.trim()) {
          errors.title = 'Title is required';
        } else if (value.trim().length < 3) {
          errors.title = 'Title must be at least 3 characters';
        } else {
          delete errors.title;
        }
        break;
      }
      case 'subject': {
        if (!value.trim()) {
          errors.subject = 'Subject is required';
        } else if (value.trim().length < 2) {
          errors.subject = 'Subject must be at least 2 characters';
        } else {
          delete errors.subject;
        }
        break;
      }
      case 'scheduledDate': {
        if (!value) {
          errors.scheduledDate = 'Scheduled date is required';
        } else if (new Date(value) <= new Date()) {
          errors.scheduledDate = 'Scheduled date must be in the future';
        } else {
          delete errors.scheduledDate;
        }
        break;
      }
      case 'duration': {
        const duration = parseInt(value);
        if (!value || isNaN(duration)) {
          errors.duration = 'Duration is required';
        } else if (duration < 5) {
          errors.duration = 'Duration must be at least 5 minutes';
        } else if (duration > 300) {
          errors.duration = 'Duration cannot exceed 300 minutes';
        } else {
          delete errors.duration;
        }
        break;
      }
      case 'numQuestions': {
        const numQuestions = parseInt(value);
        if (!value || isNaN(numQuestions)) {
          errors.numQuestions = 'Number of questions is required';
        } else if (numQuestions < 5) {
          errors.numQuestions = 'Must have at least 5 questions';
        } else if (numQuestions > 50) {
          errors.numQuestions = 'Cannot have more than 50 questions';
        } else {
          delete errors.numQuestions;
        }
        break;
      }
      default:
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExamData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Validate field on change (except for checkboxes)
    if (type !== 'checkbox') {
      validateField(name, value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TutorSidebar />

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Tutor Exam Creation Panel</h1>
              <p className="text-blue-100 mt-1">Create AI-powered exams for students</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error Creating Exam
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {Array.isArray(error) ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {error.map((err, index) => (
                              <li key={index}>{err}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    value={examData.title}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.title ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter exam title"
                  />
                  {fieldErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    required
                    value={examData.subject}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.subject ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Mathematics, Science, History"
                  />
                  {fieldErrors.subject && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={examData.difficulty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Exam Settings */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Settings</h3>
                </div>

                <div>
                  <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions *
                  </label>
                  <input
                    type="number"
                    name="numQuestions"
                    id="numQuestions"
                    min="5"
                    max="50"
                    required
                    value={examData.numQuestions}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.numQuestions ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.numQuestions && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.numQuestions}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    id="duration"
                    min="15"
                    max="180"
                    required
                    value={examData.duration}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.duration ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.duration && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.duration}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    id="scheduledDate"
                    required
                    value={examData.scheduledDate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.scheduledDate ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.scheduledDate && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.scheduledDate}</p>
                  )}
                </div>

                {/* Admin Settings */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Settings</h3>
                </div>

                <div>
                  <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    id="targetAudience"
                    name="targetAudience"
                    value={examData.targetAudience}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Students</option>
                    <option value="beginners">Beginners</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    id="isPublic"
                    checked={examData.isPublic}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Make exam public (visible to all students)
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions for Students
                  </label>
                  <textarea
                    id="instructions"
                    name="instructions"
                    rows={4}
                    value={examData.instructions}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter exam instructions for students..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Exam...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Exam
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorExam;