import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import {
  BookOpen,
  Users,
  Video,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  GraduationCap,
  Zap,
  Globe,
  Shield,
  Smartphone,
  Quote,
  Calendar,
  Book,
  Target,
  Brain,
  Trophy,
  Sparkles,
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Video,
      title: 'Live Interactive Classes',
      description:
        'Join real-time classes with expert teachers using our advanced video platform with whiteboard integration.',
      color: 'text-blue-500',
    },
    {
      icon: BookOpen,
      title: 'Comprehensive Curriculum',
      description:
        'Access structured learning paths designed by educational experts for all grades and subjects.',
      color: 'text-green-500',
    },
    {
      icon: Users,
      title: 'Personalized Learning',
      description:
        'Get personalized attention with small batch sizes and one-on-one doubt clearing sessions.',
      color: 'text-purple-500',
    },
    {
      icon: Award,
      title: 'Performance Tracking',
      description:
        'Monitor progress with detailed analytics, regular assessments, and performance reports.',
      color: 'text-orange-500',
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Detailed insights into learning progress and areas for improvement.',
      color: 'text-indigo-500',
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Learn at your own pace with recorded sessions and flexible class timings.',
      color: 'text-teal-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'High School Student',
      content:
        'GenZEd has transformed my learning experience. The live classes are engaging and the teachers are incredibly supportive.',
      rating: 5,
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Mathematics Teacher',
      content:
        'As an educator, I love how GenZEd empowers teachers with great tools and provides excellent student engagement.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Parent',
      content:
        "My daughter's grades have improved significantly since joining GenZEd. The personalized attention is unmatched.",
      rating: 5,
    },
  ];

  const pricingPlans = [
    {
      name: 'Basic',
      price: '₹999',
      period: '/month',
      features: ['5 live classes', 'Recorded content access', 'Basic support'],
      popular: false,
    },
    {
      name: 'Pro',
      price: '₹1999',
      period: '/month',
      features: [
        'Unlimited live classes',
        'All recorded content',
        'Priority support',
        'Progress tracking',
      ],
      popular: true,
    },
    {
      name: 'Premium',
      price: '₹2999',
      period: '/month',
      features: ['Everything in Pro', '1-on-1 tutoring', 'Advanced analytics', 'Career guidance'],
      popular: false,
    },
  ];

  const courses = [
    {
      id: 1,
      title: 'Mathematics Fundamentals',
      instructor: 'Dr. Smith',
      rating: 4.8,
      students: 1200,
      price: '₹2999',
      image: 'https://via.placeholder.com/300x200',
      category: 'Mathematics',
    },
    {
      id: 2,
      title: 'Physics Mastery',
      instructor: 'Prof. Johnson',
      rating: 4.9,
      students: 950,
      price: '₹3499',
      image: 'https://via.placeholder.com/300x200',
      category: 'Physics',
    },
    {
      id: 3,
      title: 'English Literature',
      instructor: 'Ms. Davis',
      rating: 4.7,
      students: 800,
      price: '₹2799',
      image: 'https://via.placeholder.com/300x200',
      category: 'English',
    },
    {
      id: 4,
      title: 'Chemistry Basics',
      instructor: 'Dr. Wilson',
      rating: 4.6,
      students: 1100,
      price: '₹3199',
      image: 'https://via.placeholder.com/300x200',
      category: 'Chemistry',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section
        id='home'
        className='pt-32 pb-24 px-4 bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden'
      >
        {/* Background Elements */}
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.15)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-20'></div>

        <div className='max-w-7xl mx-auto text-center relative z-10'>
          {/* Floating Elements */}
          <div className='absolute top-20 left-10 animate-bounce delay-1000'>
            <div className='w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg'>
              <Users className='w-8 h-8 text-white' />
            </div>
          </div>
          <div className='absolute top-32 right-16 animate-bounce delay-2000'>
            <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg'>
              <Award className='w-6 h-6 text-white' />
            </div>
          </div>
          <div className='absolute bottom-20 left-20 animate-bounce delay-3000'>
            <div className='w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg'>
              <Video className='w-7 h-7 text-white' />
            </div>
          </div>

          <Badge className='mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 shadow-xl px-6 py-3 text-base font-semibold animate-pulse'>
            <Zap className='w-5 h-5 mr-2' />
            AI-Powered Learning Platform of 2025
          </Badge>

          <h1 className='text-7xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl leading-tight'>
            Learn Smarter with
            <span className='block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent'>
              AI-Powered Intelligence
            </span>
          </h1>

          <p className='text-2xl text-gray-300 mb-12 max-w-5xl mx-auto leading-relaxed'>
            Join the next generation of learners with personalized AI-driven education, interactive
            live classes, and gamified learning experiences that make studying
            <span className='text-blue-400 font-semibold'> addictive and effective</span>.
          </p>

          <div className='flex flex-col sm:flex-row gap-6 justify-center items-center mb-16'>
            <Button
              size='lg'
              className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-2xl transform hover:scale-105 transition-all duration-300 px-10 py-6 text-xl font-bold rounded-2xl'
              asChild
            >
              <Link to='/register'>
                <Zap className='w-6 h-6 mr-3' />
                Start Your AI Journey
                <ArrowRight className='w-6 h-6 ml-3' />
              </Link>
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-blue-400 shadow-xl transform hover:scale-105 transition-all duration-300 px-10 py-6 text-xl font-bold rounded-2xl backdrop-blur-sm'
              asChild
            >
              <Link to='/courses'>
                <Play className='w-6 h-6 mr-3' />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto'>
            <div className='text-center group'>
              <div className='flex justify-center mb-3'>
                <Users className='w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform' />
              </div>
              <div className='text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform'>
                50K+
              </div>
              <div className='text-gray-400 text-sm'>Active Students</div>
            </div>
            <div className='text-center group'>
              <div className='flex justify-center mb-3'>
                <GraduationCap className='w-8 h-8 text-green-500 group-hover:scale-110 transition-transform' />
              </div>
              <div className='text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform'>
                1000+
              </div>
              <div className='text-gray-400 text-sm'>Expert Teachers</div>
            </div>
            <div className='text-center group'>
              <div className='flex justify-center mb-3'>
                <Award className='w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform' />
              </div>
              <div className='text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform'>
                95%
              </div>
              <div className='text-gray-400 text-sm'>Success Rate</div>
            </div>
            <div className='text-center group'>
              <div className='flex justify-center mb-3'>
                <Clock className='w-8 h-8 text-red-500 group-hover:scale-110 transition-transform' />
              </div>
              <div className='text-3xl font-bold text-white mb-1 group-hover:scale-110 transition-transform'>
                24/7
              </div>
              <div className='text-gray-400 text-sm'>Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-24 px-4 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_rgba(139,92,246,0.3)_0%,_transparent_50%)]'></div>

        <div className='max-w-7xl mx-auto relative z-10'>
          <div className='text-center mb-16'>
            <Badge className='mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-white border-0 px-6 py-3 text-lg font-semibold'>
              <TrendingUp className='w-5 h-5 mr-2' />
              Platform Growth
            </Badge>
            <h2 className='text-6xl font-bold mb-6 text-white drop-shadow-lg'>
              Trusted by
              <span className='block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent'>
                Millions Worldwide
              </span>
            </h2>
            <p className='text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed'>
              Join a growing community of learners who are transforming their careers with our
              AI-powered platform.
            </p>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 mb-16'>
            <div className='text-center group'>
              <div className='flex justify-center mb-4'>
                <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110'>
                  <Users className='w-10 h-10 text-white' />
                </div>
              </div>
              <div className='text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300'>
                2.5M+
              </div>
              <div className='text-blue-200 font-medium'>Active Learners</div>
              <div className='text-blue-300 text-sm mt-1'>Growing 30% monthly</div>
            </div>

            <div className='text-center group'>
              <div className='flex justify-center mb-4'>
                <div className='w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110'>
                  <Award className='w-10 h-10 text-white' />
                </div>
              </div>
              <div className='text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300'>
                98%
              </div>
              <div className='text-green-200 font-medium'>Success Rate</div>
              <div className='text-green-300 text-sm mt-1'>Course completion</div>
            </div>

            <div className='text-center group'>
              <div className='flex justify-center mb-4'>
                <div className='w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110'>
                  <BookOpen className='w-10 h-10 text-white' />
                </div>
              </div>
              <div className='text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300'>
                15K+
              </div>
              <div className='text-purple-200 font-medium'>Expert Instructors</div>
              <div className='text-purple-300 text-sm mt-1'>Certified professionals</div>
            </div>

            <div className='text-center group'>
              <div className='flex justify-center mb-4'>
                <div className='w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110'>
                  <Globe className='w-10 h-10 text-white' />
                </div>
              </div>
              <div className='text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300'>
                50+
              </div>
              <div className='text-orange-200 font-medium'>Countries</div>
              <div className='text-orange-300 text-sm mt-1'>Global reach</div>
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 text-center'>
            <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20'>
              <div className='text-4xl font-bold text-white mb-2'>4.9★</div>
              <div className='text-blue-200 mb-3'>Average Rating</div>
              <div className='flex justify-center'>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className='w-5 h-5 fill-yellow-400 text-yellow-400' />
                ))}
              </div>
            </div>

            <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20'>
              <div className='text-4xl font-bold text-white mb-2'>24/7</div>
              <div className='text-purple-200 mb-3'>Support Available</div>
              <div className='text-purple-300 text-sm'>AI + Human assistance</div>
            </div>

            <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20'>
              <div className='text-4xl font-bold text-white mb-2'>99.9%</div>
              <div className='text-green-200 mb-3'>Uptime</div>
              <div className='text-green-300 text-sm'>Reliable platform</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section
        id='ai-features'
        className='py-24 px-4 bg-gradient-to-br from-white via-blue-50 to-purple-50 relative'
      >
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-20'>
            <Badge className='mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-4 py-2'>
              <Brain className='w-4 h-4 mr-2' />
              AI-Powered Learning
            </Badge>
            <h2 className='text-6xl font-bold mb-6 text-gray-900'>
              Intelligence That
              <span className='block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Adapts to You
              </span>
            </h2>
            <p className='text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
              Our advanced AI technology personalizes your learning journey, predicts your needs,
              and optimizes your progress for maximum results.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16'>
            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='text-center pb-6 relative z-10'>
                <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Brain className='w-8 h-8 text-white' />
                </div>
                <CardTitle className='text-xl font-bold text-gray-900 mb-3'>
                  Adaptive Learning
                </CardTitle>
                <CardDescription className='text-gray-600 leading-relaxed'>
                  AI analyzes your learning patterns and adjusts difficulty, pace, and content to
                  match your optimal learning style.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='text-center pb-6 relative z-10'>
                <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Target className='w-8 h-8 text-white' />
                </div>
                <CardTitle className='text-xl font-bold text-gray-900 mb-3'>
                  Smart Recommendations
                </CardTitle>
                <CardDescription className='text-gray-600 leading-relaxed'>
                  Get personalized course and skill recommendations based on your goals, interests,
                  and career aspirations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='text-center pb-6 relative z-10'>
                <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Trophy className='w-8 h-8 text-white' />
                </div>
                <CardTitle className='text-xl font-bold text-gray-900 mb-3'>
                  Progress Prediction
                </CardTitle>
                <CardDescription className='text-gray-600 leading-relaxed'>
                  AI predicts your learning trajectory and suggests interventions to help you stay
                  on track and achieve your goals.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='text-center pb-6 relative z-10'>
                <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Video className='w-8 h-8 text-white' />
                </div>
                <CardTitle className='text-xl font-bold text-gray-900 mb-3'>
                  Intelligent Tutoring
                </CardTitle>
                <CardDescription className='text-gray-600 leading-relaxed'>
                  24/7 AI tutoring system that provides instant help, explanations, and feedback on
                  your assignments and questions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='text-center pb-6 relative z-10'>
                <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Sparkles className='w-8 h-8 text-white' />
                </div>
                <CardTitle className='text-xl font-bold text-gray-900 mb-3'>
                  Skill Gap Analysis
                </CardTitle>
                <CardDescription className='text-gray-600 leading-relaxed'>
                  Automatically identify knowledge gaps and create personalized learning paths to
                  bridge them effectively.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16'></div>
              <CardHeader className='text-center pb-6 relative z-10'>
                <div className='w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg'>
                  <Calendar className='w-8 h-8 text-white' />
                </div>
                <CardTitle className='text-xl font-bold text-gray-900 mb-3'>
                  Smart Scheduling
                </CardTitle>
                <CardDescription className='text-gray-600 leading-relaxed'>
                  AI optimizes your study schedule based on your energy levels, preferences, and
                  proven productivity patterns.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <div className='text-center'>
            <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-12 text-white relative overflow-hidden'>
              <div className='absolute inset-0 bg-black/10'></div>
              <div className='relative z-10'>
                <h3 className='text-4xl font-bold mb-4'>
                  Ready to Experience AI-Powered Learning?
                </h3>
                <p className='text-xl text-blue-100 mb-8 max-w-2xl mx-auto'>
                  Join thousands of learners who are already transforming their careers with our
                  intelligent platform.
                </p>
                <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                  <Button
                    size='lg'
                    className='bg-white text-blue-600 hover:bg-gray-100 shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-bold rounded-2xl'
                    asChild
                  >
                    <Link to='/register'>
                      <Sparkles className='w-5 h-5 mr-2' />
                      Start Free Trial
                      <ArrowRight className='w-5 h-5 ml-2' />
                    </Link>
                  </Button>
                  <Button
                    size='lg'
                    variant='outline'
                    className='border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-bold rounded-2xl backdrop-blur-sm'
                    asChild
                  >
                    <Link to='/courses'>
                      <BookOpen className='w-5 h-5 mr-2' />
                      Explore Courses
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id='features'
        className='py-24 px-4 bg-gradient-to-br from-white via-blue-50 to-purple-50 relative'
      >
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-20'>
            <Badge className='mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-4 py-2'>
              <BookOpen className='w-4 h-4 mr-2' />
              AI Revolution in Education
            </Badge>
            <h2 className='text-6xl font-bold mb-6 text-gray-900'>
              Experience the Future of
              <span className='block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Learning
              </span>
            </h2>
            <p className='text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
              Our cutting-edge AI technology adapts to your learning style, predicts your needs, and
              creates personalized educational experiences that maximize your potential.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-10'>
            {features.map((feature, index) => (
              <Card
                key={index}
                className='group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm'
              >
                <CardHeader className='text-center pb-6'>
                  <div
                    className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color === 'text-blue-500' ? 'from-blue-500 to-cyan-500' : feature.color === 'text-green-500' ? 'from-green-500 to-emerald-500' : 'from-purple-500 to-pink-500'} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className='w-10 h-10 text-white' />
                  </div>
                  <CardTitle className='text-2xl font-bold text-gray-900 mb-3'>
                    {feature.title}
                  </CardTitle>
                  <CardDescription className='text-gray-600 leading-relaxed text-base'>
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section
        id='courses'
        className='py-24 px-4 bg-gradient-to-br from-white via-gray-50 to-blue-50 relative'
      >
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-20'>
            <Badge className='mb-6 bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 px-4 py-2'>
              <BookOpen className='w-4 h-4 mr-2' />
              Premium Course Catalog
            </Badge>
            <h2 className='text-6xl font-bold mb-6 text-gray-900'>
              Choose Your
              <span className='block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Learning Path
              </span>
            </h2>
            <p className='text-xl text-gray-600 leading-relaxed max-w-4xl mx-auto'>
              Explore our comprehensive collection of courses designed by expert educators and
              enhanced with AI-powered learning tools.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16'>
            {courses.map(course => (
              <Card
                key={course.id}
                className='group hover:shadow-2xl transition-all duration-500 bg-white border-gray-200 hover:border-blue-300 transform hover:-translate-y-3 relative overflow-hidden'
              >
                <div className='relative'>
                  <div className='aspect-video overflow-hidden rounded-t-lg'>
                    <img
                      src={course.image}
                      alt={course.title}
                      className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                    />
                  </div>
                  <div className='absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                </div>

                <CardContent className='p-6'>
                  <div className='flex items-center justify-between mb-3'>
                    <Badge variant='outline' className='text-xs'>
                      {course.category}
                    </Badge>
                    <div className='flex items-center space-x-1'>
                      <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                      <span className='text-sm font-semibold text-gray-900'>{course.rating}</span>
                      <span className='text-sm text-gray-500'>
                        ({course.students.toLocaleString()} students)
                      </span>
                    </div>
                  </div>

                  <h3 className='text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors'>
                    {course.title}
                  </h3>

                  <p className='text-sm text-gray-600 mb-3'>by {course.instructor}</p>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-2xl font-bold text-gray-900'>{course.price}</span>
                    </div>
                    <Button
                      size='sm'
                      className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg group-hover:shadow-xl transition-all duration-300'
                      asChild
                    >
                      <Link to={`/courses/${course.id}`}>
                        Enroll Now
                        <ArrowRight className='w-4 h-4 ml-1' />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className='text-center'>
            <Button
              variant='outline'
              className='border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300 rounded-xl'
              asChild
            >
              <Link to='/courses'>
                <BookOpen className='w-5 h-5 mr-2' />
                View All Courses
                <ArrowRight className='w-5 h-5 ml-2' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id='testimonials'
        className='py-24 px-4 bg-gradient-to-br from-slate-900 via-gray-900 to-black relative overflow-hidden'
      >
        <div className='max-w-7xl mx-auto relative z-10'>
          <div className='text-center mb-20'>
            <Badge className='mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 px-4 py-2'>
              <Quote className='w-4 h-4 mr-2' />
              Student Success Stories
            </Badge>
            <h2 className='text-6xl font-bold mb-6 text-white drop-shadow-lg'>
              What Our
              <span className='block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent'>
                Students Say
              </span>
            </h2>
            <p className='text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed'>
              Hear from students who have transformed their learning journey with GenZEd's
              AI-powered platform.
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-10'>
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className='bg-white/10 backdrop-blur-sm border-gray-700 text-white relative overflow-hidden'
              >
                <CardContent className='p-8'>
                  <div className='flex items-center mb-6'>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className='w-5 h-5 fill-yellow-400 text-yellow-400' />
                    ))}
                  </div>
                  <p className='text-gray-300 mb-6 leading-relaxed'>"{testimonial.content}"</p>
                  <div className='flex items-center'>
                    <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4'>
                      <span className='text-white font-bold text-lg'>{testimonial.name[0]}</span>
                    </div>
                    <div>
                      <div className='font-semibold text-white'>{testimonial.name}</div>
                      <div className='text-sm text-gray-400'>{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id='pricing'
        className='py-24 px-4 bg-gradient-to-br from-white via-gray-50 to-blue-50 relative'
      >
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-20'>
            <Badge className='mb-6 bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 px-4 py-2'>
              <Award className='w-4 h-4 mr-2' />
              Choose Your Plan
            </Badge>
            <h2 className='text-6xl font-bold mb-6 text-gray-900'>
              Flexible
              <span className='block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Pricing Options
              </span>
            </h2>
            <p className='text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
              Start with our free trial or choose a plan that fits your learning needs and budget.
            </p>
          </div>

          <div className='grid md:grid-cols-3 gap-10'>
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2 ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-2 rounded-full text-sm font-bold'>
                    Most Popular
                  </div>
                )}
                <CardHeader className='text-center pb-8'>
                  <CardTitle className='text-3xl font-bold text-gray-900 mb-4'>
                    {plan.name}
                  </CardTitle>
                  <div className='text-5xl font-bold text-gray-900 mb-2'>
                    {plan.price}
                    <span className='text-xl text-gray-500'>{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-4 mb-8'>
                    {plan.features.map((feature, i) => (
                      <li key={i} className='flex items-center text-gray-600'>
                        <CheckCircle className='w-5 h-5 text-green-500 mr-3 flex-shrink-0' />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                    asChild
                  >
                    <Link to='/register'>
                      Get Started
                      <ArrowRight className='w-5 h-5 ml-2' />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-white py-16 px-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid md:grid-cols-4 gap-8 mb-12'>
            <div>
              <div className='flex items-center mb-4'>
                <GraduationCap className='w-8 h-8 text-blue-500 mr-2' />
                <span className='text-2xl font-bold'>GenZEd</span>
              </div>
              <p className='text-gray-400 mb-4'>
                Revolutionizing education with AI-powered learning platforms.
              </p>
              <div className='flex space-x-4'>
                <Globe className='w-5 h-5 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors' />
                <Smartphone className='w-5 h-5 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors' />
                <Shield className='w-5 h-5 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors' />
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-4'>Quick Links</h3>
              <ul className='space-y-2 text-gray-400'>
                <li>
                  <Link to='/courses' className='hover:text-white transition-colors'>
                    Courses
                  </Link>
                </li>
                <li>
                  <Link to='/about' className='hover:text-white transition-colors'>
                    About
                  </Link>
                </li>
                <li>
                  <Link to='/contact' className='hover:text-white transition-colors'>
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to='/blog' className='hover:text-white transition-colors'>
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-4'>Support</h3>
              <ul className='space-y-2 text-gray-400'>
                <li>
                  <Link to='/help' className='hover:text-white transition-colors'>
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to='/faq' className='hover:text-white transition-colors'>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to='/tutorials' className='hover:text-white transition-colors'>
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link to='/community' className='hover:text-white transition-colors'>
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-4'>Company</h3>
              <ul className='space-y-2 text-gray-400'>
                <li>
                  <Link to='/careers' className='hover:text-white transition-colors'>
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to='/privacy' className='hover:text-white transition-colors'>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to='/terms' className='hover:text-white transition-colors'>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to='/security' className='hover:text-white transition-colors'>
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className='border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center'>
            <p className='text-gray-400 text-sm'>© 2025 GenZEd. All rights reserved.</p>
            <div className='flex space-x-6 mt-4 md:mt-0'>
              <Globe className='w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors' />
              <Smartphone className='w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors' />
              <Shield className='w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors' />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
