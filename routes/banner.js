const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const adminAuth = require('../middleware/adminAuth');
const { upload, deleteFile, getFileKeyFromUrl } = require('../utils/cdn');

// Public route - Get all banners
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.find();
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

        const banner = new Banner({
            title: req.body.title,
            bannerImage: req.file.location // CDN URL of the uploaded image
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

        const updateData = {
            title: req.body.title || banner.title,
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