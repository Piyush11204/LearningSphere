import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URLS } from '../../config/api';
import { FileText, Download, BarChart3, TrendingUp, Award, Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';

const StudentReports = () => {
  const [report, setReport] = useState('');
  const [userId, setUserId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [reportDate, setReportDate] = useState(null);

  // Function to format the report text by removing markdown and improving presentation
  const formatReport = (text) => {
    if (!text) return null;

    // Split the text into lines
    const lines = text.split('\n');
    const formattedContent = [];

    lines.forEach((line, index) => {
      let formattedLine = line.trim();
      
      if (!formattedLine) {
        // Empty line - add spacing
        formattedContent.push(<br key={index} />);
        return;
      }

      // Remove markdown formatting
      formattedLine = formattedLine
        .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers
        .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers
        .replace(/#{1,6}\s*/g, '')        // Remove heading markers
        .replace(/`(.*?)`/g, '$1')        // Remove code markers
        .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove link formatting

      // Check if it's a heading (starts with caps and ends with colon or is all caps)
      const isHeading = formattedLine.endsWith(':') || 
                       (formattedLine === formattedLine.toUpperCase() && formattedLine.length > 5);

      // Check if it's a bullet point or list item
      const isBulletPoint = formattedLine.startsWith('-') || 
                           formattedLine.startsWith('•') || 
                           formattedLine.match(/^\d+\./);

      // Format based on line type
      if (isHeading) {
        formattedContent.push(
          <div key={index} className="mb-4 mt-6 first:mt-0">
            <h3 className="text-lg font-bold text-slate-800 border-b-2 border-blue-200 pb-2">
              {formattedLine.replace(':', '')}
            </h3>
          </div>
        );
      } else if (isBulletPoint) {
        const bulletText = formattedLine.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
        formattedContent.push(
          <div key={index} className="flex items-start mb-2 ml-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span className="text-slate-700">{bulletText}</span>
          </div>
        );
      } else {
        // Regular paragraph text
        formattedContent.push(
          <p key={index} className="mb-3 text-slate-700 leading-relaxed">
            {formattedLine}
          </p>
        );
      }
    });

    return <div>{formattedContent}</div>;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URLS.AUTH}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(res.data.user._id);
        setUserProfile(res.data.user);
        
        // Fetch user progress data
        try {
          const progressRes = await axios.get(`${API_URLS.PROGRESS}/user/${res.data.user._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserProgress(progressRes.data.progress);
        } catch (progressError) {
          console.error('Error fetching progress:', progressError);
        }
      } catch (error) {
        console.error('Error:', error.response?.data?.message || error.message);
      }
    };
    fetchUserData();
  }, []);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URLS.REPORTS}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data.report);
      setReportDate(new Date()); // Set the report generation date
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Error:', error.response?.data?.message || error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    // Create PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text('Performance Report', 20, 30);

    // Add user information
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55); // Dark gray
    doc.text(`Student: ${userProfile?.profile?.name || userProfile?.email || 'N/A'}`, 20, 45);
    
    // Add date - use report generation date instead of current date
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // Gray color
    const displayDate = reportDate ? reportDate.toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Generated on: ${displayDate}`, 20, 55);

    let yPosition = 75;

    // Add user profile section
    if (userProfile) {
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('Student Profile', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);

      const profileInfo = [
        `Email: ${userProfile.email}`,
        `Role: ${userProfile.role}`,
        `Location: ${userProfile.profile?.location || 'Not specified'}`,
        `Phone: ${userProfile.profile?.phone || 'Not specified'}`
      ];

      if (userProfile.profile?.bio) {
        profileInfo.push(`Bio: ${userProfile.profile.bio}`);
      }

      if (userProfile.profile?.interests?.length > 0) {
        profileInfo.push(`Interests: ${userProfile.profile.interests.join(', ')}`);
      }

      if (userProfile.profile?.skills?.length > 0) {
        profileInfo.push(`Skills: ${userProfile.profile.skills.join(', ')}`);
      }

      profileInfo.forEach((info) => {
        doc.text(info, 20, yPosition);
        yPosition += 8;
      });

      yPosition += 10;
    }

    // Add experience and level section
    if (userProgress) {
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('Experience & Level', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);

      const expInfo = [
        `Current Level: ${userProgress.currentLevel || 1}`,
        `Experience Points: ${userProgress.experiencePoints || 0} XP`,
        `Total Sessions: ${userProgress.sessionsCompleted || 0}`,
        `Live Sessions: ${userProgress.liveSessionsAttended || 0}`,
        `Total Hours: ${userProgress.totalHours || 0}h`
      ];

      expInfo.forEach((info) => {
        doc.text(info, 20, yPosition);
        yPosition += 8;
      });

      yPosition += 10;
    }

    // Add badges section
    if (userProgress?.badges?.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('Earned Badges', 20, yPosition);
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);

      userProgress.badges.forEach((badge) => {
        doc.text(`${badge.icon} ${badge.name}: ${badge.description}`, 20, yPosition);
        yPosition += 8;
      });

      yPosition += 10;
    }

    // Clean the report text for PDF
    const cleanReport = report
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers
      .replace(/#{1,6}\s*/g, '')        // Remove heading markers
      .replace(/`(.*?)`/g, '$1')        // Remove code markers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove link formatting

    // Add report content
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text('Performance Analysis', 20, yPosition);
    yPosition += 15;

    // Split text into lines and add to PDF
    const lines = cleanReport.split('\n');
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = doc.internal.pageSize.width - 2 * margin;

    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55); // Dark gray

    lines.forEach((line) => {
      if (line.trim()) {
        const textLines = doc.splitTextToSize(line.trim(), maxWidth);

        textLines.forEach((textLine) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin + 20;
          }
          doc.text(textLine, margin, yPosition);
          yPosition += 7;
        });
      } else {
        yPosition += 5; // Add some space for empty lines
      }
    });

    // Add performance metrics at the bottom
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin + 20;
    }

    yPosition += 20;
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text('Performance Metrics', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);

    // Use actual data from user progress and exam stats
    const metrics = [];
    
    if (userProgress) {
      metrics.push(`Total Sessions: ${userProgress.sessionsCompleted || 0}`);
      metrics.push(`Live Sessions Attended: ${userProgress.liveSessionsAttended || 0}`);
      metrics.push(`Total Study Hours: ${userProgress.totalHours || 0}h`);
      metrics.push(`Current Level: ${userProgress.currentLevel || 1}`);
      metrics.push(`Experience Points: ${userProgress.experiencePoints || 0} XP`);
      metrics.push(`Badges Earned: ${userProgress.badges?.length || 0}`);
    }

    if (userProfile?.examStats) {
      metrics.push(`Total Exams: ${userProfile.examStats.totalExams || 0}`);
      metrics.push(`Exams Passed: ${userProfile.examStats.examsPassed || 0}`);
      metrics.push(`Exams Failed: ${userProfile.examStats.examsFailed || 0}`);
      metrics.push(`Average Score: ${userProfile.examStats.averageScore?.toFixed(1) || 0}%`);
      metrics.push(`Best Score: ${userProfile.examStats.bestScore || 0}%`);
      metrics.push(`Current Pass Streak: ${userProfile.examStats.examStreak?.current || 0}`);
      metrics.push(`Longest Pass Streak: ${userProfile.examStats.examStreak?.longest || 0}`);
    }

    metrics.forEach((metric) => {
      doc.text(metric, margin, yPosition);
      yPosition += 8;
    });

    // Save the PDF with proper filename
    const userName = userProfile?.profile?.name || userProfile?.email || 'user';
    const fileName = `performance-report-${userName.replace(/\s+/g, '-').toLowerCase()}-${displayDate.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);

    toast.success('PDF report downloaded successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 text-slate-700">
      {/* Header Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-slate-200 shadow-sm">
            <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Performance Analytics
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-800 leading-tight">
            My{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Reports
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Track your academic progress, view detailed performance analytics, and download comprehensive reports.
          </p>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-20 blur-xl animate-pulse delay-1000"></div>
      </section>

      {/* Generate Report Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg p-8 border border-slate-100">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-6">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-slate-800">
                  Generate Your{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Performance Report
                  </span>
                </h2>
                <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                  Get a comprehensive overview of your academic performance, including exam results, attendance, and progress metrics.
                </p>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className={`inline-flex items-center px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    isGenerating
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-2xl hover:scale-105'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5 mr-3" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report Display Section */}
      {report && (
        <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Award className="w-6 h-6 text-white" />
                      <h2 className="text-2xl font-bold text-white">Performance Report</h2>
                    </div>
                    <button
                      onClick={handleDownloadReport}
                      className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="prose prose-slate max-w-none">
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <div className="text-slate-700 font-medium leading-relaxed text-sm">
                        {formatReport(report)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-700">Current Level</p>
                          <p className="text-2xl font-bold text-blue-800">{userProgress?.currentLevel || 1}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                      <div className="flex items-center space-x-3">
                        <Award className="w-6 h-6 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium text-emerald-700">Experience Points</p>
                          <p className="text-2xl font-bold text-emerald-800">{userProgress?.experiencePoints || 0} XP</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-6 h-6 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-purple-700">Total Sessions</p>
                          <p className="text-2xl font-bold text-purple-800">{userProgress?.sessionsCompleted || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional User Details Section */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-4">Exam Statistics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Total Exams:</span>
                          <span className="font-medium text-indigo-800">{userProfile?.examStats?.totalExams || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Passed:</span>
                          <span className="font-medium text-green-600">{userProfile?.examStats?.examsPassed || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Failed:</span>
                          <span className="font-medium text-red-600">{userProfile?.examStats?.examsFailed || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Average Score:</span>
                          <span className="font-medium text-indigo-800">{userProfile?.examStats?.averageScore?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Best Score:</span>
                          <span className="font-medium text-indigo-800">{userProfile?.examStats?.bestScore || 0}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200">
                      <h3 className="text-lg font-semibold text-teal-800 mb-4">Badges Earned ({userProgress?.badges?.length || 0})</h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {userProgress?.badges?.length > 0 ? (
                          userProgress.badges.slice(0, 5).map((badge, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <span className="text-lg">{badge.icon}</span>
                              <div>
                                <span className="font-medium text-teal-800">{badge.name}</span>
                                <p className="text-xs text-teal-600">{badge.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-teal-600">No badges earned yet. Keep learning!</p>
                        )}
                        {userProgress?.badges?.length > 5 && (
                          <p className="text-xs text-teal-500 mt-2">And {userProgress.badges.length - 5} more...</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Profile Section */}
                  {userProfile && (
                    <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Profile</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="ml-2 text-gray-800">{userProfile.profile?.name || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>
                          <span className="ml-2 text-gray-800">{userProfile.email}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Role:</span>
                          <span className="ml-2 text-gray-800 capitalize">{userProfile.role}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <span className="ml-2 text-gray-800">{userProfile.profile?.location || 'Not specified'}</span>
                        </div>
                        {userProfile.profile?.phone && (
                          <div>
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="ml-2 text-gray-800">{userProfile.profile.phone}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Member since:</span>
                          <span className="ml-2 text-gray-800">{new Date(userProfile.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {userProfile.profile?.bio && (
                        <div className="mt-4">
                          <span className="font-medium text-gray-700">Bio:</span>
                          <p className="mt-1 text-gray-800">{userProfile.profile.bio}</p>
                        </div>
                      )}
                      {userProfile.profile?.interests?.length > 0 && (
                        <div className="mt-4">
                          <span className="font-medium text-gray-700">Interests:</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {userProfile.profile.interests.map((interest, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {userProfile.profile?.skills?.length > 0 && (
                        <div className="mt-4">
                          <span className="font-medium text-gray-700">Skills:</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {userProfile.profile.skills.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentReports;
