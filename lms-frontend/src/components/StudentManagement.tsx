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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Search,
  Filter as _Filter,
  Download,
  Mail,
  Phone,
  Calendar,
  BookOpen as _BookOpen,
  TrendingUp,
  Award,
  Clock as _Clock,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2 as _Trash2,
  UserPlus,
  GraduationCap as _GraduationCap,
  BarChart3,
  Activity as _Activity,
  MessageSquare,
  Star,
  Eye,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  enrolledAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
  totalCourses: number;
  completedCourses: number;
  totalProgress: number;
  currentBatch?: string;
  location: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  totalSpent: number;
}

interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  batch: string;
  enrolledAt: Date;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
  lastAccessed: Date;
  completionDate?: Date;
  certificateIssued: boolean;
}

interface _StudentPerformance {
  studentId: string;
  courseName: string;
  progress: number;
  timeSpent: number; // in minutes
  assignmentsCompleted: number;
  totalAssignments: number;
  quizScore: number;
  attendanceRate: number;
  lastActivity: Date;
}

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@email.com',
      phone: '+91 9876543210',
      avatar: '',
      enrolledAt: new Date('2024-01-15'),
      lastActive: new Date('2024-01-20'),
      status: 'active',
      totalCourses: 3,
      completedCourses: 1,
      totalProgress: 75,
      currentBatch: 'React Masterclass',
      location: 'Mumbai, India',
      deviceType: 'desktop',
      paymentStatus: 'paid',
      totalSpent: 25999,
    },
    {
      id: '2',
      name: 'Priya Patel',
      email: 'priya.patel@email.com',
      phone: '+91 9876543211',
      avatar: '',
      enrolledAt: new Date('2024-01-10'),
      lastActive: new Date('2024-01-19'),
      status: 'active',
      totalCourses: 2,
      completedCourses: 2,
      totalProgress: 100,
      currentBatch: 'Node.js Bootcamp',
      location: 'Delhi, India',
      deviceType: 'mobile',
      paymentStatus: 'paid',
      totalSpent: 18999,
    },
  ]);

  const [enrollments, _setEnrollments] = useState<Enrollment[]>([
    {
      id: '1',
      studentId: '1',
      studentName: 'Rahul Sharma',
      course: 'Complete React Developer Course',
      batch: 'React Masterclass Batch 1',
      enrolledAt: new Date('2024-01-15'),
      progress: 75,
      status: 'active',
      lastAccessed: new Date('2024-01-20'),
      certificateIssued: false,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Filter students based on search and status
  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats calculation
  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    totalRevenue: students.reduce((sum, s) => sum + s.totalSpent, 0),
    averageProgress: Math.round(
      students.reduce((sum, s) => sum + s.totalProgress, 0) / students.length
    ),
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const handleSuspendStudent = (studentId: string) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, status: 'suspended' as const } : student
      )
    );
  };

  const handleActivateStudent = (studentId: string) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === studentId ? { ...student, status: 'active' as const } : student
      )
    );
  };

  return (
    <div className='min-h-screen bg-gray-50 p-3 sm:p-6'>
      <div className='max-w-7xl mx-auto space-y-4 sm:space-y-6'>
        {/* Header - Mobile optimized */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Student Management</h1>
            <p className='text-sm sm:text-base text-gray-600 hidden sm:block'>
              Manage and track student progress and enrollments
            </p>
            <p className='text-sm text-gray-600 sm:hidden'>Manage students</p>
          </div>
          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3'>
            <Button variant='outline' className='text-xs sm:text-sm'>
              <Download className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
              Export Data
            </Button>
            <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
              <DialogTrigger asChild>
                <Button className='text-xs sm:text-sm'>
                  <UserPlus className='w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                  <span className='hidden sm:inline'>Add Student</span>
                  <span className='sm:hidden'>Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className='w-[95vw] max-w-md mx-auto'>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium'>Full Name</label>
                    <Input placeholder='Enter student name' />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Email</label>
                    <Input type='email' placeholder='Enter email address' />
                  </div>
                  <div>
                    <label className='text-sm font-medium'>Phone</label>
                    <Input placeholder='Enter phone number' />
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
                        <SelectItem value='fullstack'>Full Stack Development</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className='w-full'>Add Student</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards - Mobile optimized */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Total Students</CardTitle>
              <Users className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{stats.totalStudents}</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                {stats.activeStudents} active students
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>
                {stats.activeStudents} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Total Revenue</CardTitle>
              <TrendingUp className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>
                ₹{(stats.totalRevenue / 1000).toFixed(0)}k
              </div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                From student enrollments
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>Enrollments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Average Progress</CardTitle>
              <Target className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>{stats.averageProgress}%</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>Across all courses</p>
              <p className='text-xs text-muted-foreground sm:hidden'>All courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-xs sm:text-sm font-medium'>Completion Rate</CardTitle>
              <Award className='h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-lg sm:text-2xl font-bold'>82%</div>
              <p className='text-xs text-muted-foreground hidden sm:block'>
                Course completion rate
              </p>
              <p className='text-xs text-muted-foreground sm:hidden'>Completion</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search - Mobile optimized */}
        <Card>
          <CardContent className='p-3 sm:p-6'>
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Search students...'
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                    }}
                    className='pl-10 text-sm'
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='suspended'>Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue='students' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-4 lg:w-fit'>
            <TabsTrigger value='students'>Students</TabsTrigger>
            <TabsTrigger value='enrollments'>Enrollments</TabsTrigger>
            <TabsTrigger value='performance'>Performance</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value='students' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>All Students ({filteredStudents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3 sm:space-y-4'>
                  {filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className='flex items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50'
                    >
                      <div className='flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1'>
                        <Avatar className='w-8 h-8 sm:w-10 sm:h-10'>
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback className='text-xs sm:text-sm'>
                            {student.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                            <h3 className='font-medium text-sm sm:text-base truncate'>
                              {student.name}
                            </h3>
                            <div className='flex space-x-2'>
                              <Badge
                                variant={
                                  student.status === 'active'
                                    ? 'default'
                                    : student.status === 'inactive'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                                className='text-xs'
                              >
                                {student.status}
                              </Badge>
                              <Badge
                                variant='outline'
                                className={`text-xs ${
                                  student.paymentStatus === 'paid'
                                    ? 'border-green-500 text-green-700'
                                    : student.paymentStatus === 'pending'
                                      ? 'border-yellow-500 text-yellow-700'
                                      : 'border-red-500 text-red-700'
                                }`}
                              >
                                {student.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                          <p className='text-xs sm:text-sm text-gray-600 truncate'>
                            {student.email}
                          </p>
                          <div className='flex items-center flex-wrap gap-x-2 gap-y-1 mt-1 text-xs text-gray-500'>
                            <span className='hidden sm:inline'>{student.location}</span>
                            <span className='hidden sm:inline'>•</span>
                            <span>{student.totalCourses} courses</span>
                            <span>•</span>
                            <span>{student.totalProgress}% progress</span>
                          </div>
                        </div>
                      </div>
                      <div className='flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 ml-2'>
                        <div className='text-right text-xs sm:text-sm'>
                          <p className='font-medium'>₹{(student.totalSpent / 1000).toFixed(0)}k</p>
                          <p className='text-gray-500 hidden sm:block'>Total spent</p>
                          <p className='text-gray-500 sm:hidden'>Spent</p>
                        </div>
                        <div className='flex space-x-1 sm:space-x-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              handleViewStudent(student);
                            }}
                            className='text-xs sm:text-sm px-2 sm:px-3'
                          >
                            <Eye className='w-3 h-3 sm:w-4 sm:h-4 sm:mr-1' />
                            <span className='hidden sm:inline'>View</span>
                          </Button>
                          <Select>
                            <SelectTrigger className='w-6 h-6 sm:w-8 sm:h-8 p-0'>
                              <MoreHorizontal className='h-3 w-3 sm:h-4 sm:w-4' />
                            </SelectTrigger>
                            <SelectContent align='end'>
                              <SelectItem value='edit'>
                                <Edit className='w-3 h-3 sm:w-4 sm:h-4 mr-2' />
                                Edit
                              </SelectItem>
                              <SelectItem value='message'>
                                <MessageSquare className='w-3 h-3 sm:w-4 sm:h-4 mr-2' />
                                Message
                              </SelectItem>
                              {student.status === 'active' ? (
                                <SelectItem
                                  value='suspend'
                                  onClick={() => {
                                    handleSuspendStudent(student.id);
                                  }}
                                >
                                  <XCircle className='w-3 h-3 sm:w-4 sm:h-4 mr-2' />
                                  Suspend
                                </SelectItem>
                              ) : (
                                <SelectItem
                                  value='activate'
                                  onClick={() => {
                                    handleActivateStudent(student.id);
                                  }}
                                >
                                  <CheckCircle className='w-3 h-3 sm:w-4 sm:h-4 mr-2' />
                                  Activate
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enrollments Tab */}
          <TabsContent value='enrollments' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Course Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {enrollments.map(enrollment => (
                    <div
                      key={enrollment.id}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div className='flex-1'>
                        <div className='flex items-center space-x-3'>
                          <h3 className='font-medium'>{enrollment.studentName}</h3>
                          <Badge
                            variant={
                              enrollment.status === 'active'
                                ? 'default'
                                : enrollment.status === 'completed'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {enrollment.status}
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600'>{enrollment.course}</p>
                        <p className='text-sm text-gray-500'>{enrollment.batch}</p>
                        <div className='flex items-center space-x-4 mt-2'>
                          <div className='flex items-center space-x-2'>
                            <span className='text-sm text-gray-500'>Progress:</span>
                            <Progress value={enrollment.progress} className='w-24' />
                            <span className='text-sm font-medium'>{enrollment.progress}%</span>
                          </div>
                        </div>
                      </div>
                      <div className='text-right text-sm'>
                        <p className='text-gray-500'>Enrolled</p>
                        <p className='font-medium'>{enrollment.enrolledAt.toLocaleDateString()}</p>
                        <p className='text-gray-500 mt-1'>Last accessed</p>
                        <p className='font-medium'>
                          {enrollment.lastAccessed.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value='performance' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <BarChart3 className='w-5 h-5 mr-2' />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {students
                      .sort((a, b) => b.totalProgress - a.totalProgress)
                      .slice(0, 5)
                      .map((student, index) => (
                        <div key={student.id} className='flex items-center space-x-4'>
                          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                            <span className='text-sm font-medium text-blue-600'>{index + 1}</span>
                          </div>
                          <Avatar className='w-8 h-8'>
                            <AvatarFallback className='text-xs'>
                              {student.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex-1'>
                            <p className='font-medium text-sm'>{student.name}</p>
                            <p className='text-xs text-gray-500'>{student.currentBatch}</p>
                          </div>
                          <div className='text-right'>
                            <p className='font-medium text-sm'>{student.totalProgress}%</p>
                            <div className='flex items-center'>
                              <Star className='w-3 h-3 text-yellow-400 mr-1' />
                              <span className='text-xs text-gray-500'>4.8</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center'>
                    <AlertCircle className='w-5 h-5 mr-2' />
                    Students at Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {students
                      .filter(s => s.totalProgress < 30 || s.status === 'inactive')
                      .slice(0, 5)
                      .map(student => (
                        <div
                          key={student.id}
                          className='flex items-center justify-between p-3 bg-red-50 rounded-lg'
                        >
                          <div className='flex items-center space-x-3'>
                            <Avatar className='w-8 h-8'>
                              <AvatarFallback className='text-xs'>
                                {student.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium text-sm'>{student.name}</p>
                              <p className='text-xs text-red-600'>
                                {student.totalProgress}% progress
                              </p>
                            </div>
                          </div>
                          <Button size='sm' variant='outline'>
                            <MessageSquare className='w-4 h-4 mr-1' />
                            Contact
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Course-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  {['React Masterclass', 'Node.js Bootcamp', 'Full Stack Development'].map(
                    course => (
                      <div key={course} className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <h4 className='font-medium'>{course}</h4>
                          <span className='text-sm text-gray-500'>25 students</span>
                        </div>
                        <div className='grid grid-cols-3 gap-4 text-sm'>
                          <div>
                            <p className='text-gray-500'>Avg. Progress</p>
                            <p className='font-medium'>78%</p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Completion Rate</p>
                            <p className='font-medium'>85%</p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Avg. Rating</p>
                            <div className='flex items-center'>
                              <Star className='w-4 h-4 text-yellow-400 mr-1' />
                              <span className='font-medium'>4.6</span>
                            </div>
                          </div>
                        </div>
                        <Progress value={78} className='h-2' />
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value='analytics' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Enrollment trend chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='h-64 flex items-center justify-center bg-gray-50 rounded'>
                    <p className='text-gray-500'>Demographics chart would be rendered here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Desktop</span>
                      <span className='text-sm font-medium'>60%</span>
                    </div>
                    <Progress value={60} />
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Mobile</span>
                      <span className='text-sm font-medium'>35%</span>
                    </div>
                    <Progress value={35} />
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Tablet</span>
                      <span className='text-sm font-medium'>5%</span>
                    </div>
                    <Progress value={5} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Paid</span>
                      <span className='text-sm font-medium text-green-600'>145 students</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Pending</span>
                      <span className='text-sm font-medium text-yellow-600'>8 students</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm'>Overdue</span>
                      <span className='text-sm font-medium text-red-600'>3 students</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Student Details Modal */}
        <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className='space-y-6'>
                <div className='flex items-center space-x-4'>
                  <Avatar className='w-16 h-16'>
                    <AvatarFallback className='text-lg'>
                      {selectedStudent.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <h2 className='text-xl font-bold'>{selectedStudent.name}</h2>
                    <p className='text-gray-600'>{selectedStudent.email}</p>
                    <div className='flex items-center space-x-4 mt-2'>
                      <Badge
                        variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}
                      >
                        {selectedStudent.status}
                      </Badge>
                      <span className='text-sm text-gray-500'>
                        Member since {selectedStudent.enrolledAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='text-lg'>Learning Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-4'>
                        <div>
                          <div className='flex justify-between mb-2'>
                            <span className='text-sm'>Overall Progress</span>
                            <span className='text-sm font-medium'>
                              {selectedStudent.totalProgress}%
                            </span>
                          </div>
                          <Progress value={selectedStudent.totalProgress} />
                        </div>
                        <div className='grid grid-cols-2 gap-4 text-sm'>
                          <div>
                            <p className='text-gray-500'>Total Courses</p>
                            <p className='font-medium'>{selectedStudent.totalCourses}</p>
                          </div>
                          <div>
                            <p className='text-gray-500'>Completed</p>
                            <p className='font-medium'>{selectedStudent.completedCourses}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className='text-lg'>Account Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-3 text-sm'>
                        <div className='flex items-center'>
                          <Mail className='w-4 h-4 mr-2 text-gray-400' />
                          {selectedStudent.email}
                        </div>
                        <div className='flex items-center'>
                          <Phone className='w-4 h-4 mr-2 text-gray-400' />
                          {selectedStudent.phone}
                        </div>
                        <div className='flex items-center'>
                          <Calendar className='w-4 h-4 mr-2 text-gray-400' />
                          Last active: {selectedStudent.lastActive.toLocaleDateString()}
                        </div>
                        <div>
                          <p className='text-gray-500'>Total Spent</p>
                          <p className='font-medium text-lg'>
                            ₹{selectedStudent.totalSpent.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentManagement;
