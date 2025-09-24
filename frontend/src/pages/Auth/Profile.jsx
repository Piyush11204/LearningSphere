import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URLS from '../../config/api';

const Profile = () => {
  const [user, setUser] = useState({});
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    phone: '',
    interests: '',
    skills: ''
  });
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      setError('Not authenticated');
      setLoading(false);
      navigate('/login');
      return;
    }

    // Fetch user data, progress, and sessions
    Promise.all([
      fetch(`${API_URLS.USERS}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URLS.PROGRESS}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_URLS.SESSIONS}?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ])
      .then(async ([userRes, progressRes, sessionsRes]) => {
        const userData = userRes.ok ? await userRes.json() : null;
        const progressData = progressRes.ok ? await progressRes.json() : null;
        const sessionsData = sessionsRes.ok ? await sessionsRes.json() : [];

        if (userData) {
          setUser(userData);
          setEditForm({
            name: userData.profile?.name || '',
            bio: userData.profile?.bio || '',
            location: userData.profile?.location || '',
            phone: userData.profile?.phone || '',
            interests: userData.profile?.interests?.join(', ') || '',
            skills: userData.profile?.skills?.join(', ') || ''
          });
        }
        
        setProgress(progressData);
        setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch profile data error:', err);
        setError('Failed to load profile data');
        setLoading(false);
      });
  }, [navigate]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    try {
      const updateData = {
        'profile.name': editForm.name,
        'profile.bio': editForm.bio,
        'profile.location': editForm.location,
        'profile.phone': editForm.phone,
        'profile.interests': editForm.interests.split(',').map(item => item.trim()).filter(Boolean),
        'profile.skills': editForm.skills.split(',').map(item => item.trim()).filter(Boolean)
      };

      const response = await fetch(`${API_URLS.USERS}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Error updating profile');
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <img
                  src={user.profile?.avatar || 'https://via.placeholder.com/120'}
                  alt="Profile Avatar"
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-center md:text-left flex-grow">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user.profile?.name || 'Anonymous User'}
                </h1>
                <p className="text-blue-100 text-lg mb-2">{user.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'admin' ? 'bg-red-500 text-white' :
                    user.role === 'tutor' ? 'bg-green-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {user.role || 'learner'}
                  </span>
                  {user.isVerified && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleEditToggle}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview', icon: 'user' },
                { id: 'progress', name: 'Progress', icon: 'chart' },
                { id: 'history', name: 'History', icon: 'clock' },
                { id: 'achievements', name: 'Achievements', icon: 'trophy' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Interests (comma-separated)</label>
                        <input
                          type="text"
                          value={editForm.interests}
                          onChange={(e) => handleInputChange('interests', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="JavaScript, React, Node.js"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma-separated)</label>
                      <input
                        type="text"
                        value={editForm.skills}
                        onChange={(e) => handleInputChange('skills', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Web Development, Programming, Teaching"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Email</span>
                            <span className="text-gray-900">{user.email}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Phone</span>
                            <span className="text-gray-900">{user.profile?.phone || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Location</span>
                            <span className="text-gray-900">{user.profile?.location || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Joined</span>
                            <span className="text-gray-900">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bio</h3>
                        <p className="text-gray-700 leading-relaxed">
                          {user.profile?.bio || 'No bio available. Click "Edit Profile" to add one.'}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.profile?.interests?.length > 0 ? (
                            user.profile.interests.map((interest, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                              >
                                {interest}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">No interests added yet</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {user.profile?.skills?.length > 0 ? (
                            user.profile.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">No skills added yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div className="space-y-6">
                {progress ? (
                  <>
                    {/* Progress Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100">Current Level</p>
                            <p className="text-3xl font-bold">{progress.currentLevel}</p>
                          </div>
                          <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100">Sessions Completed</p>
                            <p className="text-3xl font-bold">{progress.sessionsCompleted}</p>
                          </div>
                          <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100">Total Hours</p>
                            <p className="text-3xl font-bold">{progress.totalHours}</p>
                          </div>
                          <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100">Experience Points</p>
                            <p className="text-3xl font-bold">{progress.experiencePoints}</p>
                          </div>
                          <div className="w-12 h-12 bg-orange-400 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="bg-gray-100 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Level Progress</h3>
                        <span className="text-sm text-gray-600">
                          Level {progress.currentLevel} → Level {progress.currentLevel + 1}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${((progress.experiencePoints % 1000) / 1000) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {progress.experiencePoints % 1000} / 1000 XP to next level
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Data</h3>
                    <p className="text-gray-600">Complete your first session to start tracking progress!</p>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Session History</h3>
                {sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session, index) => (
                      <div key={session._id || index} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              {session.title || 'Untitled Session'}
                            </h4>
                            <p className="text-gray-600 mb-2">{session.description || 'No description'}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <span>Date: {new Date(session.startTime || session.createdAt).toLocaleDateString()}</span>
                              <span>Type: {session.type || 'Unknown'}</span>
                              <span>Duration: {session.duration || 'N/A'} minutes</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            session.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Session History</h3>
                    <p className="text-gray-600">Book your first session to see your history here!</p>
                  </div>
                )}
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Badges & Achievements</h3>
                {progress?.badges?.length > 0 || progress?.milestones?.length > 0 ? (
                  <>
                    {/* Badges */}
                    {progress.badges?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Earned Badges</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {progress.badges.map((badge, index) => (
                            <div key={index} className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-4 text-center">
                              <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-2xl">{badge.icon || '🏆'}</span>
                              </div>
                              <p className="text-sm font-medium text-yellow-900 capitalize">
                                {badge.name || badge.id || 'Unknown Badge'}
                              </p>
                              {badge.description && (
                                <p className="text-xs text-yellow-800 mt-1">
                                  {badge.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    {progress.milestones?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Milestones</h4>
                        <div className="space-y-3">
                          {progress.milestones.map((milestone, index) => (
                            <div key={index} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{milestone.milestone}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(milestone.achievedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Achievements Yet</h3>
                    <p className="text-gray-600">Complete sessions to earn badges and unlock achievements!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;