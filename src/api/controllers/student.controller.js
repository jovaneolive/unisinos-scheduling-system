const { Subject, StudentInterest, User } = require('../../models');
const logger = require('../../config/logger');

/**
 * Controller for student operations
 */
class StudentController {
  /**
   * Get available subjects for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async getAvailableSubjects(req, res) {
    try {
      const { semester } = req.query;
      const studentId = req.user._id;
      
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: 'Semestre é obrigatório'
        });
      }
      
      // Get student info with courses
      const student = await User.findById(studentId).populate('courses');
      
      if (!student || student.role !== 'student') {
        return res.status(404).json({
          success: false,
          message: 'Estudante não encontrado'
        });
      }
      
      // Get student's courses
      const courseIds = student.courses.map(course => course._id);
      
      // Get subjects for these courses
      const subjects = await Subject.find({
        courses: { $in: courseIds },
        isActive: true
      }).populate('prerequisites', 'name code');
      
      // Get already registered interests for this semester
      const existingInterests = await StudentInterest.find({
        student: studentId,
        semester
      }).select('subject');
      
      const registeredSubjectIds = existingInterests.map(interest => 
        interest.subject.toString()
      );
      
      // Filter out subjects that the student has already registered interest in
      const availableSubjects = subjects.filter(subject => 
        !registeredSubjectIds.includes(subject._id.toString())
      );
      
      // TODO: Filter out subjects where prerequisites are not met
      
      return res.status(200).json({
        success: true,
        count: availableSubjects.length,
        data: availableSubjects
      });
    } catch (error) {
      logger.error(`Error fetching available subjects: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar disciplinas disponíveis',
        error: error.message
      });
    }
  }
  
  /**
   * Register student interest in subjects
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async registerInterest(req, res) {
    try {
      const { 
        subjects, 
        semester,
        preferredShifts
      } = req.body;
      
      const studentId = req.user._id;
      
      // Validate required fields
      if (!subjects || !Array.isArray(subjects) || !semester || !preferredShifts) {
        return res.status(400).json({
          success: false,
          message: 'Disciplinas, semestre e turnos preferidos são obrigatórios'
        });
      }
      
      // Validate max subjects
      if (subjects.length > 8) {
        return res.status(400).json({
          success: false,
          message: 'O limite máximo é de 8 disciplinas por semestre'
        });
      }
      
      // Check if all subjects exist and student is eligible
      const subjectsToRegister = await Subject.find({
        _id: { $in: subjects },
        isActive: true
      });
      
      if (subjectsToRegister.length !== subjects.length) {
        return res.status(400).json({
          success: false,
          message: 'Uma ou mais disciplinas não existem ou não estão ativas'
        });
      }
      
      // Get existing interests for this semester
      const existingInterests = await StudentInterest.find({
        student: studentId,
        semester
      });
      
      // Calculate how many more can be added
      const maxAllowed = 8;
      const canAddCount = maxAllowed - existingInterests.length;
      
      if (canAddCount < subjects.length) {
        return res.status(400).json({
          success: false,
          message: `Você já registrou interesse em ${existingInterests.length} disciplinas. Você pode adicionar apenas mais ${canAddCount} disciplinas.`
        });
      }
      
      // Create student interests
      const interests = [];
      
      for (let i = 0; i < subjects.length; i++) {
        const priority = existingInterests.length + i + 1;
        
        const interestData = {
          student: studentId,
          subject: subjects[i],
          semester,
          preferredShifts,
          preferredDays: req.body.preferredDays || [],
          priority,
          registeredAt: new Date()
        };
        
        const interest = new StudentInterest(interestData);
        await interest.save();
        
        interests.push(interest);
      }
      
      logger.info(`Student ${studentId} registered interest in ${subjects.length} subjects for semester ${semester}`);
      
      return res.status(201).json({
        success: true,
        count: interests.length,
        data: interests
      });
    } catch (error) {
      logger.error(`Error registering student interest: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar interesse',
        error: error.message
      });
    }
  }
  
  /**
   * Get student's registered interests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async getRegisteredInterests(req, res) {
    try {
      const { semester } = req.query;
      const studentId = req.user._id;
      
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: 'Semestre é obrigatório'
        });
      }
      
      const interests = await StudentInterest.find({
        student: studentId,
        semester
      })
      .populate('subject', 'name code credits campus')
      .sort('priority');
      
      return res.status(200).json({
        success: true,
        count: interests.length,
        data: interests
      });
    } catch (error) {
      logger.error(`Error fetching student interests: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar interesses registrados',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a registered interest
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async deleteInterest(req, res) {
    try {
      const { id } = req.params;
      const studentId = req.user._id;
      
      // Find the interest and check if it belongs to this student
      const interest = await StudentInterest.findOne({
        _id: id,
        student: studentId
      });
      
      if (!interest) {
        return res.status(404).json({
          success: false,
          message: 'Interesse não encontrado ou você não tem permissão para excluí-lo'
        });
      }
      
      await interest.remove();
      
      logger.info(`Student ${studentId} deleted interest in subject ${interest.subject}`);
      
      return res.status(200).json({
        success: true,
        message: 'Interesse excluído com sucesso'
      });
    } catch (error) {
      logger.error(`Error deleting student interest: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir interesse',
        error: error.message
      });
    }
  }
  
  /**
   * Update interest priorities
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async updateInterestPriorities(req, res) {
    try {
      const { priorityUpdates } = req.body;
      const studentId = req.user._id;
      
      if (!priorityUpdates || !Array.isArray(priorityUpdates)) {
        return res.status(400).json({
          success: false,
          message: 'Atualizações de prioridade inválidas'
        });
      }
      
      // Validate updates
      for (const update of priorityUpdates) {
        if (!update.interestId || !update.priority || update.priority < 1 || update.priority > 8) {
          return res.status(400).json({
            success: false,
            message: 'Atualizações de prioridade inválidas. A prioridade deve estar entre 1 e 8.'
          });
        }
      }
      
      // Update each interest
      const updatedInterests = [];
      
      for (const update of priorityUpdates) {
        const interest = await StudentInterest.findOne({
          _id: update.interestId,
          student: studentId
        });
        
        if (!interest) {
          return res.status(404).json({
            success: false,
            message: `Interesse ${update.interestId} não encontrado ou você não tem permissão para atualizá-lo`
          });
        }
        
        interest.priority = update.priority;
        await interest.save();
        
        updatedInterests.push(interest);
      }
      
      logger.info(`Student ${studentId} updated priorities for ${updatedInterests.length} interests`);
      
      return res.status(200).json({
        success: true,
        count: updatedInterests.length,
        data: updatedInterests
      });
    } catch (error) {
      logger.error(`Error updating interest priorities: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar prioridades',
        error: error.message
      });
    }
  }
}

module.exports = new StudentController(); 