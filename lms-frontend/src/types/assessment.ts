export interface Question {
  id: string;
  type:
    | 'multiple_choice'
    | 'single_choice'
    | 'short_answer'
    | 'long_answer'
    | 'true_false'
    | 'matching'
    | 'coding';
  text: string;
  points: number;
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  rubric?: RubricCriteria[];
  codeTemplate?: string;
  testCases?: TestCase[];
  explanation?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface RubricCriteria {
  id: string;
  criterion: string;
  maxPoints: number;
  description: string;
  levels: {
    score: number;
    description: string;
  }[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  points?: number;
}

export interface AssessmentSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  showFeedback: boolean;
  allowReview: boolean;
  passingScore?: number;
  maxAttempts?: number;
  proctoring?: {
    enabled: boolean;
    webcamRequired: boolean;
    screenRecordingRequired: boolean;
    browserLockRequired: boolean;
    aiMonitoring?: boolean;
  };
  gradingScheme?: {
    type: 'points' | 'percentage' | 'rubric';
    maxScore: number;
    weights?: Record<string, number>;
  };
  accessibility?: {
    extraTime?: number;
    textToSpeech?: boolean;
    highContrast?: boolean;
    fontSize?: number;
  };
  timer?: {
    type: 'countdown' | 'elapsed';
    duration: number;
    warning?: number;
  };
}
