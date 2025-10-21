const Blog = require('../models/BlogsModel');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Utility: Extract keywords from content
const extractKeywords = (content) => {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    const words = content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word));
    const frequency = {};
    words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    return Object.keys(frequency)
        .sort((a, b) => frequency[b] - frequency[a])
        .slice(0, 10);
};

// Utility: Calculate SEO score
const calculateSEOScore = (blog) => {
    let score = 0;
    if (blog.title && blog.title.length >= 30 && blog.title.length <= 60) score += 20;
    else if (blog.title && blog.title.length >= 20) score += 10;
    if (blog.metaDescription && blog.metaDescription.length >= 120 && blog.metaDescription.length <= 160) score += 15;
    else if (blog.metaDescription && blog.metaDescription.length >= 100) score += 10;
    if (blog.content) {
        const wordCount = blog.content.split(' ').length;
        if (wordCount >= 1000) score += 20;
        else if (wordCount >= 500) score += 15;
        else if (wordCount >= 300) score += 10;
    }
    if (blog.featuredImage && blog.featuredImage.url) score += 10;
    if (blog.tags && blog.tags.length >= 3) score += 10;
    else if (blog.tags && blog.tags.length >= 1) score += 5;
    if (blog.keywords && blog.keywords.length >= 5) score += 15;
    else if (blog.keywords && blog.keywords.length >= 3) score += 10;
    if (blog.excerpt && blog.excerpt.length >= 100) score += 10;
    else if (blog.excerpt && blog.excerpt.length >= 50) score += 5;
    return score;
};

// Utility: Upload image to Cloudinary
const uploadImageToCloudinary = async (file, folder = 'learningsphere-blog-images') => {
    try {
        const base64String = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64String, {
            folder,
            resource_type: 'image',
            transformation: [
                { width: 1200, height: 630, crop: 'fill', quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        throw new Error('Image upload failed');
    }
};

// Utility: Delete image from Cloudinary
const deleteImageFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        // Log but don't throw
    }
};

module.exports = {
    // Public: Get all published blogs (with pagination, search, category)
    getAllBlogs: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 12;
            const category = req.query.category;
            const search = req.query.search;
            let query = { isPublished: true };
            if (category) query.category = category;
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ];
            }
            const total = await Blog.countDocuments(query);
            const blogs = await Blog.find(query)
                .populate('author', 'name')
                .sort({ publishedAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .lean();
            res.json({
                success: true,
                blogs: blogs || [],
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                total,
                category: category || null,
                search: search || null
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error loading blogs: ' + error.message });
        }
    },

    // Public: Get single blog by slug
    getBlogBySlug: async (req, res) => {
        try {
            const blog = await Blog.findOne({
                slug: req.params.slug,
                isPublished: true
            }).populate('author', 'name');
            if (!blog) {
                return res.status(404).json({ success: false, error: 'Blog not found' });
            }
            blog.views += 1;
            await blog.save();
            const relatedBlogs = await Blog.find({
                _id: { $ne: blog._id },
                category: blog.category,
                isPublished: true
            }).limit(3).populate('author', 'name');
            res.json({
                success: true,
                blog,
                relatedBlogs,
                structuredData: blog.generateStructuredData()
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error loading blog: ' + error.message });
        }
    },

    // Public: Generate sitemap.xml
    generateSitemap: async (req, res) => {
        try {
            const blogs = await Blog.find({ isPublished: true }).select('slug updatedAt');
            let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://khushihomesofageneration.com/blog</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;
            blogs.forEach(blog => {
                sitemap += `
    <url>
        <loc>https://khushihomesofageneration.com/blog/${blog.slug}</loc>
        <lastmod>${blog.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
            });
            sitemap += '\n</urlset>';
            res.set('Content-Type', 'application/xml');
            res.send(sitemap);
        } catch (error) {
            res.status(500).send('Error generating sitemap');
        }
    },

    // Admin: Get all blogs (no filters)
    adminGetAllBlogs: async (req, res) => {
        try {
            const blogs = await Blog.find()
                .populate('author', 'name email')
                .sort({ createdAt: -1 })
                .lean();
            res.json({
                success: true,
                blogs: blogs || []
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error loading blogs: ' + error.message });
        }
    },

    // Admin: Create blog
    adminCreateBlog: async (req, res) => {
        try {
            const {
                title,
                content,
                excerpt,
                category,
                tags,
                metaTitle,
                metaDescription,
                canonicalUrl,
                isPublished
            } = req.body;

            let featuredImage = null;
            if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
                featuredImage = await uploadImageToCloudinary(req.files.featuredImage[0], 'learningsphere-blog-featured');
            }

            let images = [];
            if (req.files && req.files.images) {
                for (const file of req.files.images) {
                    const uploadedImage = await uploadImageToCloudinary(file, 'learningsphere-blog-content');
                    images.push({
                        ...uploadedImage,
                        alt: file.originalname.split('.')[0]
                    });
                }
            }

            const keywords = extractKeywords(content + ' ' + title);

            const blog = new Blog({
                title,
                content,
                excerpt,
                featuredImage,
                images,
                author: req.user.id,
                category,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                keywords,
                metaTitle,
                metaDescription,
                canonicalUrl,
                isPublished: isPublished === 'true' || isPublished === true,
                publishedAt: (isPublished === 'true' || isPublished === true) ? new Date() : null
            });

            blog.seoScore = calculateSEOScore(blog);

            await blog.save();

            res.json({ success: true, blog });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create blog: ' + error.message });
        }
    },

    // Admin: Update blog
    adminUpdateBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const blog = await Blog.findById(id);
            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }
            const {
                title,
                content,
                excerpt,
                category,
                tags,
                metaTitle,
                metaDescription,
                canonicalUrl,
                isPublished
            } = req.body;

            if (title) blog.title = title;
            if (content) blog.content = content;
            if (excerpt) blog.excerpt = excerpt;
            if (category) blog.category = category;
            if (tags) blog.tags = tags.split(',').map(tag => tag.trim());
            if (metaTitle) blog.metaTitle = metaTitle;
            if (metaDescription) blog.metaDescription = metaDescription;
            if (canonicalUrl) blog.canonicalUrl = canonicalUrl;

            if (isPublished !== undefined) {
                const wasPublished = blog.isPublished;
                blog.isPublished = isPublished === 'true' || isPublished === true;
                if (!wasPublished && blog.isPublished) {
                    blog.publishedAt = new Date();
                }
            }

            if (req.files && req.files.featuredImage && req.files.featuredImage[0]) {
                if (blog.featuredImage?.publicId) {
                    await deleteImageFromCloudinary(blog.featuredImage.publicId);
                }
                blog.featuredImage = await uploadImageToCloudinary(req.files.featuredImage[0], 'learningsphere-blog-featured');
            }

            if (content || title) {
                blog.keywords = extractKeywords((content || blog.content) + ' ' + (title || blog.title));
            }

            blog.seoScore = calculateSEOScore(blog);

            await blog.save();

            res.json({ success: true, blog });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update blog: ' + error.message });
        }
    },

    // Admin: Delete blog
    adminDeleteBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const blog = await Blog.findById(id);
            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }
            if (blog.featuredImage?.publicId) {
                await deleteImageFromCloudinary(blog.featuredImage.publicId);
            }
            if (blog.images?.length > 0) {
                for (const image of blog.images) {
                    if (image.publicId) {
                        await deleteImageFromCloudinary(image.publicId);
                    }
                }
            }
            await Blog.findByIdAndDelete(id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete blog: ' + error.message });
        }
    }
};