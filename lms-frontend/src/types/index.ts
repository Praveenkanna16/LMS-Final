export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  totalEarnings?: number;
  availableForPayout?: number;

  // Enhanced profile
  profile?: {
    avatar?: string;
    bio?: string;
    title?: string;
    company?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
    timezone?: string;
    language?: string;
  };

  // Learning preferences
  preferences?: {
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
    pace?: 'slow' | 'medium' | 'fast';
    difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
      reminders?: boolean;
      achievements?: boolean;
    };
    privacy?: {
      profileVisibility?: 'public' | 'private' | 'connections';
      showProgress?: boolean;
      showAchievements?: boolean;
    };
  };

  // AI profile
  aiProfile?: {
    strengths?: string[];
    weaknesses?: string[];
    learningGoals?: {
      goal: string;
      priority: 'low' | 'medium' | 'high';
      deadline?: Date;
      progress: number;
    }[];
    predictedPerformance?: {
      overall?: number;
      bySubject?: Record<string, number>;
    };
    studyPatterns?: {
      bestTimeToStudy?: string;
      averageSessionLength?: number;
      preferredStudyDays?: string[];
      breakFrequency?: number;
    };
  };

  // Gamification
  gamification?: {
    totalPoints: number;
    level: number;
    experience: number;
    experienceToNext: number;
    levelProgress?: number; // Virtual property for UI display
    streak: {
      current: number;
      longest: number;
      lastActivity?: Date;
    };
    achievements: {
      achievement: string;
      unlockedAt: Date;
    }[];
    badges: {
      name: string;
      earnedAt: Date;
      rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    }[];
  };

  // Progress tracking
  progress?: {
    coursesEnrolled: number;
    coursesCompleted: number;
    totalStudyTime: number;
    averageScore: number;
    certificates: {
      course: string;
      issuedAt: Date;
      grade: 'A' | 'B' | 'C' | 'D' | 'F';
      certificateId: string;
    }[];
    lastActive: Date;
  };

  // Social features
  social?: {
    connections: string[];
    followers: string[];
    following: string[];
    studyGroups: string[];
    reputation: number;
    contributions: {
      forumPosts: number;
      answersGiven: number;
      helpfulVotes: number;
    };
  };

  // Security
  verification?: {
    emailVerified: boolean;
    emailVerifiedAt?: Date;
    phoneVerified: boolean;
    identityVerified: boolean;
    twoFactorEnabled: boolean;
    lastLogin?: Date;
    loginAttempts: number;
    lockedUntil?: Date;
  };

  isActive?: boolean;
  onboardingCompleted?: boolean;
  lastSeen?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  price: number;

  // Course ownership
  teacher: User;
  coTeachers?: User[];
  category: string;
  subcategory?: string;

  // Metadata
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  duration?: string;
  language?: string;
  tags?: string[];
  rating?: number;
  studentsEnrolled?: number;

  // Learning objectives
  learningObjectives?: {
    objective: string;
    order?: number;
    bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  }[];
  prerequisites?: {
    skill: string;
    description?: string;
    isRequired: boolean;
  }[];
  targetAudience?: string[];

  // Course structure
  modules?: {
    title: string;
    description?: string;
    order: number;
    type: 'video' | 'reading' | 'quiz' | 'assignment' | 'interactive' | 'live_session';
    duration?: number;
    content?: {
      contentId?: string;
      url?: string;
      text?: string;
      resources?: {
        title: string;
        type: 'pdf' | 'video' | 'link' | 'code';
        url: string;
      }[];
    };
    isPreview?: boolean;
    isRequired?: boolean;
  }[];

  // AI features
  aiFeatures?: {
    personalizedPaths: boolean;
    adaptiveDifficulty: boolean;
    autoRecommendations: boolean;
    smartAssessments: boolean;
    contentSuggestions: boolean;
  };

  // Analytics
  stats?: {
    rating: number;
    reviewCount: number;
    studentsEnrolled: number;
    studentsCompleted: number;
    completionRate: number;
    averageTimeToComplete?: number;
    dropOffPoints: {
      moduleIndex: number;
      rate: number;
    }[];
    popularModules: {
      moduleIndex: number;
      engagement: number;
    }[];
  };

  // Media
  media?: {
    thumbnail?: string;
    trailer?: string;
    gallery?: string[];
    promotionalVideo?: string;
  };

  // Settings
  settings?: {
    isActive: boolean;
    isPublished: boolean;
    isPremium: boolean;
    allowPreview: boolean;
    certificateEnabled: boolean;
    discussionsEnabled: boolean;
    assignmentsEnabled: boolean;
    liveSessionsEnabled: boolean;
  };

  // Pricing
  pricing?: {
    originalPrice?: number;
    discountPrice?: number;
    discountPercentage?: number;
    currency: string;
    priceTiers: {
      name: string;
      price: number;
      features: string[];
    }[];
  };

  // SEO
  seo?: {
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };

  // Quality
  quality?: {
    isVerified: boolean;
    verifiedBy?: User;
    verifiedAt?: Date;
    standards?: string[];
    accreditation: {
      body: string;
      level: string;
      validUntil?: Date;
    }[];
  };

  version?: number;
  lastUpdated?: Date;
  updateNotes?: string;

  // Reviews
  featuredReviews?: {
    user: User;
    rating: number;
    comment: string;
    createdAt: Date;
  }[];

  createdAt?: Date;
  updatedAt?: Date;
  availableBatches?: Batch[];
}

export interface LearningPath {
  _id: string;
  title: string;
  description: string;
  student: User;
  course: Course;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;

  // Path structure
  modules: {
    title: string;
    description?: string;
    order: number;
    type: 'video' | 'quiz' | 'assignment' | 'reading' | 'interactive';
    content: {
      contentId?: string;
      duration?: number;
      points: number;
    };
    isCompleted: boolean;
    completedAt?: Date;
    score?: number;
  }[];

  // Progress
  progress: {
    completedModules: number;
    totalModules: number;
    currentModule: number;
    timeSpent: number;
    lastAccessed: Date;
    startedAt: Date;
  };

  // Personalization
  personalization: {
    learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    pace?: 'slow' | 'medium' | 'fast';
    strengths: string[];
    weaknesses: string[];
    preferences: {
      preferredTime?: string;
      sessionLength?: number;
      difficultyAdjustment: number;
    };
  };

  // Recommendations
  recommendations: {
    type: 'practice' | 'review' | 'advance' | 'focus';
    message: string;
    moduleIndex?: number;
    createdAt: Date;
  }[];

  // Completion
  isCompleted: boolean;
  completedAt?: Date;
  certificate?: {
    issued: boolean;
    issuedAt?: Date;
    certificateId?: string;
    grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  course: Course;
  teacher: User;
  batch?: Batch;

  // Configuration
  settings: {
    timeLimit?: number;
    attemptsAllowed: number;
    passingScore: number;
    showResults: 'immediate' | 'after_completion' | 'never';
    randomizeQuestions: boolean;
    allowReview: boolean;
  };

  // Questions
  questions: {
    question: Question;
    points: number;
    order: number;
  }[];

  // Adaptive settings
  adaptive: {
    enabled: boolean;
    difficultyAdjustment: boolean;
    questionSelection: 'linear' | 'adaptive' | 'personalized';
  };

  // Scheduling
  scheduledFor?: Date;
  deadline?: Date;
  isActive: boolean;
  isPublished: boolean;

  // Analytics
  totalPoints: number;
  averageScore: number;
  completionRate: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  tags: string[];
  learningObjectives: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface Question {
  _id: string;
  title: string;
  content: string;
  type:
    | 'multiple_choice'
    | 'true_false'
    | 'short_answer'
    | 'essay'
    | 'fill_blank'
    | 'matching'
    | 'ordering'
    | 'code'
    | 'file_upload';
  course: Course;
  teacher: User;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;

  // Question options
  options?: {
    text: string;
    isCorrect: boolean;
    explanation?: string;
    image?: string;
  }[];

  // Different answer types
  correctAnswer?: string;
  matchingPairs?: {
    left: string;
    right: string;
  }[];
  orderingItems?: string[];
  codeTemplate?: string;
  fileTypes?: string[];

  // AI features
  hints?: {
    text: string;
    cost: number;
  }[];
  explanation?: string;
  similarQuestions?: Question[];

  // Analytics
  usageStats: {
    timesUsed: number;
    averageScore: number;
    difficultyRating: number;
  };

  // Auto-grading
  autoGrade: {
    enabled: boolean;
    keywords: string[];
    caseSensitive: boolean;
    partialCredit: boolean;
    tolerance: number;
  };

  // Lifecycle
  isActive: boolean;
  isApproved: boolean;
  reviewedBy?: User;
  reviewedAt?: Date;

  // Learning objectives
  learningObjectives: string[];
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  standards?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface Assessment {
  _id: string;
  quiz: Quiz;
  student: User;
  batch?: Batch;

  // Session info
  startedAt: Date;
  completedAt?: Date;
  submittedAt?: Date;

  // Time tracking
  timeSpent: number;
  timeLimit?: number;
  isTimeUp: boolean;

  // Answers
  answers: {
    question: Question;
    answer: any;
    isCorrect?: boolean;
    pointsEarned: number;
    timeSpent: number;
    hintsUsed: string[];
    attempts: number;
  }[];

  // Scores
  scores: {
    totalPoints: number;
    earnedPoints: number;
    percentage: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    passed: boolean;
  };

  // Adaptive data
  adaptiveData?: {
    difficultyLevel: 'easy' | 'medium' | 'hard';
    questionsSkipped: Question[];
    recommendedQuestions: Question[];
    skillAssessment: {
      strengths: string[];
      weaknesses: string[];
      improvementAreas: string[];
    };
  };

  // Progress
  progress: {
    currentQuestion: number;
    totalQuestions: number;
    completionPercentage: number;
  };

  // Status
  status: 'in_progress' | 'completed' | 'submitted' | 'graded' | 'overdue';

  // Grading
  grading?: {
    autoGraded: boolean;
    autoGradedAt?: Date;
    manuallyGraded: boolean;
    gradedBy?: User;
    gradedAt?: Date;
    feedback?: string;
    comments: {
      text: string;
      author: User;
      createdAt: Date;
    }[];
  };

  // Attempts
  attemptNumber: number;
  maxAttempts: number;
  previousAttempts: {
    attemptNumber: number;
    score: number;
    completedAt: Date;
  }[];

  // AI insights
  insights?: {
    performance: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement';
    recommendations: {
      type: 'study' | 'practice' | 'review' | 'focus';
      priority: 'low' | 'medium' | 'high';
      message: string;
      topic?: string;
      estimatedImpact: number;
    }[];
    learningPath?: LearningPath;
  };

  // Proctoring
  proctoring?: {
    suspiciousActivity: boolean;
    warnings: {
      type: string;
      timestamp: Date;
      description: string;
    }[];
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export interface Progress {
  _id: string;
  moduleId: string;
  userId: string;
  courseId: string;
  batchId?: string;
  completionStatus: 'not_started' | 'in_progress' | 'completed';
  timeSpent: number;
  score?: number;
  notes?: string;
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProgressStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  notStartedModules: number;
  totalTimeSpent: number;
  averageScore?: number;
  startedAt?: Date;
  lastAccessedAt?: Date;
  estimatedCompletionDate?: Date;
  progressPercentage: number;
}

export interface BatchProgress {
  batchId: string;
  totalStudents: number;
  moduleStats: {
    moduleId: string;
    completed: number;
    inProgress: number;
    notStarted: number;
    averageScore?: number;
  }[];
  overallStats: {
    averageProgress: number;
    averageScore?: number;
    totalTimeSpent: number;
    estimatedCompletionDate?: Date;
  };
}

export interface Analytics {
  _id: string;
  entityType: 'student' | 'course' | 'quiz' | 'batch' | 'teacher' | 'platform';
  entityId: string;

  // Time period
  period: {
    startDate: Date;
    endDate: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };

  // Performance metrics
  performance: {
    averageScore?: number;
    completionRate?: number;
    engagementRate?: number;
    averageTimeSpent?: number;
    totalTimeSpent?: number;
    modulesCompleted?: number;
    quizzesAttempted?: number;
    quizzesPassed?: number;
    forumPosts?: number;
    collaborations?: number;
    peerReviews?: number;
  };

  // Learning analytics
  learning: {
    learningStyle?: {
      visual: number;
      auditory: number;
      kinesthetic: number;
      reading: number;
    };
    learningPace?: 'slow' | 'moderate' | 'fast' | 'variable';
    preferredStudyTime?: 'morning' | 'afternoon' | 'evening' | 'night';
    strengths: string[];
    weaknesses: string[];
    improvementAreas: {
      topic: string;
      severity: 'low' | 'medium' | 'high';
      recommendation: string;
    }[];
  };

  // Engagement analytics
  engagement: {
    activeDays?: number;
    averageSessionLength?: number;
    peakActivityHours: number[];
    preferredContentTypes: {
      type: string;
      engagement: number;
    }[];
    difficultTopics: {
      topic: string;
      attempts: number;
      successRate: number;
    }[];
    socialActivity: {
      forumParticipation: number;
      groupStudy: number;
      peerHelp: number;
    };
  };

  // Predictions
  predictions?: {
    predictedCompletionDate?: Date;
    predictedFinalGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
    dropoutRisk?: {
      score: number;
      factors: string[];
    };
    recommendedActions: {
      type: 'study' | 'practice' | 'review' | 'rest';
      priority: 'low' | 'medium' | 'high';
      message: string;
      estimatedImpact: number;
    }[];
    recommendedContent: {
      contentId: string;
      contentType: string;
      reason: string;
      confidence: number;
    }[];
  };

  // Comparisons
  comparisons?: {
    percentileRank?: number;
    classAverage?: number;
    topPerformers: {
      studentId: string;
      score: number;
    }[];
    improvementRate?: number;
    trend?: 'improving' | 'declining' | 'stable' | 'variable';
  };

  // AI insights
  insights: {
    type: 'performance' | 'engagement' | 'learning' | 'prediction' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
    createdAt: Date;
  }[];

  // Raw data
  rawData?: any;
  generatedAt: Date;
  lastUpdated: Date;
  version: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon?: string;
  category:
    | 'learning'
    | 'social'
    | 'progress'
    | 'skill'
    | 'participation'
    | 'special'
    | 'streak'
    | 'perfection';

  // Criteria
  criteria: {
    type:
      | 'score_threshold'
      | 'completion_count'
      | 'streak_days'
      | 'time_spent'
      | 'quizzes_passed'
      | 'forum_posts'
      | 'peer_reviews'
      | 'courses_completed'
      | 'perfect_scores'
      | 'early_completion'
      | 'help_others'
      | 'custom';
    target: number;
    course?: Course;
    quiz?: Quiz;
    period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };

  // Rewards
  rewards: {
    points: number;
    badge?: {
      name: string;
      color: string;
      rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    };
    title?: string;
    unlockables: string[];
  };

  // Metadata
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
  isActive: boolean;
  isSecret: boolean;
  prerequisites: Achievement[];

  // Statistics
  stats: {
    totalUnlocked: number;
    averageTimeToUnlock?: number;
    rarity: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserAchievement {
  _id: string;
  user: User;
  achievement: Achievement;

  // Unlock info
  unlockedAt: Date;
  progress: number;
  isCompleted: boolean;

  // Context
  context?: {
    course?: Course;
    quiz?: Quiz;
    batch?: Batch;
    value?: number;
    description: string;
  };

  // Rewards
  rewardsClaimed: {
    points: boolean;
    badge: boolean;
    title: boolean;
    unlockables: string[];
  };

  // Gamification
  pointsEarned: number;
  streak: {
    current: number;
    longest: number;
    lastActivity?: Date;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: User;

  // Discussion context
  type: 'question' | 'discussion' | 'announcement' | 'resource' | 'help';
  category: 'general' | 'course' | 'quiz' | 'technical' | 'career' | 'study_group';

  // Related entities
  course?: Course;
  quiz?: Quiz;
  batch?: Batch;
  learningPath?: LearningPath;

  // Tags and metadata
  tags: string[];
  isResolved: boolean;
  resolvedBy?: User;
  resolvedAt?: Date;

  // Engagement
  stats: {
    views: number;
    replies: number;
    upvotes: number;
    downvotes: number;
    bookmarks: number;
  };

  // Moderation
  isApproved: boolean;
  isPinned: boolean;
  isLocked: boolean;
  moderatedBy?: User;
  moderatedAt?: Date;

  // AI features
  sentiment?: 'positive' | 'neutral' | 'negative' | 'confused';
  topics: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  // Study groups
  studyGroup?: {
    isGroupDiscussion: boolean;
    groupId: string;
    participants: User[];
  };

  // Attachments
  attachments: {
    filename: string;
    url: string;
    type: string;
    size: number;
  }[];

  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Existing interfaces (keeping for backward compatibility)
export interface Batch {
  _id: string;
  name: string;
  course: Course;
  teacher: User;
  students: User[];
  schedule: ScheduleItem[];
  studentLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScheduleItem {
  _id?: string;
  startTime: Date;
  endTime: Date;
  topic: string;
}

export interface Payment {
  _id: string;
  student: User;
  batch: Batch;
  teacher: User;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  cashfree_order_id: string;
  cashfree_payment_id?: string;
  cashfree_signature?: string;
  source: 'platform' | 'teacher';
  commissionRate: number;
  teacherEarnings: number;
  platformFee: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Payout {
  _id: string;
  teacher: User;
  amount: number;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  requestedAt?: Date;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Attendance {
  _id: string;
  student: User;
  batch: Batch;
  scheduleId: string;
  date: Date;
  status: 'present' | 'absent';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DashboardStats {
  totalEarnings?: number;
  availableForPayout?: number;
  batchCount?: number;
  upcomingClasses?: Batch[];
  studentCount?: number;
  teacherCount?: number;
  pendingPayouts?: number;
  overview?: {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    activeUsers: number;
    totalCourses: number;
    activeCourses: number;
    totalBatches: number;
    activeBatches: number;
    totalRevenue: number;
    totalPayments: number;
    pendingPayouts: number;
    userGrowthRate: string;
    newUsersThisMonth: number;
    newUsersThisWeek: number;
  };
  recentActivity?: {
    recentPayments: any[];
    upcomingClasses: any[];
  };
  systemHealth?: {
    databaseStatus: string;
    apiStatus: string;
    uptime: number;
    lastBackup: string;
    storageUsed: number;
  };
}

export interface ChatMessage {
  message: string;
  name: string;
  userId: string;
  timestamp?: Date;
}

export interface WhiteboardData {
  type: 'draw' | 'clear';
  data: any;
}

export interface CashfreeOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}
