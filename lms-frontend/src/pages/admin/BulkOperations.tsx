import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Mail,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Send,
  UserCheck,
  UserX,
  GraduationCap,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SelectedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface BulkOperationResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

const BulkOperations: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Bulk User Actions State
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [userAction, setUserAction] = useState<'activate' | 'deactivate' | 'delete'>('activate');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Bulk Email State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailRecipientType, setEmailRecipientType] = useState<'all' | 'students' | 'teachers' | 'selected'>('all');
  const [emailSelectedUsers, setEmailSelectedUsers] = useState<string[]>([]);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'enrollments' | 'users' | 'grades'>('enrollments');

  // Progress State
  const [operationProgress, setOperationProgress] = useState(0);
  const [operationStatus, setOperationStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');

  // Fetch users for bulk operations
  const { data: usersData } = useQuery({
    queryKey: ['bulk-users', userSearchTerm],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/users?search=${userSearchTerm}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Bulk User Actions Mutation
  const bulkUserActionMutation = useMutation({
    mutationFn: async (data: { userIds: string[]; action: string }) => {
      const response = await fetch('/api/admin/bulk/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bulk operation failed');
      }
      return response.json() as Promise<BulkOperationResult>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Bulk Operation Completed',
        description: `${data.succeeded} users processed successfully. ${data.failed} failed.`,
        variant: data.failed > 0 ? 'default' : 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['bulk-users'] });
      setSelectedUsers([]);
      setOperationStatus('completed');
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk Operation Failed',
        description: error.message,
        variant: 'destructive',
      });
      setOperationStatus('error');
    },
  });

  // Bulk Email Mutation
  const bulkEmailMutation = useMutation({
    mutationFn: async (data: {
      subject: string;
      body: string;
      recipientType: string;
      userIds?: string[];
    }) => {
      const response = await fetch('/api/admin/bulk/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send emails');
      }
      return response.json() as Promise<BulkOperationResult>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Emails Sent Successfully',
        description: `${data.succeeded} emails sent. ${data.failed} failed.`,
      });
      setEmailSubject('');
      setEmailBody('');
      setEmailSelectedUsers([]);
      setOperationStatus('completed');
    },
    onError: (error: Error) => {
      toast({
        title: 'Email Sending Failed',
        description: error.message,
        variant: 'destructive',
      });
      setOperationStatus('error');
    },
  });

  // CSV Import Mutation
  const csvImportMutation = useMutation({
    mutationFn: async (data: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('type', data.type);

      const response = await fetch('/api/admin/bulk/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      return response.json() as Promise<BulkOperationResult>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Import Completed',
        description: `${data.succeeded} records imported. ${data.failed} failed.`,
      });
      setCsvFile(null);
      setOperationStatus('completed');
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
      setOperationStatus('error');
    },
  });

  const handleBulkUserAction = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No Users Selected',
        description: 'Please select at least one user',
        variant: 'destructive',
      });
      return;
    }

    setOperationStatus('processing');
    bulkUserActionMutation.mutate({
      userIds: selectedUsers.map((u) => u.id),
      action: userAction,
    });
  };

  const handleBulkEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both subject and body',
        variant: 'destructive',
      });
      return;
    }

    if (emailRecipientType === 'selected' && emailSelectedUsers.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'Please select at least one recipient',
        variant: 'destructive',
      });
      return;
    }

    setOperationStatus('processing');
    bulkEmailMutation.mutate({
      subject: emailSubject,
      body: emailBody,
      recipientType: emailRecipientType,
      userIds: emailRecipientType === 'selected' ? emailSelectedUsers : undefined,
    });
  };

  const handleCSVImport = () => {
    if (!csvFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }

    setOperationStatus('processing');
    csvImportMutation.mutate({
      file: csvFile,
      type: importType,
    });
  };

  const toggleUserSelection = (user: SelectedUser) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const downloadTemplate = (type: string) => {
    const templates = {
      enrollments: 'student_email,course_id,batch_id\nstudent@example.com,1,1\n',
      users: 'name,email,role,phone\nJohn Doe,john@example.com,student,9876543210\n',
      grades: 'student_email,assessment_id,score,remarks\nstudent@example.com,1,85,Good work\n',
    };

    const content = templates[type as keyof typeof templates] || '';
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Operations</h1>
        <p className="text-muted-foreground">
          Perform batch operations on users, send bulk emails, and import data
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            User Actions
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-2">
            <Mail className="h-4 w-4" />
            Bulk Emails
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            CSV Import
          </TabsTrigger>
        </TabsList>

        {/* Bulk User Actions Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk User Actions</CardTitle>
              <CardDescription>
                Select users and perform batch operations like activate, deactivate, or delete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Users */}
              <div className="space-y-2">
                <Label>Search Users</Label>
                <Input
                  placeholder="Search by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>

              {/* User List */}
              <div className="space-y-2">
                <Label>Select Users ({selectedUsers.length} selected)</Label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {usersData?.users?.map((user: SelectedUser) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                      onClick={() => toggleUserSelection(user)}
                    >
                      <Checkbox
                        checked={selectedUsers.some((u) => u.id === user.id)}
                        onCheckedChange={() => toggleUserSelection(user)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </div>
                  ))}
                  {usersData?.users?.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No users found</p>
                  )}
                </div>
              </div>

              {/* Action Selection */}
              <div className="space-y-2">
                <Label>Select Action</Label>
                <Select value={userAction} onValueChange={(value: any) => setUserAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        Activate Users
                      </div>
                    </SelectItem>
                    <SelectItem value="deactivate">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4 text-orange-600" />
                        Deactivate Users
                      </div>
                    </SelectItem>
                    <SelectItem value="delete">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        Delete Users
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Warning Alert */}
              {userAction === 'delete' && selectedUsers.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Deleting {selectedUsers.length} user(s) is permanent and cannot be undone.
                    All associated data will be removed.
                  </AlertDescription>
                </Alert>
              )}

              {/* Execute Button */}
              <Button
                onClick={handleBulkUserAction}
                disabled={
                  selectedUsers.length === 0 || bulkUserActionMutation.isPending
                }
                className="w-full"
                size="lg"
              >
                {bulkUserActionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Execute Action on {selectedUsers.length} User(s)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Email Tab */}
        <TabsContent value="emails" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Bulk Emails</CardTitle>
              <CardDescription>
                Compose and send emails to multiple users at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recipient Type */}
              <div className="space-y-2">
                <Label>Recipients</Label>
                <Select
                  value={emailRecipientType}
                  onValueChange={(value: any) => setEmailRecipientType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="students">All Students</SelectItem>
                    <SelectItem value="teachers">All Teachers</SelectItem>
                    <SelectItem value="selected">Selected Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email Subject */}
              <div className="space-y-2">
                <Label>Email Subject</Label>
                <Input
                  placeholder="Enter email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  placeholder="Enter email content..."
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={10}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Use {'{name}'} for recipient's name, {'{email}'} for email
                </p>
              </div>

              {/* Preview */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This email will be sent to{' '}
                  {emailRecipientType === 'all'
                    ? 'all users'
                    : emailRecipientType === 'students'
                    ? 'all students'
                    : emailRecipientType === 'teachers'
                    ? 'all teachers'
                    : `${emailSelectedUsers.length} selected user(s)`}
                </AlertDescription>
              </Alert>

              {/* Send Button */}
              <Button
                onClick={handleBulkEmail}
                disabled={bulkEmailMutation.isPending}
                className="w-full"
                size="lg"
              >
                {bulkEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Emails
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Import Tab */}
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Import</CardTitle>
              <CardDescription>
                Import enrollments, users, or grades from CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Import Type */}
              <div className="space-y-2">
                <Label>Import Type</Label>
                <Select value={importType} onValueChange={(value: any) => setImportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrollments">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Course Enrollments
                      </div>
                    </SelectItem>
                    <SelectItem value="users">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        New Users
                      </div>
                    </SelectItem>
                    <SelectItem value="grades">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Student Grades
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Download Template */}
              <div className="space-y-2">
                <Label>Download Template</Label>
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate(importType)}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download {importType} Template
                </Button>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Upload CSV File</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    {csvFile ? (
                      <div className="space-y-2">
                        <FileSpreadsheet className="h-12 w-12 mx-auto text-green-600" />
                        <p className="font-medium">{csvFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(csvFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="font-medium">Click to upload CSV file</p>
                        <p className="text-sm text-muted-foreground">
                          or drag and drop your file here
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Import Instructions */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Import Instructions:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Download the template for your import type</li>
                    <li>Fill in the required data (do not modify headers)</li>
                    <li>Save as CSV format</li>
                    <li>Upload the file below</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Import Button */}
              <Button
                onClick={handleCSVImport}
                disabled={!csvFile || csvImportMutation.isPending}
                className="w-full"
                size="lg"
              >
                {csvImportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </>
                )}
              </Button>

              {/* Progress Bar */}
              {operationStatus === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing...</span>
                    <span>{operationProgress}%</span>
                  </div>
                  <Progress value={operationProgress} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Operation Status */}
      {operationStatus === 'completed' && (
        <Alert className="mt-6">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Operation completed successfully!
          </AlertDescription>
        </Alert>
      )}

      {operationStatus === 'error' && (
        <Alert variant="destructive" className="mt-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Operation failed. Please try again or contact support.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BulkOperations;
