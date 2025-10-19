import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  RefreshCw,
  MessageCircle,
  User,
  TrendingUp,
  BookOpen,
  Target,
  Calendar,
  Award,
  Users,
  BarChart3,
  Clock
} from 'lucide-react';
import './ChatbotImproved.css';

const ChatbotPage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([
    'Show my exam schedule',
    'Check practice test progress', 
    'View sectional test results',
    'Find available tutors',
    'Show performance analytics',
    'Help me plan study schedule'
  ]);
  
  const API_BASE_URL = 'https://learningsphere-1fgj.onrender.com/api';
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: 'Hello! Welcome to LearningSphere AI Assistant. I\'m here to help you with your exams, practice tests, sectional tests, tutoring sessions, and performance analytics. What would you like to know about your learning journey?',
      isWelcome: true,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    
    // Fetch user info
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token && userId) {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUserInfo(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: messageText.trim(),
          context: { 
            timestamp: new Date().toISOString(),
            conversationLength: messages.length
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response,
          intent: data.intent,
          suggestions: data.suggestions,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: 'Hello! Welcome to LearningSphere AI Assistant. How can I help you with your learning journey today?',
      isWelcome: true,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const renderMessage = (message) => {
    const isBot = message.type === 'bot';
    const isWelcome = message.isWelcome;
    const isError = message.isError;

    return (
      <div
        key={message.id}
        className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 message-${message.type}`}
      >
        <div className={`flex items-start space-x-3 max-w-3xl ${isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isBot 
              ? isWelcome 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                : isError 
                  ? 'bg-red-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600'
              : 'bg-gradient-to-r from-green-500 to-blue-500'
          }`}>
            {isBot ? (
              isWelcome ? (
                <img 
                  src="/LearningSphereLogo.png" 
                  alt="LearningSphere" 
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <Bot size={16} className="text-white" />
              )
            ) : (
              <User size={16} className="text-white" />
            )}
          </div>

          <div className={`rounded-2xl px-4 py-3 message-bubble ${
            isBot
              ? isWelcome
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white welcome-message'
                : isError
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-gray-50 border border-gray-200 text-gray-800'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
          }`}>
            <div className="prose prose-sm max-w-none">
              {message.content}
            </div>
            
            {message.intent && !isWelcome && (
              <div className="mt-2">
                <span className="intent-badge">
                  {message.intent.replace(/_/g, ' ')}
                </span>
              </div>
            )}

            <div className={`text-xs mt-2 opacity-70 ${isBot && !isWelcome && !isError ? 'text-gray-500' : isBot ? 'text-white' : 'text-white'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const quickActions = [
    { icon: BookOpen, label: 'Take Practice Exam', action: 'Take a practice exam' },
    { icon: Target, label: 'Sectional Tests', action: 'Show sectional test results' },
    { icon: TrendingUp, label: 'Performance Analytics', action: 'Show my performance analytics' },
    { icon: Calendar, label: 'Exam Schedule', action: 'Show my exam schedule' },
    { icon: Users, label: 'Find Tutors', action: 'Find available tutors' },
    { icon: Award, label: 'My Progress', action: 'Show my learning progress' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center p-2">
                <img 
                  src="/LearningSphereLogo.png" 
                  alt="LearningSphere" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LearningSphere AI Assistant
                </h1>
                <p className="text-sm text-gray-600">Your intelligent learning companion</p>
              </div>
            </div>
            
            {userInfo && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userInfo.profile?.name || userInfo.username}</p>
                  <p className="text-xs text-gray-500 capitalize">{userInfo.role}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {(userInfo.profile?.name || userInfo.username || 'U')[0].toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(action.action)}
                    disabled={isLoading}
                    className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    <action.icon size={20} />
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={clearConversation}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear Conversation
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Chat Messages */}
              <div className="h-[600px] overflow-y-auto p-6 chatbot-messages">
                {messages.map(renderMessage)}
                
                {isLoading && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl mx-4 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <img 
                        src="/LearningSphereLogo.png" 
                        alt="LearningSphere" 
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot"></div>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">AI is thinking...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                {suggestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.slice(0, 4).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => sendMessage(suggestion)}
                          disabled={isLoading}
                          className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 disabled:opacity-50 suggestion-chip"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your learning journey on LearningSphere..."
                      disabled={isLoading}
                      className="w-full p-4 pr-16 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 chat-input"
                      rows="1"
                      style={{ 
                        minHeight: '56px', 
                        maxHeight: '140px',
                        fontSize: '15px',
                        lineHeight: '1.5'
                      }}
                    />
                    
                    {inputMessage.length > 0 && (
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                        {inputMessage.length}/500
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center min-w-[56px] shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;