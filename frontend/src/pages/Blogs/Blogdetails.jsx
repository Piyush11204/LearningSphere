import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, User, Clock, Tag, ArrowLeft, Share2, Eye, Image } from 'lucide-react';
import { trackBlogView, shareBlog } from '../../utils/blogUtils';

const BlogDetails = () => {
    const { slug } = useParams();
    // const navigate = useNavigate(); // Unused for now
    const [blog, setBlog] = useState(null);
    const [relatedBlogs, setRelatedBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_BASE_URL = `https://khushihomesofarepairing.com/api`;

    useEffect(() => {
        fetchBlogDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    useEffect(() => {
        if (blog && slug) {
            trackBlogView(slug);
        }
    }, [blog, slug]);

    useEffect(() => {
        if (blog) {
            // Update page title and meta description
            document.title = `${blog.title} - Khushi Home Sofa Repair Blog`;
            
            // Update meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', blog.metaDescription || blog.excerpt);
            }
        }
    }, [blog]);

    const fetchBlogDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/blogs/${slug}`);
            
            if (response.data.success) {
                setBlog(response.data.blog);
                setRelatedBlogs(response.data.relatedBlogs || []);
            }
        } catch (err) {
            console.error('Error fetching blog details:', err);
            if (err.response?.status === 404) {
                setError('Blog post not found');
            } else {
                setError('Failed to load blog post');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (blog) {
            const result = await shareBlog(blog);
            if (result === 'copied') {
                alert('Link copied to clipboard!');
            }
        }
    };

    // Format content to preserve line breaks and styling
    const formatContent = (content) => {
        if (!content) return '';
        
        // Convert line breaks to <br> tags and wrap paragraphs
        return content
            .split('\n\n')
            .map(paragraph => {
                if (paragraph.trim()) {
                    // Replace single line breaks with <br> tags within paragraphs
                    const formattedParagraph = paragraph.replace(/\n/g, '<br>');
                    return `<p>${formattedParagraph}</p>`;
                }
                return '';
            })
            .join('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading article...</p>
                </div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {error || 'Blog post not found'}
                    </h1>
                    <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been moved.</p>
                    <Link 
                        to="/blog" 
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 ">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link 
                        to="/blog"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Blog
                    </Link>
                </div>
            </div>

            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Article Header */}
                <header className="mb-8">
                    <div className="mb-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            <Tag className="w-3 h-3" />
                            {blog.category}
                        </span>
                    </div>
                    
                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        {blog.title}
                    </h1>
                    
                    <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                        {blog.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                        <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{blog.author?.name || 'Khushi Home Sofa Repair Team'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{blog.readTime || 5} min read</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{blog.views || 0} views</span>
                        </div>
                    </div>

                    {/* Share Button */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </header>

                {/* Featured Image */}
                {blog.featuredImage?.url && (
                    <div className="mb-8">
                        <img
                            src={blog.featuredImage.url}
                            alt={blog.title}
                            className="w-full h-64 lg:h-96 object-cover rounded-xl shadow-lg"
                        />
                    </div>
                )}

                {/* Article Content with proper formatting */}
                <div className="mb-12">
                    <div 
                        className="prose prose-lg max-w-none prose-blue prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6"
                        dangerouslySetInnerHTML={{ 
                            __html: blog.content.includes('<p>') || blog.content.includes('<div>') || blog.content.includes('<br>') 
                                ? blog.content 
                                : formatContent(blog.content)
                        }}
                        style={{
                            fontSize: '1.125rem',
                            lineHeight: '1.75',
                            color: '#374151'
                        }}
                    />
                </div>

                {/* Additional Images */}
                {blog.images && blog.images.length > 0 && (
                    <div className="mb-12">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Image className="w-5 h-5" />
                            Additional Images
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {blog.images.map((image, index) => (
                                <div key={index} className="space-y-2">
                                    <img
                                        src={image.url}
                                        alt={image.alt || `Additional image ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => window.open(image.url, '_blank')}
                                    />
                                    {image.alt && (
                                        <p className="text-sm text-gray-600 text-center italic">
                                            {image.alt}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Keywords */}
                {blog.keywords && blog.keywords.length > 0 && (
                    <div className="border-t border-gray-200 pt-8 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                            {blog.keywords.map((keyword, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                    <div className="border-t border-gray-200 pt-8 mb-12">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {blog.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Blog Metadata */}
                <div className="bg-gray-50 rounded-lg p-6 mb-12">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Article Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Published:</span>
                            <span className="ml-2 text-gray-600">
                                {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Last Updated:</span>
                            <span className="ml-2 text-gray-600">
                                {new Date(blog.updatedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Category:</span>
                            <span className="ml-2 text-gray-600">{blog.category}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Reading Time:</span>
                            <span className="ml-2 text-gray-600">{blog.readTime || 5} minutes</span>
                        </div>
                        
                        <div>
                            <span className="font-medium text-gray-700">Views:</span>
                            <span className="ml-2 text-gray-600">{blog.views || 0}</span>
                        </div>
                    </div>
                </div>
            </article>

            {/* Related Articles */}
            {relatedBlogs.length > 0 && (
                <section className="bg-white py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
                            Related Articles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {relatedBlogs.map((relatedBlog) => (
                                <article 
                                    key={relatedBlog._id}
                                    className="bg-gray-50 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                                >
                                    {relatedBlog.featuredImage?.url && (
                                        <Link to={`/blog/${relatedBlog.slug}`}>
                                            <img
                                                src={relatedBlog.featuredImage.url}
                                                alt={relatedBlog.title}
                                                className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                                            />
                                        </Link>
                                    )}
                                    <div className="p-6">
                                        <div className="mb-3">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                <Tag className="w-3 h-3" />
                                                {relatedBlog.category}
                                            </span>
                                        </div>
                                        
                                        <Link to={`/blog/${relatedBlog.slug}`}>
                                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                                                {relatedBlog.title}
                                            </h3>
                                        </Link>
                                        <p className="text-gray-600 line-clamp-3 mb-4">{relatedBlog.excerpt}</p>
                                        
                                        <div className="pt-4 border-t border-gray-200">
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <span>{new Date(relatedBlog.publishedAt || relatedBlog.createdAt).toLocaleDateString()}</span>
                                                <span>{relatedBlog.readTime || 5} min read</span>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            )}

         
        </div>
    );
};

export default BlogDetails;