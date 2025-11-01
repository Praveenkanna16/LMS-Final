const { Assessment, AssessmentSubmission, Question, QuestionBank, User, Batch, Course } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const fcmService = require('../services/fcmService');

/**
 * Enhanced Assessment Controller
 * Comprehensive test creation, auto-grading, and analytics
 */

// ==================== TEST CREATION ====================

/**
 * Create new assessment/test
 */
const createAssessment = async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      batchId,
      type,
      category,
      scheduledFor,
      deadline,
      timeLimit,
      totalPoints,
      difficulty,
      settings,
      learningObjectives,
      tags
    } = req.body;

    const teacherId = req.user.id;

    // Validate dates
    if (new Date(deadline) <= new Date(scheduledFor)) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be after scheduled date'
      });
    }

    const assessment = await Assessment.create({
      title,
      description,
      courseId,
      batchId,
      teacherId,
      type: type || 'quiz',
      category: category || 'formative',
      scheduledFor,
      deadline,
      timeLimit: timeLimit || 60,
      totalPoints: totalPoints || 100,
      difficulty: difficulty || 'medium',
      settings: JSON.stringify(settings || {
        attemptsAllowed: 1,
        passingScore: 60,
        showResults: 'after_grading',
        showCorrectAnswers: true,
        allowReview: true,
        randomizeQuestions: false,
        isProctored: false
      }),
      learningObjectives: JSON.stringify(learningObjectives || []),
      tags: JSON.stringify(tags || []),
      status: 'draft',
      questions: JSON.stringify([])
    });

    logger.info(`Assessment created: ${assessment.id} by teacher ${teacherId}`);

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment
    });
  } catch (error) {
    logger.error('Error creating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assessment',
      error: error.message
    });
  }
};

/**
 * Add questions to assessment
 */
const addQuestionsToAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions, fromQuestionBank } = req.body;

    const assessment = await Assessment.findByPk(id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check ownership
    if (assessment.teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    let existingQuestions = JSON.parse(assessment.questions || '[]');

    if (fromQuestionBank && Array.isArray(fromQuestionBank)) {
      // Import from question bank
      const bankQuestions = await QuestionBank.findAll({
        where: {
          id: fromQuestionBank,
          teacherId: req.user.id
        }
      });

      const newQuestions = bankQuestions.map((q, index) => ({
        id: Date.now() + index,
        text: q.text,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
        difficulty: q.difficulty,
        hint: q.hint,
        explanation: q.explanation,
        sortOrder: existingQuestions.length + index,
        questionBankId: q.id
      }));

      existingQuestions = [...existingQuestions, ...newQuestions];

      // Increment usage count
      for (const q of bankQuestions) {
        await q.incrementUsage();
      }
    } else if (questions && Array.isArray(questions)) {
      // Add custom questions
      const newQuestions = questions.map((q, index) => ({
        id: Date.now() + index,
        text: q.text,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        difficulty: q.difficulty || 'medium',
        hint: q.hint,
        explanation: q.explanation,
        sortOrder: existingQuestions.length + index
      }));

      existingQuestions = [...existingQuestions, ...newQuestions];
    }

    // Update total points
    const totalPoints = existingQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

    await assessment.update({
      questions: JSON.stringify(existingQuestions),
      totalPoints
    });

    logger.info(`Questions added to assessment ${id}`);

    res.json({
      success: true,
      message: 'Questions added successfully',
      data: {
        assessment,
        questionsCount: existingQuestions.length,
        totalPoints
      }
    });
  } catch (error) {
    logger.error('Error adding questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add questions',
      error: error.message
    });
  }
};

/**
 * Update question in assessment
 */
const updateQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const questionData = req.body;

    const assessment = await Assessment.findByPk(id);

    if (!assessment || assessment.teacherId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or unauthorized'
      });
    }

    let questions = JSON.parse(assessment.questions || '[]');
    const questionIndex = questions.findIndex(q => q.id == questionId);

    if (questionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    questions[questionIndex] = {
      ...questions[questionIndex],
      ...questionData,
      id: questions[questionIndex].id
    };

    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    await assessment.update({
      questions: JSON.stringify(questions),
      totalPoints
    });

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: questions[questionIndex]
    });
  } catch (error) {
    logger.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question'
    });
  }
};

/**
 * Delete question from assessment
 */
const deleteQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;

    const assessment = await Assessment.findByPk(id);

    if (!assessment || assessment.teacherId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or unauthorized'
      });
    }

    let questions = JSON.parse(assessment.questions || '[]');
    questions = questions.filter(q => q.id != questionId);

    // Reorder questions
    questions.forEach((q, index) => {
      q.sortOrder = index;
    });

    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    await assessment.update({
      questions: JSON.stringify(questions),
      totalPoints
    });

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
};

/**
 * Publish assessment
 */
const publishAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await Assessment.findByPk(id);

    if (!assessment || assessment.teacherId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or unauthorized'
      });
    }

    const questions = JSON.parse(assessment.questions || '[]');

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish assessment without questions'
      });
    }

    await assessment.update({
      status: 'published',
      isPublished: true
    });

    // Send notifications to students
    if (assessment.batchId) {
      const { BatchEnrollment } = require('../models');
      const enrollments = await BatchEnrollment.findAll({
        where: { batchId: assessment.batchId, status: 'active' },
        attributes: ['studentId']
      });

      for (const enrollment of enrollments) {
        try {
          await fcmService.sendAssessmentReminderNotification(
            enrollment.studentId,
            assessment.title,
            new Date(assessment.deadline).toLocaleDateString()
          );
        } catch (notifError) {
          logger.warn('Failed to send assessment notification:', notifError);
        }
      }
    }

    logger.info(`Assessment ${id} published`);

    res.json({
      success: true,
      message: 'Assessment published successfully',
      data: assessment
    });
  } catch (error) {
    logger.error('Error publishing assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish assessment'
    });
  }
};

// ==================== AUTO-GRADING ====================

/**
 * Submit assessment
 */
const submitAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeSpent } = req.body;
    const studentId = req.user.id;

    const assessment = await Assessment.findByPk(id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    if (assessment.status !== 'published' && assessment.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Assessment is not available for submission'
      });
    }

    // Check deadline
    if (new Date() > new Date(assessment.deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Assessment deadline has passed'
      });
    }

    const questions = JSON.parse(assessment.questions || '[]');
    const settings = JSON.parse(assessment.settings || '{}');

    // Auto-grade MCQ and True/False questions
    const gradedAnswers = answers.map(answer => {
      const question = questions.find(q => q.id == answer.questionId);
      
      if (!question) return answer;

      let isCorrect = false;
      let pointsEarned = 0;

      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        isCorrect = String(answer.answer).toLowerCase() === String(question.correctAnswer).toLowerCase();
        pointsEarned = isCorrect ? question.points : 0;
      }

      return {
        ...answer,
        isCorrect,
        pointsEarned,
        needsManualGrading: question.type === 'essay' || question.type === 'short_answer' || question.type === 'coding'
      };
    });

    // Calculate scores
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const earnedPoints = gradedAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= (settings.passingScore || 60);

    // Assign grade
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';

    // Create submission
    const submission = {
      student: studentId,
      startedAt: new Date(Date.now() - timeSpent * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      answers: gradedAnswers,
      timeSpent,
      status: gradedAnswers.some(a => a.needsManualGrading) ? 'pending_grading' : 'graded',
      attemptNumber: 1,
      scores: {
        totalPoints,
        earnedPoints,
        percentage,
        passed,
        grade
      },
      grading: {
        autoGraded: true,
        gradedAt: new Date().toISOString()
      }
    };

    // Add submission to assessment
    let submissions = JSON.parse(assessment.submissions || '[]');
    const existingIndex = submissions.findIndex(s => s.student === studentId);
    
    if (existingIndex >= 0) {
      submissions[existingIndex] = submission;
    } else {
      submissions.push(submission);
    }

    await assessment.update({
      submissions: JSON.stringify(submissions)
    });

    logger.info(`Assessment ${id} submitted by student ${studentId}`);

    res.json({
      success: true,
      message: 'Assessment submitted successfully',
      data: {
        submission,
        showResults: settings.showResults === 'immediately' || (settings.showResults === 'after_grading' && !gradedAnswers.some(a => a.needsManualGrading))
      }
    });
  } catch (error) {
    logger.error('Error submitting assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assessment'
    });
  }
};

/**
 * Grade submission manually (for essays, short answers, etc.)
 */
const gradeSubmission = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const { gradedAnswers, feedback, overrideScore } = req.body;

    const assessment = await Assessment.findByPk(id);

    if (!assessment || assessment.teacherId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found or unauthorized'
      });
    }

    let submissions = JSON.parse(assessment.submissions || '[]');
    const submissionIndex = submissions.findIndex(s => s.student == studentId);

    if (submissionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const submission = submissions[submissionIndex];

    // Update graded answers
    gradedAnswers.forEach(gradedAnswer => {
      const answerIndex = submission.answers.findIndex(a => a.questionId == gradedAnswer.questionId);
      if (answerIndex >= 0) {
        submission.answers[answerIndex] = {
          ...submission.answers[answerIndex],
          ...gradedAnswer
        };
      }
    });

    // Recalculate scores
    const totalPoints = submission.scores.totalPoints;
    const earnedPoints = submission.answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const settings = JSON.parse(assessment.settings || '{}');
    const passed = percentage >= (settings.passingScore || 60);

    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';

    submission.scores = {
      totalPoints,
      earnedPoints,
      percentage: overrideScore?.percentage || percentage,
      passed: overrideScore ? overrideScore.passed : passed,
      grade: overrideScore?.grade || grade
    };

    submission.grading = {
      ...submission.grading,
      manuallyGraded: true,
      gradedBy: req.user.id,
      gradedAt: new Date().toISOString(),
      feedback
    };

    submission.status = 'graded';

    submissions[submissionIndex] = submission;
    await assessment.update({
      submissions: JSON.stringify(submissions)
    });

    // Send notification to student
    try {
      await fcmService.sendNotificationToUser(
        studentId,
        'Assessment Graded',
        `Your ${assessment.title} has been graded. Score: ${submission.scores.percentage}%`,
        {
          type: 'assessment_graded',
          action: 'view_results',
          assessmentId: id
        }
      );
    } catch (notifError) {
      logger.warn('Failed to send grading notification:', notifError);
    }

    logger.info(`Assessment ${id} graded for student ${studentId}`);

    res.json({
      success: true,
      message: 'Submission graded successfully',
      data: submission
    });
  } catch (error) {
    logger.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grade submission'
    });
  }
};

// ==================== RESULT ANALYTICS ====================

/**
 * Get assessment analytics
 */
const getAssessmentAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await Assessment.findByPk(id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check access
    if (assessment.teacherId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const submissions = JSON.parse(assessment.submissions || '[]');
    const questions = JSON.parse(assessment.questions || '[]');
    const gradedSubmissions = submissions.filter(s => s.status === 'graded');

    // Overall statistics
    const totalSubmissions = submissions.length;
    const averageScore = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + s.scores.percentage, 0) / gradedSubmissions.length
      : 0;
    
    const passRate = gradedSubmissions.length > 0
      ? (gradedSubmissions.filter(s => s.scores.passed).length / gradedSubmissions.length) * 100
      : 0;

    const averageTime = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / submissions.length
      : 0;

    // Grade distribution
    const gradeDistribution = gradedSubmissions.reduce((dist, submission) => {
      const grade = submission.scores.grade || 'F';
      dist[grade] = (dist[grade] || 0) + 1;
      return dist;
    }, { A: 0, B: 0, C: 0, D: 0, F: 0 });

    // Question-wise analytics
    const questionAnalytics = questions.map(question => {
      const questionAnswers = gradedSubmissions.flatMap(s =>
        s.answers.filter(a => a.questionId == question.id)
      );

      const totalAttempts = questionAnswers.length;
      const correctAnswers = questionAnswers.filter(a => a.isCorrect).length;
      const successRate = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
      const averagePoints = totalAttempts > 0
        ? questionAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0) / totalAttempts
        : 0;

      return {
        questionId: question.id,
        text: question.text.substring(0, 100) + '...',
        type: question.type,
        totalAttempts,
        correctAnswers,
        successRate: successRate.toFixed(2),
        averagePoints: averagePoints.toFixed(2),
        difficulty: successRate < 50 ? 'hard' : successRate < 75 ? 'medium' : 'easy'
      };
    });

    // Performance trends (by submission time)
    const performanceTrend = gradedSubmissions
      .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
      .map((s, index) => ({
        submission: index + 1,
        score: s.scores.percentage,
        timestamp: s.submittedAt
      }));

    // Top performers
    const topPerformers = gradedSubmissions
      .sort((a, b) => b.scores.percentage - a.scores.percentage)
      .slice(0, 5)
      .map(s => ({
        studentId: s.student,
        score: s.scores.percentage,
        grade: s.scores.grade,
        timeSpent: s.timeSpent
      }));

    // Students needing help (score < 60%)
    const studentsNeedingHelp = gradedSubmissions
      .filter(s => s.scores.percentage < 60)
      .map(s => ({
        studentId: s.student,
        score: s.scores.percentage,
        weakAreas: s.answers
          .filter(a => !a.isCorrect)
          .map(a => questions.find(q => q.id == a.questionId)?.type)
      }));

    res.json({
      success: true,
      data: {
        overview: {
          totalSubmissions,
          gradedSubmissions: gradedSubmissions.length,
          pendingGrading: totalSubmissions - gradedSubmissions.length,
          averageScore: averageScore.toFixed(2),
          passRate: passRate.toFixed(2),
          averageTime: Math.round(averageTime)
        },
        gradeDistribution,
        questionAnalytics,
        performanceTrend,
        topPerformers,
        studentsNeedingHelp
      }
    });
  } catch (error) {
    logger.error('Error getting assessment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics'
    });
  }
};

/**
 * Get student performance report
 */
const getStudentPerformanceReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, batchId, startDate, endDate } = req.query;

    const whereClause = {
      status: { [Op.in]: ['published', 'active', 'completed'] }
    };

    if (courseId) whereClause.courseId = courseId;
    if (batchId) whereClause.batchId = batchId;
    if (startDate) whereClause.scheduledFor = { [Op.gte]: new Date(startDate) };
    if (endDate) whereClause.deadline = { [Op.lte]: new Date(endDate) };

    const assessments = await Assessment.findAll({ where: whereClause });

    const studentPerformance = assessments.map(assessment => {
      const submissions = JSON.parse(assessment.submissions || '[]');
      const studentSubmission = submissions.find(s => s.student == studentId);

      if (!studentSubmission) {
        return {
          assessmentId: assessment.id,
          title: assessment.title,
          type: assessment.type,
          status: 'not_attempted',
          deadline: assessment.deadline
        };
      }

      return {
        assessmentId: assessment.id,
        title: assessment.title,
        type: assessment.type,
        status: studentSubmission.status,
        score: studentSubmission.scores?.percentage || 0,
        grade: studentSubmission.scores?.grade || 'N/A',
        passed: studentSubmission.scores?.passed || false,
        timeSpent: studentSubmission.timeSpent,
        submittedAt: studentSubmission.submittedAt,
        feedback: studentSubmission.grading?.feedback
      };
    });

    // Calculate overall statistics
    const completedAssessments = studentPerformance.filter(p => p.status === 'graded');
    const averageScore = completedAssessments.length > 0
      ? completedAssessments.reduce((sum, p) => sum + p.score, 0) / completedAssessments.length
      : 0;
    
    const passRate = completedAssessments.length > 0
      ? (completedAssessments.filter(p => p.passed).length / completedAssessments.length) * 100
      : 0;

    res.json({
      success: true,
      data: {
        studentId,
        summary: {
          totalAssessments: assessments.length,
          completed: completedAssessments.length,
          pending: studentPerformance.filter(p => p.status === 'pending_grading').length,
          notAttempted: studentPerformance.filter(p => p.status === 'not_attempted').length,
          averageScore: averageScore.toFixed(2),
          passRate: passRate.toFixed(2)
        },
        assessments: studentPerformance
      }
    });
  } catch (error) {
    logger.error('Error getting student performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance report'
    });
  }
};

/**
 * Get class performance comparison
 */
const getClassPerformanceComparison = async (req, res) => {
  try {
    const { batchId } = req.params;

    const assessments = await Assessment.findAll({
      where: { batchId, status: { [Op.in]: ['published', 'active', 'completed'] } },
      order: [['scheduledFor', 'DESC']]
    });

    const classComparison = assessments.map(assessment => {
      const submissions = JSON.parse(assessment.submissions || '[]');
      const gradedSubmissions = submissions.filter(s => s.status === 'graded');

      const scores = gradedSubmissions.map(s => s.scores.percentage);
      const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const highest = scores.length > 0 ? Math.max(...scores) : 0;
      const lowest = scores.length > 0 ? Math.min(...scores) : 0;
      const median = scores.length > 0 ? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0;

      return {
        assessmentId: assessment.id,
        title: assessment.title,
        type: assessment.type,
        totalSubmissions: submissions.length,
        gradedSubmissions: gradedSubmissions.length,
        statistics: {
          average: average.toFixed(2),
          highest,
          lowest,
          median,
          passRate: gradedSubmissions.length > 0
            ? ((gradedSubmissions.filter(s => s.scores.passed).length / gradedSubmissions.length) * 100).toFixed(2)
            : 0
        }
      };
    });

    res.json({
      success: true,
      data: classComparison
    });
  } catch (error) {
    logger.error('Error getting class performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get class performance'
    });
  }
};

// ==================== QUESTION BANK ====================

/**
 * Add question to question bank
 */
const addToQuestionBank = async (req, res) => {
  try {
    const questionData = req.body;
    const teacherId = req.user.id;

    const question = await QuestionBank.create({
      ...questionData,
      teacherId,
      options: questionData.options || [],
      tags: questionData.tags || [],
      metadata: questionData.metadata || {}
    });

    logger.info(`Question added to bank by teacher ${teacherId}`);

    res.status(201).json({
      success: true,
      message: 'Question added to bank successfully',
      data: question
    });
  } catch (error) {
    logger.error('Error adding question to bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add question'
    });
  }
};

/**
 * Get questions from question bank
 */
const getQuestionBank = async (req, res) => {
  try {
    const { type, difficulty, topic, courseId, isPublic } = req.query;
    const teacherId = req.user.id;

    const whereClause = {
      [Op.or]: [
        { teacherId },
        { isPublic: true }
      ],
      isActive: true
    };

    if (type) whereClause.type = type;
    if (difficulty) whereClause.difficulty = difficulty;
    if (topic) whereClause.topic = topic;
    if (courseId) whereClause.courseId = courseId;
    if (isPublic !== undefined) whereClause.isPublic = isPublic === 'true';

    const questions = await QuestionBank.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    logger.error('Error getting question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get questions'
    });
  }
};

/**
 * Update question in bank
 */
const updateQuestionInBank = async (req, res) => {
  try {
    const { id } = req.params;
    const questionData = req.body;

    const question = await QuestionBank.findOne({
      where: { id, teacherId: req.user.id }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or unauthorized'
      });
    }

    await question.update(questionData);

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    logger.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question'
    });
  }
};

/**
 * Delete question from bank
 */
const deleteQuestionFromBank = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await QuestionBank.findOne({
      where: { id, teacherId: req.user.id }
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or unauthorized'
      });
    }

    await question.update({ isActive: false });

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question'
    });
  }
};

module.exports = {
  createAssessment,
  addQuestionsToAssessment,
  updateQuestion,
  deleteQuestion,
  publishAssessment,
  submitAssessment,
  gradeSubmission,
  getAssessmentAnalytics,
  getStudentPerformanceReport,
  getClassPerformanceComparison,
  addToQuestionBank,
  getQuestionBank,
  updateQuestionInBank,
  deleteQuestionFromBank
};
