// Blog utility functions for LearningSphere

// Track blog view for analytics
export const trackBlogView = async (slug) => {
  try {
    // Only track if we have valid user session
    const token = localStorage.getItem('token');
    if (!token) return;

    // Simple view tracking - could be enhanced with analytics service
    const viewData = {
      slug,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    // Store view in localStorage for now
    const views = JSON.parse(localStorage.getItem('blogViews') || '[]');
    views.push(viewData);
    
    // Keep only last 100 views to prevent storage bloat
    const recentViews = views.slice(-100);
    localStorage.setItem('blogViews', JSON.stringify(recentViews));

    return true;
  } catch (error) {
    console.error('Error tracking blog view:', error);
    return false;
  }
};

// Share blog functionality
export const shareBlog = async (blog) => {
  try {
    const shareData = {
      title: `${blog.title} - LearningSphere Blog`,
      text: blog.excerpt || blog.metaDescription || 'Check out this article from LearningSphere',
      url: window.location.href
    };

    // Try to use Web Share API if available
    if (navigator.share) {
      await navigator.share(shareData);
      return 'shared';
    } 
    // Fallback to clipboard
    else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      return 'copied';
    }
    // Last resort - manual copy
    else {
      const textArea = document.createElement('textarea');
      textArea.value = shareData.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return 'copied';
    }
  } catch (error) {
    console.error('Error sharing blog:', error);
    return 'error';
  }
};

// Get reading time estimate
export const calculateReadingTime = (content) => {
  if (!content) return 5;
  
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  return Math.max(1, readingTime); // Minimum 1 minute
};

// Format blog date for display
export const formatBlogDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return date.toLocaleDateString('en-US', defaultOptions);
};

// Generate blog excerpt from content
export const generateExcerpt = (content, maxLength = 160) => {
  if (!content) return '';
  
  // Remove HTML tags
  const textContent = content.replace(/<[^>]*>/g, '');
  
  if (textContent.length <= maxLength) {
    return textContent;
  }
  
  // Truncate at word boundary
  const truncated = textContent.substr(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    return truncated.substr(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

// Blog category colors for UI
export const getCategoryColor = (category) => {
  const colors = {
    'Study Tips': 'bg-blue-100 text-blue-800',
    'Exam Preparation': 'bg-green-100 text-green-800',
    'Technology Trends': 'bg-purple-100 text-purple-800',
    'Career Guidance': 'bg-orange-100 text-orange-800',
    'Learning Strategies': 'bg-indigo-100 text-indigo-800',
    'Educational Resources': 'bg-teal-100 text-teal-800',
    'Student Success': 'bg-emerald-100 text-emerald-800',
    'Skill Development': 'bg-cyan-100 text-cyan-800',
    'Academic Advice': 'bg-pink-100 text-pink-800',
    'Industry Insights': 'bg-red-100 text-red-800',
    'AI & Machine Learning': 'bg-violet-100 text-violet-800',
    'Programming': 'bg-gray-100 text-gray-800',
    'Data Science': 'bg-blue-100 text-blue-800',
    'Success Stories': 'bg-yellow-100 text-yellow-800'
  };
  
  return colors[category] || 'bg-gray-100 text-gray-800';
};

// SEO utilities
export const updatePageSEO = (blog) => {
  if (!blog) return;
  
  // Update page title
  document.title = `${blog.title} - LearningSphere Blog`;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', blog.metaDescription || blog.excerpt || '');
  } else {
    const newMetaDescription = document.createElement('meta');
    newMetaDescription.name = 'description';
    newMetaDescription.content = blog.metaDescription || blog.excerpt || '';
    document.head.appendChild(newMetaDescription);
  }
  
  // Update Open Graph tags
  updateOpenGraphTags(blog);
};

const updateOpenGraphTags = (blog) => {
  const ogTags = {
    'og:title': blog.title,
    'og:description': blog.metaDescription || blog.excerpt,
    'og:image': blog.featuredImage?.url || '/LearningSphereLogo.png',
    'og:url': window.location.href,
    'og:type': 'article',
    'og:site_name': 'LearningSphere',
    'article:author': blog.author?.name || 'LearningSphere Team',
    'article:published_time': blog.publishedAt,
    'article:modified_time': blog.updatedAt,
    'article:section': blog.category
  };
  
  Object.entries(ogTags).forEach(([property, content]) => {
    if (!content) return;
    
    let metaTag = document.querySelector(`meta[property="${property}"]`);
    if (metaTag) {
      metaTag.setAttribute('content', content);
    } else {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      metaTag.setAttribute('content', content);
      document.head.appendChild(metaTag);
    }
  });
};

// Filter blogs by category, search term, etc.
export const filterBlogs = (blogs, filters = {}) => {
  if (!blogs || blogs.length === 0) return [];
  
  let filteredBlogs = [...blogs];
  
  // Filter by category
  if (filters.category) {
    filteredBlogs = filteredBlogs.filter(blog => 
      blog.category === filters.category
    );
  }
  
  // Filter by search term
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredBlogs = filteredBlogs.filter(blog =>
      blog.title.toLowerCase().includes(searchTerm) ||
      blog.excerpt.toLowerCase().includes(searchTerm) ||
      blog.content.toLowerCase().includes(searchTerm) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
  
  // Sort blogs
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'newest':
        filteredBlogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        break;
      case 'oldest':
        filteredBlogs.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
        break;
      case 'popular':
        filteredBlogs.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'title':
        filteredBlogs.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
  }
  
  return filteredBlogs;
};

export default {
  trackBlogView,
  shareBlog,
  calculateReadingTime,
  formatBlogDate,
  generateExcerpt,
  getCategoryColor,
  updatePageSEO,
  filterBlogs
};