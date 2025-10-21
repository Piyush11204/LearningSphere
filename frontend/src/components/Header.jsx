import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


const Header = ({ isAuthenticated, username, userRole, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExamsDropdownOpen, setIsExamsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (isAuthenticated && username && username.includes('@')) {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token && userId && token.length > 20 && token !== '<valid-token>') {
        fetch(`https://learningsphere-1fgj.onrender.com/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => {
            if (res.ok) {
              return res.json();
            }
            throw new Error(`HTTP ${res.status}`);
          })
          .then((data) => {
            if (data.profile || data.role) {
              setUserProfile(data);
            }
          })
          .catch((err) => {
            console.error('Fetch user error:', err.message);
            if (err.message.includes('401')) {
              onLogout();
            }
          });
      }
    }
  }, [isAuthenticated, username, onLogout]);

  const displayName = userProfile?.profile?.name || username || 'User';
  const currentUserRole = userRole || userProfile?.role || 'learner';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="bg-white border-b-2 border-gray-100 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src="/LearningSphereLogo.png" 
                alt="LearningSphere Logo" 
                className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LearningSphere
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/sessions" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
              My Sessions
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/progress" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
              Progress
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* Exams Dropdown */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onMouseEnter={() => setIsExamsDropdownOpen(true)}
                  onMouseLeave={() => setIsExamsDropdownOpen(false)}
                  onClick={() => setIsExamsDropdownOpen(!isExamsDropdownOpen)}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group flex items-center"
                >
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                    Exams
                  </span>
                  <svg 
                    className={`w-4 h-4 ml-1 text-gray-500 transition-transform ${isExamsDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </button>

                {isExamsDropdownOpen && (
                  <div 
                    className="absolute left-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 py-4 z-50"
                    onMouseEnter={() => setIsExamsDropdownOpen(true)}
                    onMouseLeave={() => setIsExamsDropdownOpen(false)}
                  >
                    <div className="px-4 pb-3 border-b border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900">Choose Your Exam Type</h3>
                      <p className="text-sm text-gray-600">Select from our variety of assessment options</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 p-4">
                      {/* Adaptive Exam */}
                      <Link
                        to="/adaptive-exam"
                        className="group p-4 rounded-lg border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200"
                        onClick={() => setIsExamsDropdownOpen(false)}
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">Adaptive Exam</h4>
                        </div>
                        <p className="text-sm text-gray-600 group-hover:text-gray-700">
                          AI-powered exams that adjust difficulty based on your performance
                        </p>
                      </Link>

                      {/* Sectional Tests */}
                      <Link
                        to="/sectional-tests"
                        className="group p-4 rounded-lg border-2 border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all duration-200"
                        onClick={() => setIsExamsDropdownOpen(false)}
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-green-600">Sectional Tests</h4>
                        </div>
                        <p className="text-sm text-gray-600 group-hover:text-gray-700">
                          Focus on specific topics and subjects to strengthen weak areas
                        </p>
                      </Link>

                      {/* Regular Exams */}
                      <Link
                        to="/student/exams"
                        className="group p-4 rounded-lg border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all duration-200"
                        onClick={() => setIsExamsDropdownOpen(false)}
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-orange-600">Mock Exams</h4>
                        </div>
                        <p className="text-sm text-gray-600 group-hover:text-gray-700">
                          Full-length practice exams to simulate real test conditions
                        </p>
                      </Link>

                      {/* Practice Tests */}
                      <Link
                        to="/practice-exams"
                        className="group p-4 rounded-lg border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all duration-200"
                        onClick={() => setIsExamsDropdownOpen(false)}
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-purple-600">Practice Tests</h4>
                        </div>
                        <p className="text-sm text-gray-600 group-hover:text-gray-700">
                          Quick practice sessions to sharpen your skills daily
                        </p>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
           
           
            <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/blog" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
              Blog
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
          </nav>

          <div className="flex items-center space-x-4">
            
            {isAuthenticated ? (
              <>
               

                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {initials}
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-32 truncate">
                      {displayName}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-sm text-gray-500 truncate">{username}</p>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          My Profile
                        </Link>
                        <Link
                          to={currentUserRole === 'admin' ? '/admin' : currentUserRole === 'tutor' ? '/tutor/dashboard' : '/progress'}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Dashboard
                        </Link>
                        {currentUserRole === 'admin' && (
                          <Link
                            to="/admin/contacts"
                            className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Contact Management
                          </Link>
                        )}
                        {currentUserRole === 'admin' && (
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.40A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Admin Panel
                          </Link>
                        )}
                        {currentUserRole === 'admin' && (
                          <Link
                            to="/admin/blogs"
                            className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Blog Management
                          </Link>
                        )}
                        
                      </div>
                      
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={() => {
                            onLogout();
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/sessions" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                My Sessions
              </Link>
              <Link to="/progress" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Progress
              </Link>
              
              {/* Mobile Exam Links */}
              {isAuthenticated && (
                <>
                  <div className="px-3 py-2">
                    <h3 className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EXAMS</h3>
                  </div>
                  <Link to="/adaptive-exam" className="text-gray-700 hover:text-blue-600 px-6 py-2 text-base font-medium transition-colors flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    Adaptive Exam
                  </Link>
                  <Link to="/sectional-tests" className="text-gray-700 hover:text-blue-600 px-6 py-2 text-base font-medium transition-colors flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    Sectional Tests
                  </Link>
                  <Link to="/student/exams" className="text-gray-700 hover:text-blue-600 px-6 py-2 text-base font-medium transition-colors flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    AI Generated Exams
                  </Link>
                  <Link to="/practice" className="text-gray-700 hover:text-blue-600 px-6 py-2 text-base font-medium transition-colors flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    Practice Tests
                  </Link>
                </>
              )}
          
              <Link to="/matching" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Find Mentors
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                About
              </Link>
              <Link to="/blog" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Blog
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Contact
              </Link>
              {isAuthenticated && (
                <Link to="/chatbot" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  AI Assistant
                </Link>
              )}
              
              {!isAuthenticated && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <Link to="/login" className="block text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign in
                  </Link>
                  <Link to="/register" className="block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg text-base font-medium mt-2 text-center" onClick={() => setIsMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;