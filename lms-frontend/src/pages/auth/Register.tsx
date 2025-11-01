import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff,
  Users,
  BookOpen,
  Star,
  CheckCircle,
  Sparkles,
  Target,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { USER_ROLES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: authRegister, loading } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      role: USER_ROLES.STUDENT,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await authRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (result.success) {
        // Registration successful, redirect to appropriate dashboard based on role
        navigate(`/${result.user.role}/dashboard`, { replace: true });
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.message || 'Registration failed. Please try again.',
      });
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20'></div>

      {/* Floating Elements */}
      <div className='absolute top-20 left-10 animate-bounce delay-1000'>
        <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
          <Users className='w-8 h-8 text-white' />
        </div>
      </div>
      <div className='absolute top-32 right-16 animate-bounce delay-2000'>
        <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
          <BookOpen className='w-6 h-6 text-white' />
        </div>
      </div>
      <div className='absolute bottom-20 left-20 animate-bounce delay-3000'>
        <div className='w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
          <Star className='w-7 h-7 text-white' />
        </div>
      </div>

      <div className='relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-lg w-full space-y-8'>
          {/* Header */}
          <div className='text-center'>
            <div className='flex justify-center mb-8'>
              <div className='w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300'>
                <GraduationCap className='w-12 h-12 text-white' />
              </div>
            </div>

            <Badge className='mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 shadow-xl px-4 py-2 text-base font-semibold animate-pulse'>
              <Sparkles className='w-4 h-4 mr-2' />
              AI-Powered Learning Platform
            </Badge>

            <h2 className='text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent drop-shadow-lg'>
              Join GenZEd
            </h2>
            <p className='text-xl text-gray-600 leading-relaxed'>
              Create your account and start your{' '}
              <span className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold'>
                personalized learning journey
              </span>
            </p>
          </div>

          {/* Registration Form */}
          <Card className='border-0 shadow-2xl bg-white/90 backdrop-blur-sm relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>

            <CardContent className='p-8 relative z-10'>
              <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
                {/* Error Alert */}
                {errors.root && (
                  <Alert variant='destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                      {errors.root?.message || 'Registration failed. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className='space-y-4'>
                  <div>
                    <Label
                      htmlFor='name'
                      className='block text-sm font-semibold text-gray-900 mb-3'
                    >
                      Full Name
                    </Label>
                    <Input
                      id='name'
                      type='text'
                      placeholder='Enter your full name'
                      className={`appearance-none relative block w-full px-4 py-4 border-0 rounded-2xl bg-gray-50/80 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md ${
                        errors.name ? 'ring-2 ring-red-500 bg-red-50' : ''
                      }`}
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className='mt-2 text-sm text-red-600'>{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor='email'
                      className='block text-sm font-semibold text-gray-900 mb-3'
                    >
                      Email Address
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='Enter a unique email address'
                      className={`appearance-none relative block w-full px-4 py-4 border-0 rounded-2xl bg-gray-50/80 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md ${
                        errors.email ? 'ring-2 ring-red-500 bg-red-50' : ''
                      }`}
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className='mt-2 text-sm text-red-600'>{errors.email.message}</p>
                    )}
                    <p className='text-xs text-gray-500 mt-2'>
                      Use a unique email address not already registered
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor='role'
                      className='block text-sm font-semibold text-gray-900 mb-3'
                    >
                      I am a
                    </Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(value: any) => {
                        setValue('role', value);
                      }}
                    >
                      <SelectTrigger className='appearance-none relative block w-full px-4 py-4 border-0 rounded-2xl bg-gray-50/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md'>
                        <SelectValue placeholder='Select your role' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={USER_ROLES.STUDENT}>
                          Student - Learn and grow with AI guidance
                        </SelectItem>
                        <SelectItem value={USER_ROLES.TEACHER}>
                          Teacher - Share knowledge and earn
                        </SelectItem>
                        <SelectItem value={USER_ROLES.ADMIN}>
                          Administrator - Manage the platform
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className='mt-2 text-sm text-red-600'>{errors.role.message}</p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor='password'
                      className='block text-sm font-semibold text-gray-900 mb-3'
                    >
                      Password
                    </Label>
                    <div className='relative'>
                      <Input
                        id='password'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='Create a strong password'
                        className={`appearance-none relative block w-full px-4 py-4 pr-12 border-0 rounded-2xl bg-gray-50/80 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md ${
                          errors.password ? 'ring-2 ring-red-500 bg-red-50' : ''
                        }`}
                        {...register('password')}
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                      >
                        {showPassword ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className='mt-2 text-sm text-red-600'>{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor='confirmPassword'
                      className='block text-sm font-semibold text-gray-900 mb-3'
                    >
                      Confirm Password
                    </Label>
                    <div className='relative'>
                      <Input
                        id='confirmPassword'
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder='Confirm your password'
                        className={`appearance-none relative block w-full px-4 py-4 pr-12 border-0 rounded-2xl bg-gray-50/80 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md ${
                          errors.confirmPassword ? 'ring-2 ring-red-500 bg-red-50' : ''
                        }`}
                        {...register('confirmPassword')}
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
                        onClick={() => {
                          setShowConfirmPassword(!showConfirmPassword);
                        }}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className='mt-2 text-sm text-red-600'>{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type='submit'
                  disabled={!isValid || loading}
                  className='group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-semibold rounded-2xl text-white bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-2xl'
                >
                  {loading ? (
                    <div className='flex items-center'>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
                      Creating account...
                    </div>
                  ) : (
                    <div className='flex items-center'>
                      <Sparkles className='w-5 h-5 mr-2' />
                      Create Your GenZEd Account
                      <ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
                    </div>
                  )}
                </Button>

                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-300'></div>
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-4 bg-white/90 text-gray-500'>Already have an account?</span>
                  </div>
                </div>

                <Button
                  variant='outline'
                  asChild
                  className='w-full py-4 px-4 border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-[1.02]'
                >
                  <Link to='/login'>
                    <GraduationCap className='w-5 h-5 mr-2' />
                    Sign In Instead
                  </Link>
                </Button>
              </form>

              {/* Features */}
              <div className='mt-8 pt-6 border-t border-gray-200'>
                <div className='grid grid-cols-1 gap-3'>
                  <div className='flex items-center text-sm text-gray-600'>
                    <CheckCircle className='w-4 h-4 text-green-500 mr-3 flex-shrink-0' />
                    <span>AI-powered personalized learning paths</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600'>
                    <CheckCircle className='w-4 h-4 text-green-500 mr-3 flex-shrink-0' />
                    <span>Interactive live classes with experts</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600'>
                    <CheckCircle className='w-4 h-4 text-green-500 mr-3 flex-shrink-0' />
                    <span>Progress tracking and analytics</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600'>
                    <CheckCircle className='w-4 h-4 text-green-500 mr-3 flex-shrink-0' />
                    <span>Community forums and peer learning</span>
                  </div>
                </div>
              </div>

              {/* Role Benefits */}
              <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200/50'>
                <div className='flex items-center mb-3'>
                  <Target className='w-5 h-5 text-blue-600 mr-2' />
                  <span className='font-semibold text-blue-900'>Choose Your Path</span>
                </div>
                <div className='grid grid-cols-1 gap-2 text-sm'>
                  <div className='flex items-center text-blue-800'>
                    <Trophy className='w-4 h-4 mr-2 text-blue-600' />
                    <span>
                      <strong>Students:</strong> Learn with AI guidance and expert teachers
                    </span>
                  </div>
                  <div className='flex items-center text-blue-800'>
                    <Trophy className='w-4 h-4 mr-2 text-purple-600' />
                    <span>
                      <strong>Teachers:</strong> Share knowledge and earn from your expertise
                    </span>
                  </div>
                  <div className='flex items-center text-blue-800'>
                    <Trophy className='w-4 h-4 mr-2 text-indigo-600' />
                    <span>
                      <strong>Admins:</strong> Manage platform and oversee operations
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className='text-center'>
            <Button
              variant='ghost'
              asChild
              className='text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-300'
            >
              <Link to='/'>
                <ArrowRight className='w-4 h-4 mr-2 rotate-180' />
                Back to GenZEd Homepage
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
