const { pool } = require('../config/database');

class Course {
  static async create(courseData) {
    const { name, code, credits, department_id } = courseData;
    
    try {
      const result = await pool.query(
        `INSERT INTO courses (name, code, credits, department_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [name, code, credits, department_id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }
  
  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT c.*, d.name as department_name, d.code as department_code
         FROM courses c
         JOIN departments d ON c.department_id = d.id
         WHERE c.id = $1`,
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding course by id:', error);
      throw error;
    }
  }
  
  static async findByCode(code) {
    try {
      const result = await pool.query(
        `SELECT c.*, d.name as department_name, d.code as department_code
         FROM courses c
         JOIN departments d ON c.department_id = d.id
         WHERE c.code = $1`,
        [code]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding course by code:', error);
      throw error;
    }
  }
  
  static async findAll() {
    try {
      const result = await pool.query(
        `SELECT c.*, d.name as department_name, d.code as department_code
         FROM courses c
         JOIN departments d ON c.department_id = d.id
         ORDER BY c.name`
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error finding all courses:', error);
      throw error;
    }
  }
  
  static async findByDepartment(departmentId) {
    try {
      const result = await pool.query(
        `SELECT c.*, d.name as department_name, d.code as department_code
         FROM courses c
         JOIN departments d ON c.department_id = d.id
         WHERE c.department_id = $1
         ORDER BY c.name`,
        [departmentId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error finding courses by department:', error);
      throw error;
    }
  }
  
  static async update(id, updateData) {
    const { name, code, credits, department_id } = updateData;
    
    try {
      const result = await pool.query(
        `UPDATE courses 
         SET name = $1, code = $2, credits = $3, department_id = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [name, code, credits, department_id, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }
  
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM courses WHERE id = $1 RETURNING *',
        [id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }
}

module.exports = Course; 