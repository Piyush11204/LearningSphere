import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutorSidebar from './TutorSidebar';
import { Video, Users, Clock, Save, ArrowLeft, Play } from 'lucide-react';

const CreateLiveSession = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    maxParticipants: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxParticipants' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      // Validate form data
      if (!formData.title || !formData.description) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.scheduledTime && new Date(formData.scheduledTime) <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      const sessionData = {
        title: formData.title,
        description: formData.description,
        scheduledTime: formData.scheduledTime || null,
        maxParticipants: formData.maxParticipants
      };

      const response = await axios.post('http://localhost:5000/api/livesessions', sessionData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Live session created successfully:', response.data);

      setSuccess('Live session created successfully!');

      // If no scheduled time, start immediately
      if (!formData.scheduledTime) {
        // Start the session immediately
        await axios.post(`http://localhost:5000/api/livesessions/${response.data.sessionId}/start`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTimeout(() => {
          navigate(`/session/${response.data.sessionId}`);
        }, 2000);
      } else {
        setTimeout(() => {
          navigate('/tutor/sessions');
        }, 2000);
      }

    } catch (error) {
      console.error('Error creating live session:', error);
      setError(error.response?.data?.msg || error.message || 'Failed to create live session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TutorSidebar />

      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-20">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate('/tutor/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create Live Session</h1>
          <p className="mt-2 text-gray-600">Start an immediate live session or schedule one for later</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Live Session Details</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Session Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Live Q&A Session"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what will be covered in this live session..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Scheduled Time */}
            <div>
              <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Time (Optional)
              </label>
              <input
                type="datetime-local"
                id="scheduledTime"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to start the session immediately
              </p>
            </div>

            {/* Max Participants */}
            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Participants
              </label>
              <select
                id="maxParticipants"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 participants</option>
                <option value={10}>10 participants</option>
                <option value={20}>20 participants</option>
                <option value={50}>50 participants</option>
                <option value={100}>100 participants</option>
              </select>
            </div>

            {/* Session Type Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Video className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Live Session Features</h4>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Real-time video and audio communication</li>
                    <li>• Interactive chat for Q&A</li>
                    <li>• Screen sharing capabilities</li>
                    <li>• Participant management</li>
                    <li>• Session recording (optional)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Session Preview</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Video className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Title:</span>
                  <span className="ml-2 text-gray-900">{formData.title || 'Not set'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Start:</span>
                  <span className="ml-2 text-gray-900">
                    {formData.scheduledTime
                      ? new Date(formData.scheduledTime).toLocaleString()
                      : 'Immediately'
                    }
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Max Participants:</span>
                  <span className="ml-2 text-gray-900">{formData.maxParticipants}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/tutor')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {formData.scheduledTime ? 'Schedule Session' : 'Start Live Session'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLiveSession;