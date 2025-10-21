import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, Upload, X, Eye, Save, Plus, Trash2,
    Bold, Italic, Underline, List, ListOrdered, 
    Link2, Image, Quote, Code, Minus
} from 'lucide-react';

const BlogForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const contentRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: '',
        metaTitle: '',
        metaDescription: '',
        canonicalUrl: '',
        isPublished: false,
        readTime: 5,
        keywords: ''
    });

    const [featuredImage, setFeaturedImage] = useState(null);
    const [featuredImagePreview, setFeaturedImagePreview] = useState('');
    const [additionalImages, setAdditionalImages] = useState([]);
    const [additionalImagePreviews, setAdditionalImagePreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [seoScore, setSeoScore] = useState(0);

    const API_BASE_URL = `https://khushihomesofarepairing.com/api`;

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
        if (isEditing) {
            fetchBlog();
        }
    }, [id, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

    // Calculate SEO score in real-time (but don't auto-update readTime from content changes)
    useEffect(() => {
        calculateSEOScore();
    }, [formData.title, formData.content, formData.metaTitle, formData.metaDescription, formData.excerpt, formData.tags, featuredImagePreview]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchBlog = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/blogs/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                const blog = response.data.blogs.find(b => b._id === id);
                if (blog) {
                    setFormData({
                        title: blog.title || '',
                        content: blog.content || '',
                        excerpt: blog.excerpt || '',
                        category: blog.category || '',
                        tags: blog.tags ? blog.tags.join(', ') : '',
                        metaTitle: blog.metaTitle || '',
                        metaDescription: blog.metaDescription || '',
                        canonicalUrl: blog.canonicalUrl || '',
                        isPublished: blog.isPublished || false,
                        readTime: blog.readTime || 5,
                        keywords: blog.keywords ? blog.keywords.join(', ') : ''
                    });
                    
                    if (blog.featuredImage?.url) {
                        setFeaturedImagePreview(blog.featuredImage.url);
                    }
                    
                    if (blog.images && blog.images.length > 0) {
                        setAdditionalImagePreviews(blog.images.map(img => img.url));
                    }

                    // Set content in the editor
                    setTimeout(() => {
                        if (contentRef.current) {
                            contentRef.current.innerHTML = blog.content || '';
                        }
                    }, 100);
                }
            }
        } catch (err) {
            console.error('Error fetching blog:', err);
            setError('Failed to load blog data');
        }
    };

    const calculateSEOScore = () => {
        let score = 0;
        
        // Title optimization (0-20 points)
        if (formData.title && formData.title.length >= 30 && formData.title.length <= 60) score += 20;
        else if (formData.title && formData.title.length >= 20) score += 10;
        
        // Meta description (0-15 points)
        if (formData.metaDescription && formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160) score += 15;
        else if (formData.metaDescription && formData.metaDescription.length >= 100) score += 10;
        
        // Content length (0-20 points)
        if (formData.content) {
            const textContent = formData.content.replace(/<[^>]*>/g, ''); // Remove HTML tags for word count
            const wordCount = textContent.split(' ').filter(word => word.length > 0).length;
            if (wordCount >= 1000) score += 20;
            else if (wordCount >= 500) score += 15;
            else if (wordCount >= 300) score += 10;
        }
        
        // Featured image (0-10 points)
        if (featuredImagePreview) score += 10;
        
        // Tags (0-10 points)
        const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        if (tagsArray.length >= 3) score += 10;
        else if (tagsArray.length >= 1) score += 5;
        
        // Keywords (0-15 points)
        const keywordsArray = formData.keywords ? formData.keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword) : [];
        if (keywordsArray.length >= 5) score += 15;
        else if (keywordsArray.length >= 3) score += 10;
        
        // Excerpt (0-10 points)
        if (formData.excerpt && formData.excerpt.length >= 100) score += 10;
        else if (formData.excerpt && formData.excerpt.length >= 50) score += 5;
        
        setSeoScore(score);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Don't auto-calculate readTime from content changes
        const newFormData = {
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        };

        // Auto-generate meta fields only if they haven't been manually edited
        if (name === 'title' && value && !formData.metaTitle) {
            newFormData.metaTitle = value.length > 60 ? value.substring(0, 57) + '...' : value;
        }

        if (name === 'excerpt' && value && !formData.metaDescription) {
            newFormData.metaDescription = value.length > 160 ? value.substring(0, 157) + '...' : value;
        }

        setFormData(newFormData);
    };

    // Rich Text Editor Functions
    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        updateContent();
        contentRef.current.focus();
    };

    const insertHTML = (html) => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const div = document.createElement('div');
            div.innerHTML = html;
            const frag = document.createDocumentFragment();
            while (div.firstChild) {
                frag.appendChild(div.firstChild);
            }
            range.insertNode(frag);
        }
        updateContent();
    };

    const updateContent = () => {
        if (contentRef.current) {
            const content = contentRef.current.innerHTML;
            setFormData(prev => ({ ...prev, content }));
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        updateContent();
    };

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const insertImage = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            insertHTML(`<img src="${url}" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0;" />`);
        }
    };

    const formatHeading = (level) => {
        execCommand('formatBlock', `<h${level}>`);
    };

    const insertDivider = () => {
        insertHTML('<hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />');
    };

    // Calculate word count from content
    const getWordCount = () => {
        if (!formData.content) return 0;
        const textContent = formData.content.replace(/<[^>]*>/g, '');
        return textContent.split(' ').filter(word => word.length > 0).length;
    };

    // Auto-calculate read time based on word count
    const getEstimatedReadTime = () => {
        const wordCount = getWordCount();
        const wordsPerMinute = 200;
        return Math.ceil(wordCount / wordsPerMinute) || 1;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            
            setFeaturedImage(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setFeaturedImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdditionalImagesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const validFiles = files.filter(file => {
                if (file.size > 5 * 1024 * 1024) {
                    setError(`Image ${file.name} is too large. Max 5MB per image.`);
                    return false;
                }
                return true;
            });

            setAdditionalImages(prev => [...prev, ...validFiles]);

            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setAdditionalImagePreviews(prev => [...prev, e.target.result]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = () => {
        setFeaturedImage(null);
        setFeaturedImagePreview('');
    };

    const removeAdditionalImage = (index) => {
        setAdditionalImages(prev => prev.filter((_, i) => i !== index));
        setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const submitData = new FormData();
            
            // Add form data
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });

            // Add featured image if present
            if (featuredImage) {
                submitData.append('featuredImage', featuredImage);
            }

            // Add additional images
            additionalImages.forEach((image) => {
                submitData.append('images', image);
            });

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            let response;
            if (isEditing) {
                response = await axios.put(`${API_BASE_URL}/blogs/admin/${id}`, submitData, config);
            } else {
                response = await axios.post(`${API_BASE_URL}/blogs/admin/create`, submitData, config);
            }

            if (response.data.success) {
                setSuccess(`Blog ${isEditing ? 'updated' : 'created'} successfully!`);
                setTimeout(() => {
                    navigate('/admin/blogs');
                }, 2000);
            }
        } catch (err) {
            console.error('Error saving blog:', err);
            setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} blog`);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        previewWindow.document.write(`
            <html>
                <head>
                    <title>${formData.title}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            max-width: 800px; 
                            margin: 0 auto; 
                            padding: 20px; 
                            line-height: 1.6;
                        }
                        .meta { 
                            color: #666; 
                            margin-bottom: 20px; 
                            padding: 15px;
                            background: #f5f5f5;
                            border-radius: 8px;
                        }
                        .content { 
                            line-height: 1.6; 
                        }
                        .content img { 
                            max-width: 100%; 
                            height: auto; 
                            border-radius: 8px;
                            margin: 10px 0;
                        }
                        .content h1, .content h2, .content h3 {
                            color: #333;
                            margin: 20px 0 10px 0;
                        }
                        .content blockquote {
                            border-left: 4px solid #ccc;
                            margin: 20px 0;
                            padding-left: 20px;
                            font-style: italic;
                        }
                        .content code {
                            background: #f4f4f4;
                            padding: 2px 4px;
                            border-radius: 3px;
                            font-family: monospace;
                        }
                    </style>
                </head>
                <body>
                    <h1>${formData.title}</h1>
                    <div class="meta">
                        <p><strong>Category:</strong> ${formData.category}</p>
                        <p><strong>Read Time:</strong> ${formData.readTime} minutes (Estimated: ${getEstimatedReadTime()} min)</p>
                        <p><strong>Word Count:</strong> ${getWordCount()} words</p>
                        <p><strong>Tags:</strong> ${formData.tags}</p>
                    </div>
                    ${featuredImagePreview ? `<img src="${featuredImagePreview}" alt="Featured Image" style="margin-bottom: 20px; border-radius: 8px;">` : ''}
                    <p><strong style="font-size: 1.2em;">${formData.excerpt}</strong></p>
                    <div class="content">${formData.content}</div>
                </body>
            </html>
        `);
    };

    const getSEOScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSEOScoreBg = (score) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link 
                        to="/admin/blogs"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Blog Management
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
                            </h1>
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${getSEOScoreBg(seoScore)}`}>
                            <div className="text-sm font-medium text-gray-700">SEO Score</div>
                            <div className={`text-2xl font-bold ${getSEOScoreColor(seoScore)}`}>
                                {seoScore}/100
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title * <span className="text-xs text-gray-500">({formData.title.length}/200)</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={200}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter blog title..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select category...</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Read Time (minutes)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            name="readTime"
                                            value={formData.readTime}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="60"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, readTime: getEstimatedReadTime() }))}
                                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                                        >
                                            Auto ({getEstimatedReadTime()})
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Estimated: {getEstimatedReadTime()} min from {getWordCount()} words</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter tags separated by commas..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Keywords (SEO)
                                    </label>
                                    <input
                                        type="text"
                                        name="keywords"
                                        value={formData.keywords}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter SEO keywords separated by commas..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Excerpt * <span className="text-xs text-gray-500">({formData.excerpt.length}/300)</span>
                                </label>
                                <textarea
                                    name="excerpt"
                                    value={formData.excerpt}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={300}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Brief description of the blog post..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rich Text Content Editor */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                            Content * 
                            <span className="text-xs text-gray-500 ml-2">
                                ({getWordCount()} words, ~{getEstimatedReadTime()} min read)
                            </span>
                        </h2>
                        
                        {/* Editor Toolbar */}
                        <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-3">
                            <div className="flex flex-wrap gap-1">
                                {/* Text Formatting */}
                                <div className="flex border-r border-gray-300 pr-2 mr-2">
                                    <button
                                        type="button"
                                        onClick={() => execCommand('bold')}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Bold"
                                    >
                                        <Bold className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => execCommand('italic')}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Italic"
                                    >
                                        <Italic className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => execCommand('underline')}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Underline"
                                    >
                                        <Underline className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Headings */}
                                <div className="flex border-r border-gray-300 pr-2 mr-2">
                                    <button
                                        type="button"
                                        onClick={() => formatHeading(1)}
                                        className="px-3 py-2 hover:bg-gray-200 rounded text-sm font-bold"
                                        title="Heading 1"
                                    >
                                        H1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => formatHeading(2)}
                                        className="px-3 py-2 hover:bg-gray-200 rounded text-sm font-bold"
                                        title="Heading 2"
                                    >
                                        H2
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => formatHeading(3)}
                                        className="px-3 py-2 hover:bg-gray-200 rounded text-sm font-bold"
                                        title="Heading 3"
                                    >
                                        H3
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => formatHeading(4)}
                                        className="px-3 py-2 hover:bg-gray-200 rounded text-sm font-bold"
                                        title="Heading 4"
                                    >
                                        H4
                                    </button>
                                </div>

                                {/* Lists */}
                                <div className="flex border-r border-gray-300 pr-2 mr-2">
                                    <button
                                        type="button"
                                        onClick={() => execCommand('insertUnorderedList')}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Bullet List"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => execCommand('insertOrderedList')}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Numbered List"
                                    >
                                        <ListOrdered className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Insert Elements */}
                                <div className="flex border-r border-gray-300 pr-2 mr-2">
                                    <button
                                        type="button"
                                        onClick={insertLink}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Insert Link"
                                    >
                                        <Link2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={insertImage}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Insert Image"
                                    >
                                        <Image className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => execCommand('formatBlock', '<blockquote>')}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Quote"
                                    >
                                        <Quote className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={insertDivider}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Horizontal Rule"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Code */}
                                <div className="flex">
                                    <button
                                        type="button"
                                        onClick={() => execCommand('formatBlock', '<pre>')}
                                        className="p-2 hover:bg-gray-200 rounded"
                                        title="Code Block"
                                    >
                                        <Code className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div
                            ref={contentRef}
                            contentEditable
                            suppressContentEditableWarning={true}
                            onInput={updateContent}
                            onPaste={handlePaste}
                            className="min-h-96 p-4 border border-gray-300 border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            style={{
                                minHeight: '400px',
                                lineHeight: '1.6',
                                fontSize: '16px'
                            }}
                            placeholder="Start writing your blog content here..."
                        />
                    </div>

                    {/* Featured Image */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Featured Image</h2>
                        
                        <div className="space-y-4">
                            {featuredImagePreview ? (
                                <div className="relative">
                                    <img
                                        src={featuredImagePreview}
                                        alt="Featured"
                                        className="w-full h-64 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4">
                                        <label className="cursor-pointer">
                                            <span className="mt-2 block text-sm font-medium text-gray-900">
                                                Upload featured image
                                            </span>
                                            <input
                                                type="file"
                                                className="sr-only"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Images */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Images</h2>
                        
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <Plus className="mx-auto h-8 w-8 text-gray-400" />
                                <div className="mt-4">
                                    <label className="cursor-pointer">
                                        <span className="mt-2 block text-sm font-medium text-gray-900">
                                            Add images for content
                                        </span>
                                        <input
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            multiple
                                            onChange={handleAdditionalImagesChange}
                                        />
                                    </label>
                                </div>
                            </div>

                            {additionalImagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {additionalImagePreviews.map((preview, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={preview}
                                                alt={`Additional ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeAdditionalImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SEO Settings */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">SEO Settings</h2>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meta Title <span className="text-xs text-gray-500">({formData.metaTitle.length}/60)</span>
                                </label>
                                <input
                                    type="text"
                                    name="metaTitle"
                                    value={formData.metaTitle}
                                    onChange={handleInputChange}
                                    maxLength={60}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="SEO title (max 60 characters)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Meta Description <span className="text-xs text-gray-500">({formData.metaDescription.length}/160)</span>
                                </label>
                                <textarea
                                    name="metaDescription"
                                    value={formData.metaDescription}
                                    onChange={handleInputChange}
                                    maxLength={160}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="SEO description (max 160 characters)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Canonical URL
                                </label>
                                <input
                                    type="url"
                                    name="canonicalUrl"
                                    value={formData.canonicalUrl}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://khushihomesofageneration.com/blog/your-post"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Publish Settings */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Publish Settings</h2>
                        
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="isPublished"
                                checked={formData.isPublished}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                                Publish immediately
                            </label>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row gap-4 justify-end">
                            <button
                                type="button"
                                onClick={handlePreview}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/blog')}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Saving...' : (isEditing ? 'Update Blog' : 'Create Blog')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BlogForm;