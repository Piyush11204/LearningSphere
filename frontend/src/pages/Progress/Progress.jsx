import React, { useState, useEffect } from 'react';
import { Learner, Tutor, Admin } from './index';

const Progress = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          setUserRole('learner'); // Default to learner view if not authenticated
          setLoading(false);
          return;
        }

        // Fetch user data to get role
        const response = await fetch(`https://learningsphere-1fgj.onrender.com/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            setUserRole('learner');
          } else {
            throw new Error(`Failed to fetch user data: ${response.status}`);
          }
        } else {
          const userData = await response.json();
          setUserRole(userData.role || 'learner');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error getting user role:', error);
        setUserRole('learner'); // Default fallback
        setLoading(false);
      }
    };

    getUserRole();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render appropriate component based on user role
  switch (userRole) {
    case 'admin':
      return <Admin />;
    case 'tutor':
      return <Tutor />;
    case 'learner':
    default:
      return <Learner />;
  }
};

export default Progress;