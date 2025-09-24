import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
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
import VideoCall from './pages/LiveSession/VideoCall';
// Tutor imports
import TutorDashboard from './pages/Tutor/TutorDashboard';
import CreateSessionTutor from './pages/Tutor/CreateSession';
import CreateLiveSession from './pages/Tutor/CreateLiveSession';
import MySessions from './pages/Tutor/MySessions';
import TutorProfile from './pages/Tutor/TutorProfile';
import TutorStudents from './pages/Tutor/TutorStudents';
import TutorEarnings from './pages/Tutor/TutorEarnings';
import TutorSchedule from './pages/Tutor/TutorSchedule';
// Progress imports
import Progress from './pages/Progress';
import { useState, useEffect } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check if token exists and is valid on app load
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null' && token !== '<valid-token>' && token.length > 20) {
      setIsAuthenticated(true);
      const storedUsername = localStorage.getItem('username');
      if (storedUsername && storedUsername !== 'undefined') {
        setUsername(storedUsername);
      }
    } else {
      // Clean up any invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} username={username} onLogout={handleLogout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} />} />
            <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/live-sessions" element={<LiveSessions />} />
            <Route path="/session/:sessionId" element={<LiveSession />} />
            <Route path="/create-session" element={<CreateSession />} />
            <Route path="/video-call/:sessionId" element={<VideoCall />} />
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
            {/* Progress Routes */}
            <Route path="/progress" element={<Progress />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
