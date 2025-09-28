const Question = require('../models/Question');

// Get all questions (for admin/tutors)
const getAllQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 10, difficulty, tags, isActive = true } = req.query;
    
    const filter = { isActive };
    if (difficulty) filter.difficulty = difficulty;
    if (tags) filter.tags = { $regex: tags, $options: 'i' };
    
    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');
    
    const total = await Question.countDocuments(filter);
    
    res.json({
      questions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single question
const getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new question (tutors only)
const createQuestion = async (req, res) => {
  try {
    // Check if user is tutor
    if (!req.user.isTutor) {
      return res.status(403).json({ message: 'Only tutors can create questions' });
    }
    
    const { question_text, option_a, option_b, option_c, option_d, answer, tags, difficulty } = req.body;
    
    // Get next ID
    const lastQuestion = await Question.findOne().sort({ id: -1 });
    const nextId = lastQuestion ? lastQuestion.id + 1 : 1;
    
    const question = new Question({
      id: nextId,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      answer,
      tags,
      difficulty,
      bloomsTaxonomy: 'Understand', // Default
      isActive: true,
      totalAttempts: 0,
      correctAttempts: 0,
      successRate: 0
    });
    
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update question (tutors only)
const updateQuestion = async (req, res) => {
  try {
    if (!req.user.isTutor) {
      return res.status(403).json({ message: 'Only tutors can update questions' });
    }
    
    const { question_text, option_a, option_b, option_c, option_d, answer, tags, difficulty } = req.body;
    
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Update allowed fields
    question.question_text = question_text || question.question_text;
    question.option_a = option_a || question.option_a;
    question.option_b = option_b || question.option_b;
    question.option_c = option_c || question.option_c;
    question.option_d = option_d || question.option_d;
    question.answer = answer || question.answer;
    question.tags = tags || question.tags;
    question.difficulty = difficulty || question.difficulty;
    
    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete question (tutors only)
const deleteQuestion = async (req, res) => {
  try {
    if (!req.user.isTutor) {
      return res.status(403).json({ message: 'Only tutors can delete questions' });
    }
    
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Soft delete by setting isActive to false
    question.isActive = false;
    await question.save();
    
    res.json({ message: 'Question deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion
};