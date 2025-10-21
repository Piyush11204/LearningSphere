import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, Search, Tag, ArrowRight } from 'lucide-react';

const Blog = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const API_BASE_URL = `https://khushihomesofarepairing.com/api`;

    // Sofa repair and furniture care categories
    const categories = [
        'Sofa Repair',
        'Fabric Care',
        'Frame Restoration', 
        'Cushion Replacement',
        'Upholstery Tips',
        'Maintenance Guides',
        'Before & After',
        'DIY Fixes',
        'Customer Stories',
        'Expert Advice'
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

            const response = await axios.get(`${API_BASE_URL}/blogs?${params}`);
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
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                        Khushi Home Sofa Repair <span className="text-orange-600">Blog</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Expert tips, repair guides, and trends for maintaining beautiful sofas and furniture.
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="mb-12">
                    <div className=" items-center justify-between">
                        

                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryFilter(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        selectedCategory === category
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
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
                                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                            >
                                {post.featuredImage?.url && (
                                    <Link to={`/blog/${post.slug}`}>
                                        <img
                                            src={post.featuredImage.url}
                                            alt={post.title}
                                            className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                                        />
                                    </Link>
                                )}
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                        <div className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            <span>{post.author?.name || 'Khushi Home Sofa Repair Team'}</span>
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
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                            <Tag className="w-3 h-3" />
                                            {post.category}
                                        </span>
                                    </div>
                                    
                                    <Link to={`/blog/${post.slug}`}>
                                        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-orange-600 cursor-pointer">
                                            {post.title}
                                        </h2>
                                    </Link>
                                    <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <Link 
                                            to={`/blog/${post.slug}`}
                                            className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
                                        >
                                            Read More <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-12">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-4 py-2 border rounded-lg ${
                                        currentPage === i + 1
                                            ? 'bg-orange-600 text-white border-orange-600'
                                            : 'border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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