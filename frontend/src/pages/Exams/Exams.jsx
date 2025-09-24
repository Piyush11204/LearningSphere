import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
    // Get user role from localStorage or context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || 'student');
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/exams');
      setExams(response.data.exams || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to load exams');
      setLoading(false);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      await api.post(`/exams/${examId}/start`);
      navigate(`/exam/${examId}`);
    } catch (error) {
      console.error('Error starting exam:', error);
      setError('Failed to start exam');
    }
  };

  const getExamStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      live: 'bg-green-100 text-green-800',
      ongoing: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      expired: 'bg-red-100 text-red-800'
    };
    
    return `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badges[status] || badges.draft}`;
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading exams...</div>;
  if (error) return <div className="text-red-600 text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Exams</h1>
          <p className="mt-2 text-sm text-gray-700">
            {(userRole === 'admin' || userRole === 'tutor') ? 'Manage and create exams' : 'View and take available exams'}
          </p>
        </div>
        {(userRole === 'admin' || userRole === 'tutor') && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => navigate('/create-exam')}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              Create New Exam
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {exams.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No exams available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {(userRole === 'admin' || userRole === 'tutor') ? 'Get started by creating a new exam.' : 'Check back later for new exams.'}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Scheduled Date
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exams.map((exam) => (
                      <tr key={exam._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {exam.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exam.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exam.duration} minutes
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getExamStatusBadge(exam.status)}>
                            {exam.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(exam.scheduledDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {userRole === 'student' && exam.status === 'live' && (
                            <button
                              onClick={() => handleStartExam(exam._id)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Start Exam
                            </button>
                          )}
                          {(userRole === 'admin' || userRole === 'tutor') && (
                            <>
                              <button
                                onClick={() => navigate(`/exam/${exam._id}`)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                View
                              </button>
                              <button
                                onClick={() => navigate(`/reports/exam/${exam._id}`)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Report
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exams;