const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Por favor, informe um e-mail válido']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'professor'],
    default: 'student'
  },
  passwordHash: {
    type: String,
    select: false
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  samlId: {
    type: String,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
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
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para verificar senha
UserSchema.methods.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Método para hash de senha
UserSchema.statics.hashPassword = async function(password) {
  return await bcrypt.hash(password, 10);
};

module.exports = mongoose.model('User', UserSchema); 