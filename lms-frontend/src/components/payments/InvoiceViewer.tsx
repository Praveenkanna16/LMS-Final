import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Mail, FileText, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvoiceData {
  invoiceNumber: string;
  paymentId: string;
  date: string;
  studentName: string;
  studentEmail: string;
  studentAddress?: string;
  courseName: string;
  batchName?: string;
  amount: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  transactionId?: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  organization: {
    name: string;
    address: string;
    gstin?: string;
    pan?: string;
    email: string;
    phone: string;
  };
}

interface InvoiceViewerProps {
  paymentId: string;
  trigger?: React.ReactNode;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ paymentId, trigger }) => {
  const [open, setOpen] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const fetchInvoice = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/payments/invoice/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setInvoice(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch invoice');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load invoice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    void fetchInvoice();
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/payments/invoice/${paymentId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  };

  const handleEmailInvoice = async () => {
    try {
      setIsSending(true);
      const response = await fetch(`/api/payments/invoice/${paymentId}/email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Invoice sent to email successfully',
        });
      } else {
        throw new Error(result.message || 'Failed to send invoice');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invoice',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div onClick={handleOpen} className='cursor-pointer'>
        {trigger || (
          <Button variant='outline' size='sm'>
            <FileText className='mr-2 h-4 w-4' />
            View Invoice
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center justify-between'>
              <span>Invoice</span>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    void handleDownload();
                  }}
                >
                  <Download className='mr-2 h-4 w-4' />
                  Download PDF
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    void handleEmailInvoice();
                  }}
                  disabled={isSending}
                >
                  <Mail className='mr-2 h-4 w-4' />
                  {isSending ? 'Sending...' : 'Email'}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handlePrint}
                  className='print:hidden'
                >
                  <Printer className='mr-2 h-4 w-4' />
                  Print
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className='py-12 text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' />
              <p className='text-gray-600'>Loading invoice...</p>
            </div>
          ) : invoice ? (
            <div className='bg-white p-8 print:p-0' id='invoice-content'>
              {/* Invoice Header */}
              <div className='flex justify-between items-start mb-8 border-b pb-6'>
                <div>
                  <h1 className='text-3xl font-bold text-blue-600'>{invoice.organization.name}</h1>
                  <p className='text-sm text-gray-600 mt-2 whitespace-pre-line'>
                    {invoice.organization.address}
                  </p>
                  <div className='mt-2 text-sm text-gray-600'>
                    {invoice.organization.gstin && <p>GSTIN: {invoice.organization.gstin}</p>}
                    {invoice.organization.pan && <p>PAN: {invoice.organization.pan}</p>}
                    <p>Email: {invoice.organization.email}</p>
                    <p>Phone: {invoice.organization.phone}</p>
                  </div>
                </div>
                <div className='text-right'>
                  <h2 className='text-2xl font-bold'>INVOICE</h2>
                  <p className='text-sm text-gray-600 mt-2'>{invoice.invoiceNumber}</p>
                  <p className='text-sm text-gray-600'>
                    Date: {new Date(invoice.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Bill To */}
              <div className='mb-8'>
                <h3 className='font-semibold text-gray-700 mb-2'>Bill To:</h3>
                <div className='text-gray-600'>
                  <p className='font-medium'>{invoice.studentName}</p>
                  <p>{invoice.studentEmail}</p>
                  {invoice.studentAddress && <p className='whitespace-pre-line'>{invoice.studentAddress}</p>}
                </div>
              </div>

              {/* Invoice Items */}
              <div className='mb-8'>
                <table className='w-full'>
                  <thead>
                    <tr className='bg-gray-100 border-b'>
                      <th className='text-left p-3 font-semibold'>Description</th>
                      <th className='text-right p-3 font-semibold'>Qty</th>
                      <th className='text-right p-3 font-semibold'>Rate</th>
                      <th className='text-right p-3 font-semibold'>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className='border-b'>
                        <td className='p-3'>{item.description}</td>
                        <td className='text-right p-3'>{item.quantity}</td>
                        <td className='text-right p-3'>₹{item.rate.toLocaleString()}</td>
                        <td className='text-right p-3'>₹{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className='flex justify-end mb-8'>
                <div className='w-64'>
                  <div className='flex justify-between py-2 border-b'>
                    <span className='text-gray-600'>Subtotal:</span>
                    <span className='font-medium'>₹{invoice.amount.toLocaleString()}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className='flex justify-between py-2 border-b text-green-600'>
                      <span>Discount:</span>
                      <span>- ₹{invoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className='flex justify-between py-2 border-b'>
                    <span className='text-gray-600'>Tax (GST):</span>
                    <span className='font-medium'>₹{invoice.tax.toLocaleString()}</span>
                  </div>
                  <div className='flex justify-between py-3 bg-gray-100 px-3 mt-2 rounded'>
                    <span className='font-bold text-lg'>Total:</span>
                    <span className='font-bold text-lg text-blue-600'>
                      ₹{invoice.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className='bg-gray-50 p-4 rounded mb-8'>
                <h3 className='font-semibold text-gray-700 mb-3'>Payment Information</h3>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <p className='text-gray-600'>Payment Method:</p>
                    <p className='font-medium capitalize'>{invoice.paymentMethod}</p>
                  </div>
                  {invoice.transactionId && (
                    <div>
                      <p className='text-gray-600'>Transaction ID:</p>
                      <p className='font-medium'>{invoice.transactionId}</p>
                    </div>
                  )}
                  <div>
                    <p className='text-gray-600'>Payment Date:</p>
                    <p className='font-medium'>{new Date(invoice.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className='text-gray-600'>Status:</p>
                    <p className='font-medium text-green-600'>Paid</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className='text-center text-sm text-gray-500 border-t pt-4'>
                <p>Thank you for your business!</p>
                <p className='mt-1'>
                  For any queries, please contact us at {invoice.organization.email}
                </p>
              </div>
            </div>
          ) : (
            <div className='py-12 text-center text-gray-500'>
              <FileText className='w-16 h-16 text-gray-300 mx-auto mb-4' />
              <p>Invoice not available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
