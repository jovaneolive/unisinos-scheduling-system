const { Subject, Course, User, ScheduleSuggestion, EmailSchedule } = require('../../models');
const emailService = require('../../services/EmailService');
const scheduleAIService = require('../../services/ScheduleAIService');
const logger = require('../../config/logger');

/**
 * Admin controller for managing subjects, professors, and schedules
 */
class AdminController {
  /**
   * Create a new subject
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async createSubject(req, res) {
    try {
      const { 
        name, 
        code, 
        description, 
        credits, 
        workload, 
        courses, 
        prerequisites, 
        eligibleProfessors,
        campus,
        semester 
      } = req.body;
      
      // Validate required fields
      if (!name || !code || !credits || !workload || !courses || !campus) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios não fornecidos'
        });
      }
      
      // Check if subject with code already exists
      const existingSubject = await Subject.findOne({ code });
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: `Disciplina com código ${code} já existe`
        });
      }
      
      // Create new subject
      const subject = new Subject({
        name,
        code,
        description,
        credits,
        workload,
        courses,
        prerequisites: prerequisites || [],
        eligibleProfessors: eligibleProfessors || [],
        campus,
        semester: semester || 1,
        isActive: true
      });
      
      await subject.save();
      
      logger.info(`Subject created: ${subject.name} (${subject.code})`);
      
      return res.status(201).json({
        success: true,
        data: subject
      });
    } catch (error) {
      logger.error(`Error creating subject: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar disciplina',
        error: error.message
      });
    }
  }
  
  /**
   * Get all subjects
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async getAllSubjects(req, res) {
    try {
      const { courseId, isActive } = req.query;
      
      // Build query
      const query = {};
      
      if (courseId) {
        query.courses = courseId;
      }
      
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }
      
      const subjects = await Subject.find(query)
        .populate('courses', 'name code')
        .populate('prerequisites', 'name code')
        .populate('eligibleProfessors', 'name email');
      
      return res.status(200).json({
        success: true,
        count: subjects.length,
        data: subjects
      });
    } catch (error) {
      logger.error(`Error fetching subjects: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar disciplinas',
        error: error.message
      });
    }
  }
  
  /**
   * Get a subject by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async getSubjectById(req, res) {
    try {
      const subject = await Subject.findById(req.params.id)
        .populate('courses', 'name code')
        .populate('prerequisites', 'name code')
        .populate('eligibleProfessors', 'name email');
      
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Disciplina não encontrada'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: subject
      });
    } catch (error) {
      logger.error(`Error fetching subject: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar disciplina',
        error: error.message
      });
    }
  }
  
  /**
   * Update a subject
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async updateSubject(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Find and update the subject
      const subject = await Subject.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Disciplina não encontrada'
        });
      }
      
      logger.info(`Subject updated: ${subject.name} (${subject.code})`);
      
      return res.status(200).json({
        success: true,
        data: subject
      });
    } catch (error) {
      logger.error(`Error updating subject: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar disciplina',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a subject (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async deleteSubject(req, res) {
    try {
      const { id } = req.params;
      
      // Soft delete (set isActive to false)
      const subject = await Subject.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      );
      
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Disciplina não encontrada'
        });
      }
      
      logger.info(`Subject soft deleted: ${subject.name} (${subject.code})`);
      
      return res.status(200).json({
        success: true,
        message: 'Disciplina desativada com sucesso'
      });
    } catch (error) {
      logger.error(`Error deleting subject: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao desativar disciplina',
        error: error.message
      });
    }
  }
  
  /**
   * Add prerequisites to a subject
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async addPrerequisites(req, res) {
    try {
      const { id } = req.params;
      const { prerequisites } = req.body;
      
      if (!prerequisites || !Array.isArray(prerequisites)) {
        return res.status(400).json({
          success: false,
          message: 'Lista de pré-requisitos inválida'
        });
      }
      
      const subject = await Subject.findByIdAndUpdate(
        id,
        { $addToSet: { prerequisites: { $each: prerequisites } } },
        { new: true }
      ).populate('prerequisites', 'name code');
      
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Disciplina não encontrada'
        });
      }
      
      logger.info(`Prerequisites added to subject: ${subject.name} (${subject.code})`);
      
      return res.status(200).json({
        success: true,
        data: subject
      });
    } catch (error) {
      logger.error(`Error adding prerequisites: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao adicionar pré-requisitos',
        error: error.message
      });
    }
  }
  
  /**
   * Link professors to a subject
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async linkProfessorsToSubject(req, res) {
    try {
      const { id } = req.params;
      const { professorIds } = req.body;
      
      if (!professorIds || !Array.isArray(professorIds)) {
        return res.status(400).json({
          success: false,
          message: 'Lista de professores inválida'
        });
      }
      
      // Verify all professors exist and have role 'professor'
      const professors = await User.find({
        _id: { $in: professorIds },
        role: 'professor'
      });
      
      if (professors.length !== professorIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Um ou mais professores não existem ou não têm a função de professor'
        });
      }
      
      const subject = await Subject.findByIdAndUpdate(
        id,
        { $addToSet: { eligibleProfessors: { $each: professorIds } } },
        { new: true }
      ).populate('eligibleProfessors', 'name email');
      
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Disciplina não encontrada'
        });
      }
      
      logger.info(`Professors linked to subject: ${subject.name} (${subject.code})`);
      
      return res.status(200).json({
        success: true,
        data: subject
      });
    } catch (error) {
      logger.error(`Error linking professors: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao vincular professores',
        error: error.message
      });
    }
  }
  
  /**
   * Schedule an email to students or professors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async scheduleEmail(req, res) {
    try {
      const { 
        name,
        type,
        semester,
        scheduledDate,
        emailSubject,
        emailTemplate,
        courseFilter
      } = req.body;
      
      // Validate required fields
      if (!name || !type || !semester || !scheduledDate || !emailSubject || !emailTemplate) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios não fornecidos'
        });
      }
      
      // Validate type
      if (type !== 'student' && type !== 'professor') {
        return res.status(400).json({
          success: false,
          message: 'Tipo de e-mail inválido (deve ser "student" ou "professor")'
        });
      }
      
      // Create email schedule
      const scheduleData = {
        name,
        type,
        semester,
        scheduledDate: new Date(scheduledDate),
        emailSubject,
        emailTemplate,
        courseFilter: courseFilter || []
      };
      
      const emailSchedule = await emailService.scheduleEmail(scheduleData, req.user._id);
      
      return res.status(201).json({
        success: true,
        data: emailSchedule
      });
    } catch (error) {
      logger.error(`Error scheduling email: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao agendar e-mail',
        error: error.message
      });
    }
  }
  
  /**
   * Get all scheduled emails
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async getScheduledEmails(req, res) {
    try {
      const { semester, type, status } = req.query;
      
      // Build query
      const query = {};
      
      if (semester) {
        query.semester = semester;
      }
      
      if (type) {
        query.type = type;
      }
      
      if (status) {
        query.status = status;
      }
      
      const emailSchedules = await EmailSchedule.find(query)
        .populate('createdBy', 'name email')
        .populate('courseFilter', 'name code')
        .sort({ scheduledDate: -1 });
      
      return res.status(200).json({
        success: true,
        count: emailSchedules.length,
        data: emailSchedules
      });
    } catch (error) {
      logger.error(`Error fetching email schedules: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar agendamentos de e-mail',
        error: error.message
      });
    }
  }
  
  /**
   * Generate a schedule suggestion using AI
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async generateScheduleSuggestion(req, res) {
    try {
      const { courseId, semester } = req.body;
      
      if (!courseId || !semester) {
        return res.status(400).json({
          success: false,
          message: 'Curso e semestre são obrigatórios'
        });
      }
      
      // Check if course exists
      const course = await Course.findById(courseId);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Curso não encontrado'
        });
      }
      
      // Generate schedule suggestion using the AI service
      const suggestion = await scheduleAIService.generateScheduleSuggestion(
        courseId,
        semester,
        req.user._id
      );
      
      return res.status(201).json({
        success: true,
        data: suggestion
      });
    } catch (error) {
      logger.error(`Error generating schedule suggestion: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao gerar sugestão de grade',
        error: error.message
      });
    }
  }
  
  /**
   * Get all schedule suggestions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async getScheduleSuggestions(req, res) {
    try {
      const { courseId, semester, status } = req.query;
      
      // Build query
      const query = {};
      
      if (courseId) {
        query.course = courseId;
      }
      
      if (semester) {
        query.semester = semester;
      }
      
      if (status) {
        query.approvalStatus = status;
      }
      
      const suggestions = await ScheduleSuggestion.find(query)
        .populate('course', 'name code')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate({
          path: 'scheduleItems.subject',
          select: 'name code campus credits'
        })
        .populate({
          path: 'scheduleItems.professor',
          select: 'name email'
        })
        .sort({ createdAt: -1 });
      
      return res.status(200).json({
        success: true,
        count: suggestions.length,
        data: suggestions
      });
    } catch (error) {
      logger.error(`Error fetching schedule suggestions: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar sugestões de grade',
        error: error.message
      });
    }
  }
  
  /**
   * Approve or reject a schedule suggestion
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response
   */
  async updateScheduleApprovalStatus(req, res) {
    try {
      const { id } = req.params;
      const { approvalStatus, comments } = req.body;
      
      if (!approvalStatus || !['approved', 'rejected', 'modified'].includes(approvalStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Status de aprovação inválido'
        });
      }
      
      const suggestion = await ScheduleSuggestion.findByIdAndUpdate(
        id,
        { 
          $set: { 
            approvalStatus,
            comments: comments || '',
            approvedBy: req.user._id,
            approvalDate: new Date()
          } 
        },
        { new: true }
      );
      
      if (!suggestion) {
        return res.status(404).json({
          success: false,
          message: 'Sugestão de grade não encontrada'
        });
      }
      
      logger.info(`Schedule suggestion ${approvalStatus}: ${suggestion._id}`);
      
      return res.status(200).json({
        success: true,
        data: suggestion
      });
    } catch (error) {
      logger.error(`Error updating schedule approval status: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status de aprovação',
        error: error.message
      });
    }
  }
}

module.exports = new AdminController(); 