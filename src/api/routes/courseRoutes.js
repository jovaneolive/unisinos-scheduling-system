const express = require('express');
const router = express.Router();
const Course = require('../../models/Course');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    
    // Find user by id
    const User = require('../../models/User');
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get courses by department
router.get('/department/:departmentId', async (req, res) => {
  try {
    const courses = await Course.findByDepartment(req.params.departmentId);
    res.json(courses);
  } catch (error) {
    console.error('Get courses by department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new course (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, code, credits, department_id } = req.body;
    
    // Check if course code already exists
    const existingCourse = await Course.findByCode(code);
    if (existingCourse) {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    
    // Create new course
    const newCourse = await Course.create({
      name,
      code,
      credits,
      department_id
    });
    
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, code, credits, department_id } = req.body;
    
    // Check if course exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if new code already exists (if changing code)
    if (code !== course.code) {
      const existingCourse = await Course.findByCode(code);
      if (existingCourse) {
        return res.status(400).json({ message: 'Course code already exists' });
      }
    }
    
    // Update course
    const updatedCourse = await Course.update(req.params.id, {
      name,
      code,
      credits,
      department_id
    });
    
    res.json(updatedCourse);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Check if course exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Delete course
    await Course.delete(req.params.id);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 