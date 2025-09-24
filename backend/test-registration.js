const mongoose = require('mongoose');
const User = require('./models/User');
const Progress = require('./models/Progress');
require('dotenv').config();

async function testRegistration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test user
    const testEmail = `test_${Date.now()}@example.com`;
    
    const user = new User({
      email: testEmail,
      password: 'password123',
      profile: { name: 'Test User' }
    });
    await user.save();
    console.log('User created:', user._id);

    // Create Progress entry and award Noobie badge
    const badgeDefinitions = Progress.getBadgeDefinitions();
    const noobieBadge = badgeDefinitions['noobie'];
    
    const progress = new Progress({
      user: user._id,
      experiencePoints: noobieBadge.xpReward,
      currentLevel: 1,
      badges: [{
        id: noobieBadge.id,
        name: noobieBadge.name,
        description: noobieBadge.description,
        category: noobieBadge.category,
        icon: noobieBadge.icon,
        xpReward: noobieBadge.xpReward,
        earnedAt: new Date()
      }]
    });
    await progress.save();
    
    console.log('Progress created with Noobie badge:', progress.badges[0].name);
    console.log('Initial XP:', progress.experiencePoints);

    // Test session joining (simulate)
    progress.experiencePoints += 100;
    progress.sessionsCompleted += 1;
    progress.currentLevel = Math.floor(progress.experiencePoints / 1000) + 1;
    
    // Check and award badges
    const newBadges = progress.checkAndAwardBadges();
    await progress.save();
    
    console.log('After joining session:');
    console.log('Total XP:', progress.experiencePoints);
    console.log('Sessions completed:', progress.sessionsCompleted);
    console.log('Level:', progress.currentLevel);
    console.log('New badges earned:', newBadges.map(b => b.name));
    console.log('Total badges:', progress.badges.length);

    // Test multiple sessions to see progression
    for (let i = 0; i < 5; i++) {
      progress.experiencePoints += 100;
      progress.sessionsCompleted += 1;
      progress.currentLevel = Math.floor(progress.experiencePoints / 1000) + 1;
      
      const moreBadges = progress.checkAndAwardBadges();
      if (moreBadges.length > 0) {
        console.log(`Session ${i + 2}: Earned badges:`, moreBadges.map(b => b.name));
      }
      await progress.save();
    }

    console.log('\nFinal status:');
    console.log('Total XP:', progress.experiencePoints);
    console.log('Sessions completed:', progress.sessionsCompleted);
    console.log('Level:', progress.currentLevel);
    console.log('All badges:', progress.badges.map(b => b.name));

    // Cleanup
    await User.findByIdAndDelete(user._id);
    await Progress.findByIdAndDelete(progress._id);
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testRegistration();