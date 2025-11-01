import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import EMIPlanSelector from '@/components/payments/EMIPlanSelector';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  CreditCard,
  Loader2,
  ArrowLeft 
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  level: string;
  category: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  students: number;
  rating: number;
  features: string[];
  thumbnail?: string;
}

const CourseEnrollmentPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch course details
  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course details');
      }

      return response.json() as Promise<Course>;
    },
  });

  const handleFullPayment = async () => {
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          courseId,
          paymentType: 'full',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const data = await response.json();
      
      // Redirect to payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }

      toast({
        title: 'Payment Initiated',
        description: 'Redirecting to payment gateway...',
      });
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    }
  };

  const handleEMIEnrollmentSuccess = (enrollmentId: string) => {
    toast({
      title: 'EMI Enrollment Successful!',
      description: 'You will be redirected to complete the down payment.',
    });

    // Redirect to payment page after 2 seconds
    setTimeout(() => {
      navigate(`/payments/${enrollmentId}`);
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading course details...</span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Failed to load course details</p>
        <Button onClick={() => navigate('/courses')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Course Details - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-3xl">{course.title}</CardTitle>
                  <CardDescription className="text-base">
                    {course.description}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {course.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold">{course.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="font-semibold">{course.students}+</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="font-semibold">{course.rating}/5</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-semibold">{course.category}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Instructor */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Instructor</h3>
                <div className="flex items-center gap-3">
                  {course.instructor.avatar && (
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{course.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">Course Instructor</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* What You'll Learn */}
              {course.features && course.features.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">What You'll Learn</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {course.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Options - Right Column */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-2xl">Enroll Now</CardTitle>
              <CardDescription>Choose your payment option</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price Display */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Course Price</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(course.price)}</p>
                <p className="text-xs text-muted-foreground mt-1">One-time payment</p>
              </div>

              <Separator />

              {/* Payment Options */}
              <div className="space-y-3">
                <h4 className="font-semibold">Payment Methods</h4>

                {/* Full Payment Button */}
                <Button
                  onClick={handleFullPayment}
                  className="w-full gap-2 h-auto py-3"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Pay Full Amount</div>
                    <div className="text-xs opacity-90">Instant access to course</div>
                  </div>
                </Button>

                {/* EMI Option */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <EMIPlanSelector
                  courseId={course.id}
                  courseName={course.title}
                  baseAmount={course.price}
                  trigger={
                    <Button variant="outline" className="w-full gap-2 h-auto py-3" size="lg">
                      <CreditCard className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Pay in EMI</div>
                        <div className="text-xs opacity-90">Starting from ₹{Math.round(course.price / 3)}/month</div>
                      </div>
                    </Button>
                  }
                  onEnrollmentSuccess={handleEMIEnrollmentSuccess}
                />
              </div>

              <Separator />

              {/* Benefits */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Lifetime access to course</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Certificate of completion</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>24/7 instructor support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Money-back guarantee</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground text-center">
              By enrolling, you agree to our Terms of Service and Privacy Policy
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseEnrollmentPage;
