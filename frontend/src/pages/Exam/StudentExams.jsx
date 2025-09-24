import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URLS } from '../../config/api';
import { 
  Book, 
  Filter, 
  Search, 
  Calendar, 
  Clock, 
  PlayCircle,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [filters, setFilters] = useState({ subject: '', status: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Try to get token for authenticated users, but allow public access
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(API_URLS.EXAMS, { headers });
        setExams(res.data.exams || []);
      } catch {
        // For public access, try without authentication
        try {
          const res = await axios.get(API_URLS.EXAMS);
          setExams(res.data.exams || []);
        } catch {
          // Ignore public access error, just show empty list
        }
      }
    };
    fetchExams();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSubject = filters.subject ? exam.subject.toLowerCase().includes(filters.subject.toLowerCase()) : true;
    const matchesStatus = filters.status ? exam.status === filters.status : true;
    const matchesSearch = searchQuery ? exam.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesSubject && matchesStatus && matchesSearch;
  });

  const handleTakeExam = async (examId, examStatus) => {
    try {
      // For ongoing exams, check if user has local progress
      if (examStatus === 'ongoing') {
        const savedProgress = localStorage.getItem(`exam_${examId}_progress`);
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          const savedTime = new Date(progress.savedAt);
          const now = new Date();
          const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

          if (hoursDiff > 24) {
            // Clear old progress and start fresh
            localStorage.removeItem(`exam_${examId}_progress`);
          }
        }
      }

      // Navigate to the exam taking page
      navigate(`/student/exam/${examId}`);
    } catch (error) {
      console.error('Failed to start exam:', error);
      toast.error('Failed to start exam');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 text-slate-700">
      {/* Main Content */}
      <div className="p-6 md:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium mb-4 border border-slate-200 shadow-sm">
            <Book className="w-4 h-4 mr-2 text-blue-500" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Examination Center
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 leading-tight">
            My{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Examinations
            </span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            Access your scheduled exams, track your progress, and take examinations with confidence.
          </p>
        </div>

        {/* Search and Filters Section */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search exams by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-4 pl-12 pr-4 rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-400 text-slate-700"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg p-6 border border-slate-100">
              <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center">
                <Filter className="w-6 h-6 mr-3 text-blue-500" />
                Filter Your Exams
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                    <Book className="w-4 h-4 mr-2 text-blue-500" />
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={filters.subject}
                    onChange={handleFilterChange}
                    className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder-slate-400"
                    placeholder="e.g., Mathematics"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                    Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  >
                    <option value="">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exams List Section */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-slate-800">
              Available{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Examinations
              </span>
            </h2>
            <p className="text-slate-600">Browse and take your scheduled exams</p>
          </div>

          {filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => (
                <div key={exam._id} className="group bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 hover:-translate-y-2">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        exam.status === 'live' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700' :
                        exam.status === 'ongoing' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700' :
                        exam.status === 'scheduled' ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700' :
                        'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700'
                      }`}>
                        {exam.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <p className="text-slate-600 flex items-center text-sm">
                        <Book className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="font-medium">Subject:</span>
                        <span className="ml-2">{exam.subject}</span>
                      </p>
                      <p className="text-slate-600 flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                        <span className="font-medium">
                          {new Date(exam.scheduledDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                      <p className="text-slate-600 flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-emerald-500" />
                        <span className="font-medium">Duration:</span>
                        <span className="ml-2">{exam.duration} minutes</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleTakeExam(exam._id, exam.status)}
                      disabled={exam.status === 'completed'}
                      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                        exam.status !== 'completed'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-2xl hover:scale-105'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {exam.status === 'completed' ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Completed
                        </>
                      ) : exam.status === 'ongoing' ? (
                        <>
                          <PlayCircle className="w-5 h-5 mr-2" />
                          Resume Exam
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-5 h-5 mr-2" />
                          Take Exam
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Book className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-600 mb-2">No Exams Found</h3>
              <p className="text-slate-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExams;
