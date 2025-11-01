import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DollarSign,
  Users,
  Clock,
  Video,
  TrendingUp,
  Star,
  Play,
  Pause,
  BarChart3,
  PieChart,
  Download,
  Settings,
  Plus,
  Calendar as CalendarIcon,
  Eye,
  Edit,
  Target,
} from 'lucide-react';

interface TeacherStats {
  totalEarnings: number;
  monthlyEarnings: number;
  totalStudents: number;
  activeBatches: number;
  completedCourses: number;
  averageRating: number;
  totalReviews: number;
  upcomingClasses: number;
}

interface Batch {
  id: string;
  name: string;
  course: string;
  students: number;
  schedule: string;
  status: 'active' | 'upcoming' | 'completed';
  startDate: Date;
  endDate: Date;
  price: number;
}

interface LiveClass {
  id: string;
  title: string;
  batch: string;
  scheduledAt: Date;
  duration: number;
  status: 'upcoming' | 'live' | 'completed';
  attendees: number;
  recording?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  students: number;
  rating: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  lastUpdated: Date;
}

const TeacherDashboard: React.FC = () => {
  const [_teacherStats, _setTeacherStats] = useState<TeacherStats>({
    totalEarnings: 45000,
    monthlyEarnings: 12000,
    totalStudents: 156,
    activeBatches: 8,
    completedCourses: 12,
    averageRating: 4.8,
    totalReviews: 89,
    upcomingClasses: 5,
  });

  const [batches, setBatches] = useState<Batch[]>([
    {
      id: '1',
      name: 'Advanced React Development',
      course: 'React Masterclass',
      students: 25,
      schedule: 'Mon, Wed, Fri - 7:00 PM',
      status: 'active',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      price: 8999,
    },
    {
      id: '2',
      name: 'Node.js Backend Bootcamp',
      course: 'Full Stack Development',
      students: 18,
      schedule: 'Tue, Thu - 8:00 PM',
      status: 'active',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-01'),
      price: 12999,
    },
  ]);

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([
    {
      id: '1',
      title: 'React Hooks Deep Dive',
      batch: 'Advanced React Development',
      scheduledAt: new Date('2024-01-15T19:00:00'),
      duration: 90,
      status: 'upcoming',
      attendees: 0,
    },
    {
      id: '2',
      title: 'Building RESTful APIs',
      batch: 'Node.js Backend Bootcamp',
      scheduledAt: new Date('2024-01-16T20:00:00'),
      duration: 120,
      status: 'upcoming',
      attendees: 0,
    },
  ]);

  const [_courses, _setCourses] = useState<Course[]>([
    {
      id: '1',
      title: 'Complete React Developer Course',
      description: 'Master React from basics to advanced concepts',
      category: 'Web Development',
      price: 8999,
      students: 234,
      rating: 4.8,
      status: 'published',
      createdAt: new Date('2023-06-01'),
      lastUpdated: new Date('2024-01-10'),
    },
  ]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [_showCreateClass, _setShowCreateClass] = useState(false);

  // Create new batch
  const _handleCreateBatch = (batchData: Partial<Batch>) => {
    const newBatch: Batch = {
      id: Date.now().toString(),
      name: batchData.name ?? 'New Batch',
      course: batchData.course ?? 'Course',
      students: batchData.students ?? 0,
      schedule: batchData.schedule ?? 'TBD',
      startDate: batchData.startDate ?? new Date(),
      endDate: batchData.endDate ?? new Date(),
      price: batchData.price ?? 0,
      status: 'upcoming' as const,
    };
    setBatches([...batches, newBatch]);
    setShowCreateBatch(false);
  };

  // Start live class
  const startLiveClass = (classId: string) => {
    setLiveClasses(prev =>
      prev.map(cls => (cls.id === classId ? { ...cls, status: 'live' as const } : cls))
    );
    // TODO: Integrate with actual live class system
  };

  return (
    <div className='min-h-screen bg-gray-50 p-3 sm:p-6'>
      <div className='max-w-7xl mx-auto space-y-4 sm:space-y-6'>
        {/* Header - Mobile optimized */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Teacher Dashboard</h1>
            <p className='text-gray-600 text-sm sm:text-base'>
              Welcome back! Here's your teaching overview.
            </p>
          </div>
          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3'>
            <Button className='w-full sm:w-auto'>
              <Plus className='w-4 h-4 mr-2' />
              <span className='sm:inline'>Create Course</span>
            </Button>
            <Button variant='outline' className='w-full sm:w-auto'>
              <Settings className='w-4 h-4 mr-2' />
              <span className='sm:inline'>Settings</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Mobile optimized */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Total Earnings</CardTitle>
              <DollarSign className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>
                ₹{(_teacherStats.totalEarnings / 1000).toFixed(0)}k
              </div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                +₹{_teacherStats.monthlyEarnings.toLocaleString()} this month
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>
                +₹{(_teacherStats.monthlyEarnings / 1000).toFixed(0)}k/mo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Total Students</CardTitle>
              <Users className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{_teacherStats.totalStudents}</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                Across {_teacherStats.activeBatches} active batches
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>
                {_teacherStats.activeBatches} batches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Course Rating</CardTitle>
              <Star className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{_teacherStats.averageRating}/5.0</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                Based on {_teacherStats.totalReviews} reviews
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>
                {_teacherStats.totalReviews} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Upcoming Classes</CardTitle>
              <Clock className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{_teacherStats.upcomingClasses}</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Next class in 2 hours</p>
              <p className='text-xs text-muted-foreground sm:hidden'>Next: 2hrs</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs - Mobile optimized */}
        <Tabs defaultValue='overview' className='space-y-6'>
          <div className='overflow-x-auto pb-2'>
            <TabsList className='inline-flex w-max min-w-full lg:w-fit'>
              <TabsTrigger value='overview' className='text-xs sm:text-sm'>
                Overview
              </TabsTrigger>
              <TabsTrigger value='batches' className='text-xs sm:text-sm'>
                Batches
              </TabsTrigger>
              <TabsTrigger value='live-classes' className='text-xs sm:text-sm'>
                Live Classes
              </TabsTrigger>
              <TabsTrigger value='courses' className='text-xs sm:text-sm'>
                Courses
              </TabsTrigger>
              <TabsTrigger value='analytics' className='text-xs sm:text-sm'>
                Analytics
              </TabsTrigger>
              <TabsTrigger value='earnings' className='text-xs sm:text-sm'>
                Earnings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* Upcoming Classes */}
              <Card className='lg:col-span-2'>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Video className='w-5 h-5 mr-2' />
                    Upcoming Live Classes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {liveClasses
                      .filter(cls => cls.status === 'upcoming')
                      .map(liveClass => (
                        <div
                          key={liveClass.id}
                          className='flex items-center justify-between p-4 border rounded-lg'
                        >
                          <div className='flex-1'>
                            <h4 className='font-medium'>{liveClass.title}</h4>
                            <p className='text-sm text-gray-600'>{liveClass.batch}</p>
                            <p className='text-sm text-gray-500'>
                              {liveClass.scheduledAt.toLocaleDateString()} at{' '}
                              {liveClass.scheduledAt.toLocaleTimeString()}
                            </p>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Badge variant='outline'>{liveClass.duration} min</Badge>
                            <Button
                              size='sm'
                              onClick={() => {
                                startLiveClass(liveClass.id);
                              }}
                            >
                              <Play className='w-4 h-4 mr-1' />
                              Start
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <CalendarIcon className='w-5 h-5 mr-2' />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className='rounded-md border'
                  />
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                    <div className='flex-1'>
                      <p className='text-sm'>New student enrolled in React Masterclass</p>
                      <p className='text-xs text-gray-500'>2 hours ago</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <div className='flex-1'>
                      <p className='text-sm'>Live class completed: Building RESTful APIs</p>
                      <p className='text-xs text-gray-500'>1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batches Tab */}
          <TabsContent value='batches' className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-bold'>My Batches</h2>
              <Dialog open={showCreateBatch} onOpenChange={setShowCreateBatch}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className='w-4 h-4 mr-2' />
                    Create New Batch
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-md'>
                  <DialogHeader>
                    <DialogTitle>Create New Batch</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <label className='text-sm font-medium'>Batch Name</label>
                      <Input placeholder='Enter batch name' />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Course</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder='Select course' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='react'>React Masterclass</SelectItem>
                          <SelectItem value='node'>Node.js Bootcamp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Schedule</label>
                      <Input placeholder='e.g., Mon, Wed, Fri - 7:00 PM' />
                    </div>
                    <div>
                      <label className='text-sm font-medium'>Price</label>
                      <Input type='number' placeholder='Enter price' />
                    </div>
                    <Button className='w-full'>Create Batch</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {batches.map(batch => (
                <Card key={batch.id}>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>{batch.name}</CardTitle>
                      <Badge variant={batch.status === 'active' ? 'default' : 'secondary'}>
                        {batch.status}
                      </Badge>
                    </div>
                    <p className='text-sm text-gray-600'>{batch.course}</p>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>Students</span>
                        <span className='font-medium'>{batch.students}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>Schedule</span>
                        <span className='text-sm font-medium'>{batch.schedule}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>Price</span>
                        <span className='font-medium'>₹{batch.price.toLocaleString()}</span>
                      </div>
                      <div className='flex space-x-2 pt-2'>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Eye className='w-4 h-4 mr-1' />
                          View
                        </Button>
                        <Button size='sm' variant='outline' className='flex-1'>
                          <Edit className='w-4 h-4 mr-1' />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Live Classes Tab */}
          <TabsContent value='live-classes' className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-bold'>Live Classes</h2>
              <Button>
                <Plus className='w-4 h-4 mr-2' />
                Schedule Class
              </Button>
            </div>

            <div className='space-y-4'>
              {liveClasses.map(liveClass => (
                <Card key={liveClass.id}>
                  <CardContent className='p-6'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center space-x-3'>
                          <h3 className='text-lg font-medium'>{liveClass.title}</h3>
                          <Badge
                            variant={
                              liveClass.status === 'live'
                                ? 'destructive'
                                : liveClass.status === 'upcoming'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {liveClass.status}
                          </Badge>
                        </div>
                        <p className='text-gray-600'>{liveClass.batch}</p>
                        <div className='flex items-center space-x-4 mt-2 text-sm text-gray-500'>
                          <span className='flex items-center'>
                            <CalendarIcon className='w-4 h-4 mr-1' />
                            {liveClass.scheduledAt.toLocaleDateString()}
                          </span>
                          <span className='flex items-center'>
                            <Clock className='w-4 h-4 mr-1' />
                            {liveClass.scheduledAt.toLocaleTimeString()}
                          </span>
                          <span className='flex items-center'>
                            <Users className='w-4 h-4 mr-1' />
                            {liveClass.attendees} attendees
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        {liveClass.status === 'upcoming' && (
                          <Button
                            onClick={() => {
                              startLiveClass(liveClass.id);
                            }}
                          >
                            <Play className='w-4 h-4 mr-2' />
                            Start Class
                          </Button>
                        )}
                        {liveClass.status === 'live' && (
                          <Button variant='destructive'>
                            <Pause className='w-4 h-4 mr-2' />
                            End Class
                          </Button>
                        )}
                        {liveClass.status === 'completed' && liveClass.recording && (
                          <Button variant='outline'>
                            <Download className='w-4 h-4 mr-2' />
                            Download Recording
                          </Button>
                        )}
                        <Button variant='ghost' size='sm'>
                          <Edit className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value='analytics' className='space-y-6'>
            <h2 className='text-2xl font-bold'>Teaching Analytics</h2>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <BarChart3 className='w-5 h-5 mr-2' />
                    Student Enrollment Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <PieChart className='w-5 h-5 mr-2' />
                    Course Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <TrendingUp className='w-5 h-5 mr-2' />
                    Earnings Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <Target className='w-5 h-5 mr-2' />
                    Completion Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>React Masterclass</span>
                      <span className='text-sm font-medium'>85%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div className='bg-blue-600 h-2 rounded-full' style={{ width: '85%' }}></div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Node.js Bootcamp</span>
                      <span className='text-sm font-medium'>78%</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div className='bg-green-600 h-2 rounded-full' style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value='earnings' className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h2 className='text-2xl font-bold'>Earnings & Payouts</h2>
              <Button variant='outline'>
                <Download className='w-4 h-4 mr-2' />
                Export Report
              </Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-green-600'>₹12,000</div>
                  <p className='text-xs text-muted-foreground'>+20% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Pending Payout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-orange-600'>₹8,500</div>
                  <p className='text-xs text-muted-foreground'>Next payout on 1st</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-sm'>Total Earned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>₹45,000</div>
                  <p className='text-xs text-muted-foreground'>Lifetime earnings</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div>
                        <p className='font-medium'>Student Enrollment - React Masterclass</p>
                        <p className='text-sm text-gray-600'>Jan {i}, 2024</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium text-green-600'>+₹1,200</p>
                        <p className='text-sm text-gray-500'>Commission: ₹180</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeacherDashboard;
