import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
      features: [
        'Everything in Pro',
        '1-on-1 tutoring',
        'Advanced analytics',
        'Career guidance',
      ],
      popular: false,
    },
  ];

  // --- FIX was applied here ---
  // The image URLs for Math and Physics were corrected.
  const courses = [
    {
      id: 1,
      title: 'Mathematics Fundamentals',
      instructor: 'Dr. Smith',
      rating: 4.8,
      students: 1200,
      price: '₹2999',
      image:
      'https://mvjce.edu.in/wp-content/uploads/2024/07/The-Power-of-Mathematics-and-Computing.jpg',
      category: 'Mathematics',
    },
    {
      id: 2,
      title: 'Physics Mastery',
      instructor: 'Prof. Johnson',
      rating: 4.9,
      students: 950,
      price: '₹3499',
      image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSBb6gCEBzjogNK_ckISb0qAgeI-CHcU2TwA&s',
      category: 'Physics',
    },
    {
      id: 3,
      title: 'English Literature',
      instructor: 'Ms. Davis',
      rating: 4.7,
      students: 800,
      price: '₹2799',
      image:
      'https://t4.ftcdn.net/jpg/02/25/31/89/360_F_225318919_klpkRFyiJjxWdwLptzfeCX2Bo6QsBndm.jpg',
      category: 'English',
    },
    {
      id: 4,
      title: 'Chemistry Basics',
      instructor: 'Dr. Wilson',
      rating: 4.6,
      students: 1100,
      price: '₹3199',
      image:
      'https://www.thoughtco.com/thmb/6MsMmUK27akFhb8i89kj95J5iko=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-545286316-433dd345105e4c6ebe4cdd8d2317fdaa.jpg',
      category: 'Chemistry',
    },
  ];
  // --- End of fix ---

  return (
    <div className='min-h-screen bg-white'>
      <Navbar />

      {/* Hero Section */}
      <section
        id='home'
        className='pt-32 pb-24 px-4 bg-slate-900 text-white relative overflow-hidden'
      >
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.1)_0%,_transparent_40%)]'></div>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.1)_0%,_transparent_40%)]'></div>

        <div className='max-w-7xl mx-auto text-center relative z-10'>
          <Badge className='mb-6 bg-white/10 text-blue-300 border-blue-300/20 shadow-xl px-4 py-2 text-sm font-medium'>
            <Sparkles className='w-4 h-4 mr-2 text-blue-400' />
            AI-Powered Learning Platform of 2025
          </Badge>
          <h1 className='text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent leading-tight'>
            Learn Smarter with
            <span className='block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent'>
              AI-Powered Intelligence
            </span>
          </h1>
          <p className='text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto'>
            Join the next generation of learners with personalized AI education,
            interactive classes, and gamified experiences that make studying{' '}
            <span className='text-blue-400 font-semibold'>
              addictive and effective
            </span>
            .
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            <Button
              size='lg'
              className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-6 text-base font-semibold rounded-full'
              asChild
            >
              <Link to='/register'>
                Start Your AI Journey
                <ArrowRight className='w-5 h-5 ml-2' />
              </Link>
            </Button>
            <Button
              size='lg'
              variant='ghost'
              className='text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300 px-8 py-6 text-base font-semibold rounded-full'
              asChild
            >
              <Link to='#courses'>
                <Play className='w-5 h-5 mr-2' />
                Watch Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AI Features Section (How AI Works) */}
      <section id='ai-features' className='py-20 md:py-28 px-4 bg-slate-50'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <Badge
              variant='outline'
              className='mb-4 text-purple-700 border-purple-200'
            >
              <Brain className='w-4 h-4 mr-2' />
              How AI-Powered Learning Works
            </Badge>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 text-slate-900'>
              Intelligence That Adapts to You
            </h2>
            <p className='text-lg text-slate-600 max-w-3xl mx-auto'>
              Our advanced AI technology personalizes your learning journey,
              predicts your needs, and optimizes your progress for maximum
              results.
            </p>
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <Card className='bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all'>
              <CardHeader className='flex flex-row items-center gap-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center'>
                  <Brain className='w-6 h-6 text-purple-600' />
                </div>
                <CardTitle className='text-lg font-semibold text-slate-900'>
                  Adaptive Learning Paths
                </CardTitle>
              </CardHeader>
              <CardContent className='text-slate-700'>
                The AI analyzes your performance to create a unique learning
                path that focuses on your weak points and accelerates through
                your strengths.
              </CardContent>
            </Card>
            <Card className='bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all'>
              <CardHeader className='flex flex-row items-center gap-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center'>
                  <Target className='w-6 h-6 text-green-600' />
                </div>
                <CardTitle className='text-lg font-semibold text-slate-900'>
                  Smart Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className='text-slate-700'>
                Based on your goals, our AI suggests relevant courses and
                practice problems to keep you engaged and on track for your
                career.
              </CardContent>
            </Card>
            <Card className='bg-white border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all'>
              <CardHeader className='flex flex-row items-center gap-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center'>
                  <Sparkles className='w-6 h-6 text-pink-600' />
                </div>
                <CardTitle className='text-lg font-semibold text-slate-900'>
                  Progress Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className='text-slate-700'>
                Predictive analytics forecast your future performance and
                identify potential roadblocks before they happen, suggesting
                timely interventions.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Classes Section */}
      <section id='live-classes' className='py-20 md:py-28 px-4 bg-white'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <Badge
              variant='outline'
              className='mb-4 text-blue-700 border-blue-200'
            >
              <Video className='w-4 h-4 mr-2' />
              Real-Time Interaction
            </Badge>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 text-slate-900'>
              Engaging Live Classes
            </h2>
            <p className='text-lg text-slate-600 max-w-3xl mx-auto'>
              Experience interactive learning with expert instructors,
              collaborative tools, and instant doubt resolution. Our platform
              brings the classroom to you.
            </p>
          </div>
          <div className='grid md:grid-cols-3 gap-8 text-center'>
            <Card className='border-0 bg-transparent shadow-none'>
              <div className='w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center'>
                <Users className='w-8 h-8 text-blue-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2 text-slate-900'>
                Expert Instructors
              </h3>
              <p className='text-slate-700'>
                Learn from the best educators in the industry, live.
              </p>
            </Card>
            <Card className='border-0 bg-transparent shadow-none'>
              <div className='w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center'>
                <Sparkles className='w-8 h-8 text-blue-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2 text-slate-900'>
                Interactive Whiteboard
              </h3>
              <p className='text-slate-700'>
                Collaborate on problems in real-time with your peers.
              </p>
            </Card>
            <Card className='border-0 bg-transparent shadow-none'>
              <div className='w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center'>
                <Clock className='w-8 h-8 text-blue-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2 text-slate-900'>
                Session Recordings
              </h3>
              <p className='text-slate-700'>
                Never miss a class with access to all recordings.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section id='gamification' className='py-20 md:py-28 px-4 bg-slate-50'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <Badge
              variant='outline'
              className='mb-4 text-amber-700 border-amber-200'
            >
              <Trophy className='w-4 h-4 mr-2' />
              Learn Through Play
            </Badge>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 text-slate-900'>
              Gamified Learning Experience
            </h2>
            <p className='text-lg text-slate-600 max-w-3xl mx-auto'>
              Make learning addictive. Earn points, unlock badges, and compete
              with friends on leaderboards to stay motivated and achieve your
              goals.
            </p>
          </div>
          <div className='grid md:grid-cols-3 gap-8 text-center'>
            <Card className='border-0 bg-transparent shadow-none'>
              <div className='w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center'>
                <Award className='w-8 h-8 text-amber-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2 text-slate-900'>
                Earn Badges
              </h3>
              <p className='text-slate-700'>
                Showcase your achievements and milestones.
              </p>
            </Card>
            <Card className='border-0 bg-transparent shadow-none'>
              <div className='w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center'>
                <TrendingUp className='w-8 h-8 text-amber-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2 text-slate-900'>
                Climb Leaderboards
              </h3>
              <p className='text-slate-700'>
                Compete with peers and climb the ranks.
              </p>
            </Card>
            <Card className='border-0 bg-transparent shadow-none'>
              <div className='w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center'>
                <CheckCircle className='w-8 h-8 text-amber-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2 text-slate-900'>
                Daily Challenges
              </h3>
              <p className='text-slate-700'>
                Stay engaged with fun and rewarding tasks.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Adaptive Quizzes Section */}
      <section id='adaptive-quizzes' className='py-20 md:py-28 px-4 bg-white'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <Badge
              variant='outline'
              className='mb-4 text-green-700 border-green-200'
            >
              <Brain className='w-4 h-4 mr-2' />
              Personalized Assessments
            </Badge>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 text-slate-900'>
              Adaptive Quizzes
            </h2>
            <p className='text-lg text-slate-600 max-w-3xl mx-auto'>
              Our AI quizzes adapt in real-time to your skill level, providing
              questions that are perfectly challenging to maximize learning and
              retention.
            </p>
          </div>
          <div className='grid md:grid-cols-3 gap-8 text-center'>
            <Card className='border-0 bg-transparent shadow-none'>
              <div className='w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center'>
                <Target className='w-8 h-8 text-green-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2 text-slate-900'>
                Tailored Difficulty
              </h3>
              <p className='text-slate-700'>
                Questions get easier or harder based on your answers.
              </p>
            </Card>
            <Card className='border-0 bg-transparent shadow-none'>
              <div className='w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center'>
                <Sparkles className='w-8 h-8 text-green-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2 text-slate-900'>
                Instant Feedback
              </h3>
              <p className='text-slate-700'>
                Get detailed explanations for every question you answer.
              </p>
            </Card>
            <Card className='border-0 bg-transparent shadow-none'>
              <div className='w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center'>
                <BookOpen className='w-8 h-8 text-green-600' />
              </div>
              <h3 className='text-xl font-semibold mb-2 text-slate-900'>
                Skill Gap Analysis
              </h3>
              <p className='text-slate-700'>
                Identify your strengths and areas for improvement.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id='courses' className='py-20 md:py-28 px-4 bg-slate-50'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <Badge
              variant='outline'
              className='mb-4 text-blue-700 border-blue-200'
            >
              <BookOpen className='w-4 h-4 mr-2' />
              Premium Course Catalog
            </Badge>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 text-slate-900'>
              Choose Your Learning Path
            </h2>
            <p className='text-lg text-slate-600 max-w-3xl mx-auto'>
              Explore our comprehensive courses designed by expert educators
              and enhanced with AI-powered learning tools.
            </p>
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12'>
            {courses.map(course => (
              <Card
                key={course.id}
                className='group bg-white rounded-xl overflow-hidden border hover:border-blue-500/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'
              >
                <div className='aspect-w-16 aspect-h-9 overflow-hidden'>
                  <img
                    src={course.image}
                    alt={course.title}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                  />
                </div>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <Badge variant='secondary' className='text-xs font-medium'>
                      {course.category}
                    </Badge>
                    <div className='flex items-center gap-1'>
                      <Star className='w-4 h-4 text-amber-400 fill-amber-400' />
                      <span className='text-sm font-semibold text-slate-800'>
                        {course.rating}
                      </span>
                    </div>
                  </div>
                  <h3 className='text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors'>
                    {course.title}
                  </h3>
                  <div className='flex items-center justify-between text-sm'>
                    <p className='text-slate-600'>by {course.instructor}</p>
                    <p className='font-bold text-lg text-slate-900'>
                      {course.price}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className='text-center'>
            <Button size='lg' asChild className='rounded-full'>
              <Link to='/courses'>
                View All Courses <ArrowRight className='w-4 h-4 ml-2' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id='testimonials' className='py-20 md:py-28 px-4 bg-slate-900 text-white'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <Badge className='mb-4 bg-white/10 text-purple-300 border-purple-300/20'>
              <Quote className='w-4 h-4 mr-2' />
              Student Success Stories
            </Badge>
            <h2 className='text-3xl md:text-5xl font-bold mb-4'>
              What Our Students Say
            </h2>
            <p className='text-lg text-slate-400 max-w-3xl mx-auto'>
              Hear from students who have transformed their learning journey
              with our AI-powered platform.
            </p>
          </div>
          <div className='grid md:grid-cols-3 gap-8'>
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className='bg-slate-800/50 border border-slate-700 p-6'
              >
                <div className='flex items-center mb-4'>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className='w-5 h-5 text-amber-400 fill-amber-400'
                    />
                  ))}
                </div>
                <p className='text-slate-300 mb-6'>"{testimonial.content}"</p>
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4'>
                    <span className='text-white font-bold'>
                      {testimonial.name[0]}
                    </span>
                  </div>
                  <div>
                    <div className='font-semibold text-white'>
                      {testimonial.name}
                    </div>
                    <div className='text-sm text-slate-400'>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id='pricing' className='py-20 md:py-28 px-4 bg-slate-50'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <Badge
              variant='outline'
              className='mb-4 text-green-700 border-green-200'
            >
              <Award className='w-4 h-4 mr-2' />
              Choose Your Plan
            </Badge>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 text-slate-900'>
              Flexible Pricing Options
            </h2>
            <p className='text-lg text-slate-600 max-w-3xl mx-auto'>
              Start with our free trial or choose a plan that fits your
              learning needs and budget.
            </p>
          </div>
          <div className='grid md:grid-cols-3 gap-8 items-center'>
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`bg-white border rounded-xl p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'border-2 border-blue-600 scale-105 shadow-2xl'
                    : 'border-slate-200 shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className='absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'>
                    <Badge className='bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold'>
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className='text-center p-0 mb-6'>
                  <CardTitle className='text-2xl font-bold text-slate-900 mb-2'>
                    {plan.name}
                  </CardTitle>
                  <p className='text-4xl font-bold text-slate-900'>
                    {plan.price}
                    <span className='text-lg font-medium text-slate-500'>
                      {plan.period}
                    </span>
                  </p>
                </CardHeader>
                <CardContent className='p-0'>
                  <ul className='space-y-3 mb-8'>
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className='flex items-center text-slate-700'
                      >
                        <CheckCircle className='w-5 h-5 text-green-500 mr-3' />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size='lg'
                    className={`w-full rounded-full text-base font-semibold ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                    asChild
                  >
                    <Link to='/register'>
                      Get Started <ArrowRight className='w-4 h-4 ml-2' />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-slate-900 text-white py-16 px-4'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid md:grid-cols-4 gap-8 mb-12'>
            <div>
              <div className='flex items-center mb-4'>
                <GraduationCap className='w-8 h-8 text-blue-500 mr-2' />
                <span className='text-2xl font-bold'>GenZEd</span>
              </div>
              <p className='text-slate-400 mb-4'>
                Revolutionizing education with AI-powered learning platforms.
              </p>
            </div>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Quick Links</h3>
              <ul className='space-y-2 text-slate-400'>
                <li>
                  <Link
                    to='/courses'
                    className='hover:text-white transition-colors'
                  >
                    Courses
                  </Link>
                </li>
                <li>
                  <Link
                    to='/about'
                    className='hover:text-white transition-colors'
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to='/contact'
                    className='hover:text-white transition-colors'
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to='/blog'
                    className='hover:text-white transition-colors'
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Support</h3>
              <ul className='space-y-2 text-slate-400'>
                <li>
                  <Link
                    to='/help'
                    className='hover:text-white transition-colors'
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to='/faq' className='hover:text-white transition-colors'>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    to='/tutorials'
                    className='hover:text-white transition-colors'
                  >
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link
                    to='/community'
                    className='hover:text-white transition-colors'
                  >
                    Community
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Company</h3>
              <ul className='space-y-2 text-slate-400'>
                <li>
                  <Link
                    to='/careers'
                    className='hover:text-white transition-colors'
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to='/privacy'
                    className='hover:text-white transition-colors'
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to='/terms'
                    className='hover:text-white transition-colors'
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to='/security'
                    className='hover:text-white transition-colors'
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className='border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center'>
            <p className='text-slate-500 text-sm'>
              © 2025 GenZEd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;