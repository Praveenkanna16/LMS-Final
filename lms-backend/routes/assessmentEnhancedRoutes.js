const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/assessmentEnhancedController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ==================== ASSESSMENT CREATION & MANAGEMENT ====================

// Create new assessment (Teacher/Admin)
router.post('/create', authMiddleware, createAssessment);

// Add questions to assessment (Teacher/Admin)
router.post('/:id/questions', authMiddleware, addQuestionsToAssessment);

// Update question in assessment (Teacher/Admin)
router.put('/:id/questions/:questionId', authMiddleware, updateQuestion);

// Delete question from assessment (Teacher/Admin)
router.delete('/:id/questions/:questionId', authMiddleware, deleteQuestion);

// Publish assessment (Teacher/Admin)
router.post('/:id/publish', authMiddleware, publishAssessment);

// ==================== ASSESSMENT SUBMISSION & GRADING ====================

// Submit assessment (Student)
router.post('/:id/submit', authMiddleware, submitAssessment);

// Grade submission (Teacher/Admin)
router.post('/:id/submissions/:submissionId/grade', authMiddleware, gradeSubmission);

// ==================== ANALYTICS & REPORTS ====================

// Get assessment analytics (Teacher/Admin)
router.get('/:id/analytics', authMiddleware, getAssessmentAnalytics);

// Get student performance report (Teacher/Admin/Student)
router.get('/student/:studentId/performance', authMiddleware, getStudentPerformanceReport);

// Get class performance comparison (Teacher/Admin)
router.get('/batch/:batchId/performance', authMiddleware, getClassPerformanceComparison);

// ==================== QUESTION BANK ====================

// Add question to bank (Teacher)
router.post('/question-bank', authMiddleware, addToQuestionBank);

// Get questions from bank (Teacher)
router.get('/question-bank', authMiddleware, getQuestionBank);

// Update question in bank (Teacher)
router.put('/question-bank/:id', authMiddleware, updateQuestionInBank);

// Delete question from bank (Teacher)
router.delete('/question-bank/:id', authMiddleware, deleteQuestionFromBank);

module.exports = router;
