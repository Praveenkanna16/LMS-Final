import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePayment } from '@/hooks/usePayment';

export const EarningsDashboard: React.FC = () => {
  const { processRazorpayPayment } = usePayment();
  const [earnings] = useState({
    total: 50000,
    pending: 15000,
    paid: 35000,
    thisMonth: 12000,
  });

  const handlePayoutRequest = () => {
    processRazorpayPayment(1000, 'payout');
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
          <CardDescription>Your revenue and payout status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold'>₹{earnings.total}</div>
              <div className='text-sm text-gray-500'>Total Earnings</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>₹{earnings.pending}</div>
              <div className='text-sm text-gray-500'>Pending</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>₹{earnings.paid}</div>
              <div className='text-sm text-gray-500'>Paid Out</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>₹{earnings.thisMonth}</div>
              <div className='text-sm text-gray-500'>This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>Earnings by source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span>Platform Revenue (60%)</span>
              <span>₹30,000</span>
            </div>
            <div className='flex justify-between'>
              <span>Teacher Revenue (40%)</span>
              <span>₹20,000</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout Management</CardTitle>
          <CardDescription>Request payouts for completed classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span>Available for Payout</span>
              <Badge variant='outline'>₹15,000</Badge>
            </div>
            <Button onClick={handlePayoutRequest} className='w-full'>
              Request Payout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
