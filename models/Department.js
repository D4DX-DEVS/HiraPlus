const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  // Flag to mark any department as hierarchical (can have sub-departments)
  isHierarchical: {
    type: Boolean,
    default: false
  },
  // Sub-departments array (only used if isHierarchical is true)
  subDepartments: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Add indexes for better performance
departmentSchema.index({ title: 1 });
departmentSchema.index({ isHierarchical: 1 });

module.exports = mongoose.model('Department', departmentSchema); 