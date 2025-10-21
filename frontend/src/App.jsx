import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer.jsx';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Sessions from './pages/Sessions/Sessions';
import Matching from './pages/Matching';
import Profile from './pages/Auth/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin/Admin';
import LiveSessions from './pages/LiveSession/LiveSessions';
import LiveSession from './pages/LiveSession/LiveSession';
import CreateSession from './pages/LiveSession/CreateSession';
import VideoCall from './pages/LiveSession/VideoCall.jsx';
import VideoCallWrapper from './pages/LiveSession/VideoCallWrapper';
// Tutor imports
import TutorDashboard from './pages/Tutor/TutorDashboard';
import CreateSessionTutor from './pages/Tutor/CreateSession';
import CreateLiveSession from './pages/Tutor/CreateLiveSession';
import MySessions from './pages/Tutor/MySessions';
import TutorProfile from './pages/Tutor/TutorProfile';
import TutorStudents from './pages/Tutor/TutorStudents';
import TutorEarnings from './pages/Tutor/TutorEarnings';
import TutorSchedule from './pages/Tutor/TutorSchedule';
import QuestionsManagement from './pages/Tutor/QuestionsManagement';
import PracticeExamsManagement from './pages/Tutor/PracticeExamsManagement';
// Progress imports
import Progress from './pages/Progress';
// Exam imports (using only the Exam folder)
import StudentExams from './pages/Exam/StudentExams';
import TakeExamStudent from './pages/Exam/TakeExam';
import ExamResults from './pages/Exam/ExamResults';
import StudentReports from './pages/Exam/StudentReports';
// Practice Exam imports
import PracticeExams from './pages/PracticeExam/PracticeExams';
import TakePracticeExam from './pages/PracticeExam/TakePracticeExam';
import PracticeExamResults from './pages/PracticeExam/PracticeExamResults';
// Sectional Test imports
import SectionalTestSelection from './pages/SectionalTest/SectionalTestSelection';
import TakeSectionalTest from './pages/SectionalTest/TakeSectionalTest';
import SectionalTestResults from './pages/SectionalTest/SectionalTestResults';
import SectionSummary from './pages/SectionalTest/SectionSummary';
// Adaptive Exam imports
import StartExam from './pages/AdaptiveExam/StartExam';
import ExamInterface from './pages/AdaptiveExam/ExamInterface';
import ResultsDashboard from './pages/AdaptiveExam/ResultsDashboard';
import ExamHistory from './pages/AdaptiveExam/ExamHistory';
// Admin imports
import AdminCreateExam from './pages/Admin/AdminCreateExam';
import QuestionManagement from './pages/Admin/QuestionManagement';
import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChatbotEnhanced from './components/Chatbot/ChatbotEnhanced.jsx';
import ChatbotPage from './pages/Chatbot/ChatbotPage.jsx';
// Blog imports
import Blog from './pages/Blogs/Blog';
import BlogDetails from './pages/Blogs/Blogdetails';
import BlogManagement from './pages/Blogs/BlogManagement';
import BlogForm from './pages/Blogs/BlogForm';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Check if token exists and is valid on app load
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null' && token !== '<valid-token>' && token.length > 20) {
      setIsAuthenticated(true);
      const storedUsername = localStorage.getItem('username');
      const storedRole = localStorage.getItem('userRole');
      
      if (storedUsername && storedUsername !== 'undefined') {
        setUsername(storedUsername);
      }
      if (storedRole && storedRole !== 'undefined') {
        setUserRole(storedRole);
      }
    } else {
      // Clean up any invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUsername('');
    setUserRole('');
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} username={username} userRole={userRole} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} setUserRole={setUserRole} />} />
            <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} setUserRole={setUserRole} />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/live-sessions" element={<LiveSessions />} />
            <Route path="/session/:sessionId" element={<LiveSession />} />
            <Route path="/create-session" element={<CreateSession />} />
            <Route path="/video-call/:sessionId" element={<VideoCallWrapper />} />
            <Route path="/matching" element={<Matching />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/*" element={<Admin />} />
            {/* Tutor Routes */}
            <Route path="/tutor/dashboard" element={<TutorDashboard />} />
            <Route path="/tutor/create-session" element={<CreateSessionTutor />} />
            <Route path="/tutor/create-live-session" element={<CreateLiveSession />} />
            <Route path="/tutor/my-sessions" element={<MySessions />} />
            <Route path="/tutor/profile" element={<TutorProfile />} />
            <Route path="/tutor/students" element={<TutorStudents />} />
            <Route path="/tutor/earnings" element={<TutorEarnings />} />
            <Route path="/tutor/schedule" element={<TutorSchedule />} />
            <Route path="/tutor/questions" element={<QuestionsManagement />} />
            <Route path="/tutor/practice-exams" element={<PracticeExamsManagement />} />
            <Route path="/create-exam" element={<AdminCreateExam />} />
            <Route path="/tutor/create-exam" element={<AdminCreateExam />} />
            {/* Progress Routes */}
            <Route path="/progress" element={<Progress />} />
            {/* Student Exam Routes - Main exam system */}
            <Route path="/exams" element={<StudentExams />} />
            <Route path="/exam/:id" element={<TakeExamStudent />} />
            <Route path="/exam/:id/results" element={<ExamResults />} />
            <Route path="/reports" element={<StudentReports />} />
            {/* Practice Exam Routes - Adaptive learning system */}
            <Route path="/practice-exams" element={<PracticeExams />} />
            <Route path="/practice-exam/take/:sessionId" element={<TakePracticeExam />} />
            <Route path="/practice-exam/results/:sessionId" element={<PracticeExamResults />} />
            {/* Sectional Test Routes - Progressive difficulty testing */}
            <Route path="/sectional-tests" element={<SectionalTestSelection />} />
            <Route path="/sectional-test/take/:sessionId" element={<TakeSectionalTest />} />
            <Route path="/sectional-test/section-summary/:sessionId" element={<SectionSummary />} />
            <Route path="/sectional-test/results/:sessionId" element={<SectionalTestResults />} />
            {/* Adaptive Exam Routes - IRT-based adaptive testing */}
            <Route path="/adaptive-exam" element={<StartExam />} />
            <Route path="/adaptive-exam/exam" element={<ExamInterface />} />
            <Route path="/adaptive-exam/results" element={<ResultsDashboard />} />
            <Route path="/adaptive-exam/history" element={<ExamHistory />} />
            {/* Alternative paths for consistency */}
            <Route path="/student/exams" element={<StudentExams />} />
            <Route path="/student/exam/:id" element={<TakeExamStudent />} />
            <Route path="/student/exam/:id/results" element={<ExamResults />} />
            <Route path="/student/reports" element={<StudentReports />} />
            {/* Blog Routes */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetails />} />
            <Route path="/admin/blogs" element={<BlogManagement />} />
            <Route path="/admin/blogs/create" element={<BlogForm />} />
            <Route path="/admin/blogs/edit/:id" element={<BlogForm />} />
            <Route path="/admin/questions" element={<QuestionManagement />} />
            {/* Chatbot Page */}
            <Route path="/chatbot" element={<ChatbotPage />} />
          </Routes>
        </main>
        <Footer />
              <ChatbotEnhanced />
        
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;
