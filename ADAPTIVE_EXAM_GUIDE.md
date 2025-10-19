# 🧠 Adaptive Exam System - User Guide

## What is Adaptive Exam?

The Adaptive Exam System is an intelligent testing platform that adjusts question difficulty based on your performance in real-time. Similar to standardized tests like GRE and GMAT, it provides a more accurate assessment of your abilities by presenting questions that match your skill level.

## Key Features

### 🎯 Intelligent Adaptation
- Questions automatically adjust based on your answers
- Correct answers lead to harder questions
- Incorrect answers lead to easier questions
- Precise ability measurement using IRT (Item Response Theory)

### 📊 Detailed Analytics
- Real-time accuracy tracking
- Ability level progression
- Time statistics per question
- Difficulty breakdown analysis

### 🏆 Gamification
- Earn XP for each exam
- Unlock badges for achievements
- Track your progress over time
- Compete with yourself to improve

### 💾 Session Management
- Automatic progress saving
- Resume interrupted exams
- View exam history
- Abandon and restart anytime

## How to Use

### Starting an Exam

1. **Navigate to Adaptive Exam**
   - Click on "Adaptive Exam" from the main menu
   - You'll see your stats if you've taken exams before

2. **Check for Active Sessions**
   - The system automatically checks for active sessions
   - If you have an active session, you'll see:
     - Session details (questions answered, accuracy, ability)
     - Option to **Resume** the exam
     - Option to **Abandon** and start new

3. **Start New Exam**
   - If no active session, click "Start Adaptive Exam"
   - The system will enter fullscreen mode
   - Your first question will appear

### Taking the Exam

1. **Read the Question**
   - Each question displays:
     - Difficulty level (Very Easy, Easy, Moderate, Difficult)
     - Question text
     - Four answer options (A, B, C, D)

2. **Select Your Answer**
   - Click on your chosen option
   - The selected option will be highlighted

3. **Submit Answer**
   - Click "Submit Answer" button
   - System tracks time spent on each question
   - Immediate feedback shows if you're correct/incorrect

4. **View Feedback**
   - Green = Correct answer ✅
   - Red = Incorrect answer ❌
   - Your ability level updates instantly
   - Next question loads automatically (2 seconds)

5. **Track Progress**
   - Progress bar at bottom shows completion
   - Stats panel shows:
     - Current question number
     - Accuracy percentage
     - Ability level
     - Correct answers count

### Exam Features

#### ⏱️ Time Tracking
- Timer shows total elapsed time
- No time limit per question
- Take your time to think

#### 📱 Fullscreen Mode
- Minimizes distractions
- Can exit fullscreen using button
- Warning shown if fullscreen is exited

#### 🚪 Exit Anytime
- Click "Exit Exam" button
- Exam will be marked as abandoned
- Can resume or start new later

### Viewing Results

After completing ~20 questions:

1. **Automatic Redirect**
   - Results page loads automatically
   - Final feedback on last question shown for 2 seconds

2. **Performance Summary**
   - **Accuracy**: Overall percentage correct
   - **Final Ability**: Your measured skill level
   - **XP Earned**: Experience points awarded
   - **Time Spent**: Total exam duration

3. **Detailed Analytics**
   - **Difficulty Breakdown**: Performance by difficulty level
   - **Response Timeline**: Question-by-question review
   - **Time Statistics**: Fastest, average, slowest responses
   - **Badges Earned**: Any new achievements unlocked

4. **Next Steps**
   - **Take Another Exam**: Start fresh session
   - **Back to Home**: Return to dashboard

## Understanding Your Metrics

### Ability Level
- **Range**: 0.0 to 3.0+
- **0.0 - 0.5**: Beginner
- **0.5 - 1.0**: Intermediate
- **1.0 - 1.5**: Advanced
- **1.5 - 2.0**: Expert
- **2.0+**: Master

### Accuracy Grades
- **90%+**: Exceptional ⭐⭐⭐
- **80-89%**: Excellent ⭐⭐
- **70-79%**: Good ⭐
- **60-69%**: Average
- **Below 60%**: Needs Improvement

### XP Calculation
- Base: 50 XP for completion
- Correct answers: 10 XP each
- Accuracy bonuses:
  - 90%+: +100 XP
  - 80-89%: +75 XP
  - 70-79%: +50 XP
  - 60-69%: +25 XP
- Difficulty bonuses:
  - Difficult questions: +20 XP per correct
  - Moderate questions: +10 XP per correct
- Speed bonus: +50 XP (if avg < 15s and accuracy ≥ 70%)
- Ability bonuses:
  - 2.0+: +100 XP
  - 1.5-1.9: +50 XP

## Badges & Achievements

### Milestone Badges
- 🎯 **First Adaptive Attempt** - Complete 1 exam
- 📚 **Persistent Learner** - Complete 5 exams
- 🌟 **Dedicated Student** - Complete 10 exams
- 🏆 **Master Learner** - Complete 25 exams
- 👑 **Adaptive Legend** - Complete 50 exams

### Performance Badges
- 🎓 **Accuracy Expert** - Achieve 80%+ accuracy
- ⚡ **High Ability** - Reach ability level 2.0+

## Tips for Success

### Before Starting
1. ✅ Find a quiet environment
2. ✅ Ensure stable internet connection
3. ✅ Allow fullscreen mode
4. ✅ Set aside 15-30 minutes

### During the Exam
1. 📖 Read questions carefully
2. 🤔 Take time to think
3. 💪 Don't rush - accuracy matters more
4. 🎯 Focus on understanding, not guessing
5. 📈 Watch your ability level trend

### After the Exam
1. 📊 Review your analytics
2. 🔍 Identify weak areas
3. 📚 Study topics you struggled with
4. 🔄 Take another exam to improve
5. 🏆 Track your progress over time

## Troubleshooting

### "You already have an active exam session"
**Solution**: The page will show your active session with options to resume or abandon it.

### Questions not loading
**Solution**: 
- Check internet connection
- External API may be sleeping (wait 30 seconds and try again)
- Check browser console for errors

### Fullscreen issues
**Solution**:
- Click the "Enter Fullscreen" button
- Allow fullscreen in browser permissions
- Press F11 as alternative

### Session lost after browser close
**Solution**:
- Return to adaptive exam page
- Active session will be detected
- Click "Resume Exam"

### Results not showing
**Solution**:
- Check that exam was completed (not abandoned)
- Session ID must be valid
- Try viewing from exam history

## Best Practices

### For Accurate Assessment
- Don't use external resources
- Answer honestly without guessing randomly
- Complete exam in one sitting when possible
- Take breaks between exams, not during

### For Improvement
- Take exams regularly (once a week)
- Review analytics after each exam
- Focus on weak difficulty levels
- Track ability level progression
- Aim for consistent accuracy improvement

## Technical Details

### Question Selection Algorithm
- Uses Item Response Theory (IRT)
- Adjusts based on correctness AND time
- Maintains difficulty distribution
- ~20 questions for accurate measurement

### Data Stored
- All responses (questions, answers, time)
- Ability progression
- Difficulty breakdown
- Time statistics
- XP and badges earned

### Privacy
- All data is associated with your account
- No data shared with third parties
- Analytics are personal and private

## Support

Need help?
- Check the FAQ section
- Contact support team
- Review tutorial videos
- Join community forums

---

**Good luck with your adaptive exams! 🚀**

Remember: The system is designed to challenge you at your level. Don't worry if questions get harder - that means you're doing well!
