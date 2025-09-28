import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorSidebar from './TutorSidebar';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { API_URLS } from '../../config/api';

const QuestionsManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    answer: '',
    tags: '',
    difficulty: 'Easy'
  });

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.QUESTIONS}?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        setError('Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URLS.QUESTIONS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          question_text: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          answer: '',
          tags: '',
          difficulty: 'Easy'
        });
        fetchQuestions();
        setSuccessMessage('Question created successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create question');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      setError('Network error occurred');
    }
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.QUESTIONS}/${editingQuestion._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        })
      });

      if (response.ok) {
        setEditingQuestion(null);
        setFormData({
          question_text: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          answer: '',
          tags: '',
          difficulty: 'Easy'
        });
        fetchQuestions();
        setSuccessMessage('Question updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      setError('Network error occurred');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URLS.QUESTIONS}/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchQuestions();
        setSuccessMessage('Question deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Network error occurred');
    }
  };

  const openEditModal = (question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      answer: question.answer,
      tags: question.tags ? question.tags.join(', ') : '',
      difficulty: question.difficulty
    });
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = !difficultyFilter || question.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'difficult': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TutorSidebar />

      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/tutor/dashboard')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Dashboard
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Question Bank Management</h1>
                  <p className="mt-2 text-gray-600">Create and manage questions for practice exams</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
              <button
                onClick={() => setError('')}
                className="float-right ml-4"
              >
                ×
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              {successMessage}
              <button
                onClick={() => setSuccessMessage('')}
                className="float-right ml-4"
              >
                ×
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {questions.filter(q => q.isActive).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Easy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {questions.filter(q => q.difficulty === 'Easy').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Difficult</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {questions.filter(q => q.difficulty === 'Difficult').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Difficult">Difficult</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Questions ({filteredQuestions.length})</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => (
                  <div key={question._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {question.question_text}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          {!question.isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>A: {question.option_a}</div>
                            <div>B: {question.option_b}</div>
                            <div>C: {question.option_c}</div>
                            <div>D: {question.option_d}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Answer: {question.answer?.toUpperCase()}</span>
                          {question.tags && question.tags.length > 0 && (
                            <span>Tags: {question.tags.join(', ')}</span>
                          )}
                          <span>Attempts: {question.totalAttempts || 0}</span>
                          <span>Success: {question.successRate ? Math.round(question.successRate) : 0}%</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openEditModal(question)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No questions found</h3>
                  <p className="text-sm text-gray-500">
                    {searchTerm || difficultyFilter ? 'Try adjusting your filters' : 'Create your first question to get started'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingQuestion) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingQuestion ? 'Edit Question' : 'Create New Question'}
              </h3>
            </div>

            <form onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Option A</label>
                  <input
                    type="text"
                    value={formData.option_a}
                    onChange={(e) => setFormData({...formData, option_a: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Option B</label>
                  <input
                    type="text"
                    value={formData.option_b}
                    onChange={(e) => setFormData({...formData, option_b: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Option C</label>
                  <input
                    type="text"
                    value={formData.option_c}
                    onChange={(e) => setFormData({...formData, option_c: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Option D</label>
                  <input
                    type="text"
                    value={formData.option_d}
                    onChange={(e) => setFormData({...formData, option_d: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                  <select
                    value={formData.answer}
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Answer</option>
                    <option value="a">A</option>
                    <option value="b">B</option>
                    <option value="c">C</option>
                    <option value="d">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Difficult">Difficult</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., math, algebra, geometry"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingQuestion(null);
                    setFormData({
                      question_text: '',
                      option_a: '',
                      option_b: '',
                      option_c: '',
                      option_d: '',
                      answer: '',
                      tags: '',
                      difficulty: 'Easy'
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingQuestion ? 'Update Question' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsManagement;