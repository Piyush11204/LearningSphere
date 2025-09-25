import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateSession = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    studentEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate form data (only title, description, and studentEmail are required)
      if (!formData.title || !formData.description || !formData.studentEmail) {
        alert('Please fill in all required fields (Title, Description, Student Email)');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.studentEmail)) {
        alert('Please enter a valid student email address');
        return;
      }

      // Validate dates only if both are provided
      if (formData.startTime && formData.endTime) {
        if (new Date(formData.startTime) <= new Date()) {
          alert('Start time must be in the future');
          return;
        }

        if (new Date(formData.endTime) <= new Date(formData.startTime)) {
          alert('End time must be after start time');
          return;
        }
      } else if (formData.startTime && !formData.endTime) {
        alert('Please provide end time if start time is specified');
        return;
      } else if (!formData.startTime && formData.endTime) {
        alert('Please provide start time if end time is specified');
        return;
      }

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/livesessions', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('One-on-one live session created successfully! Student has been notified via email.');
      navigate('/tutor/dashboard');
    } catch (error) {
      console.error('Error creating session:', error);
      alert(error.response?.data?.msg || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12">
      <div className="container mx-auto max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create 1-on-1 Live Session</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Session Title (e.g., Math Tutoring - Algebra)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what will be covered in this tutoring session..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            name="studentEmail"
            value={formData.studentEmail}
            onChange={handleChange}
            placeholder="Student Email (they will receive an invitation)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time (Optional - Session starts immediately if not set)</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time (Optional)</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">One-on-One Session (2 People Max)</h3>
                <p className="text-sm text-blue-700">
                  The student will receive an email invitation with the session link. Room capacity: You + 1 student. Sessions start immediately when created - use scheduling only if you want to plan for later.
                </p>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Creating Session...' : 'Create & Start Live Session'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateSession;