const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock users endpoint
app.get('/api/users', (req, res) => {
  const mockUsers = [
    {
      id: 1,
      name: 'Praveen Kanna K R',
      email: 'krpraveenkannna@gmail.com',
      role: 'admin',
      status: 'active',
      isActive: true,
      emailVerified: false,
      lastLogin: '2025-10-27T12:19:03.586Z',
      loginAttempts: 0,
      created_at: '2025-10-27T07:32:32.577Z',
      updated_at: '2025-10-27T12:19:03.586Z'
    },
    {
      id: 2,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student',
      status: 'active',
      isActive: true,
      emailVerified: true,
      lastLogin: '2025-10-26T15:30:00.000Z',
      loginAttempts: 0,
      created_at: '2025-10-25T10:00:00.000Z',
      updated_at: '2025-10-26T15:30:00.000Z'
    }
  ];
  
  res.json({
    success: true,
    data: mockUsers,
    pagination: { page: 1, limit: 50, total: mockUsers.length, pages: 1 }
  });
});

// Mock courses endpoint  
app.get('/api/courses', (req, res) => {
  res.json({
    success: true,
    data: { courses: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
  console.log(`Users API: http://localhost:${PORT}/api/users`);
  console.log(`Courses API: http://localhost:${PORT}/api/courses`);
});
