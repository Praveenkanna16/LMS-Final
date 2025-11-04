import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  X,
  BookOpen,
  Users,
  Star,
  ChevronDown,
  User,
  LogOut,
  Settings,
  GraduationCap,
  Zap,
  Phone,
  Mail,
  MapPin,
  Clock,
  Code2,
  TrendingUp,
  Award,
  Globe,
  Shield,
  Smartphone,
  Quote,
  Calendar,
  Book,
  Video,
  Target,
  Brain,
  Trophy,
  Heart,
  Sparkles,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCartWishlistCounts } from '@/hooks/useCartWishlistCounts';

// --- Added TypeScript Interfaces (if you are using .tsx) ---
// If you are using .js, you can remove this block.
interface User {
  name?: string;
  email?: string;
  role?: string;
  gamification?: {
    level: number;
    experience: number;
    experienceToNext: number;
    levelProgress: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

interface CartContextType {
  cartCount: number;
  wishlistCount: number;
}
// ---------------------------------

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // --- Added Types to Hooks (if using .tsx) ---
  const { user, isAuthenticated, logout } = useAuth() as AuthContextType;
  const { cartCount, wishlistCount } = useCartWishlistCounts() as CartContextType;
  
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      // If menu is open, keep the "scrolled" state true
      if (isOpen) {
        setScrolled(true);
      } else {
        setScrolled(window.scrollY > 20);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Run on mount

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]); // Re-run effect if isOpen changes

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    // If we're not on the homepage, navigate there first
    if (window.location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete before trying to scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          // Adjust for fixed header height
          const headerOffset = 140; // Combined height of banner + nav + extra space
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 100); // 100ms delay
    } else {
      // If already on homepage, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 140;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
    setIsOpen(false);
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Personalized learning paths powered by advanced AI',
      color: 'text-purple-500',
      href: '#ai-features',
    },
    {
      icon: Video,
      title: 'Live Classes',
      description: 'Interactive sessions with expert teachers',
      color: 'text-blue-500',
      href: '#live-classes',
    },
    {
      icon: Trophy,
      title: 'Gamification',
      description: 'Earn badges, points, and achievements',
      color: 'text-yellow-500',
      href: '#gamification',
    },
    {
      icon: Target,
      title: 'Adaptive Quizzes',
      description: 'Smart assessments that adapt to your level',
      color: 'text-green-500',
      href: '#adaptive-quizzes',
    },
  ];

  return (
    <>
      {/* Top Banner (remains static at the top of the page) */}
      <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-2 px-4'>
        <div className='max-w-7xl mx-auto flex flex-col items-center sm:flex-row sm:justify-between text-xs sm:text-sm'>
          {/* Contact Info (Left) */}
          <div className='flex items-center space-x-4 sm:space-x-6'>
            <div className='flex items-center space-x-2'>
              <Phone className='w-4 h-4' />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className='hidden sm:flex items-center space-x-2'>
              <Mail className='w-4 h-4' />
              <span>support@genzed.com</span>
            </div>
            <div className='hidden lg:flex items-center space-x-2'>
              <MapPin className='w-4 h-4' />
              <span>San Francisco, CA</span>
            </div>
          </div>
          {/* Badges (Right) */}
          <div className='flex items-center space-x-4 mt-1 sm:mt-0'>
            <div className='hidden md:flex items-center space-x-2'>
              <Clock className='w-4 h-4' />
              <span>24/7 Premium Support</span>
            </div>
            <Badge className='bg-white/20 text-white border-white/30 backdrop-blur-sm'>
              <Sparkles className='w-3 h-3 mr-1' />
              AI-Powered Platform
            </Badge>
            <Badge className='hidden sm:flex bg-green-500/20 text-green-100 border-green-400/30 backdrop-blur-sm'>
              <div className='w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse'></div>
              Live Classes Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Navbar (Floating Pill Design) */}
      <nav
        className={`fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 transform transition-all duration-300 ${
          scrolled || isOpen // Keep bg if menu is open
            ? 'top-4 bg-white/95 shadow-xl backdrop-blur-lg'
            : 'top-14 bg-white/90 shadow-lg backdrop-blur-md' // Starts lower (top-14) to clear banner
        } rounded-2xl border border-gray-200/60`}
      >
        <div className='px-4 sm:px-6 lg:px-8'>
          {/* FIX: Refactored to a 3-column layout:
            1. Left: Logo
            2. Center: Nav Links (fills space, centers links)
            3. Right: Auth/Mobile Menu (fixed width)
          */}
          <div className='flex justify-between items-center h-16'>
            {/* 1. Left: Logo */}
            <div className='flex items-center flex-shrink-0'>
              <Link to='/' className='flex items-center space-x-3 group'>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105'>
                  <GraduationCap className='w-7 h-7 text-white' />
                </div>
                <div className='flex flex-col'>
                  <span className='text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors'>
                    GenZEd
                  </span>
                  <span className='text-xs text-gray-500 -mt-1'>Next-Gen Learning</span>
                </div>
              </Link>
            </div>

            {/* 2. Center: Desktop Navigation */}
            <div className='hidden lg:flex flex-1 items-center justify-center space-x-8'>
              <button
                onClick={() => {
                  scrollToSection('home');
                }}
                className='text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors relative group'
              >
                Home
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full'></span>
              </button>

              <div className='relative group'>
                <button className='flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors'>
                  <span>Features</span>
                  <ChevronDown className='w-4 h-4' />
                </button>
                <div className='absolute top-full left-1/2 -translate-x-1/2 mt-4 w-80 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2'>
                  <div className='p-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      {features.map((feature, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            scrollToSection(feature.href.substring(1));
                          }}
                          className='flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group/feature'
                        >
                          <feature.icon
                            className={`w-8 h-8 ${feature.color} mt-1 group-hover/feature:scale-110 transition-transform`}
                          />
                          <div className='text-left'>
                            <div className='font-medium text-gray-900 text-sm'>{feature.title}</div>
                            <div className='text-xs text-gray-500'>{feature.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className='relative group'>
                <button className='flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors'>
                  <span>Courses</span>
                  <ChevronDown className='w-4 h-4' />
                </button>
                <div className='absolute top-full left-0 mt-4 w-56 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2'>
                  <div className='py-2'>
                    <Link
                      to='/courses'
                      className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    >
                      <BookOpen className='w-4 h-4 mr-3' />
                      All Courses
                    </Link>
                    <Link
                      to='/courses?category=mathematics'
                      className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    >
                      <div className='w-4 h-4 mr-3 bg-blue-100 rounded flex items-center justify-center'>
                        <span className='text-xs text-blue-600 font-bold'>π</span>
                      </div>
                      Mathematics
                    </Link>
                    <Link
                      to='/courses?category=science'
                      className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    >
                      <div className='w-4 h-4 mr-3 bg-green-100 rounded flex items-center justify-center'>
                        <span className='text-xs text-green-600 font-bold'>⚛</span>
                      </div>
                      Science
                    </Link>
                    <Link
                      to='/courses?category=english'
                      className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    >
                      <div className='w-4 h-4 mr-3 bg-purple-100 rounded flex items-center justify-center'>
                        <span className='text-xs text-purple-600 font-bold'>A</span>
                      </div>
                      English
                    </Link>
                    <Link
                      to='/courses?category=programming'
                      className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    >
                      <Code2 className='w-4 h-4 mr-3' />
                      Programming
                    </Link>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  scrollToSection('testimonials');
                }}
                className='text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors relative group'
              >
                Reviews
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full'></span>
              </button>

              <button
                onClick={() => {
                  scrollToSection('pricing');
                }}
                className='text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors relative group'
              >
                Pricing
                <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full'></span>
              </button>
            </div>

            {/* 3. Right: Auth Buttons & Mobile Menu Toggle */}
            <div className='flex items-center justify-end'>
              {/* Desktop Auth Buttons */}
              {/* FIX: Changed 'md:flex' to 'lg:flex' to match nav links */}
              <div className='hidden lg:flex items-center space-x-4'>
                {isAuthenticated ? (
                  <div className='flex items-center space-x-4'>
                    {/* Cart and Wishlist */}
                    <div className='flex items-center space-x-2'>
                      <Link
                        to='/cart'
                        className='relative p-2 text-gray-700 hover:text-blue-600 transition-colors'
                      >
                        <ShoppingCart className='w-5 h-5' />
                        {cartCount > 0 && (
                          <Badge className='absolute -top-1 -right-1 bg-blue-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center p-0'>
                            {cartCount > 99 ? '99+' : cartCount}
                          </Badge>
                        )}
                      </Link>
                      <Link
                        to='/wishlist'
                        className='relative p-2 text-gray-700 hover:text-red-500 transition-colors'
                      >
                        <Heart className='w-5 h-5' />
                        {wishlistCount > 0 && (
                          <Badge className='absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center p-0'>
                            {wishlistCount > 99 ? '99+' : wishlistCount}
                          </Badge>
                        )}
                      </Link>
                    </div>

                    {/* User Profile Dropdown */}
                    <div className='relative group'>
                      <button className='flex items-center space-x-3 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200'>
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm'>
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className='text-left'>
                          <div className='text-sm font-medium text-gray-900'>{user?.name}</div>
                          <div className='text-xs text-gray-500 capitalize'>{user?.role}</div>
                        </div>
                        <ChevronDown className='w-4 h-4 text-gray-400' />
                      </button>
                      <div className='absolute top-full right-0 mt-4 w-64 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2'>
                        <div className='p-4'>
                          <div className='flex items-center space-x-3 mb-4'>
                            <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium'>
                              {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className='font-medium text-gray-900'>{user?.name}</div>
                              <div className='text-sm text-gray-500'>{user?.email}</div>
                              <Badge className='text-xs mt-1 bg-blue-100 text-blue-700'>
                                Level {user?.gamification?.level || 1}
                              </Badge>
                            </div>
                          </div>

                          {user?.gamification && (
                            <div className='mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg'>
                              <div className='flex items-center justify-between text-sm'>
                                <span className='text-gray-600'>Experience</span>
                                <span className='font-medium text-gray-900'>
                                  {user.gamification.experience} / {user.gamification.experienceToNext}
                                </span>
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                                <div
                                  className='bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300'
                                  style={{ width: `${user.gamification.levelProgress || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          <div className='space-y-1'>
                            <Link
                              to={`/${user?.role}/dashboard`}
                              className='flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors'
                            >
                              <User className='w-4 h-4 mr-3' />
                              Dashboard
                            </Link>
                            <Link
                              to={`/${user?.role}/personalized-learning`}
                              className='flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors'
                            >
                              <Brain className='w-4 h-4 mr-3' />
                              AI Learning Path
                            </Link>
                            <Link
                              to={`/${user?.role}/settings`}
                              className='flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors'
                            >
                              <Settings className='w-4 h-4 mr-3' />
                              Settings
                            </Link>
                            <div className='border-t border-gray-200 my-2'></div>
                            <button
                              onClick={handleLogout}
                              className='flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                            >
                              <LogOut className='w-4 h-4 mr-3' />
                              Logout
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      variant='ghost'
                      className='text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors'
                      asChild
                    >
                      <Link to='/login'>Sign In</Link>
                    </Button>
                    <Button
                      className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
                      asChild
                    >
                      <Link to='/register'>
                        <Sparkles className='w-4 h-4 mr-2' />
                        Start Free Trial
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className='lg:hidden'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => {
                    setIsOpen(!isOpen);
                  }}
                  className='text-gray-700 hover:bg-gray-100 rounded-full'
                >
                  {isOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className='lg:hidden bg-white border-t border-gray-200/60'>
            <div className='px-4 pt-4 pb-6 space-y-4'>
              {/* Mobile User Info */}
              {isAuthenticated && user && (
                <div className='pb-4 border-b border-gray-200'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium'>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className='font-medium text-gray-900'>{user.name}</div>
                      <div className='text-sm text-gray-500 capitalize'>{user.role}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <button
                onClick={() => {
                  scrollToSection('home');
                }}
                className='block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors'
              >
                Home
              </button>

              <div className='space-y-2'>
                <div className='text-sm font-medium text-gray-900 px-3 py-2'>Features</div>
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      scrollToSection(feature.href.substring(1));
                    }}
                    className='flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors'
                  >
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    <div>
                      <div className='font-medium'>{feature.title}</div>
                      <div className='text-xs text-gray-500'>{feature.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              <Link
                to='/courses'
                onClick={() => setIsOpen(false)}
                className='block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors'
              >
                Courses
              </Link>

              <button
                onClick={() => {
                  scrollToSection('testimonials');
                }}
                className='block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors'
              >
                Reviews
              </button>

              <button
                onClick={() => {
                  scrollToSection('pricing');
                }}
                className='block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors'
              >
                Pricing
              </button>

              {/* Mobile Auth Section */}
              {isAuthenticated ? (
                <div className='space-y-2 pt-4 border-t border-gray-200'>
                  {/* Mobile Cart and Wishlist */}
                  <div className='flex items-center justify-center space-x-4 pb-2 mb-2 border-b border-gray-200'>
                    <Link
                      to='/cart'
                      onClick={() => setIsOpen(false)}
                      className='flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors'
                    >
                      <ShoppingCart className='w-4 h-4 mr-1' />
                      Cart{' '}
                      {cartCount > 0 && (
                        <Badge className='ml-1 bg-blue-500 text-white text-xs'>{cartCount}</Badge>
                      )}
                    </Link>
                    <Link
                      to='/wishlist'
                      onClick={() => setIsOpen(false)}
                      className='flex items-center text-sm text-gray-600 hover:text-red-500 transition-colors'
                    >
                      <Heart className='w-4 h-4 mr-1' />
                      Wishlist{' '}
                      {wishlistCount > 0 && (
                        <Badge className='ml-1 bg-red-500 text-white text-xs'>
                          {wishlistCount}
                        </Badge>
                      )}
                    </Link>
                  </div>

                  <Link
                    to={`/${user?.role}/dashboard`}
                    onClick={() => setIsOpen(false)}
                    className='flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors'
                  >
                    <User className='w-5 h-5 mr-3' />
                    Dashboard
                  </Link>
                  <Link
                    to={`/${user?.role}/personalized-learning`}
                    onClick={() => setIsOpen(false)}
                    className='flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors'
                  >
                    <Brain className='w-5 h-5 mr-3' />
                    AI Learning Path
                  </Link>
                  <Link
                    to={`/${user?.role}/settings`}
                    onClick={() => setIsOpen(false)}
                    className='flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors'
                  >
                    <Settings className='w-5 h-5 mr-3' />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='flex items-center w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <LogOut className='w-5 h-5 mr-3' />
                    Logout
                  </button>
                </div>
              ) : (
                <div className='space-y-3 pt-4 border-t border-gray-200'>
                  <Button
                    variant='ghost'
                    className='w-full justify-center text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    asChild
                  >
                    <Link to='/login' onClick={() => setIsOpen(false)}>Sign In</Link>
                  </Button>
                  <Button
                    className='w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                    asChild
                  >
                    <Link to='/register' onClick={() => setIsOpen(false)}>
                      <Sparkles className='w-4 h-4 mr-2' />
                      Start Free Trial
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

// If you are using .jsx, you can remove the TypeScript interfaces at the top.
// If you are using .tsx, you'll need to make sure your useAuth and useCartWishlistCounts
// hooks provide the types specified in the interfaces.