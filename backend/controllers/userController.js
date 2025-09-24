const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Get all users (paginated, for admin/leaderboard)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({}).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await User.countDocuments();

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ msg: 'Server error fetching users', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ msg: 'Server error fetching user', error: error.message });
  }
};

// Create user (similar to auth, but for admin)
exports.createUser = async (req, res) => {
  try {
    const { email, password, name, interests, skills, location, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email,
      password,
      profile: { name, interests, skills, location },
      role: role || 'learner'
    });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ msg: 'Server error creating user', error: error.message });
  }
};

// Update user profile (including avatar upload)
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;
    let avatarUrl;

    // Handle avatar upload if file provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      avatarUrl = result.secure_url;
      updates['profile.avatar'] = avatarUrl;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ msg: 'Server error updating user', error: error.message });
  }
};

// Delete user (soft delete or hard, here hard for simplicity)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Cascade delete related data if needed (sessions, progress, etc.)
    // await Session.deleteMany({ tutor: req.params.id });
    // await Progress.deleteMany({ user: req.params.id });

    res.json({ msg: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ msg: 'Server error deleting user', error: error.message });
  }
};

// Switch mode (learner/tutor)
exports.switchMode = async (req, res) => {
  try {
    const { isTutor } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isTutor },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: `Mode switched to ${isTutor ? 'Tutor' : 'Learner'}`, user });
  } catch (error) {
    console.error('Switch mode error:', error);
    res.status(500).json({ msg: 'Server error switching mode', error: error.message });
  }
};

// Search users (for matching preview)
exports.searchUsers = async (req, res) => {
  try {
    const { query, role, location } = req.query;
    const searchQuery = {};

    if (query) {
      searchQuery['profile.name'] = { $regex: query, $options: 'i' };
    }
    if (role) searchQuery.role = role;
    if (location) searchQuery['profile.location'] = { $regex: location, $options: 'i' };

    const users = await User.find(searchQuery).select('-password').limit(20);
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ msg: 'Server error searching users', error: error.message });
  }
};
