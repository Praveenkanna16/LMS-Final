#!/bin/bash

echo "🚀 Setting up GenZEd LMS Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if backend is running
if ! curl -s http://localhost:5000/api/auth/me > /dev/null 2>&1; then
    echo "⚠️  Backend server not running on port 5000."
    echo "   Please start the backend first:"
    echo "   cd ../lms-backend && npm install && npm run dev"
    echo ""
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
EOF
    echo "✅ Created .env file with default configuration."
    echo ""
    echo "⚠️  Please update the following in .env file:"
    echo "   - VITE_RAZORPAY_KEY_ID: Your Razorpay test/production key"
    echo ""
else
    echo "✅ .env file already exists."
fi

echo "🎯 Starting development server..."
echo ""
echo "The frontend will be available at: http://localhost:5173"
echo "The backend should be running at: http://localhost:5000"
echo ""
echo "To start the backend (if not already running):"
echo "cd ../lms-backend && npm run dev"
echo ""

npm run dev
