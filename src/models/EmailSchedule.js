const mongoose = require('mongoose');

const EmailScheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['student', 'professor'],
    required: true
  },
  semester: {
    type: String,
    required: true,
    match: [/^\d{4}\/[1-2]$/, 'Formato de semestre inválido, use YYYY/N onde N é 1 ou 2']
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  emailSubject: {
    type: String,
    required: true,
    trim: true
  },
  emailTemplate: {
    type: String,
    required: true
  },
  courseFilter: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'scheduled'
  },
  sentCount: {
    type: Number,
    default: 0
  },
  errorCount: {
    type: Number,
    default: 0
  },
  errors: [{
    email: String,
    error: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying by scheduled date and status
EmailScheduleSchema.index({ scheduledDate: 1, status: 1 });

module.exports = mongoose.model('EmailSchedule', EmailScheduleSchema); 