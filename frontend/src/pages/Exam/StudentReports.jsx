import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URLS } from '../../config/api';
import { FileText, Download, BarChart3, TrendingUp, Award, Calendar } from 'lucide-react';

const StudentReports = () => {
  const [report, setReport] = useState('');
  const [userId, setUserId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    const fetchUserId = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URLS.AUTH}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserId(res.data.user._id);
      } catch (error) {
  
        console.error('Error:', error.response?.data?.message || error.message);
      }
    };
    fetchUserId();
  }, []);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URLS.REPORTS}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data.report);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Error:', error.response?.data?.message || error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    // Clean the report text for download
    const cleanReport = report
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers
      .replace(/#{1,6}\s*/g, '')        // Remove heading markers
      .replace(/`(.*?)`/g, '$1')        // Remove code markers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove link formatting

    const element = document.createElement('a');
    const file = new Blob([cleanReport], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `performance-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Report downloaded successfully');
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
                          <p className="text-sm font-medium text-blue-700">Progress</p>
                          <p className="text-2xl font-bold text-blue-800">85%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                      <div className="flex items-center space-x-3">
                        <Award className="w-6 h-6 text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium text-emerald-700">Exams Passed</p>
                          <p className="text-2xl font-bold text-emerald-800">12</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-6 h-6 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-purple-700">Study Hours</p>
                          <p className="text-2xl font-bold text-purple-800">156</p>
                        </div>
                      </div>
                    </div>
                  </div>
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
