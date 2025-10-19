import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  User, 
  Bot,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Expand
} from 'lucide-react';
import './ChatbotImproved.css';

const ChatbotEnhanced = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [userInfo, setUserInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([
    'Show my exam schedule',
    'Check my practice test progress',
    'View my performance analytics',
    'Help with study planning',
    'Show my sectional test results',
    'Find available live sessions'
  ]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  const API_BASE_URL = 'https://learningsphere-1fgj.onrender.com/api';
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchUserInfo = useCallback(async () => {
    if (hasInitialized) return;
    
    try {
      setConnectionStatus('connecting');
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token - user is not logged in, show guest welcome
        setConnectionStatus('connected');
        setHasInitialized(true);
        setUserInfo(null);
        
        if (messages.length === 0) {
          const welcomeMessage = {
            id: Date.now(),
            type: 'bot',
            content: `Hello! 👋 Welcome to LearningSphere AI Assistant! I'm here to help you learn about our platform and its features.

For the full experience including personalized data and progress tracking, please log in to your account.

I can help you with:
• Learn about LearningSphere features
• Get information about tutoring and learning sessions
• Understand how our matching system works
• General questions about the platform`,
            isWelcome: true,
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
        return;
      }

      // Try to fetch user data if token exists
      const response = await fetch(`${API_BASE_URL}/chatbot/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.data.user);
        setConnectionStatus('connected');
        setHasInitialized(true);
        
        if (messages.length === 0) {
          const welcomeMessage = {
            id: Date.now(),
            type: 'bot',
            content: `Hello ${data.data.user?.username || data.data.user?.name || 'there'}! 👋 I'm your LearningSphere AI Assistant. How can I assist you today?

I can help you with:
• Check your learning sessions and progress
• View your tutor matches and reviews  
• Review notifications and updates
• Track your academic progress
• Get help with assignments
• Navigate platform features

What would you like to know about?`,
            intent: 'welcome',
            suggestions: [
              'Show my dashboard',
              'Check my grades',
              'View upcoming exams', 
              'Show my timetable',
              'Recent notifications'
            ],
            isWelcome: true,
            timestamp: new Date()
          };
          
          setMessages([welcomeMessage]);
        }
      } else {
        throw new Error('Failed to fetch user info');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Error fetching user info:', error);
    }
  }, [API_BASE_URL, hasInitialized, messages.length]);

  useEffect(() => {
    if (isOpen && !userInfo) {
      fetchUserInfo();
    }
  }, [isOpen, userInfo, fetchUserInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingIndicator, scrollToBottom]);

  useEffect(() => {
    const checkConnection = () => {
      setConnectionStatus(navigator.onLine ? 'connected' : 'error');
    };

    checkConnection();
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

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
    setTypingIndicator(true);
    setShowQuickActions(false);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers,
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
        
        const typingDelay = Math.min(2000, Math.max(800, data.response.length * 8));
        
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: data.response,
            intent: data.intent,
            suggestions: data.suggestions,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, botMessage]);
          setTypingIndicator(false);
          setIsLoading(false);
          
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
          }
        }, typingDelay);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setTypingIndicator(false);
      setIsLoading(false);
      setConnectionStatus('error');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
        isError: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      console.error('Error sending message:', error);
    }
  };

  const handleMessageReaction = (messageId, reaction) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reaction: msg.reaction === reaction ? null : reaction }
        : msg
    ));
  };

  const copyMessageToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setShowQuickActions(true);
    setHasInitialized(false);
    if (userInfo) {
      fetchUserInfo();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      connected: { icon: CheckCircle, color: 'text-green-400', text: 'Connected' },
      connecting: { icon: RefreshCw, color: 'text-yellow-400', text: 'Connecting...' },
      disconnected: { icon: RefreshCw, color: 'text-gray-400', text: 'Disconnected' },
      error: { icon: AlertCircle, color: 'text-red-400', text: 'Connection Error' }
    };

    const config = statusConfig[connectionStatus];
    const StatusIcon = config.icon;

    return (
      <div className={`flex items-center space-x-1 text-xs ${config.color}`}>
        <StatusIcon size={12} className={connectionStatus === 'connecting' ? 'animate-spin' : ''} />
        <span>{config.text}</span>
      </div>
    );
  };

  const renderTypingIndicator = () => (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl mx-4 mb-4">
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <Bot size={16} className="text-white" />
      </div>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot"></div>
      </div>
      <span className="text-sm text-gray-600 font-medium">AI is thinking...</span>
    </div>
  );

  const renderMessage = (message) => {
    const isBot = message.type === 'bot';
    const isWelcome = message.isWelcome;
    const isError = message.isError;

    return (
      <div key={message.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-6 px-4`}>
        <div className={`flex ${isBot ? 'flex-row' : 'flex-row-reverse'} items-start space-x-3 max-w-[85%]`}>
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
            isBot 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
              : 'bg-gradient-to-r from-green-500 to-blue-500'
          } text-white`}>
            {isBot ? <Bot size={18} /> : <User size={18} />}
          </div>
          
          <div className={`message-container relative group max-w-full`}>
            <div className={`p-4 rounded-2xl shadow-lg transition-all duration-200 ${
              isBot 
                ? isWelcome 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-blue-500/25' 
                  : isError
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-white text-gray-800 border border-gray-200'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-blue-500/25'
            }`}>
              {message.intent && (
                <div className="inline-block px-2 py-1 mb-2 text-xs font-semibold rounded-full bg-white bg-opacity-20 text-white">
                  {message.intent}
                </div>
              )}
              
              <div className={`prose prose-sm max-w-none chatbot-markdown ${
                isWelcome || !isBot ? 'prose-invert' : ''
              }`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({...props}) => <h1 className="text-xl font-bold mb-3 mt-4" {...props} />,
                    h2: ({...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                    h3: ({...props}) => <h3 className="text-base font-bold mb-2 mt-3" {...props} />,
                    h4: ({...props}) => <h4 className="text-sm font-bold mb-2 mt-2" {...props} />,
                    p: ({...props}) => <p className="mb-2 text-sm leading-relaxed" {...props} />,
                    ul: ({...props}) => <ul className="list-none space-y-1 mb-3" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal list-inside space-y-1 mb-3 ml-2" {...props} />,
                    li: ({children, ...props}) => (
                      <li className="flex items-start space-x-2 text-sm" {...props}>
                        <span className={`${isWelcome || !isBot ? 'text-blue-200' : 'text-blue-500'} font-bold flex-shrink-0 mt-0.5`}>•</span>
                        <span className="flex-1">{children}</span>
                      </li>
                    ),
                    strong: ({...props}) => <strong className="font-bold" {...props} />,
                    em: ({...props}) => <em className="italic" {...props} />,
                    code: ({inline, ...props}) => 
                      inline 
                        ? <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono" {...props} />
                        : <code className="block px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto" {...props} />,
                    blockquote: ({...props}) => (
                      <blockquote className="border-l-4 border-blue-500 pl-3 italic my-2" {...props} />
                    ),
                    a: ({...props}) => (
                      <a className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-opacity-20">
                <div className="flex items-center space-x-2">
                  {isBot && (
                    <>
                      <button
                        onClick={() => handleMessageReaction(message.id, 'like')}
                        className={`message-reaction-btn p-1 rounded-md transition-all duration-200 ${
                          message.reaction === 'like' 
                            ? 'bg-green-100 text-green-600' 
                            : 'hover:bg-white hover:bg-opacity-20 text-white text-opacity-60 hover:text-opacity-100'
                        }`}
                        title="Like this response"
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        onClick={() => handleMessageReaction(message.id, 'dislike')}
                        className={`message-reaction-btn p-1 rounded-md transition-all duration-200 ${
                          message.reaction === 'dislike' 
                            ? 'bg-red-100 text-red-600' 
                            : 'hover:bg-white hover:bg-opacity-20 text-white text-opacity-60 hover:text-opacity-100'
                        }`}
                        title="Dislike this response"
                      >
                        <ThumbsDown size={12} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => copyMessageToClipboard(message.content)}
                    className="message-reaction-btn p-1 rounded-md hover:bg-white hover:bg-opacity-20 text-white text-opacity-60 hover:text-opacity-100 transition-all duration-200"
                    title="Copy message"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                
                <span className="text-xs opacity-60">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
            
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 font-medium pl-1">Quick actions:</p>
                <div className="flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(suggestion)}
                      className="px-4 py-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-400 rounded-full text-sm text-gray-700 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 font-medium"
                      disabled={isLoading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center animate-float z-50 hover:scale-110 group"
        aria-label="Open LearningSphere AI Assistant"
      >
        <div className="relative">
          <img 
            src="/LearningSphereLogo.png" 
            alt="LearningSphere AI" 
            className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </button>
    );
  }

  return (
    <div 
      ref={chatContainerRef}
      className={`fixed z-50 transition-all duration-300 ease-in-out ${
        isMinimized 
          ? 'w-80 h-16 bottom-6 right-6' 
          : isFullscreen
            ? 'inset-0 w-full h-full'
            : 'w-[420px] h-[700px] bottom-6 right-6'
      }`}
    >
      <div 
        className={`w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden ${
          isFullscreen ? 'rounded-none' : ''
        }`}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-md p-1">
              <img 
                src="/LearningSphereLogo.png" 
                alt="LearningSphere Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">LearningSphere AI Assistant</h3>
              {renderConnectionStatus()}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Expand size={18} />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
              aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white" style={{ scrollbarWidth: 'thin' }}>
              {messages.length === 0 && showQuickActions && (
                <div className="text-center py-12 px-6">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl p-3">
                    <img 
                      src="/LearningSphereLogo.png" 
                      alt="LearningSphere Logo" 
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">👋 Hello! I'm your LearningSphere AI Assistant</h3>
                  <p className="text-gray-600 mb-8 text-lg">Ready to help you with exams, practice tests, progress tracking, and more!</p>
                  <div className="space-y-3 max-w-sm mx-auto">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => sendMessage(suggestion)}
                        className="block w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-400 rounded-xl text-blue-700 hover:text-blue-800 transition-all duration-200 text-left shadow-sm hover:shadow-lg hover:scale-105 font-medium"
                        disabled={isLoading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="py-4">
                {messages.map(renderMessage)}
              </div>
              
              {typingIndicator && renderTypingIndicator()}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              {connectionStatus === 'error' && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                  <span className="text-red-600 text-sm font-medium">Connection lost - Please check your internet</span>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="Refresh page"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              )}
              
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    disabled={isLoading || connectionStatus === 'disconnected'}
                    className="w-full p-4 pr-16 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-gray-50 placeholder-gray-500 text-gray-900 font-medium"
                    rows="1"
                    style={{ 
                      minHeight: '56px', 
                      maxHeight: '140px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
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
                  disabled={!inputMessage.trim() || isLoading || connectionStatus === 'disconnected'}
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
              
              {/* Quick actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex space-x-3">
                  <button
                    onClick={clearConversation}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
                  >
                    Clear Chat
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
                  >
                    {showQuickActions ? 'Hide' : 'Show'} Suggestions
                  </button>
                </div>
                
                <div className="text-xs text-gray-400 font-medium">
                  Powered by AI ✨
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatbotEnhanced;