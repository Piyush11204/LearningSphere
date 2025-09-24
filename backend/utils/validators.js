const mongoose = require('mongoose');

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>?/gm, '').trim();
};

// Validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate exam data
const validateExamData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  
  if (!data.scheduledDate || new Date(data.scheduledDate) <= new Date()) {
    errors.push('Scheduled date must be in the future');
  }
  
  if (!data.duration || data.duration < 5 || data.duration > 300) {
    errors.push('Duration must be between 5 and 300 minutes');
  }
  
  if (!data.subject || data.subject.trim().length < 2) {
    errors.push('Subject must be at least 2 characters long');
  }
  
  return errors;
};

module.exports = {
  sanitizeInput,
  isValidObjectId,
  isValidEmail,
  validateExamData
};