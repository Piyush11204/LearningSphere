import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


const Header = ({ isAuthenticated, username, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const userRole = userProfile?.role || 'learner';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
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
            {isAuthenticated && (
              <Link to="/student/exams" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
                Exams
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
            {isAuthenticated && (
              <Link to="/sectional-tests" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
                Sectional Tests
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
           
           
            <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {isAuthenticated && (
              <Link to="/chatbot" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group">
                AI Assistant
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
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
                          to={userRole === 'admin' ? '/admin' : userRole === 'tutor' ? '/tutor/dashboard' : '/progress'}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Dashboard
                        </Link>
                        {userRole === 'admin' && (
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
                        {userRole === 'admin' && (
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
              {isAuthenticated && (
                <Link to="/student/exams" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Exams
                </Link>
              )}
              {isAuthenticated && (
                <Link to="/sectional-tests" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Sectional Tests
                </Link>
              )}
          
              <Link to="/matching" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                Find Mentors
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-base font-medium transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                About
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