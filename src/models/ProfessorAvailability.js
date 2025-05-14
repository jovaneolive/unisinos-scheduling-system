const mongoose = require('mongoose');

const ProfessorAvailabilitySchema = new mongoose.Schema({
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  semester: {
    type: String,
    required: true, // Ex: "2025/1"
    match: [/^\d{4}\/[1-2]$/, 'Formato de semestre inválido, use YYYY/N onde N é 1 ou 2']
  },
  isWillingToTeach: {
    type: Boolean,
    required: true,
    default: true
  },
  reasonIfNotWilling: {
    type: String,
    trim: true
  },
  availableShifts: [{
    type: String,
    enum: ['Manhã', 'Tarde', 'Noite'],
    required: true
  }],
  availableDays: [{
    type: String,
    enum: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    required: true
  }],
  preferredTimeSlots: [{
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
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido, use HH:MM']
    },
    endTime: {
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido, use HH:MM']
    }
  }],
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  comments: {
    type: String,
    trim: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure a professor can only express availability once per subject per semester
ProfessorAvailabilitySchema.index({ professor: 1, subject: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('ProfessorAvailability', ProfessorAvailabilitySchema); 