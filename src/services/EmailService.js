const nodemailer = require('nodemailer');
const { EmailSchedule, User, Subject, Course } = require('../models');
const logger = require('../config/logger');

/**
 * Service for managing email scheduling and sending
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize the email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      logger.info('Email transporter initialized');
    } catch (error) {
      logger.error(`Failed to initialize email transporter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Schedule an email campaign for students or professors
   * @param {Object} scheduleData - Email schedule data
   * @param {string} adminId - Admin user ID
   * @returns {Promise<Object>} The created email schedule
   */
  async scheduleEmail(scheduleData, adminId) {
    try {
      const emailSchedule = new EmailSchedule({
        ...scheduleData,
        createdBy: adminId
      });

      await emailSchedule.save();
      logger.info(`Email scheduled: ${emailSchedule.name} for ${emailSchedule.type}s on ${emailSchedule.scheduledDate}`);
      
      return emailSchedule;
    } catch (error) {
      logger.error(`Error scheduling email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process scheduled emails that are due to be sent
   * @returns {Promise<Array>} Processed email schedules
   */
  async processScheduledEmails() {
    try {
      // Find all scheduled emails with scheduledDate less than or equal to now
      const now = new Date();
      const scheduledEmails = await EmailSchedule.find({
        scheduledDate: { $lte: now },
        status: 'scheduled'
      });
      
      if (scheduledEmails.length === 0) {
        logger.info('No scheduled emails to process');
        return [];
      }
      
      logger.info(`Found ${scheduledEmails.length} scheduled emails to process`);
      
      const results = [];
      
      // Process each scheduled email
      for (const schedule of scheduledEmails) {
        try {
          // Update status to in_progress
          schedule.status = 'in_progress';
          await schedule.save();
          
          // Process based on type
          if (schedule.type === 'student') {
            await this.processStudentEmails(schedule);
          } else if (schedule.type === 'professor') {
            await this.processProfessorEmails(schedule);
          }
          
          // Update status to completed
          schedule.status = 'completed';
          schedule.completedAt = new Date();
          await schedule.save();
          
          results.push({
            id: schedule._id,
            name: schedule.name,
            status: 'completed',
            sentCount: schedule.sentCount
          });
        } catch (error) {
          logger.error(`Error processing email schedule ${schedule._id}: ${error.message}`);
          
          // Update status to failed
          schedule.status = 'failed';
          await schedule.save();
          
          results.push({
            id: schedule._id,
            name: schedule.name,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error processing scheduled emails: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process emails for students
   * @param {Object} schedule - Email schedule
   * @returns {Promise<void>}
   */
  async processStudentEmails(schedule) {
    try {
      // Find students
      const query = { role: 'student', isActive: true };
      
      // Apply course filter if specified
      if (schedule.courseFilter && schedule.courseFilter.length > 0) {
        query.courses = { $in: schedule.courseFilter };
      }
      
      const students = await User.find(query);
      
      if (students.length === 0) {
        logger.warn(`No students found for email schedule ${schedule._id}`);
        return;
      }
      
      logger.info(`Found ${students.length} students for email schedule ${schedule._id}`);
      
      let sentCount = 0;
      let errorCount = 0;
      
      // Send emails to each student
      for (const student of students) {
        try {
          // Generate student-specific email with available subjects
          const emailContent = await this.generateStudentEmailContent(student, schedule);
          
          // Send the email
          await this.sendEmail({
            to: student.email,
            subject: schedule.emailSubject,
            html: emailContent
          });
          
          sentCount++;
        } catch (error) {
          logger.error(`Failed to send email to student ${student._id}: ${error.message}`);
          
          // Track the error
          schedule.errors.push({
            email: student.email,
            error: error.message,
            timestamp: new Date()
          });
          
          errorCount++;
        }
      }
      
      // Update counts
      schedule.sentCount = sentCount;
      schedule.errorCount = errorCount;
      await schedule.save();
      
      logger.info(`Processed student emails for schedule ${schedule._id}: ${sentCount} sent, ${errorCount} failed`);
    } catch (error) {
      logger.error(`Error processing student emails for schedule ${schedule._id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process emails for professors
   * @param {Object} schedule - Email schedule
   * @returns {Promise<void>}
   */
  async processProfessorEmails(schedule) {
    try {
      // Find professors
      const query = { role: 'professor', isActive: true };
      
      // Apply course filter if specified
      if (schedule.courseFilter && schedule.courseFilter.length > 0) {
        query.courses = { $in: schedule.courseFilter };
      }
      
      const professors = await User.find(query);
      
      if (professors.length === 0) {
        logger.warn(`No professors found for email schedule ${schedule._id}`);
        return;
      }
      
      logger.info(`Found ${professors.length} professors for email schedule ${schedule._id}`);
      
      let sentCount = 0;
      let errorCount = 0;
      
      // Send emails to each professor
      for (const professor of professors) {
        try {
          // Generate professor-specific email with assigned subjects
          const emailContent = await this.generateProfessorEmailContent(professor, schedule);
          
          // Send the email
          await this.sendEmail({
            to: professor.email,
            subject: schedule.emailSubject,
            html: emailContent
          });
          
          sentCount++;
        } catch (error) {
          logger.error(`Failed to send email to professor ${professor._id}: ${error.message}`);
          
          // Track the error
          schedule.errors.push({
            email: professor.email,
            error: error.message,
            timestamp: new Date()
          });
          
          errorCount++;
        }
      }
      
      // Update counts
      schedule.sentCount = sentCount;
      schedule.errorCount = errorCount;
      await schedule.save();
      
      logger.info(`Processed professor emails for schedule ${schedule._id}: ${sentCount} sent, ${errorCount} failed`);
    } catch (error) {
      logger.error(`Error processing professor emails for schedule ${schedule._id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate email content for a student
   * @param {Object} student - Student user
   * @param {Object} schedule - Email schedule
   * @returns {Promise<string>} HTML email content
   */
  async generateStudentEmailContent(student, schedule) {
    try {
      // Get the courses for the student
      const courses = await Course.find({ _id: { $in: student.courses } });
      
      // Get the subjects for these courses that the student is eligible for
      const allSubjects = [];
      
      for (const course of courses) {
        // Find subjects for this course, excluding ones the student has already taken
        const subjects = await Subject.find({
          courses: course._id,
          isActive: true
          // TODO: Check prerequisites
        });
        
        allSubjects.push(...subjects);
      }
      
      // Create a unique list of subjects (in case a subject belongs to multiple courses)
      const uniqueSubjects = Array.from(
        new Map(allSubjects.map(s => [s._id.toString(), s])).values()
      );
      
      // Generate the HTML content with the subject list
      let baseTemplate = schedule.emailTemplate;
      
      // Replace tokens in the template
      baseTemplate = baseTemplate
        .replace('{{student_name}}', student.name)
        .replace('{{semester}}', schedule.semester)
        .replace('{{login_link}}', `${process.env.FRONTEND_URL}/login?redirectTo=/student/interests&semester=${schedule.semester}`);
      
      // Generate the subjects list
      let subjectsList = '';
      
      if (uniqueSubjects.length > 0) {
        subjectsList = '<ul>';
        uniqueSubjects.forEach(subject => {
          subjectsList += `<li>${subject.name} (${subject.code}) - ${subject.credits} créditos</li>`;
        });
        subjectsList += '</ul>';
      } else {
        subjectsList = '<p>Nenhuma disciplina disponível para matrícula neste semestre.</p>';
      }
      
      baseTemplate = baseTemplate.replace('{{subjects_list}}', subjectsList);
      
      return baseTemplate;
    } catch (error) {
      logger.error(`Error generating student email content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate email content for a professor
   * @param {Object} professor - Professor user
   * @param {Object} schedule - Email schedule
   * @returns {Promise<string>} HTML email content
   */
  async generateProfessorEmailContent(professor, schedule) {
    try {
      // Get the courses for the professor
      const courses = await Course.find({ _id: { $in: professor.courses } });
      
      // Get the subjects that the professor is eligible to teach
      const allSubjects = await Subject.find({
        eligibleProfessors: professor._id,
        isActive: true
      });
      
      // Generate the HTML content with the subject list
      let baseTemplate = schedule.emailTemplate;
      
      // Replace tokens in the template
      baseTemplate = baseTemplate
        .replace('{{professor_name}}', professor.name)
        .replace('{{semester}}', schedule.semester)
        .replace('{{login_link}}', `${process.env.FRONTEND_URL}/login?redirectTo=/professor/availability&semester=${schedule.semester}`);
      
      // Generate the subjects list
      let subjectsList = '';
      
      if (allSubjects.length > 0) {
        subjectsList = '<ul>';
        allSubjects.forEach(subject => {
          const courseNames = subject.courses
            .map(courseId => {
              const course = courses.find(c => c._id.toString() === courseId.toString());
              return course ? course.name : 'Curso desconhecido';
            })
            .join(', ');
          
          subjectsList += `<li>${subject.name} (${subject.code}) - ${subject.credits} créditos - Curso(s): ${courseNames}</li>`;
        });
        subjectsList += '</ul>';
      } else {
        subjectsList = '<p>Nenhuma disciplina disponível para você ministrar neste semestre.</p>';
      }
      
      baseTemplate = baseTemplate.replace('{{subjects_list}}', subjectsList);
      
      return baseTemplate;
    } catch (error) {
      logger.error(`Error generating professor email content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send an email
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(emailData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@unisinos.edu.br',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html
      };
      
      // Add CC if provided
      if (emailData.cc) {
        mailOptions.cc = emailData.cc;
      }
      
      // Add BCC if provided
      if (emailData.bcc) {
        mailOptions.bcc = emailData.bcc;
      }
      
      // Send mail
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${emailData.to}`);
      
      return result;
    } catch (error) {
      logger.error(`Error sending email to ${emailData.to}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new EmailService(); 