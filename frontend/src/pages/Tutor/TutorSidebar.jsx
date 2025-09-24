import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Video,
  PlusCircle,
  User,
  DollarSign,
  Settings,
  LogOut,
  BookOpen,
  Clock,
  Menu, // Added for toggle
  X // Added for close icon
} from 'lucide-react';

const TutorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false); // For mobile toggle
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // md breakpoint

  // Listen for resize to detect mobile
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/tutor/dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    {
      name: 'My Sessions',
      path: '/tutor/my-sessions',
      icon: Video,
      description: 'Manage Sessions'
    },
    {
      name: 'Create Session',
      path: '/tutor/create-session',
      icon: PlusCircle,
      description: 'Schedule New Session'
    },
    {
      name: 'Create Live Session',
      path: '/tutor/create-live-session',
      icon: BookOpen,
      description: 'Start Live Session'
    },
    {
      name: 'Schedule',
      path: '/tutor/schedule',
      icon: Calendar,
      description: 'Calendar View'
    },
    {
      name: 'Students',
      path: '/tutor/students',
      icon: Users,
      description: 'My Students'
    },
    {
      name: 'Earnings',
      path: '/tutor/earnings',
      icon: DollarSign,
      description: 'Payment History'
    },
    {
      name: 'Profile',
      path: '/tutor/profile',
      icon: User,
      description: 'Profile Settings'
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile Toggle Button - Always show on mobile */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-20 left-4 z-50 bg-gray-800 text-white p-2 rounded-lg md:hidden hover:bg-gray-700 transition-colors shadow-lg border border-gray-600"
        >
          {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
        </button>
      )}

      {/* Sidebar */}
      <div 
        className={`
          sticky top-16 h-screen bg-gray-900 border-r border-gray-700 
          shadow-xl transition-all duration-300 ease-in-out overflow-hidden
          ${isMobile 
            ? (isCollapsed ? 'w-0 -left-full' : 'w-64 left-0') // Mobile: slide in/out
            : (isCollapsed ? 'w-16' : 'w-64') // Desktop: collapse/expand
          }
        `}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-700 flex-shrink-0 bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <h2 className="text-white font-semibold text-lg truncate">Tutor Portal</h2>
                  <p className="text-gray-400 text-sm truncate">Growora Academy</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon className={`w-5 h-5 transition-colors flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  } ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'} truncate`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-400 truncate">
                        {item.description}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex-shrink-0 bg-gray-800">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-all duration-200 whitespace-nowrap ${
                isCollapsed ? 'justify-center px-2' : ''
              }`}
            >
              <LogOut className={`w-5 h-5 transition-colors flex-shrink-0 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default TutorSidebar;