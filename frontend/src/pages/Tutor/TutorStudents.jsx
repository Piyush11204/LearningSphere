import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutorSidebar from './TutorSidebar';
import {
  Users,
  User,
  Mail,
  MessageSquare,
  Star,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Video,
  BookOpen
} from 'lucide-react';

const TutorStudents = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalSessions: 0,
    averageRating: 0
  });
  const navigate = useNavigate();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch sessions to get student data
      const sessionsResponse = await axios.get('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sessions = sessionsResponse.data || [];

      // Extract unique students from sessions
      const studentMap = new Map();

      sessions.forEach(session => {
        if (session.learners && Array.isArray(session.learners)) {
          session.learners.forEach(learner => {
            if (!studentMap.has(learner._id)) {
              studentMap.set(learner._id, {
                ...learner,
                sessionsCount: 0,
                completedSessions: 0,
                lastSession: null,
                totalSpent: 0,
                rating: 4.5, // Mock rating
                status: 'active'
              });
            }

            const student = studentMap.get(learner._id);
            student.sessionsCount += 1;

            if (session.status === 'completed') {
              student.completedSessions += 1;
              student.totalSpent += 25; // Assuming $25 per session
            }

            if (!student.lastSession || new Date(session.startTime) > new Date(student.lastSession)) {
              student.lastSession = session.startTime;
            }
          });
        }
      });

      const studentsList = Array.from(studentMap.values());
      setStudents(studentsList);
      setFilteredStudents(studentsList);

      // Calculate stats
      const activeStudents = studentsList.filter(student => student.status === 'active');
      const totalSessions = studentsList.reduce((sum, student) => sum + student.sessionsCount, 0);

      setStats({
        totalStudents: studentsList.length,
        activeStudents: activeStudents.length,
        totalSessions: totalSessions,
        averageRating: 4.7 // Mock data
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students data');
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    let filtered = students;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => student.status === filterStatus);
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, filterStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartSession = (studentId) => {
    // Navigate to create live session with pre-selected student
    navigate('/tutor/create-live-session', { state: { studentId } });
  };

  const handleViewProfile = (studentId) => {
    // Navigate to student profile or show modal
    console.log('View student profile:', studentId);
  };

  const handleMessage = (studentId) => {
    // Open messaging interface
    console.log('Message student:', studentId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TutorSidebar />

      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-20">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Students</h1>
          <p className="mt-2 text-gray-600">Manage your student relationships and track their progress.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeStudents}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Video className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalSessions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Rating</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.averageRating}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Students</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Students ({filteredStudents.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div key={student._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={student.avatar || '/default-avatar.png'}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{student.name}</h4>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {student.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Student Stats */}
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{student.sessionsCount}</div>
                        <div className="text-xs text-gray-500">Sessions</div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">{student.completedSessions}</div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">${student.totalSpent}</div>
                        <div className="text-xs text-gray-500">Earned</div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center text-sm font-medium text-gray-900">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          {student.rating}
                        </div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                        {student.status}
                      </span>

                      {/* Actions Dropdown */}
                      <div className="relative">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {/* Dropdown menu would go here */}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Last session: {student.lastSession ? new Date(student.lastSession).toLocaleDateString() : 'Never'}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewProfile(student._id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Profile
                      </button>

                      <button
                        onClick={() => handleStartSession(student._id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
                      >
                        <Video className="w-4 h-4 mr-1" />
                        Start Session
                      </button>

                      <button
                        onClick={() => handleMessage(student._id)}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 flex items-center"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'You haven\'t had any students yet. Start by creating sessions!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorStudents;