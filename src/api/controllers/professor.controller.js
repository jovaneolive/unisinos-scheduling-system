const { Subject, ProfessorAvailability, User } = require('../../models');
const logger = require('../../config/logger');

/**
 * Controller for professor operations
 */
class ProfessorController {
  /**
   * Get assigned subjects for a professor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async getAssignedSubjects(req, res) {
    try {
      const { semester } = req.query;
      const professorId = req.user._id;
      
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: 'Semestre é obrigatório'
        });
      }
      
      // Get professor info with courses
      const professor = await User.findById(professorId);
      
      if (!professor || professor.role !== 'professor') {
        return res.status(404).json({
          success: false,
          message: 'Professor não encontrado'
        });
      }
      
      // Get subjects that this professor is eligible to teach
      const subjects = await Subject.find({
        eligibleProfessors: professorId,
        isActive: true
      }).populate('courses', 'name code');
      
      // Get already registered availabilities for this semester
      const existingAvailabilities = await ProfessorAvailability.find({
        professor: professorId,
        semester
      }).select('subject');
      
      const registeredSubjectIds = existingAvailabilities.map(avail => 
        avail.subject.toString()
      );
      
      // Filter out subjects that the professor has already registered availability for
      const availableSubjects = subjects.filter(subject => 
        !registeredSubjectIds.includes(subject._id.toString())
      );
      
      return res.status(200).json({
        success: true,
        count: availableSubjects.length,
        data: availableSubjects
      });
    } catch (error) {
      logger.error(`Error fetching assigned subjects: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar disciplinas atribuídas',
        error: error.message
      });
    }
  }
  
  /**
   * Register professor availability
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async registerAvailability(req, res) {
    try {
      const { 
        subject,
        semester,
        isWillingToTeach,
        reasonIfNotWilling,
        availableShifts,
        availableDays,
        preferredTimeSlots,
        comments
      } = req.body;
      
      const professorId = req.user._id;
      
      // Validate required fields
      if (!subject || !semester || isWillingToTeach === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Disciplina, semestre e disposição para ministrar são obrigatórios'
        });
      }
      
      // If willing to teach, check for required shift and day information
      if (isWillingToTeach) {
        if (!availableShifts || !Array.isArray(availableShifts) || availableShifts.length === 0 ||
            !availableDays || !Array.isArray(availableDays) || availableDays.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Turnos e dias disponíveis são obrigatórios quando há disposição para ministrar'
          });
        }
      } else if (!reasonIfNotWilling) {
        return res.status(400).json({
          success: false,
          message: 'Motivo para não ministrar é obrigatório quando não há disposição'
        });
      }
      
      // Check if subject exists and professor is eligible
      const subjectExists = await Subject.findOne({
        _id: subject,
        eligibleProfessors: professorId,
        isActive: true
      });
      
      if (!subjectExists) {
        return res.status(400).json({
          success: false,
          message: 'Disciplina não existe ou você não está elegível para ministrá-la'
        });
      }
      
      // Check if already registered for this semester and subject
      const existingAvailability = await ProfessorAvailability.findOne({
        professor: professorId,
        subject,
        semester
      });
      
      if (existingAvailability) {
        return res.status(400).json({
          success: false,
          message: 'Você já registrou disponibilidade para esta disciplina neste semestre'
        });
      }
      
      // Count existing registrations for this semester
      const existingCount = await ProfessorAvailability.countDocuments({
        professor: professorId,
        semester,
        isWillingToTeach: true
      });
      
      // Check if exceeding maximum subjects (10)
      if (isWillingToTeach && existingCount >= 10) {
        return res.status(400).json({
          success: false,
          message: 'Você já atingiu o limite máximo de 10 disciplinas por semestre'
        });
      }
      
      // Create availability record
      const availabilityData = {
        professor: professorId,
        subject,
        semester,
        isWillingToTeach,
        reasonIfNotWilling: isWillingToTeach ? undefined : reasonIfNotWilling,
        availableShifts: isWillingToTeach ? availableShifts : [],
        availableDays: isWillingToTeach ? availableDays : [],
        preferredTimeSlots: preferredTimeSlots || [],
        comments,
        registeredAt: new Date()
      };
      
      const availability = new ProfessorAvailability(availabilityData);
      await availability.save();
      
      logger.info(`Professor ${professorId} registered availability for subject ${subject} in semester ${semester}`);
      
      return res.status(201).json({
        success: true,
        data: availability
      });
    } catch (error) {
      logger.error(`Error registering professor availability: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar disponibilidade',
        error: error.message
      });
    }
  }
  
  /**
   * Get professor's registered availabilities
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async getRegisteredAvailabilities(req, res) {
    try {
      const { semester } = req.query;
      const professorId = req.user._id;
      
      if (!semester) {
        return res.status(400).json({
          success: false,
          message: 'Semestre é obrigatório'
        });
      }
      
      const availabilities = await ProfessorAvailability.find({
        professor: professorId,
        semester
      })
      .populate('subject', 'name code credits campus')
      .sort('-isWillingToTeach');
      
      return res.status(200).json({
        success: true,
        count: availabilities.length,
        data: availabilities
      });
    } catch (error) {
      logger.error(`Error fetching professor availabilities: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar disponibilidades registradas',
        error: error.message
      });
    }
  }
  
  /**
   * Update an availability entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async updateAvailability(req, res) {
    try {
      const { id } = req.params;
      const professorId = req.user._id;
      const updateData = req.body;
      
      // Find the availability and check if it belongs to this professor
      const availability = await ProfessorAvailability.findOne({
        _id: id,
        professor: professorId
      });
      
      if (!availability) {
        return res.status(404).json({
          success: false,
          message: 'Disponibilidade não encontrada ou você não tem permissão para atualizá-la'
        });
      }
      
      // If changing from not willing to willing, check the max limit
      if (!availability.isWillingToTeach && updateData.isWillingToTeach) {
        const existingCount = await ProfessorAvailability.countDocuments({
          professor: professorId,
          semester: availability.semester,
          isWillingToTeach: true
        });
        
        if (existingCount >= 10) {
          return res.status(400).json({
            success: false,
            message: 'Você já atingiu o limite máximo de 10 disciplinas por semestre'
          });
        }
      }
      
      // If willing to teach, validate required fields
      if (updateData.isWillingToTeach) {
        if ((!updateData.availableShifts || !Array.isArray(updateData.availableShifts) || updateData.availableShifts.length === 0) &&
            (!availability.availableShifts || availability.availableShifts.length === 0)) {
          return res.status(400).json({
            success: false,
            message: 'Turnos disponíveis são obrigatórios quando há disposição para ministrar'
          });
        }
        
        if ((!updateData.availableDays || !Array.isArray(updateData.availableDays) || updateData.availableDays.length === 0) &&
            (!availability.availableDays || availability.availableDays.length === 0)) {
          return res.status(400).json({
            success: false,
            message: 'Dias disponíveis são obrigatórios quando há disposição para ministrar'
          });
        }
      } else if (updateData.isWillingToTeach === false && !updateData.reasonIfNotWilling && !availability.reasonIfNotWilling) {
        return res.status(400).json({
          success: false,
          message: 'Motivo para não ministrar é obrigatório quando não há disposição'
        });
      }
      
      // Update the availability
      Object.keys(updateData).forEach(key => {
        availability[key] = updateData[key];
      });
      
      await availability.save();
      
      logger.info(`Professor ${professorId} updated availability for subject ${availability.subject}`);
      
      return res.status(200).json({
        success: true,
        data: availability
      });
    } catch (error) {
      logger.error(`Error updating professor availability: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar disponibilidade',
        error: error.message
      });
    }
  }
  
  /**
   * Delete an availability entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async deleteAvailability(req, res) {
    try {
      const { id } = req.params;
      const professorId = req.user._id;
      
      // Find the availability and check if it belongs to this professor
      const availability = await ProfessorAvailability.findOne({
        _id: id,
        professor: professorId
      });
      
      if (!availability) {
        return res.status(404).json({
          success: false,
          message: 'Disponibilidade não encontrada ou você não tem permissão para excluí-la'
        });
      }
      
      await availability.remove();
      
      logger.info(`Professor ${professorId} deleted availability for subject ${availability.subject}`);
      
      return res.status(200).json({
        success: true,
        message: 'Disponibilidade excluída com sucesso'
      });
    } catch (error) {
      logger.error(`Error deleting professor availability: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir disponibilidade',
        error: error.message
      });
    }
  }
}

module.exports = new ProfessorController(); 