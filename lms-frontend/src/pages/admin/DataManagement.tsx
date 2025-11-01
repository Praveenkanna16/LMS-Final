import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useDataStats, useBackupHistory, useCreateBackup, useDeleteBackup } from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Search,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Users,
  BookOpen,
  Trash2,
  RefreshCw,
  Archive,
  FileText,
  Calendar,
  FileJson,
  FileSpreadsheet,
  Shield,
  TrendingUp,
  Server,
} from 'lucide-react';

interface BackupRecord {
  id: string;
  type: 'full' | 'incremental' | 'manual';
  filename: string;
  size: number;
  createdAt: Date;
  status: 'completed' | 'in_progress' | 'failed';
  recordsCount?: number;
  description?: string;
  formattedSize?: string;
  formattedDate?: string;
  formattedTime?: string;
  formattedRecords?: string;
}

const DataManagement: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportCollection, setExportCollection] = useState<'users' | 'payments' | 'classes' | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [backupConfig, setBackupConfig] = useState<{
    type: 'full' | 'incremental' | 'manual';
    description: string;
    schedule: 'manual';
  }>({
    type: 'full',
    description: '',
    schedule: 'manual',
  });

  // Real API data fetching
  const {
    data: dataStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDataStats();

  const {
    data: backupData,
    isLoading: backupsLoading,
    error: backupsError,
    refetch: refetchBackups,
  } = useBackupHistory();

  // Mutation hooks
  const createBackupMutation = useCreateBackup();
  const deleteBackupMutation = useDeleteBackup();

  // Extract data with fallbacks
  const stats = {
    totalUsers: dataStats?.totalUsers ?? 0,
    totalCourses: dataStats?.totalCourses ?? 0,
    totalBatches: dataStats?.totalBatches ?? 0,
    totalPayments: dataStats?.totalPayments ?? 0,
    totalLiveClasses: dataStats?.totalLiveClasses ?? 0,
    totalStorageUsed: dataStats?.totalStorageUsed ?? 0,
    totalBackups: dataStats?.totalBackups ?? 0,
    lastBackupDate: dataStats?.lastBackupDate ?? null,
    formattedStorage: dataStats?.formattedStorage ?? '0 MB',
  };

  const backups: BackupRecord[] = React.useMemo(() => {
    if (!backupData?.backups || !Array.isArray(backupData.backups)) return [];

    return backupData.backups.map(
      (backup: {
        id: string;
        type: 'full' | 'incremental' | 'manual';
        filename: string;
        size: number;
        createdAt: string;
        status: 'completed' | 'in_progress' | 'failed';
        recordsCount?: number;
        description?: string;
      }) => {
        const createdDate = backup.createdAt ? new Date(backup.createdAt) : new Date();
        
        return {
          id: backup.id,
          type: backup.type,
          filename: backup.filename,
          size: backup.size,
          createdAt: createdDate,
          status: backup.status,
          recordsCount: backup.recordsCount,
          description: backup.description,
          formattedSize: `${backup.size}MB`,
          formattedDate: createdDate.toLocaleDateString(),
          formattedTime: createdDate.toLocaleTimeString(),
          formattedRecords: backup.recordsCount?.toLocaleString() ?? '-',
        };
      }
    );
  }, [backupData]);

  // Filter backups
  const filteredBackups = React.useMemo(() => {
    return backups.filter(backup => {
      const matchesSearch =
        (backup.filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (backup.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || backup.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || backup.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [backups, searchTerm, typeFilter, statusFilter]);

  const handleCreateBackup = async () => {
    try {
      await createBackupMutation.mutateAsync({
        type: backupConfig.type,
        description: backupConfig.description || undefined,
      });
      toast({
        title: 'Backup Created',
        description: 'Database backup created successfully.',
      });
      setShowBackupDialog(false);
      setBackupConfig({
        type: 'full',
        description: '',
        schedule: 'manual',
      });
      refetchBackups();
    } catch (error) {
      toast({
        title: 'Backup Failed',
        description: 'Failed to create backup. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to create backup:', error);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await deleteBackupMutation.mutateAsync(backupId);
      toast({
        title: 'Backup Deleted',
        description: 'Backup deleted successfully.',
      });
      refetchBackups();
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete backup. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete backup:', error);
    }
  };

  const handleRestoreBackup = (backupId: string) => {
    try {
      toast({
        title: 'Restore Started',
        description: 'Restore functionality will be available soon.',
      });
      setShowRestoreDialog(false);
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Call real backend export API
      const response = await fetch(
        `/api/admin/data/export?format=${exportFormat}&collection=${exportCollection}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${exportCollection}_${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `Data exported as ${exportFormat.toUpperCase()} successfully.`,
      });
      
      setShowExportDialog(false);
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      full: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      incremental: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      manual: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };
    return <Badge className={colors[type] || 'bg-gray-500/10 text-gray-600'}>{type}</Badge>;
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Gradient Circles Background */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl" />
      
      {/* Floating Icons */}
      <div className="absolute top-40 right-1/4 opacity-10">
        <Database className="w-32 h-32 text-blue-600 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
      <div className="absolute bottom-40 left-1/4 opacity-10">
        <Shield className="w-28 h-28 text-purple-600 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Data Management
              </h1>
              <p className="text-gray-600 mt-1">Manage backups, exports, and database statistics</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {stats.totalUsers.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Active users in system</p>
            </CardContent>
          </Card>

          {/* Total Courses */}
          <Card className="bg-white/90 backdrop-blur-sm border-purple-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Courses</CardTitle>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stats.totalCourses.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Available courses</p>
            </CardContent>
          </Card>

          {/* Storage Used */}
          <Card className="bg-white/90 backdrop-blur-sm border-indigo-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Storage Used</CardTitle>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg">
                  <HardDrive className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {stats.formattedStorage}
              </p>
              <p className="text-xs text-gray-500 mt-1">Database size</p>
            </CardContent>
          </Card>

          {/* Total Backups */}
          <Card className="bg-white/90 backdrop-blur-sm border-green-100/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Backups</CardTitle>
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                  <Archive className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats.totalBackups.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last: {stats.lastBackupDate ? new Date(stats.lastBackupDate).toLocaleDateString() : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => setShowBackupDialog(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6" />
                <CardTitle>Create Backup</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/80">Create a new database backup</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => setShowExportDialog(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Download className="w-6 h-6" />
                <CardTitle>Export Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/80">Export data to CSV or JSON</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => refetchStats()}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6" />
                <CardTitle>Refresh Stats</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/80">Update all statistics</p>
            </CardContent>
          </Card>
        </div>

        {/* Backup History */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Backup History</CardTitle>
                <CardDescription className="text-gray-600">View and manage all database backups</CardDescription>
              </div>
              <Button onClick={() => refetchBackups()} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search backups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {backupsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredBackups.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No backups found</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBackups.map((backup) => (
                      <TableRow key={backup.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{backup.filename}</TableCell>
                        <TableCell>{getTypeBadge(backup.type)}</TableCell>
                        <TableCell>{getStatusBadge(backup.status)}</TableCell>
                        <TableCell>{backup.formattedSize}</TableCell>
                        <TableCell>{backup.formattedRecords}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {backup.formattedDate}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreDialog(true);
                              }}
                              disabled={backup.status !== 'completed'}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBackup(backup.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Backup Dialog */}
        <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Backup</DialogTitle>
              <DialogDescription>
                Create a backup of your database. This process may take a few minutes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Backup Type</Label>
                <Select
                  value={backupConfig.type}
                  onValueChange={(value: 'full' | 'incremental' | 'manual') =>
                    setBackupConfig({ ...backupConfig, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Backup</SelectItem>
                    <SelectItem value="incremental">Incremental Backup</SelectItem>
                    <SelectItem value="manual">Manual Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Before major update"
                  value={backupConfig.description}
                  onChange={(e) => setBackupConfig({ ...backupConfig, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBackup} disabled={createBackupMutation.isPending}>
                {createBackupMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Data Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Export Data
              </DialogTitle>
              <DialogDescription>
                Export your data to CSV or JSON format. Select the data collection and format.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="collection">Data Collection</Label>
                <Select
                  value={exportCollection}
                  onValueChange={(value: 'users' | 'payments' | 'classes' | 'all') =>
                    setExportCollection(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        All Data
                      </div>
                    </SelectItem>
                    <SelectItem value="users">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Users Only
                      </div>
                    </SelectItem>
                    <SelectItem value="payments">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Payments Only
                      </div>
                    </SelectItem>
                    <SelectItem value="classes">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Classes Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  {exportCollection === 'all' && 'Exports all users, payments, courses, and classes'}
                  {exportCollection === 'users' && 'Exports user data with profile information'}
                  {exportCollection === 'payments' && 'Exports payment transactions and records'}
                  {exportCollection === 'classes' && 'Exports live sessions and batch information'}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="format">Export Format</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all ${
                      exportFormat === 'json'
                        ? 'border-blue-500 bg-blue-50/50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setExportFormat('json')}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <FileJson className={`w-8 h-8 ${exportFormat === 'json' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <p className={`font-medium ${exportFormat === 'json' ? 'text-blue-600' : 'text-gray-600'}`}>
                        JSON
                      </p>
                      <p className="text-xs text-gray-500 text-center">Structured data format</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${
                      exportFormat === 'csv'
                        ? 'border-green-500 bg-green-50/50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setExportFormat('csv')}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <FileSpreadsheet className={`w-8 h-8 ${exportFormat === 'csv' ? 'text-green-600' : 'text-gray-400'}`} />
                      <p className={`font-medium ${exportFormat === 'csv' ? 'text-green-600' : 'text-gray-600'}`}>
                        CSV
                      </p>
                      <p className="text-xs text-gray-500 text-center">Spreadsheet format</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleExportData} disabled={isExporting} className="bg-gradient-to-r from-blue-600 to-purple-600">
                {isExporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Download className="w-4 h-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restore Dialog */}
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restore Backup</DialogTitle>
              <DialogDescription>
                Are you sure you want to restore this backup? This will replace all current data.
              </DialogDescription>
            </DialogHeader>
            {selectedBackup && (
              <div className="py-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Warning</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This action cannot be undone. All current data will be replaced with the backup data.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Filename:</strong> {selectedBackup.filename}</p>
                  <p><strong>Size:</strong> {selectedBackup.formattedSize}</p>
                  <p><strong>Created:</strong> {selectedBackup.formattedDate}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedBackup && handleRestoreBackup(selectedBackup.id)}
              >
                Restore Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DataManagement;
