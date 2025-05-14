const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  workload: {
    type: Number,
    required: true,
    min: 15
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  eligibleProfessors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  campus: {
    type: String,
    enum: ['São Leopoldo', 'Porto Alegre', 'Online'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware para atualizar o campo updatedAt antes de salvar
SubjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Subject', SubjectSchema); 