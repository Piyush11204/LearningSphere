const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    content: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        required: true,
        maxlength: 300
    },
    featuredImage: {
        url: String,
        publicId: String
    },
    images: [{
        url: String,
        publicId: String,
        alt: String
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: [
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
        ]
    },
    tags: [String],
    keywords: [String],
    metaTitle: {
        type: String,
        maxlength: 60
    },
    metaDescription: {
        type: String,
        maxlength: 160
    },
    canonicalUrl: String,
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date,
    readTime: {
        type: Number,
        default: 5
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    shares: {
        type: Number,
        default: 0
    },
    seoScore: {
        type: Number,
        default: 0
    },
    structuredData: {
        type: Object
    }
}, {
    timestamps: true
});

// Auto-generate slug from title with uniqueness check
blogSchema.pre('save', async function(next) {
    if (this.isModified('title') || !this.slug) {
        let baseSlug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        // Ensure slug is unique
        let slug = baseSlug;
        let counter = 1;

        while (true) {
            const existingBlog = await this.constructor.findOne({
                slug: slug,
                _id: { $ne: this._id }
            });

            if (!existingBlog) {
                this.slug = slug;
                break;
            }

            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    // Calculate read time
    if (this.isModified('content')) {
        const wordsPerMinute = 200;
        const wordCount = this.content.split(' ').length;
        this.readTime = Math.ceil(wordCount / wordsPerMinute);
    }

    // Auto-generate meta fields if not provided
    if (!this.metaTitle) {
        this.metaTitle = this.title.length > 60 ? this.title.substring(0, 57) + '...' : this.title;
    }

    if (!this.metaDescription) {
        this.metaDescription = this.excerpt.length > 160 ? this.excerpt.substring(0, 157) + '...' : this.excerpt;
    }

    next();
});

// Generate structured data for LearningSphere
blogSchema.methods.generateStructuredData = function() {
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "LearningSphere Blog - " + this.title,
        "description": this.metaDescription,
        "image": this.featuredImage?.url,
        "author": {
            "@type": "Person",
            "name": this.author?.name || "LearningSphere Team"
        },
        "publisher": {
            "@type": "Organization",
            "name": "LearningSphere",
            "logo": {
                "@type": "ImageObject",
                "url": "https://learningsphere-1fgj.onrender.com/LearningSphereLogo.png"
            }
        },
        "datePublished": this.publishedAt,
        "dateModified": this.updatedAt,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://learningsphere-1fgj.onrender.com/blog/${this.slug}`
        }
    };
};

module.exports = mongoose.model('Blog', blogSchema);