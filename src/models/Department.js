const { pool } = require('../config/database');

class Department {
  static async create(departmentData) {
    const { name, code } = departmentData;
    
    try {
      const result = await pool.query(
        `INSERT INTO departments (name, code) 
         VALUES ($1, $2) 
         RETURNING *`,
        [name, code]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }
  
  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM departments WHERE id = $1',
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding department by id:', error);
      throw error;
    }
  }
  
  static async findByCode(code) {
    try {
      const result = await pool.query(
        'SELECT * FROM departments WHERE code = $1',
        [code]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding department by code:', error);
      throw error;
    }
  }
  
  static async findAll() {
    try {
      const result = await pool.query('SELECT * FROM departments ORDER BY name');
      return result.rows;
    } catch (error) {
      console.error('Error finding all departments:', error);
      throw error;
    }
  }
  
  static async update(id, updateData) {
    const { name, code } = updateData;
    
    try {
      const result = await pool.query(
        `UPDATE departments 
         SET name = $1, code = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [name, code, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }
  
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM departments WHERE id = $1 RETURNING *',
        [id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }
}

module.exports = Department; 