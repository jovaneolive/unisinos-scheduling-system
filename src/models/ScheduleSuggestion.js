const mongoose = require('mongoose');

const ScheduleSuggestionSchema = new mongoose.Schema({
  semester: {
    type: String,
    required: true,
    match: [/^\d{4}\/[1-2]$/, 'Formato de semestre inválido, use YYYY/N onde N é 1 ou 2']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduleItems: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    day: {
      type: String,
      enum: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      required: true
    },
    shift: {
      type: String,
      enum: ['Manhã', 'Tarde', 'Noite'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido, use HH:MM']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido, use HH:MM']
    },
    room: {
      type: String
    },
    campus: {
      type: String,
      enum: ['São Leopoldo', 'Porto Alegre', 'Online'],
      required: true
    },
    estimatedEnrollment: {
      type: Number,
      min: 0
    }
  }],
  metadata: {
    studentInterestsCount: {
      type: Number,
      default: 0
    },
    professorAvailabilityCount: {
      type: Number,
      default: 0
    },
    generationAlgorithm: {
      type: String,
      default: 'optimization'
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    constraints: {
      type: Object
    }
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'modified'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  comments: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
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

// Index for efficient querying by semester and course
ScheduleSuggestionSchema.index({ semester: 1, course: 1 });

module.exports = mongoose.model('ScheduleSuggestion', ScheduleSuggestionSchema); 