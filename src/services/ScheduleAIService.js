const logger = require('../config/logger');
const { ScheduleSuggestion, StudentInterest, ProfessorAvailability, Subject, User } = require('../models');

/**
 * Service for generating AI-based schedule suggestions
 */
class ScheduleAIService {
  /**
   * Generate a schedule suggestion for a course and semester
   * @param {string} courseId - The course ID
   * @param {string} semester - The semester (e.g., "2025/1")
   * @param {string} adminId - The admin user ID
   * @returns {Promise<Object>} The generated schedule suggestion
   */
  async generateScheduleSuggestion(courseId, semester, adminId) {
    try {
      logger.info(`Generating schedule suggestion for course ${courseId} and semester ${semester}`);
      
      // 1. Fetch all relevant data
      const [studentInterests, professorAvailabilities, subjects] = await Promise.all([
        this.getStudentInterests(courseId, semester),
        this.getProfessorAvailabilities(courseId, semester),
        this.getSubjectsForCourse(courseId)
      ]);
      
      // 2. Check if we have enough data to generate a suggestion
      if (studentInterests.length === 0 || professorAvailabilities.length === 0) {
        logger.warn(`Not enough data to generate a schedule for course ${courseId} and semester ${semester}`);
        throw new Error('Não há dados suficientes de alunos ou professores para gerar uma sugestão de grade.');
      }
      
      // 3. Process the data to identify viable subjects (with >10 student interests)
      const viableSubjects = this.identifyViableSubjects(studentInterests, subjects);
      
      if (viableSubjects.length === 0) {
        logger.warn(`No viable subjects found for course ${courseId} and semester ${semester}`);
        throw new Error('Não foram encontradas disciplinas com interesse suficiente de alunos (mínimo 10).');
      }
      
      // 4. Match professors to subjects based on availability
      const professorSubjectMatches = this.matchProfessorsToSubjects(viableSubjects, professorAvailabilities);
      
      // 5. Generate time slots based on student preferences and professor availability
      const scheduleItems = this.generateTimeSlots(professorSubjectMatches, studentInterests, professorAvailabilities);
      
      // 6. Create and save the schedule suggestion
      const suggestion = new ScheduleSuggestion({
        semester,
        course: courseId,
        createdBy: adminId,
        scheduleItems,
        metadata: {
          studentInterestsCount: studentInterests.length,
          professorAvailabilityCount: professorAvailabilities.length,
          generationAlgorithm: 'optimization',
          score: this.calculateSuggestionScore(scheduleItems, studentInterests, professorAvailabilities),
          constraints: {
            minStudentInterests: 10,
            maxProfessorSubjects: 10
          }
        }
      });
      
      await suggestion.save();
      logger.info(`Schedule suggestion generated successfully for course ${courseId} and semester ${semester}`);
      
      return suggestion;
    } catch (error) {
      logger.error(`Error generating schedule suggestion: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all student interests for a course and semester
   * @param {string} courseId - The course ID
   * @param {string} semester - The semester
   * @returns {Promise<Array>} Student interests
   */
  async getStudentInterests(courseId, semester) {
    try {
      const subjects = await Subject.find({ courses: courseId }).select('_id');
      const subjectIds = subjects.map(subject => subject._id);
      
      return await StudentInterest.find({
        subject: { $in: subjectIds },
        semester
      })
      .populate('student', 'name email')
      .populate('subject', 'name code campus');
    } catch (error) {
      logger.error(`Error fetching student interests: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all professor availabilities for a course and semester
   * @param {string} courseId - The course ID
   * @param {string} semester - The semester
   * @returns {Promise<Array>} Professor availabilities
   */
  async getProfessorAvailabilities(courseId, semester) {
    try {
      const subjects = await Subject.find({ courses: courseId }).select('_id');
      const subjectIds = subjects.map(subject => subject._id);
      
      return await ProfessorAvailability.find({
        subject: { $in: subjectIds },
        semester,
        isWillingToTeach: true
      })
      .populate('professor', 'name email')
      .populate('subject', 'name code campus');
    } catch (error) {
      logger.error(`Error fetching professor availabilities: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all subjects for a course
   * @param {string} courseId - The course ID
   * @returns {Promise<Array>} Subjects
   */
  async getSubjectsForCourse(courseId) {
    try {
      return await Subject.find({ 
        courses: courseId,
        isActive: true
      })
      .populate('eligibleProfessors', 'name email')
      .populate('prerequisites', 'name code');
    } catch (error) {
      logger.error(`Error fetching subjects for course: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Identify viable subjects with sufficient student interest
   * @param {Array} studentInterests - Student interests
   * @param {Array} subjects - All subjects
   * @returns {Array} Viable subjects
   */
  identifyViableSubjects(studentInterests, subjects) {
    const interestCounts = {};
    
    // Count interests for each subject
    studentInterests.forEach(interest => {
      const subjectId = interest.subject._id.toString();
      if (!interestCounts[subjectId]) {
        interestCounts[subjectId] = {
          count: 0,
          subject: interest.subject,
          preferredShifts: {},
          preferredDays: {}
        };
      }
      
      interestCounts[subjectId].count += 1;
      
      // Track preferred shifts
      interest.preferredShifts.forEach(shift => {
        if (!interestCounts[subjectId].preferredShifts[shift]) {
          interestCounts[subjectId].preferredShifts[shift] = 0;
        }
        interestCounts[subjectId].preferredShifts[shift] += 1;
      });
      
      // Track preferred days
      if (interest.preferredDays && interest.preferredDays.length > 0) {
        interest.preferredDays.forEach(day => {
          if (!interestCounts[subjectId].preferredDays[day]) {
            interestCounts[subjectId].preferredDays[day] = 0;
          }
          interestCounts[subjectId].preferredDays[day] += 1;
        });
      }
    });
    
    // Filter for subjects with enough interest (>=10 students)
    const viableSubjects = Object.values(interestCounts)
      .filter(item => item.count >= 10)
      .map(item => ({
        ...item,
        // Add the full subject details from the subjects array
        subjectDetails: subjects.find(s => s._id.toString() === item.subject._id.toString())
      }));
    
    return viableSubjects;
  }
  
  /**
   * Match professors to subjects based on availability
   * @param {Array} viableSubjects - Viable subjects
   * @param {Array} professorAvailabilities - Professor availabilities
   * @returns {Array} Professor-subject matches
   */
  matchProfessorsToSubjects(viableSubjects, professorAvailabilities) {
    const matches = [];
    const professorLoad = {};
    
    // Initialize professor load counter
    professorAvailabilities.forEach(availability => {
      const professorId = availability.professor._id.toString();
      if (!professorLoad[professorId]) {
        professorLoad[professorId] = 0;
      }
    });
    
    // For each viable subject, find all available professors
    viableSubjects.forEach(viableSubject => {
      const subjectId = viableSubject.subject._id.toString();
      const availableProfessors = professorAvailabilities
        .filter(avail => avail.subject._id.toString() === subjectId)
        .map(avail => ({
          professor: avail.professor,
          availability: avail,
          currentLoad: professorLoad[avail.professor._id.toString()] || 0
        }))
        .filter(prof => prof.currentLoad < 10); // Professor can teach up to 10 subjects
      
      if (availableProfessors.length > 0) {
        // Sort by current load (prioritize professors with lower load)
        availableProfessors.sort((a, b) => a.currentLoad - b.currentLoad);
        
        // Assign the professor with the lowest current load
        const assignedProfessor = availableProfessors[0];
        
        matches.push({
          subject: viableSubject,
          professor: assignedProfessor.professor,
          professorAvailability: assignedProfessor.availability
        });
        
        // Update the professor's load counter
        professorLoad[assignedProfessor.professor._id.toString()] += 1;
      }
    });
    
    return matches;
  }
  
  /**
   * Generate time slots based on student preferences and professor availability
   * @param {Array} professorSubjectMatches - Professor-subject matches
   * @param {Array} studentInterests - Student interests
   * @param {Array} professorAvailabilities - Professor availabilities
   * @returns {Array} Schedule items
   */
  generateTimeSlots(professorSubjectMatches, studentInterests, professorAvailabilities) {
    const scheduleItems = [];
    const occupiedSlots = {};
    
    // For each professor-subject match, generate a time slot
    professorSubjectMatches.forEach(match => {
      const { subject, professor, professorAvailability } = match;
      const subjectId = subject.subject._id.toString();
      const professorId = professor._id.toString();
      
      // Get student preferences for this subject
      const relevantStudentInterests = studentInterests.filter(
        interest => interest.subject._id.toString() === subjectId
      );
      
      // Calculate optimal day and shift based on student and professor preferences
      const { optimalDay, optimalShift } = this.calculateOptimalTimeSlot(
        subject,
        professorAvailability,
        relevantStudentInterests,
        occupiedSlots
      );
      
      if (optimalDay && optimalShift) {
        // Generate the standard start/end times based on the shift
        const { startTime, endTime } = this.getDefaultTimes(optimalShift);
        
        // Create the schedule item
        const scheduleItem = {
          subject: subject.subject._id,
          professor: professorId,
          day: optimalDay,
          shift: optimalShift,
          startTime,
          endTime,
          campus: subject.subject.campus,
          estimatedEnrollment: relevantStudentInterests.length
        };
        
        // Track this slot as occupied to avoid conflicts
        if (!occupiedSlots[professorId]) {
          occupiedSlots[professorId] = [];
        }
        occupiedSlots[professorId].push({
          day: optimalDay,
          shift: optimalShift
        });
        
        scheduleItems.push(scheduleItem);
      }
    });
    
    return scheduleItems;
  }
  
  /**
   * Calculate optimal time slot based on preferences
   * @param {Object} subject - Subject with interest data
   * @param {Object} professorAvailability - Professor availability
   * @param {Array} studentInterests - Student interests for this subject
   * @param {Object} occupiedSlots - Already occupied time slots
   * @returns {Object} Optimal day and shift
   */
  calculateOptimalTimeSlot(subject, professorAvailability, studentInterests, occupiedSlots) {
    const professorId = professorAvailability.professor._id.toString();
    const professorOccupiedSlots = occupiedSlots[professorId] || [];
    
    // Get available days and shifts for the professor
    const availableDays = professorAvailability.availableDays || [];
    const availableShifts = professorAvailability.availableShifts || [];
    
    // Count student preferred shifts
    const studentShiftPreferences = {};
    const studentDayPreferences = {};
    
    availableShifts.forEach(shift => {
      studentShiftPreferences[shift] = 0;
    });
    
    availableDays.forEach(day => {
      studentDayPreferences[day] = 0;
    });
    
    // Calculate student preferences
    studentInterests.forEach(interest => {
      interest.preferredShifts.forEach(shift => {
        if (availableShifts.includes(shift)) {
          studentShiftPreferences[shift] += 1;
        }
      });
      
      if (interest.preferredDays && interest.preferredDays.length > 0) {
        interest.preferredDays.forEach(day => {
          if (availableDays.includes(day)) {
            studentDayPreferences[day] += 1;
          }
        });
      }
    });
    
    // Find the optimal shift (most preferred by students)
    let optimalShift = null;
    let maxShiftPreference = 0;
    
    Object.entries(studentShiftPreferences).forEach(([shift, count]) => {
      if (count > maxShiftPreference) {
        maxShiftPreference = count;
        optimalShift = shift;
      }
    });
    
    // Find the optimal day (most preferred by students)
    let optimalDay = null;
    let maxDayPreference = 0;
    
    Object.entries(studentDayPreferences).forEach(([day, count]) => {
      if (count > maxDayPreference) {
        // Check if this day-shift combination is already occupied for this professor
        const isSlotFree = !professorOccupiedSlots.some(
          slot => slot.day === day && slot.shift === optimalShift
        );
        
        if (isSlotFree) {
          maxDayPreference = count;
          optimalDay = day;
        }
      }
    });
    
    // If no optimal day was found (all preferred days have conflicts),
    // choose any available day that doesn't conflict
    if (!optimalDay && availableDays.length > 0) {
      for (const day of availableDays) {
        const isSlotFree = !professorOccupiedSlots.some(
          slot => slot.day === day && slot.shift === optimalShift
        );
        
        if (isSlotFree) {
          optimalDay = day;
          break;
        }
      }
    }
    
    return {
      optimalDay,
      optimalShift
    };
  }
  
  /**
   * Get default start and end times for a shift
   * @param {string} shift - The shift (Manhã, Tarde, Noite)
   * @returns {Object} Start and end times
   */
  getDefaultTimes(shift) {
    switch (shift) {
      case 'Manhã':
        return { startTime: '08:00', endTime: '11:30' };
      case 'Tarde':
        return { startTime: '13:30', endTime: '17:00' };
      case 'Noite':
        return { startTime: '19:00', endTime: '22:30' };
      default:
        return { startTime: '08:00', endTime: '11:30' };
    }
  }
  
  /**
   * Calculate a score for the suggestion quality
   * @param {Array} scheduleItems - Generated schedule items
   * @param {Array} studentInterests - Student interests
   * @param {Array} professorAvailabilities - Professor availabilities
   * @returns {number} Score from 0-100
   */
  calculateSuggestionScore(scheduleItems, studentInterests, professorAvailabilities) {
    // Base score starts at 70
    let score = 70;
    
    // Calculate the percentage of viable subjects that got scheduled
    const uniqueSubjectsWithInterest = new Set(
      studentInterests.map(interest => interest.subject._id.toString())
    );
    
    const scheduledSubjects = new Set(
      scheduleItems.map(item => item.subject.toString())
    );
    
    const scheduleCoverage = scheduledSubjects.size / uniqueSubjectsWithInterest.size;
    
    // Add up to 15 points for schedule coverage
    score += Math.round(scheduleCoverage * 15);
    
    // Calculate professor load balance (standard deviation of assigned subjects)
    const professorLoads = {};
    scheduleItems.forEach(item => {
      const profId = item.professor.toString();
      professorLoads[profId] = (professorLoads[profId] || 0) + 1;
    });
    
    const loadValues = Object.values(professorLoads);
    const avgLoad = loadValues.reduce((sum, val) => sum + val, 0) / loadValues.length;
    const loadVariance = loadValues.reduce((sum, val) => sum + Math.pow(val - avgLoad, 2), 0) / loadValues.length;
    const loadStdDev = Math.sqrt(loadVariance);
    
    // Add up to 10 points for low standard deviation (balanced loads)
    // Lower standard deviation is better, so we invert the scale
    score += Math.round(Math.max(0, 10 - loadStdDev * 2));
    
    // Check student satisfaction (matching their preferred shifts)
    let satisfiedPreferences = 0;
    let totalPreferences = 0;
    
    scheduleItems.forEach(item => {
      const subjectInterests = studentInterests.filter(
        interest => interest.subject._id.toString() === item.subject.toString()
      );
      
      subjectInterests.forEach(interest => {
        totalPreferences++;
        if (interest.preferredShifts.includes(item.shift)) {
          satisfiedPreferences++;
        }
      });
    });
    
    // Add up to 5 points for satisfying student shift preferences
    if (totalPreferences > 0) {
      const satisfactionRate = satisfiedPreferences / totalPreferences;
      score += Math.round(satisfactionRate * 5);
    }
    
    return Math.min(100, Math.max(0, score));
  }
}

module.exports = new ScheduleAIService(); 