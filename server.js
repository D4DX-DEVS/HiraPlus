require('dotenv').config();

// Prevent app crashes from unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash the app
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception:', error);
  // Don't crash the app
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const mealRoutes = require('./routes/meals');
const messStaffRoutes = require('./routes/messStaff');
const bannerRoutes = require('./routes/banner');
const receptionRoutes = require('./routes/reception');
const departmentRoutes = require('./routes/departments');
const tagRoutes = require('./routes/tags');
const leadersRoutes = require('./routes/leaders');
const leadersMeetingsRoutes = require('./routes/leadersMeetings');
const scheduleRoutes = require('./routes/schedules');
const generalSecretaryRoutes = require('./routes/generalSecretary');
const roleRoutes = require('./routes/roles');
const customTagsRoutes = require('./routes/customTags');

const app = express();

// Middleware
// app.use(cors({
//   origin: ['http://localhost:5174'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// }));
app.use(cors());
app.use(express.json());


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/mess-staff', messStaffRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/testing/leaders', leadersRoutes);
app.use('/api/testing/leaders-meetings', leadersMeetingsRoutes);
app.use('/api/testing/schedules', scheduleRoutes);
app.use('/api/testing/general-secretary', generalSecretaryRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/testing/custom-tags', customTagsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 