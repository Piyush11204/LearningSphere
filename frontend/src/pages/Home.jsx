import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Play,
  Users,
  BookOpen,
  Award,
  Star,
  Clock,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Video,
  Calendar,
  User,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Heart,
  Target,
  Lightbulb,
  X,
  AlertCircle,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { API_URLS } from '../config/api';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFaq, setActiveFaq] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [practiceStats, setPracticeStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalXPEarned: 0,
    avgAccuracy: 0
  });

  // Check for email verification parameters
  useEffect(() => {
    const verification = searchParams.get('verification');
    const message = searchParams.get('message');
    
    if (verification && message) {
      setVerificationMessage({
        type: verification,
        text: decodeURIComponent(message)
      });
      
      // Clear the URL parameters after showing the message
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('verification');
      newSearchParams.delete('message');
      setSearchParams(newSearchParams, { replace: true });
      
      // Auto-hide the message after 10 seconds
      setTimeout(() => {
        setVerificationMessage(null);
      }, 10000);
    }
  }, [searchParams, setSearchParams]);

  // Fetch live sessions from API
  useEffect(() => {
    const fetchLiveSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URLS.LIVE_SESSIONS}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const sessions = await response.json();
          // Take only first 3 sessions for display
          setLiveSessions(sessions.slice(0, 3));
        } else {
          // If API fails, use empty array
          setLiveSessions([]);
        }
      } catch (error) {
        console.error('Error fetching live sessions:', error);
        // Use empty array as fallback
        setLiveSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveSessions();
  }, []);

  // Fetch user profile if logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');

        // If we have user data in localStorage, use it directly
        if (token && userId) {
          setUser({
            _id: userId,
            name: username || 'User',
            email: username || '', // username is stored as email in login
            profile: {
              name: username || 'User'
            }
          });
          return;
        }

        // Otherwise, fetch from API
        if (token) {
          const response = await fetch(`${API_URLS.AUTH}/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Try to use localStorage data as fallback
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');

        if (token && userId) {
          setUser({
            _id: userId,
            name: username || 'User',
            email: username || '',
            profile: {
              name: username || 'User'
            }
          });
        }
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch practice exam stats
  useEffect(() => {
    const fetchPracticeStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_URLS.PRACTICE}/history`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const sessions = await response.json();
            // Calculate practice stats
            const completedSessions = sessions.filter(s => s.status === 'completed');
            const totalXPEarned = sessions.reduce((acc, s) => acc + (s.xpEarned || 0), 0);
            const avgAccuracy = completedSessions.length > 0
              ? completedSessions.reduce((acc, s) => acc + s.accuracy, 0) / completedSessions.length
              : 0;

            setPracticeStats({
              totalSessions: sessions.length,
              completedSessions: completedSessions.length,
              totalXPEarned,
              avgAccuracy: Math.round(avgAccuracy)
            });
          }
        }
      } catch (error) {
        console.error('Error fetching practice stats:', error);
        // Use default stats
        setPracticeStats({
          totalSessions: 0,
          completedSessions: 0,
          totalXPEarned: 0,
          avgAccuracy: 0
        });
      }
    };

    fetchPracticeStats();
  }, []);

  // Fetch available exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URLS.EXAMS}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const examsData = await response.json();
          setExams(examsData.exams || []);
        } else {
          // If API fails, use empty array
          setExams([]);
        }
      } catch (error) {
        console.error('Error fetching exams:', error);
        // Use empty array as fallback
        setExams([]);
      } finally {
        setExamsLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Testimonials will be fetched from API
  const testimonials = [];

  // FAQ data will be fetched from API
  const faqs = [
    {
      question: "How does LearingSphere's matching system work?",
      answer: "Our AI-powered matching system analyzes your profile, interests, skills, and learning goals to connect you with the most suitable tutors. We consider factors like teaching style, subject expertise, availability, and past success rates to ensure the best learning experience."
    },
    {
      question: "What types of sessions are available?",
      answer: "We offer both one-on-one sessions and live group sessions. One-on-one sessions provide personalized attention, while live group sessions allow you to learn with peers and benefit from group discussions and collaborative learning."
    },
    {
      question: "How does the gamification system work?",
      answer: "Earn XP points by joining sessions, completing learning milestones, and achieving badges. Track your progress, compete on leaderboards, and unlock achievements as you advance through your learning journey."
    },
    {
      question: "Are the sessions recorded?",
      answer: "Yes, all sessions are recorded and made available to participants for future reference. You can access recordings anytime through your dashboard to review materials and reinforce your learning."
    },
    {
      question: "What if I need to reschedule a session?",
      answer: "You can reschedule sessions up to 24 hours in advance through your dashboard. Our tutors are flexible and will work with you to find a mutually convenient time."
    },
    {
      question: "How do I become a tutor on LearingSphere?",
      answer: "To become a tutor, you need to apply through our tutor registration process. You'll need to provide your credentials, teaching experience, and undergo a verification process to ensure quality education for our learners."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept various payment methods including credit/debit cards, UPI, net banking, and digital wallets. All transactions are secure and processed through encrypted payment gateways."
    },
    {
      question: "Is there a refund policy?",
      answer: "Yes, we offer a 24-hour refund policy for sessions. If you're not satisfied with the session quality, you can request a refund within 24 hours of session completion."
    }
  ];

  useEffect(() => {
    if (testimonials.length > 0) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const dismissVerificationMessage = () => {
    setVerificationMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Verification Message Notification */}
      {verificationMessage && (
        <div className={`fixed top-4 right-4 z-50 max-w-md rounded-lg shadow-lg p-4 ${
          verificationMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {verificationMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium">
                {verificationMessage.type === 'success' ? 'Email Verified!' : 'Verification Error'}
              </h3>
              <p className="text-sm mt-1">
                {verificationMessage.text}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={dismissVerificationMessage}
                className={`rounded-md inline-flex text-sm ${
                  verificationMessage.type === 'success'
                    ? 'text-green-600 hover:text-green-800 focus:text-green-800'
                    : 'text-red-600 hover:text-red-800 focus:text-red-800'
                } focus:outline-none`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
        <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {user ? (
                <>
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {user.profile?.name || user.name || 'Learner'}
                  </span>
                  !
                </>
              ) : (
                <>
                  Unlock Your Future with{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> LearingSphere Learning</span>
                </>
              )}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {user 
                ? "Continue your learning journey with expert mentors, interactive sessions, and AI-powered assessments."
                : "Connect with expert mentors, join interactive sessions, and accelerate your learning journey. LearingSphere makes quality education accessible to everyone, everywhere."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link 
                    to="/progress" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Go to Dashboard
                  </Link>
                  <Link 
                    to="/student/reports" 
                    className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:border-blue-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    View AI Reports
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/register" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Get Started Free
                  </Link>
                  <Link 
                    to="/sessions" 
                    className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:border-blue-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    Explore Sessions
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Mentors</h3>
              <p className="text-gray-600">Connect with industry professionals and experienced educators ready to guide your learning journey.</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Sessions</h3>
              <p className="text-gray-600">Join interactive video sessions, workshops, and collaborative learning experiences in real-time.</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Matching</h3>
              <p className="text-gray-600">Our AI-powered system matches you with the perfect mentors based on your interests and goals.</p>
            </div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute top-0 right-0 -mt-4 -mr-16 w-72 h-72 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-16 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-600 rounded-full opacity-10 animate-pulse"></div>
      </section>

      {/* Live Sessions Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Live Sessions Happening Now
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join interactive live sessions with expert instructors and learn in real-time
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : liveSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {liveSessions.map((session) => (
                <div key={session._id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Video className="w-12 h-12 mx-auto mb-2" />
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="font-semibold">LIVE NOW</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {session.participants?.length || 0} watching
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {session.tutor?.profile?.name?.charAt(0) || session.tutorId?.profile?.name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{session.tutor?.profile?.name || session.tutorId?.profile?.name || 'Tutor'}</h3>
                        <p className="text-sm text-gray-600">{session.tutor?.email || session.tutorId?.email || ''}</p>
                      </div>
                    </div>

                    <h4 className="text-xl font-bold text-gray-900 mb-3">{session.title}</h4>
                    <p className="text-gray-600 mb-4">{session.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(session.scheduledTime).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{session.maxParticipants || 50}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Link 
                        to={`/session/${session._id}`} 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all inline-block text-center"
                      >
                        Join Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Live Sessions Available</h3>
              <p className="text-gray-500">Check back later for upcoming live sessions</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/sessions" className="inline-flex items-center space-x-2 bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors">
              <span>View All Live Sessions</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Exams Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Available Exams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Test your knowledge with AI-powered assessments created by experts. Earn badges, gain XP, and track your progress.
            </p>
          </div>

          {examsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : exams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {exams.map((exam) => (
                <div key={exam._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="relative">
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-center text-white">
                        <BookOpen className="w-8 h-8 mx-auto mb-2" />
                        <div className="text-sm font-semibold">
                          {exam.subject || 'General'}
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        exam.status === 'live' ? 'bg-green-100 text-green-800' :
                        exam.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {exam.status === 'live' ? '🔴 LIVE' : exam.status === 'ongoing' ? '⏳ ONGOING' : '📅 SCHEDULED'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{exam.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{exam.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{exam.duration} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{exam.questions?.length || 0} Qs</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600">
                        <div>Scheduled: {new Date(exam.scheduledDate).toLocaleDateString()}</div>
                        <div>Invigilator: {exam.invigilator?.profile?.name || exam.invigilator?.email || 'Admin'}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">
                        {exam.results?.length || 0} attempts
                      </div>
                      <Link
                        to={`/exam/${exam._id}`}
                        className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold transition-all ${
                          exam.status === 'live' || exam.status === 'ongoing'
                            ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-md'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={(e) => {
                          if (exam.status !== 'live' && exam.status !== 'ongoing') {
                            e.preventDefault();
                          }
                        }}
                      >
                        {exam.status === 'live' || exam.status === 'ongoing' ? 'Take Exam' : 'Not Available'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Exams Available</h3>
              <p className="text-gray-500">Check back later for new exams</p>
            </div>
          )}

          <div className="text-center">
            <Link to="/student/exams" className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300">
              <BookOpen className="w-5 h-5" />
              <span>View All Exams</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Practice Exams Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Practice Exams with AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sharpen your skills with adaptive practice exams that adjust to your learning pace and award XP for progress.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Adaptive Difficulty</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Questions automatically adjust based on your performance, ensuring optimal challenge and learning.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Earn XP & Badges</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Gain experience points and unlock achievements as you complete practice sessions and improve.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Track Progress</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Monitor your improvement with detailed analytics and performance insights over time.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Timing</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Practice at your own pace with customizable session durations and instant feedback.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Practice Stats</h3>
                <p className="text-gray-600 mb-6">
                  {user ? 'Track your practice exam progress' : 'Sign in to start practicing'}
                </p>
              </div>

              {user ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Practice Sessions</p>
                        <p className="text-sm text-gray-600">Total completed</p>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {practiceStats.completedSessions}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">XP Earned</p>
                        <p className="text-sm text-gray-600">From practice</p>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {practiceStats.totalXPEarned}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Average Accuracy</p>
                        <p className="text-sm text-gray-600">Performance metric</p>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {practiceStats.avgAccuracy}%
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/practice-exams"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center block"
                  >
                    Start Practice Session
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Sign in to access adaptive practice exams and track your progress
                    </p>
                    <div className="space-y-3">
                      <Link
                        to="/login"
                        className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-md transition-all"
                      >
                        Sign In to Practice
                      </Link>
                      <Link
                        to="/register"
                        className="block w-full border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
                      >
                        Create Free Account
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">How Practice Exams Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Start Session</h4>
                <p className="text-gray-600">Begin with questions matched to your skill level</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Adaptive Learning</h4>
                <p className="text-gray-600">AI adjusts difficulty based on your answers in real-time</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Earn Rewards</h4>
                <p className="text-gray-600">Complete sessions to earn XP and unlock achievements</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sectional Tests Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Sectional Tests with Progressive Difficulty
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Master each difficulty level progressively. Choose your sections, achieve 40% accuracy to advance, and earn XP for each completed section.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Progressive Difficulty</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Start with Very Easy sections and work your way up to Difficult. Each section contains 10 carefully selected questions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">40% Pass Requirement</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Achieve at least 40% accuracy in each section to unlock the next difficulty level and continue your progress.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Study Recommendations</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Get personalized study suggestions when you don't pass a section, helping you focus on areas that need improvement.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">XP & Achievement System</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Earn 50 XP for each completed section and unlock special badges for sectional test milestones and achievements.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sectional Test Progress</h3>
                <p className="text-gray-600 mb-6">
                  {user ? 'Track your sectional test achievements' : 'Sign in to start sectional testing'}
                </p>
              </div>

              {user ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 text-lg">0</p>
                        <p className="text-sm text-gray-600">Sections Passed</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900 text-lg">0 XP</p>
                        <p className="text-sm text-gray-600">From Sections</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Difficulty Levels</p>
                        <p className="text-sm text-gray-600">Very Easy → Difficult</p>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/sectional-tests"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center block"
                  >
                    Start Sectional Test
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Sign in to access progressive sectional tests and track your difficulty progression
                    </p>
                    <div className="space-y-3">
                      <Link
                        to="/login"
                        className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-md transition-all"
                      >
                        Sign In to Test
                      </Link>
                      <Link
                        to="/register"
                        className="block w-full border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:border-green-600 hover:text-green-600 transition-all"
                      >
                        Create Free Account
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* How Sectional Tests Work */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">How Sectional Tests Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">1</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Select Sections</h4>
                <p className="text-gray-600">Choose which difficulty sections you want to test</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">2</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Take Test</h4>
                <p className="text-gray-600">Answer 10 questions per section within 30 minutes</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">3</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Pass or Study</h4>
                <p className="text-gray-600">Score 40%+ to pass, or get study recommendations</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">4</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Earn Rewards</h4>
                <p className="text-gray-600">Gain XP and unlock badges for your achievements</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Reports Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              AI-Powered Performance Reports
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get detailed insights into your learning progress with our advanced AI analytics and personalized recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Comprehensive Analytics</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Detailed performance reports with score distributions, subject-wise analysis, and learning trends.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Progress Tracking</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Monitor your improvement over time with XP growth charts and achievement milestones.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI Recommendations</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Personalized study recommendations and learning paths based on your performance data.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Export & Share</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Download detailed reports in multiple formats and share your achievements with others.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Your AI Report</h3>
                <p className="text-gray-600 mb-6">
                  {user ? 'Access your personalized performance report' : 'Sign in to unlock detailed analytics'}
                </p>
              </div>

              {user ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Performance Summary</p>
                        <p className="text-sm text-gray-600">Latest exam results & trends</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Learning Analytics</p>
                        <p className="text-sm text-gray-600">Subject-wise performance</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Recommendations</p>
                        <p className="text-sm text-gray-600">AI-powered study suggestions</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>

                  <Link
                    to="/student/reports"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-center block"
                  >
                    View My AI Report
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Sign in to access personalized AI reports and detailed performance analytics
                    </p>
                    <div className="space-y-3">
                      <Link
                        to="/login"
                        className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-md transition-all"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="block w-full border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose LearingSphere?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're not just another learning platform. We're your partner in growth and success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Expert Mentors</h3>
              <p className="text-gray-600 leading-relaxed">
                Learn from industry professionals with years of real-world experience in their fields.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Interactive Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Engage in live sessions, Q&A, and collaborative projects that make learning exciting.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Quality Assurance</h3>
              <p className="text-gray-600 leading-relaxed">
                Every mentor and course is vetted to ensure you receive the highest quality education.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Global Community</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with learners from around the world and build your professional network.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Personalized Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Get matched with the right mentors and courses based on your goals and interests.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Lifetime Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Access to recordings, resources, and community support for life after completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-5xl md:text-6xl font-bold mb-2">10K+</div>
              <div className="text-xl text-blue-100">Active Learners</div>
            </div>
            <div className="text-white">
              <div className="text-5xl md:text-6xl font-bold mb-2">500+</div>
              <div className="text-xl text-blue-100">Expert Mentors</div>
            </div>
            <div className="text-white">
              <div className="text-5xl md:text-6xl font-bold mb-2">50K+</div>
              <div className="text-xl text-blue-100">Sessions Completed</div>
            </div>
            <div className="text-white">
              <div className="text-5xl md:text-6xl font-bold mb-2">95%</div>
              <div className="text-xl text-blue-100">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                What Our Students Say
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Real stories from real learners who transformed their careers with LearingSphere
              </p>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="text-center">
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 rounded-full mx-auto mb-6"
                  />
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-xl md:text-2xl text-gray-700 mb-6 italic">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{testimonials[currentTestimonial].name}</div>
                    <div className="text-gray-600">{testimonials[currentTestimonial].role}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about LearingSphere
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg font-medium text-gray-900">{faq.question}</span>
                    {activeFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {activeFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Have questions? We're here to help you succeed on your learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Email Us</h3>
                  <p className="text-blue-100 mb-1">support@LearingSphere.in</p>
                  <p className="text-sm text-blue-200">Get a response within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Call Us</h3>
                  <p className="text-blue-100 mb-1">+91 98765 43210</p>
                  <p className="text-sm text-blue-200">Mon-Fri, 9AM-6PM IST</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Visit Us</h3>
                  <p className="text-blue-100 mb-1">123 Tech Park, Bangalore</p>
                  <p className="text-sm text-blue-200">Karnataka, India 560001</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Live Chat</h3>
                  <p className="text-blue-100 mb-1">Available 24/7</p>
                  <p className="text-sm text-blue-200">Get instant help from our support team</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Send us a message</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <select className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    rows="4"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
     
    </div>
  );
};

export default Home;
