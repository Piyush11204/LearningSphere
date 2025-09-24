import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutorSidebar from './TutorSidebar';
import {
  User,
  Mail,
  MapPin,
  Phone,
  Edit3,
  Save,
  X,
  Camera,
  Star,
  Award,
  BookOpen,
  Calendar,
  DollarSign
} from 'lucide-react';

const TutorProfile = () => {
  const [profile, setProfile] = useState({
    email: '',
    profile: {
      name: '',
      avatar: '',
      bio: '',
      interests: [],
      skills: [],
      location: '',
      phone: ''
    },
    role: '',
    isTutor: false,
    createdAt: '',
    stats: {
      totalSessions: 0,
      completedSessions: 0,
      averageRating: 0,
      totalEarnings: 0
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      // Get current user info - we'll need to decode the token or use a different approach
      // For now, let's assume we can get user ID from localStorage or token
      const decoded = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      const userId = decoded.id;

      const userResponse = await axios.get(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userData = userResponse.data;
      setProfile(userData);
      setEditedProfile({
        name: userData.profile?.name || '',
        bio: userData.profile?.bio || '',
        interests: userData.profile?.interests || [],
        skills: userData.profile?.skills || [],
        location: userData.profile?.location || '',
        phone: userData.profile?.phone || ''
      });

      // Fetch additional stats
      const sessionsResponse = await axios.get('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sessions = sessionsResponse.data || [];
      const completedSessions = sessions.filter(session => session.status === 'completed');

      setProfile(prev => ({
        ...prev,
        stats: {
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          averageRating: 4.8, // Mock data
          totalEarnings: completedSessions.length * 25 // Assuming $25 per session
        }
      }));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const updates = {
        'profile.name': editedProfile.name,
        'profile.bio': editedProfile.bio,
        'profile.interests': editedProfile.interests,
        'profile.skills': editedProfile.skills,
        'profile.location': editedProfile.location,
        'profile.phone': editedProfile.phone
      };

      const response = await axios.put(
        `http://localhost:5000/api/users/${profile._id}`,
        updates,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setProfile(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...response.data.profile
        }
      }));

      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({
      name: profile.profile?.name || '',
      bio: profile.profile?.bio || '',
      interests: profile.profile?.interests || [],
      skills: profile.profile?.skills || [],
      location: profile.profile?.location || '',
      phone: profile.profile?.phone || ''
    });
    setIsEditing(false);
    setError('');
  };

  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setEditedProfile(prev => ({
      ...prev,
      [field]: array
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.put(
        `http://localhost:5000/api/users/${profile._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setProfile(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar: response.data.profile.avatar
        }
      }));

      setSuccess('Avatar updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError('Failed to upload avatar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TutorSidebar />

      <div className="flex-1 p-4 md:p-8 pt-20 md:pt-20">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your tutor profile and settings.</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={profile.profile?.avatar || '/default-avatar.png'}
                    alt="Profile"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
                  />
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  {profile.profile?.name || 'Tutor Name'}
                </h2>
                <p className="text-gray-600">{profile.email}</p>

                <div className="mt-4 flex justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{profile.stats.totalSessions}</div>
                    <div className="text-sm text-gray-500">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{profile.stats.averageRating}</div>
                    <div className="text-sm text-gray-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">${profile.stats.totalEarnings}</div>
                    <div className="text-sm text-gray-500">Earned</div>
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4 inline mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                {isEditing && (
                  <div className="space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : <><Save className="w-4 h-4 inline mr-1" />Save</>}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      <X className="w-4 h-4 inline mr-1" />Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profile?.name || 'Not provided'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <p className="text-gray-900">{profile.email}</p>
                  <p className="text-sm text-gray-500">Email cannot be changed</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={editedProfile.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell students about yourself, your teaching experience, and what makes you unique..."
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profile?.bio || 'No bio provided'}</p>
                  )}
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Award className="w-4 h-4 inline mr-2" />
                    Skills
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.skills.join(', ')}
                      onChange={(e) => handleArrayChange('skills', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter skills separated by commas (e.g., Mathematics, Physics, Programming)"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.profile?.skills?.length > 0 ? (
                        profile.profile.skills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No skills listed</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Star className="w-4 h-4 inline mr-2" />
                    Interests
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.interests.join(', ')}
                      onChange={(e) => handleArrayChange('interests', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter interests separated by commas (e.g., Technology, Science, Art)"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.profile?.interests?.length > 0 ? (
                        profile.profile.interests.map((interest, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                            {interest}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No interests listed</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedProfile.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City, Country"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profile?.location || 'Not provided'}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profile?.phone || 'Not provided'}</p>
                  )}
                </div>

                {/* Account Info */}
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <span className="ml-2 text-gray-900 capitalize">{profile.role}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Member since:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;