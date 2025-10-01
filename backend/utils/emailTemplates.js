const { sendEmail } = require('../config/nodemailer');

exports.sendSessionReminder = async (to, session, tutorName) => {
  try {
    const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const sessionTime = new Date(session.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(session.endTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    await sendEmail({
      to,
      subject: `📚 Session Reminder: ${session.title}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Reminder</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              background-color: #f8f9fa;
            }
            .container {
              background-color: #ffffff;
              margin: 20px;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px 20px;
            }
            .session-card {
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .session-title {
              font-size: 20px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 15px;
            }
            .session-detail {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .session-detail-icon {
              width: 20px;
              height: 20px;
              margin-right: 10px;
              color: #667eea;
            }
            .join-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: 500;
              margin: 20px 0;
              text-align: center;
            }
            .join-button:hover {
              opacity: 0.9;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
            }
            .reminder-note {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .tutor-info {
              background: #e7f3ff;
              border: 1px solid #b3d9ff;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Session Reminder</h1>
              <p>Your tutoring session starts in 30 minutes!</p>
            </div>

            <div class="content">
              <div class="session-card">
                <div class="session-title">${session.title}</div>

                <div class="session-detail">
                  <span class="session-detail-icon">📅</span>
                  <strong>Date:</strong> ${sessionDate}
                </div>

                <div class="session-detail">
                  <span class="session-detail-icon">⏰</span>
                  <strong>Time:</strong> ${sessionTime} - ${endTime}
                </div>

                <div class="session-detail">
                  <span class="session-detail-icon">👨‍🏫</span>
                  <strong>Tutor:</strong> ${tutorName || 'Your Tutor'}
                </div>

                <div class="session-detail">
                  <span class="session-detail-icon">🎯</span>
                  <strong>Type:</strong> ${session.sessionType === 'video' ? 'Video Call' : 'Voice Call'}
                </div>

                ${session.description ? `
                <div class="session-detail">
                  <span class="session-detail-icon">📝</span>
                  <strong>Description:</strong> ${session.description}
                </div>
                ` : ''}
              </div>

              ${session.meetingLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${session.meetingLink}" class="join-button">
                  🎥 Join Session Now
                </a>
                <p style="margin-top: 10px; color: #6c757d; font-size: 14px;">
                  Click the button above to join your session
                </p>
              </div>
              ` : `
              <div class="reminder-note">
                <strong>⚠️ Meeting Link:</strong> Your tutor will provide the meeting link shortly.
                Please check your email for updates or contact your tutor directly.
              </div>
              `}

              <div class="tutor-info">
                <strong>💡 Pro Tips for Your Session:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                  <li>Test your camera and microphone before joining</li>
                  <li>Find a quiet, well-lit space</li>
                  <li>Have paper and pen ready for notes</li>
                  <li>Come prepared with any questions you have</li>
                </ul>
              </div>

              <div class="reminder-note">
                <strong>🔔 Reminder:</strong> This is an automated reminder sent 30 minutes before your session.
                If you need to reschedule or cancel, please contact your tutor as soon as possible.
              </div>
            </div>

            <div class="footer">
              <p>
                <strong>LearningSphere Academy</strong><br>
                Empowering learners worldwide through personalized education
              </p>
              <p style="margin-top: 10px;">
                Questions? Contact us at <a href="mailto:support@LearningSphere.com" style="color: #667eea;">support@LearningSphere.com</a>
              </p>
              <p style="margin-top: 15px; font-size: 12px; color: #adb5bd;">
                © 2025 LearningSphere. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Send session reminder error:', error);
    throw error;
  }
};

exports.sendLiveSessionInvitation = async (to, session, tutorName, studentName) => {
  try {
    const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const sessionTime = new Date(session.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(session.endTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    await sendEmail({
      to,
      subject: `🎥 You're Invited: One-on-One Live Session with ${tutorName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Live Session Invitation</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              background-color: #f8f9fa;
            }
            .container {
              background-color: #ffffff;
              margin: 20px;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px 20px;
            }
            .invitation-card {
              background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
              border: 2px solid #667eea;
              border-radius: 12px;
              padding: 25px;
              margin: 20px 0;
              text-align: center;
            }
            .invitation-icon {
              font-size: 48px;
              margin-bottom: 15px;
              display: block;
            }
            .invitation-text {
              font-size: 18px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 20px;
            }
            .session-card {
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .session-title {
              font-size: 20px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 15px;
            }
            .session-detail {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .session-detail-icon {
              width: 20px;
              height: 20px;
              margin-right: 10px;
              color: #667eea;
            }
            .join-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: 500;
              margin: 20px 0;
              text-align: center;
            }
            .join-button:hover {
              opacity: 0.9;
            }
            .tutor-info {
              background: #e7f3ff;
              border: 1px solid #b3d9ff;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
            }
            .reminder-note {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎥 Live Session Invitation</h1>
              <p>You've been personally invited to a one-on-one tutoring session!</p>
            </div>

            <div class="content">
              <div class="invitation-card">
                <span class="invitation-icon">👨‍🏫</span>
                <div class="invitation-text">
                  Hi ${studentName},<br>
                  ${tutorName} has invited you to a personalized live tutoring session!
                </div>
              </div>

              <div class="session-card">
                <div class="session-title">${session.title}</div>

                <div class="session-detail">
                  <span class="session-detail-icon">📅</span>
                  <strong>Date:</strong> ${sessionDate}
                </div>

                <div class="session-detail">
                  <span class="session-detail-icon">⏰</span>
                  <strong>Time:</strong> ${sessionTime} - ${endTime}
                </div>

                <div class="session-detail">
                  <span class="session-detail-icon">👨‍🏫</span>
                  <strong>Your Tutor:</strong> ${tutorName}
                </div>

                <div class="session-detail">
                  <span class="session-detail-icon">🎯</span>
                  <strong>Session Type:</strong> One-on-One Live Session
                </div>

                ${session.description ? `
                <div class="session-detail">
                  <span class="session-detail-icon">📝</span>
                  <strong>Session Focus:</strong> ${session.description}
                </div>
                ` : ''}
              </div>

              <div class="tutor-info">
                <strong>💡 What to Expect:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                  <li>Personalized one-on-one attention from your tutor</li>
                  <li>Interactive learning experience tailored to your needs</li>
                  <li>Real-time feedback and guidance</li>
                  <li>Direct communication to address your specific questions</li>
                </ul>
              </div>

              <div class="reminder-note">
                <strong>🔔 Important:</strong> This is a private one-on-one session just for you.
                The meeting link will be available 15 minutes before the session starts.
                You'll receive a reminder email closer to the session time.
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6c757d; font-size: 14px; margin-bottom: 15px;">
                  The meeting link will be activated closer to the session time
                </p>
                <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; display: inline-block;">
                  <strong>Session ID:</strong> ${session._id}
                </div>
              </div>
            </div>

            <div class="footer">
              <p>
                <strong>LearningSphere Academy</strong><br>
                Empowering learners worldwide through personalized education
              </p>
              <p style="margin-top: 10px;">
                Questions? Contact your tutor directly or reach us at <a href="mailto:support@LearningSphere.com" style="color: #667eea;">support@LearningSphere.com</a>
              </p>
              <p style="margin-top: 15px; font-size: 12px; color: #adb5bd;">
                © 2025 LearningSphere. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Send live session invitation error:', error);
    throw error;
  }
};

exports.sendLiveSessionConfirmation = async (to, session, studentName, tutorName) => {
  try {
    const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const sessionTime = new Date(session.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(session.endTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    await sendEmail({
      to,
      subject: `✅ Live Session Confirmed: ${session.title}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Live Session Confirmation</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              background-color: #f8f9fa;
            }
            .container {
              background-color: #ffffff;
              margin: 20px;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px 20px;
            }
            .confirmation-card {
              background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%);
              border: 2px solid #28a745;
              border-radius: 12px;
              padding: 25px;
              margin: 20px 0;
              text-align: center;
            }
            .confirmation-icon {
              font-size: 48px;
              margin-bottom: 15px;
              display: block;
            }
            .confirmation-text {
              font-size: 18px;
              font-weight: 600;
              color: #155724;
              margin-bottom: 20px;
            }
            .session-card {
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .session-title {
              font-size: 20px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 15px;
            }
            .session-detail {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .session-detail-icon {
              width: 20px;
              height: 20px;
              margin-right: 10px;
              color: #28a745;
            }
            .student-info {
              background: #e7f3ff;
              border: 1px solid #b3d9ff;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
            }
            .tips-card {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Session Confirmed</h1>
              <p>Your one-on-one live session has been successfully scheduled!</p>
            </div>

            <div class="content">
              <div class="confirmation-card">
                <span class="confirmation-icon">🎉</span>
                <div class="confirmation-text">
                  Great news, ${tutorName}!<br>
                  Your live session with ${studentName} has been confirmed.
                </div>
              </div>

              <div class="session-card">
                <div class="session-title">${session.title}</div>

                <div class="session-detail">
                  <span class="session-detail-icon">📅</span>
                  <strong>Date:</strong> ${sessionDate}
                </div>

                <div class="session-detail">
                  <span class="session-detail-icon">⏰</span>
                  <strong>Time:</strong> ${sessionTime} - ${endTime}
                </div>

                <div class="session-detail">
                  <span class="session-detail-icon">👨‍🎓</span>
                  <strong>Student:</strong> ${studentName}
                </div>

                <div class="session-detail">
                  <span class="session-detail-icon">🎯</span>
                  <strong>Session Type:</strong> One-on-One Live Session
                </div>

                ${session.description ? `
                <div class="session-detail">
                  <span class="session-detail-icon">📝</span>
                  <strong>Session Focus:</strong> ${session.description}
                </div>
                ` : ''}
              </div>

              <div class="student-info">
                <strong>👨‍🎓 Student Details:</strong>
                <p style="margin-top: 10px;">${studentName} has been notified via email and will receive session reminders automatically.</p>
              </div>

              <div class="tips-card">
                <strong>💡 Session Preparation Tips:</strong>
                <ul style="margin-top: 10px; padding-left: 20px;">
                  <li>Review the student's profile and learning goals beforehand</li>
                  <li>Prepare relevant materials or examples for the session</li>
                  <li>Test your camera and microphone 10 minutes before the session</li>
                  <li>Have a backup plan in case of technical issues</li>
                  <li>Be ready to adapt to the student's learning pace and style</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; display: inline-block;">
                  <strong>Session ID:</strong> ${session._id}<br>
                  <span style="font-size: 12px; color: #6c757d;">Share this ID with the student if needed</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>
                <strong>LearningSphere Academy</strong><br>
                Empowering learners worldwide through personalized education
              </p>
              <p style="margin-top: 10px;">
                Need help? Contact us at <a href="mailto:support@LearningSphere.com" style="color: #28a745;">support@LearningSphere.com</a>
              </p>
              <p style="margin-top: 15px; font-size: 12px; color: #adb5bd;">
                © 2025 LearningSphere. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Send live session confirmation error:', error);
    throw error;
  }
};

exports.sendVerificationEmail = async (to, verifyUrl) => {
  try {
    await sendEmail({
      to,
      subject: '🎉 Welcome to LearningSphere - Verify Your Account',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your LearningSphere Account</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              background-color: #f8f9fa;
            }
            .container {
              background-color: #ffffff;
              margin: 20px;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '🎓';
              font-size: 48px;
              display: block;
              margin-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .header p {
              margin: 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome-message {
              text-align: center;
              margin-bottom: 30px;
            }
            .welcome-message h2 {
              color: #2d3748;
              font-size: 24px;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .welcome-message p {
              color: #6c757d;
              font-size: 16px;
              line-height: 1.6;
            }
            .verification-card {
              background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
              border: 2px solid #667eea;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .verification-icon {
              font-size: 48px;
              margin-bottom: 20px;
              display: block;
            }
            .verification-text {
              font-size: 18px;
              font-weight: 500;
              color: #2d3748;
              margin-bottom: 25px;
            }
            .verify-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
              transition: all 0.3s ease;
            }
            .verify-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }
            .security-info {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
            }
            .security-info h3 {
              color: #856404;
              font-size: 16px;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .security-info p {
              color: #856404;
              font-size: 14px;
              margin: 0;
              line-height: 1.5;
            }
            .features {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 25px;
              margin: 30px 0;
            }
            .features h3 {
              color: #2d3748;
              font-size: 20px;
              margin-bottom: 20px;
              text-align: center;
              font-weight: 600;
            }
            .feature-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 20px;
              margin-top: 20px;
            }
            .feature-item {
              text-align: center;
              padding: 15px;
              background: white;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            .feature-icon {
              font-size: 24px;
              margin-bottom: 10px;
              display: block;
            }
            .feature-text {
              font-size: 14px;
              color: #6c757d;
              font-weight: 500;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
              border-top: 1px solid #e9ecef;
            }
            .footer-links {
              margin: 20px 0;
            }
            .footer-links a {
              color: #667eea;
              text-decoration: none;
              margin: 0 10px;
              font-weight: 500;
            }
            .footer-links a:hover {
              text-decoration: underline;
            }
            .expiry-notice {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #721c24;
              font-size: 14px;
            }
            .support-info {
              background: #d1ecf1;
              border: 1px solid #bee5eb;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #0c5460;
              font-size: 14px;
            }
            @media (max-width: 480px) {
              .container {
                margin: 10px;
              }
              .header {
                padding: 30px 15px;
              }
              .header h1 {
                font-size: 24px;
              }
              .content {
                padding: 25px 20px;
              }
              .feature-grid {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to LearningSphere!</h1>
              <p>Let's verify your account to get started</p>
            </div>

            <div class="content">
              <div class="welcome-message">
                <h2>🎉 Almost there!</h2>
                <p>Thank you for joining LearningSphere Academy. We're excited to help you on your learning journey!</p>
              </div>

              <div class="verification-card">
                <span class="verification-icon">✉️</span>
                <div class="verification-text">
                  Please verify your email address to activate your account
                </div>
                <a href="${verifyUrl}" class="verify-button">
                  ✅ Verify My Account
                </a>
                <p style="margin-top: 15px; color: #6c757d; font-size: 14px;">
                  Click the button above to complete your registration
                </p>
              </div>

              <div class="expiry-notice">
                <strong>⏰ Link Expires:</strong> This verification link will expire in 24 hours for security reasons.
                If it expires, you can request a new verification email from your account settings.
              </div>

              <div class="features">
                <h3>🚀 What you can do with LearningSphere:</h3>
                <div class="feature-grid">
                  <div class="feature-item">
                    <span class="feature-icon">📚</span>
                    <div class="feature-text">Access personalized learning paths</div>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">👨‍🏫</span>
                    <div class="feature-text">Connect with expert tutors</div>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">🎯</span>
                    <div class="feature-text">Track your progress with gamification</div>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">🌟</span>
                    <div class="feature-text">Earn badges and certificates</div>
                  </div>
                </div>
              </div>

              <div class="security-info">
                <h3>🔒 Security & Privacy</h3>
                <p>Your email verification helps us ensure the security of your account and protect your personal information.
                We never share your data with third parties without your consent.</p>
              </div>

              <div class="support-info">
                <strong>💬 Need Help?</strong> If you didn't create this account or have any questions,
                please contact our support team at <a href="mailto:support@LearningSphere.com" style="color: #0c5460; font-weight: 500;">support@LearningSphere.com</a>
              </div>
            </div>

            <div class="footer">
              <p>
                <strong>LearningSphere Academy</strong><br>
                Empowering learners worldwide through personalized education
              </p>

              <div class="footer-links">
                <a href="https://LearningSphere.com">Visit Website</a> |
                <a href="https://LearningSphere.com/privacy">Privacy Policy</a> |
                <a href="https://LearningSphere.com/terms">Terms of Service</a>
              </div>

              <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
                © 2025 LearningSphere. All rights reserved.<br>
                This email was sent to you because you registered for a LearningSphere account.
                If you no longer wish to receive these emails, you can unsubscribe from your account settings.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    throw error;
  }
};
