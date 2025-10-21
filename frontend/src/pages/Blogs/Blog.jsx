import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, Search, Tag, ArrowRight, BookOpen, Lightbulb } from 'lucide-react';
import { API_URLS } from '../../config/api';
import { getCategoryColor } from '../../utils/blogUtils';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // LearningSphere educational categories
    const categories = [
        'Study Tips',
        'Exam Preparation',
        'Technology Trends',
        'Career Guidance',
        'Learning Strategies',
        'Educational Resources',
        'Student Success',
        'Skill Development',
        'Academic Advice',
        'Industry Insights',
        'AI & Machine Learning',
        'Programming',
        'Data Science',
        'Success Stories'
    ];

    useEffect(() => {
        fetchBlogs();
        // eslint-disable-next-line
    }, [currentPage, selectedCategory, searchTerm]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                limit: 9
            });
            if (selectedCategory) params.append('category', selectedCategory);
            if (searchTerm) params.append('search', searchTerm);

            const response = await axios.get(`${API_URLS.BLOGS}?${params}`);
            if (response.data.success) {
                setPosts(response.data.blogs);
                setTotalPages(response.data.totalPages);
            }
        } catch (err) {
            console.error('Error fetching blogs:', err);
            setError('Failed to load blog posts');
        } finally {
            setLoading(false);
        }
    };


    const handleCategoryFilter = (category) => {
        setSelectedCategory(category === selectedCategory ? '' : category);
        setCurrentPage(1);
    };

    if (loading && posts.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading blog posts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center mb-6">
                        <BookOpen className="w-12 h-12 text-blue-600 mr-4" />
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                            LearningSphere <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Blog</span>
                        </h1>
                    </div>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Discover expert insights, study tips, career guidance, and the latest trends in education and technology to accelerate your learning journey.
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="mb-12">
                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search articles by title, content, or tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                !selectedCategory
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                            }`}
                        >
                            All Categories
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => handleCategoryFilter(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                    selectedCategory === category
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:shadow-md'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
                        {error}
                    </div>
                )}

                {/* Blog Grid */}
                {posts.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Search className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
                        <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post, index) => (
                            <article 
                                key={post._id || index} 
                                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                            >
                                {post.featuredImage?.url && (
                                    <Link to={`/blog/${post.slug}`}>
                                        <div className="relative overflow-hidden">
                                            <img
                                                src={post.featuredImage.url}
                                                alt={post.title}
                                                className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                        </div>
                                    </Link>
                                )}
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                        <div className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            <span>{post.author?.name || 'LearningSphere Team'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{post.readTime || 5} min read</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium ${getCategoryColor(post.category)}`}>
                                            <Tag className="w-3 h-3" />
                                            {post.category}
                                        </span>
                                    </div>
                                    
                                    <Link to={`/blog/${post.slug}`}>
                                        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:bg-clip-text hover:text-transparent cursor-pointer transition-all duration-200">
                                            {post.title}
                                        </h2>
                                    </Link>
                                    <p className="text-gray-600 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                                    
                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        <Link 
                                            to={`/blog/${post.slug}`}
                                            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold text-sm hover:shadow-md transition-all duration-200 group"
                                        >
                                            <Lightbulb className="w-4 h-4 text-blue-600" />
                                            Read More 
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-16">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200"
                            >
                                Previous
                            </button>
                            
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-4 py-3 border rounded-xl font-medium transition-all duration-200 ${
                                        currentPage === i + 1
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-600 shadow-lg'
                                            : 'border-gray-300 hover:bg-gray-50 hover:shadow-md'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Blog;