const mongoose = require('mongoose');

const StudentInterestSchema = new mongoose.Schema({
  student: {
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
  preferredShifts: [{
    type: String,
    enum: ['Manhã', 'Tarde', 'Noite'],
    required: true
  }],
  preferredDays: [{
    type: String,
    enum: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  }],
  priority: {
    type: Number,
    min: 1,
    max: 8,
    default: 1
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure a student can only express interest once per subject per semester
StudentInterestSchema.index({ student: 1, subject: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('StudentInterest', StudentInterestSchema); 