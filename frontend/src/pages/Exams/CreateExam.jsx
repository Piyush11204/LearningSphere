import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutorSidebar from '../Tutor/TutorSidebar';

const CreateExam = () => {
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    numQuestions: 10,
    difficulty: 'medium',
    duration: 60,
    scheduledDate: '',
    instructions: ''
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
        difficulty: examData.difficulty
      };

      const response = await axios.post('http://localhost:5000/api/exams', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Exam created:', response.data);
      navigate('/exams');
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
    const { name, value } = e.target;
    setExamData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field on change
    validateField(name, value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TutorSidebar />

      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Create New Exam</h3>
            <p className="mt-1 text-sm text-gray-600">
              Create an AI-powered exam with automatically generated questions using Gemini AI. Available for tutors and administrators.
            </p>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
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

                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Exam Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={examData.title}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        fieldErrors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder="Enter exam title"
                    />
                    {fieldErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      value={examData.subject}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        fieldErrors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder="e.g., Mathematics, Science, History"
                    />
                    {fieldErrors.subject && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.subject}</p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      name="difficulty"
                      value={examData.difficulty}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700">
                      Number of Questions
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
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        fieldErrors.numQuestions ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {fieldErrors.numQuestions && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.numQuestions}</p>
                    )}
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                      Duration (minutes)
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
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        fieldErrors.duration ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {fieldErrors.duration && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.duration}</p>
                    )}
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                      Scheduled Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledDate"
                      id="scheduledDate"
                      required
                      value={examData.scheduledDate}
                      onChange={handleChange}
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        fieldErrors.scheduledDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {fieldErrors.scheduledDate && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.scheduledDate}</p>
                    )}
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
                      Instructions
                    </label>
                    <textarea
                      id="instructions"
                      name="instructions"
                      rows={4}
                      value={examData.instructions}
                      onChange={handleChange}
                      className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter exam instructions for students..."
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate('/exams')}
                  className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;