import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TutorSidebar from './TutorSidebar';
import {
  Calendar,
  Clock,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Video,
  MapPin,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const TutorSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('month'); // month, week, day
  const navigate = useNavigate();

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const sessionsResponse = await axios.get('http://localhost:5000/api/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sessionsData = sessionsResponse.data || [];
      setSessions(sessionsData);

      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcoming = sessionsData
        .filter(session => {
          const sessionDate = new Date(session.startTime);
          return sessionDate >= now && sessionDate <= nextWeek && session.status !== 'cancelled';
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      setUpcomingSessions(upcoming);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule data');
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getSessionsForDate = (date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const handleCreateSession = () => {
    navigate('/tutor/create-session');
  };

  const handleEditSession = (sessionId) => {
    console.log('Edit session:', sessionId);
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSchedule();
      } catch (error) {
        console.error('Error deleting session:', error);
        setError('Failed to delete session');
      }
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Schedule</h1>
          <p className="mt-2 text-gray-600">Manage your tutoring sessions and availability.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              {/* Calendar Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setView('month')}
                    className={`px-3 py-1 rounded ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setView('week')}
                    className={`px-3 py-1 rounded ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setView('day')}
                    className={`px-3 py-1 rounded ${view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Day
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-6">
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((date, index) => (
                    <div
                      key={index}
                      className={`min-h-24 p-2 border border-gray-200 rounded-lg ${
                        date?.toDateString() === new Date().toDateString() ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                      }`}
                    >
                      {date && (
                        <>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {getSessionsForDate(date).map(session => (
                              <div
                                key={session._id}
                                className={`text-xs p-1 rounded ${getSessionStatusColor(session.status)} cursor-pointer`}
                                onClick={() => setSelectedDate(date)}
                              >
                                <div className="font-medium truncate">{session.title}</div>
                                <div className="text-xs opacity-75">{formatTime(session.startTime)}</div>
                                {session.meetingLink && session.status !== 'cancelled' && (
                                  <div className="text-xs opacity-75">
                                    <a
                                      href={session.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      Join Meeting
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <button
                onClick={handleCreateSession}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Session
              </button>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Sessions</h3>
              </div>
              <div className="p-6">
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.slice(0, 5).map(session => (
                      <div key={session._id} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{session.title}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSessionStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(session.startTime).toLocaleDateString()}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(session.startTime)}
                        </div>
                        {session.meetingLink && (
                          <div className="mt-1 text-xs text-gray-500 flex items-center">
                            <Video className="w-3 h-3 mr-1" />
                            <a
                              href={session.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Join Meeting
                            </a>
                          </div>
                        )}
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={() => handleEditSession(session._id)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <Edit3 className="w-3 h-3 inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session._id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            <Trash2 className="w-3 h-3 inline mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No upcoming sessions</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedDate.toLocaleDateString()}
                  </h3>
                </div>
                <div className="p-6">
                  {getSessionsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-3">
                      {getSessionsForDate(selectedDate).map(session => (
                        <div key={session._id} className="p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900">{session.title}</h4>
                          <div className="mt-1 text-sm text-gray-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatTime(session.startTime)} - {formatTime(session.endTime || new Date(new Date(session.startTime).getTime() + 60 * 60 * 1000))}
                          </div>
                          <div className="mt-1 text-sm text-gray-600 flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {session.learners?.length || 0} learners
                          </div>
                          {session.meetingLink && session.status !== 'cancelled' && (
                            <div className="mt-1 text-sm text-gray-600 flex items-center">
                              <Video className="w-4 h-4 mr-1" />
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Join Meeting
                              </a>
                            </div>
                          )}
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={() => session.meetingLink ? window.open(session.meetingLink, '_blank', 'noopener,noreferrer') : null}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Video className="w-4 h-4 inline mr-1" />
                              Join
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 text-sm">
                              <Edit3 className="w-4 h-4 inline mr-1" />
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No sessions on this date</p>
                      <button
                        onClick={handleCreateSession}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorSchedule;