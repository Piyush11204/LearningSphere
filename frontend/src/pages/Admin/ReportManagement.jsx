import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
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
          axios.get('https://p-educlud.onrender.com/api/users', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('https://p-educlud.onrender.com/api/exams', { headers: { Authorization: `Bearer ${token}` } }),
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
      const url = type === 'user' ? `https://p-educlud.onrender.com/api/reports/user/${id}` : `https://p-educlud.onrender.com/api/reports/exam/${id}`;
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

  const reportTemplates = [
    {
      title: 'Student Performance Report',
      description: 'Detailed analysis of individual student performance across all exams',
      icon: Users,
      type: 'user',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Exam Analytics Report',
      description: 'Comprehensive statistics and insights for specific exams',
      icon: BookOpen,
      type: 'exam',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'System Overview Report',
      description: 'Platform-wide statistics and usage analytics',
      icon: BarChart3,
      type: 'system',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Attendance Summary Report',
      description: 'Student attendance patterns and trends',
      icon: Calendar,
      type: 'attendance',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white flex items-center mb-2">
            <FileText className="mr-4 text-blue-600" size={36} />
            Report Management
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Generate comprehensive reports and analytics for EduCloud platform.
          </p>
        </div>

        {/* Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {reportTemplates.map((template, index) => {
            const Icon = template.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-600 p-6 cursor-pointer group"
                onClick={() => {
                  if (template.type === 'system') {
                    toast.info('System reports coming soon!');
                  }
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${template.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    {template.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {template.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Report Generation Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8 border border-slate-200 dark:border-slate-600">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Generate Custom Report</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Report */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Student Performance Report
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Student
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Choose a student...</option>
                    {users.filter(user => user.role === 'student').map(user => (
                      <option key={user._id} value={user._id}>
                        {user.username} - {user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleGenerateReport('user', selectedUser)}
                disabled={!selectedUser || isGenerating}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Student Report
                  </>
                )}
              </button>
            </div>

            {/* Exam Report */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                Exam Analytics Report
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Exam
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Choose an exam...</option>
                    {exams.map(exam => (
                      <option key={exam._id} value={exam._id}>
                        {exam.title} - {exam.subject}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleGenerateReport('exam', selectedExam)}
                disabled={!selectedExam || isGenerating}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Generate Exam Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Output */}
        {report && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600">
            <div className="p-6 border-b border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                      Generated Report
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {reportType === 'user' ? 'Student Performance' : 'Exam Analytics'} Report
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                <pre className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 font-mono leading-relaxed">
                  {report}
                </pre>
              </div>
            </div>
          </div>
        )}

        {!report && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-600 dark:text-slate-400 mb-2">
              No report generated yet
            </h3>
            <p className="text-slate-500 dark:text-slate-500">
              Select a student or exam above to generate a comprehensive report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportManagement;
