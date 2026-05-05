const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const adminAuth = require('../middleware/adminAuth');
const { upload, deleteFile, getFileKeyFromUrl } = require('../utils/cdn');

// Public route - Get active banners (within fromDate and toDate range)
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const banners = await Banner.find({
            fromDate: { $lte: now },
            toDate: { $gte: now }
        });

        if (banners.length > 0) {
            return res.status(200).json(banners);
        }

        // No active banners — return the default "Coming Soon" banner
        const defaultImageUrl = process.env.DEFAULT_BANNER_URL;

        return res.status(200).json([{
            _id: 'default',
            title: 'Coming Soon',
            bannerImage: defaultImageUrl,
            isDefault: true
        }]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin route - Get all banners regardless of date range
router.get('/all', adminAuth, async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        res.status(200).json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Public route - Get banner by ID
router.get('/:id', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }
        res.status(200).json(banner);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid banner ID format' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Admin only - Create new banner
router.post('/', adminAuth, upload.single('bannerImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Banner image is required' });
        }

        if (!req.body.fromDate || !req.body.toDate) {
            return res.status(400).json({ message: 'fromDate and toDate are required' });
        }

        const fromDate = new Date(req.body.fromDate);
        const toDate = new Date(req.body.toDate);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format for fromDate or toDate' });
        }

        if (toDate <= fromDate) {
            return res.status(400).json({ message: 'toDate must be after fromDate' });
        }

        const banner = new Banner({
            title: req.body.title,
            bannerImage: req.file.location,
            fromDate,
            toDate
        });

        const newBanner = await banner.save();
        res.status(201).json(newBanner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin only - Update banner
router.put('/:id', adminAuth, upload.single('bannerImage'), async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        if (req.body.fromDate && req.body.toDate) {
            const fromDate = new Date(req.body.fromDate);
            const toDate = new Date(req.body.toDate);
            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format for fromDate or toDate' });
            }
            if (toDate <= fromDate) {
                return res.status(400).json({ message: 'toDate must be after fromDate' });
            }
        }

        const updateData = {
            title: req.body.title || banner.title,
            fromDate: req.body.fromDate ? new Date(req.body.fromDate) : banner.fromDate,
            toDate: req.body.toDate ? new Date(req.body.toDate) : banner.toDate,
        };

        // If new image is uploaded, update the image URL and delete old image
        if (req.file) {
            // Delete old image from CDN
            if (banner.bannerImage) {
                const oldFileKey = getFileKeyFromUrl(banner.bannerImage);
                await deleteFile(oldFileKey);
            }
            updateData.bannerImage = req.file.location;
        }

        const updatedBanner = await Banner.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        res.status(200).json(updatedBanner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin only - Delete banner
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        // Delete image from CDN
        if (banner.bannerImage) {
            const fileKey = getFileKeyFromUrl(banner.bannerImage);
            await deleteFile(fileKey);
        }

        await Banner.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Banner has been deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 