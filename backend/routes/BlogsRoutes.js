const express = require('express');
const router = express.Router();
const multer = require('multer');
const blogController = require('../controllers/BlogsController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// Multer config for memory storage (for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    }
});

// -------- PUBLIC ROUTES --------
router.get('/', blogController.getAllBlogs);
router.get('/sitemap.xml', blogController.generateSitemap);
router.get('/:slug', blogController.getBlogBySlug);

// -------- ADMIN ROUTES --------
router.get('/admin/all', auth, admin, blogController.adminGetAllBlogs);

router.post(
    '/admin/create',
    auth,
    admin,
    upload.fields([
        { name: 'featuredImage', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ]),
    blogController.adminCreateBlog
);

router.put(
    '/admin/:id',
    auth,
    admin,
    upload.fields([
        { name: 'featuredImage', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ]),
    blogController.adminUpdateBlog
);

router.delete('/admin/:id', auth, admin, blogController.adminDeleteBlog);

module.exports = router;