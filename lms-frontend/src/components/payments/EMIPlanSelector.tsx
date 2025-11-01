import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, CheckCircle2, Info, TrendingUp, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EMIPlan {
  id: string;
  months: number;
  monthlyAmount: number;
  processingFee: number;
  totalAmount: number;
  interestRate: number;
  downPayment: number;
  isPopular?: boolean;
  savings?: number;
}

interface EMIPlanSelectorProps {
  courseId: string;
  courseName: string;
  baseAmount: number;
  trigger?: React.ReactNode;
  onEnrollmentSuccess?: (enrollmentId: string) => void;
}

interface EMIEnrollmentData {
  courseId: string;
  planId: string;
  acceptedTerms: boolean;
}

const EMIPlanSelector: React.FC<EMIPlanSelectorProps> = ({
  courseId,
  courseName,
  baseAmount,
  trigger,
  onEnrollmentSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch EMI plans
  const {
    data: emiPlans,
    isLoading: plansLoading,
    error: plansError,
  } = useQuery({
    queryKey: ['emi-plans', baseAmount],
    queryFn: async () => {
      const response = await fetch(`/api/payments/emi-plans?amount=${baseAmount}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch EMI plans');
      }

      return response.json() as Promise<{ success: boolean; plans: EMIPlan[] }>;
    },
    enabled: open,
  });

  // Enroll in EMI mutation
  const enrollMutation = useMutation({
    mutationFn: async (data: EMIEnrollmentData) => {
      const response = await fetch('/api/payments/enroll-emi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enroll in EMI plan');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success!',
        description: 'EMI enrollment initiated successfully. You will receive payment details shortly.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setOpen(false);
      setSelectedPlan('');
      setAcceptedTerms(false);

      if (onEnrollmentSuccess && data.enrollmentId) {
        onEnrollmentSuccess(data.enrollmentId);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Failed to enroll in EMI plan. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleEnrollEMI = () => {
    if (!selectedPlan) {
      toast({
        title: 'No Plan Selected',
        description: 'Please select an EMI plan to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: 'Terms Not Accepted',
        description: 'Please accept the terms and conditions to continue.',
        variant: 'destructive',
      });
      return;
    }

    enrollMutation.mutate({
      courseId,
      planId: selectedPlan,
      acceptedTerms,
    });
  };

  const selectedPlanDetails = emiPlans?.plans.find((plan) => plan.id === selectedPlan);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Pay in EMI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your EMI Plan</DialogTitle>
          <DialogDescription>
            Select a flexible payment plan for <span className="font-semibold">{courseName}</span>
          </DialogDescription>
        </DialogHeader>

        {plansLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading EMI plans...</span>
          </div>
        )}

        {plansError && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Failed to load EMI plans. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {emiPlans && emiPlans.plans && (
          <>
            {/* Course Summary */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Course Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Course Name</p>
                    <p className="font-semibold">{courseName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Base Price</p>
                    <p className="font-semibold text-lg">{formatCurrency(baseAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EMI Plans Selection */}
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Available EMI Plans
              </h3>

              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                <div className="grid gap-4 md:grid-cols-2">
                  {emiPlans.plans.map((plan) => (
                    <div key={plan.id} className="relative">
                      {plan.isPopular && (
                        <Badge className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-orange-500 to-red-500">
                          Most Popular
                        </Badge>
                      )}
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedPlan === plan.id
                            ? 'ring-2 ring-primary shadow-lg'
                            : 'hover:border-primary/50'
                        } ${plan.isPopular ? 'border-orange-300 dark:border-orange-700' : ''}`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              {plan.months} Months
                            </CardTitle>
                            <RadioGroupItem value={plan.id} id={plan.id} />
                          </div>
                          <CardDescription>
                            {plan.interestRate}% interest rate
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Monthly Payment */}
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">Monthly Payment</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                              {formatCurrency(plan.monthlyAmount)}
                            </p>
                            <p className="text-xs text-muted-foreground">per month for {plan.months} months</p>
                          </div>

                          {/* Breakdown */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Down Payment</span>
                              <span className="font-semibold">{formatCurrency(plan.downPayment)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Processing Fee</span>
                              <span className="font-semibold">{formatCurrency(plan.processingFee)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-muted-foreground font-semibold">Total Amount</span>
                              <span className="font-bold">{formatCurrency(plan.totalAmount)}</span>
                            </div>
                            {plan.savings && plan.savings > 0 && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 pt-1">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-semibold">
                                  Save {formatCurrency(plan.savings)} vs full payment
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Selected Plan Summary */}
            {selectedPlanDetails && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Your Selected Plan Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Down Payment</p>
                      <p className="font-bold text-lg">{formatCurrency(selectedPlanDetails.downPayment)}</p>
                      <p className="text-xs text-muted-foreground">Pay now</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly EMI</p>
                      <p className="font-bold text-lg">{formatCurrency(selectedPlanDetails.monthlyAmount)}</p>
                      <p className="text-xs text-muted-foreground">for {selectedPlanDetails.months} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Processing Fee</p>
                      <p className="font-bold text-lg">{formatCurrency(selectedPlanDetails.processingFee)}</p>
                      <p className="text-xs text-muted-foreground">One-time</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-bold text-lg">{formatCurrency(selectedPlanDetails.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">All inclusive</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Accept terms and conditions
                </Label>
                <p className="text-sm text-muted-foreground">
                  I agree to the EMI payment terms, auto-debit mandate, and understand that late payment charges may apply.
                  {' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    View full terms
                  </a>
                </p>
              </div>
            </div>

            {/* Important Information */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Down payment and processing fee are due immediately upon enrollment</li>
                  <li>Monthly EMI will be auto-debited on the 5th of each month</li>
                  <li>Late payment fee of ₹500 will apply after 3 days grace period</li>
                  <li>Course access will be suspended if 2 consecutive EMIs are missed</li>
                  <li>No refund on processing fee; down payment refund subject to terms</li>
                </ul>
              </AlertDescription>
            </Alert>
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedPlan('');
              setAcceptedTerms(false);
            }}
            disabled={enrollMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnrollEMI}
            disabled={!selectedPlan || !acceptedTerms || enrollMutation.isPending}
            className="gap-2"
          >
            {enrollMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Proceed to Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EMIPlanSelector;
