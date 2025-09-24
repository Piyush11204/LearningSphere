const User = require('../models/User');

exports.findMatches = async (userId, type = 'tutor') => {
  try {
    const user = await User.findById(userId).select('profile.interests profile.skills profile.location');
    if (!user) throw new Error('User not found');

    const query = {
      role: type === 'tutor' ? 'tutor' : 'learner',
      'profile.location': user.profile.location || { $exists: true },  // Match location if available
    };

    // Weight factors for scoring
    const matches = await User.find(query).lean();
    return matches.map(match => {
      let score = 0;
      if (match.profile.interests) {
        const commonInterests = user.profile.interests.filter(i => match.profile.interests.includes(i)).length;
        score += commonInterests * 30;  // 30 points per common interest
      }
      if (match.profile.skills) {
        const commonSkills = user.profile.skills.filter(s => match.profile.skills.includes(s)).length;
        score += commonSkills * 20;  // 20 points per common skill
      }
      if (match.profile.location === user.profile.location) score += 50;  // 50 points for same location
      return { ...match, matchScore: score > 100 ? 100 : score };  // Cap at 100
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);  // Top 10
  } catch (error) {
    console.error('Matching algorithm error:', error);
    throw error;
  }
};
