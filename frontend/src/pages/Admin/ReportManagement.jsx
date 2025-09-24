import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URLS } from '../../config/api';
import { FileText, Download, BarChart3, Users, BookOpen, TrendingUp, Calendar, Search } from 'lucide-react';

const ReportManagement = () => {
  const [report, setReport] = useState('');
  const [reportType, setReportType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [usersRes, examsRes] = await Promise.all([
          axios.get(API_URLS.USERS, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_URLS.EXAMS, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setUsers(usersRes.data.users || []);
        setExams(examsRes.data.exams || []);
      } catch {
        toast.error('Failed to fetch data');
      }
    };
    fetchData();
  }, []);

  const handleGenerateReport = async (type, id) => {
    if (!id) {
      toast.error('Please select an item to generate report');
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const url = type === 'user' ? `${API_URLS.REPORTS}/user/${id}` : `${API_URLS.REPORTS}/exam/${id}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data.report);
      setReportType(type);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully`);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📊 Report Management
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Generate comprehensive reports and analytics for your learning platform
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'student').length}</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{exams.length}</div>
                  <div className="text-sm text-gray-600">Exams</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold">{users.filter(u => u.role === 'student').length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Exams</p>
                <p className="text-3xl font-bold">{exams.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Reports Generated</p>
                <p className="text-3xl font-bold">{report ? '1' : '0'}</p>
              </div>
              <FileText className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Platform Health</p>
                <p className="text-3xl font-bold">98%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Report Generation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Student Report Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Student Performance</h3>
                    <p className="text-blue-100">Individual student analytics</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{users.filter(u => u.role === 'student').length}</div>
                  <div className="text-sm text-blue-100">Available</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Student
                  </label>
                  <div className="relative">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                    >
                      <option value="">Choose a student...</option>
                      {users.filter(user => user.role === 'student').map(user => (
                        <option key={user._id} value={user._id}>
                          {user.profile?.name || user.username} - {user.email}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateReport('user', selectedUser)}
                  disabled={!selectedUser || isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-3" />
                      Generate Student Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Exam Report Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Exam Analytics</h3>
                    <p className="text-purple-100">Comprehensive exam insights</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{exams.length}</div>
                  <div className="text-sm text-purple-100">Available</div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Exam
                  </label>
                  <div className="relative">
                    <select
                      value={selectedExam}
                      onChange={(e) => setSelectedExam(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 appearance-none"
                    >
                      <option value="">Choose an exam...</option>
                      {exams.map(exam => (
                        <option key={exam._id} value={exam._id}>
                          {exam.title} - {exam.subject}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateReport('exam', selectedExam)}
                  disabled={!selectedExam || isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5 mr-3" />
                      Generate Exam Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Display */}
        {report && (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Generated Report</h2>
                    <p className="text-green-100">
                      {reportType === 'user' ? 'Student Performance Analysis' : 'Exam Analytics Report'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadReport}
                  className="px-6 py-3 bg-white text-green-600 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center font-semibold shadow-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium">
                    {report.split('\n').map((line, index) => (
                      <div key={index} className="mb-4">
                        {line.startsWith('**') && line.endsWith('**') ? (
                          <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6 first:mt-0">
                            {line.replace(/\*\*/g, '')}
                          </h3>
                        ) : line.startsWith('*') && line.endsWith('*') ? (
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            {line.replace(/\*/g, '')}
                          </h4>
                        ) : line.startsWith('-') ? (
                          <div className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{line.substring(1).trim()}</span>
                          </div>
                        ) : line.trim() === '' ? (
                          <div className="h-2"></div>
                        ) : (
                          <p className="text-gray-700">{line}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!report && (
          <div className="text-center py-16">
            <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Generate Reports
                </h3>
                <p className="text-gray-600 text-lg mb-8">
                  Select a student or exam from the options above to generate comprehensive performance reports and analytics.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>AI-Powered Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Detailed Insights</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Actionable Recommendations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManagement;
