import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageSquare, Mail, Phone } from 'lucide-react';

const StudentSupport: React.FC = () => {
  return (
    <Layout>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent'>
            Support & Help
          </h1>
          <p className='text-gray-600 mt-2'>Get assistance and answers to your questions</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-3'>
                <MessageSquare className='w-5 h-5 text-blue-600' />
                <span>Live Chat</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 mb-4'>Chat with our support team in real-time</p>
              <Button className='w-full bg-gradient-to-r from-blue-500 to-purple-600'>
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-3'>
                <Mail className='w-5 h-5 text-green-600' />
                <span>Email Support</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 mb-4'>Send us an email and we'll respond shortly</p>
              <Button className='w-full bg-gradient-to-r from-green-500 to-emerald-600'>
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-3'>
                <Phone className='w-5 h-5 text-orange-600' />
                <span>Phone Support</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 mb-4'>Call our support line for immediate help</p>
              <Button className='w-full bg-gradient-to-r from-orange-500 to-red-600'>
                Call Now
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-3'>
                <HelpCircle className='w-5 h-5 text-purple-600' />
                <span>FAQ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 mb-4'>Browse frequently asked questions</p>
              <Button className='w-full bg-gradient-to-r from-purple-500 to-pink-600'>
                View FAQs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default StudentSupport;
