import { z } from 'zod';
import { USER_ROLES, VALIDATION } from '@/lib/constants';

// Login validation schema
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(
      VALIDATION.PASSWORD.MIN_LENGTH,
      `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`
    )
    .max(
      VALIDATION.PASSWORD.MAX_LENGTH,
      `Password must not exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters`
    ),
});

// Register validation schema
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(
        VALIDATION.NAME.MIN_LENGTH,
        `Name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`
      )
      .max(
        VALIDATION.NAME.MAX_LENGTH,
        `Name must not exceed ${VALIDATION.NAME.MAX_LENGTH} characters`
      )
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(
        VALIDATION.PASSWORD.MIN_LENGTH,
        `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`
      )
      .max(
        VALIDATION.PASSWORD.MAX_LENGTH,
        `Password must not exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters`
      )
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum([USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN], {
      required_error: 'Please select a role',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

// Reset password validation schema
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(
        VALIDATION.PASSWORD.MIN_LENGTH,
        `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`
      )
      .max(
        VALIDATION.PASSWORD.MAX_LENGTH,
        `Password must not exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters`
      )
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    token: z.string().min(1, 'Reset token is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Profile update validation schema
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(
      VALIDATION.NAME.MIN_LENGTH,
      `Name must be at least ${VALIDATION.NAME.MIN_LENGTH} characters`
    )
    .max(
      VALIDATION.NAME.MAX_LENGTH,
      `Name must not exceed ${VALIDATION.NAME.MAX_LENGTH} characters`
    )
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
  github: z.string().url('Please enter a valid GitHub URL').optional().or(z.literal('')),
});

// Change password validation schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(
        VALIDATION.PASSWORD.MIN_LENGTH,
        `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`
      )
      .max(
        VALIDATION.PASSWORD.MAX_LENGTH,
        `Password must not exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters`
      )
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Course creation validation schema
export const courseCreationSchema = z.object({
  title: z
    .string()
    .min(1, 'Course title is required')
    .min(5, 'Course title must be at least 5 characters')
    .max(100, 'Course title must not exceed 100 characters'),
  description: z
    .string()
    .min(1, 'Course description is required')
    .min(50, 'Course description must be at least 50 characters')
    .max(1000, 'Course description must not exceed 1000 characters'),
  price: z.number().min(0, 'Price cannot be negative').max(10000, 'Price cannot exceed $10,000'),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 hour')
    .max(1000, 'Duration cannot exceed 1000 hours'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels'], {
    required_error: 'Please select a difficulty level',
  }),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must not exceed 50 characters'),
  tags: z
    .array(z.string().max(30, 'Each tag must not exceed 30 characters'))
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed'),
});

// Batch creation validation schema
export const batchCreationSchema = z.object({
  name: z
    .string()
    .min(1, 'Batch name is required')
    .min(3, 'Batch name must be at least 3 characters')
    .max(100, 'Batch name must not exceed 100 characters'),
  courseId: z.string().min(1, 'Please select a course'),
  studentLimit: z
    .number()
    .min(1, 'Student limit must be at least 1')
    .max(1000, 'Student limit cannot exceed 1000'),
  schedule: z
    .array(
      z.object({
        startTime: z.date(),
        endTime: z.date(),
        topic: z
          .string()
          .min(1, 'Topic is required')
          .max(200, 'Topic must not exceed 200 characters'),
      })
    )
    .min(1, 'At least one class schedule is required')
    .max(50, 'Maximum 50 classes allowed')
    .refine(schedule => {
      return schedule.every((item, index) => {
        if (index === 0) return true;
        return item.startTime > schedule[index - 1].endTime;
      });
    }, 'Class times must not overlap'),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type CourseCreationFormData = z.infer<typeof courseCreationSchema>;
export type BatchCreationFormData = z.infer<typeof batchCreationSchema>;
