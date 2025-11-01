import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Database,
  Search,
  Download,
  Eye,
  AlertCircle,
  Loader2,
  Users,
  BookOpen,
  Calendar,
  Receipt,
  FileText,
  Bell,
  Smartphone,
  Award,
  Gamepad2,
  User,
  TrendingUp,
  HelpCircle,
  FileCheck,
  Mail,
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  Video,
  DollarSign,
  Settings,
  Server,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDatabaseTables, useTableData } from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';

interface TableInfo {
  name: string;
  displayName: string;
  icon: string;
  recordCount: number;
  tableName: string;
  error?: string;
}

interface TableData {
  tableName: string;
  records: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
}

const iconMap = {
  Users,
  BookOpen,
  Calendar,
  Receipt,
  FileText,
  Bell,
  Smartphone,
  Award,
  Gamepad2,
  User,
  TrendingUp,
  HelpCircle,
  FileCheck,
  Mail,
  ShoppingCart,
  Heart,
  MessageSquare,
  Video,
  DollarSign,
  Settings,
  Database,
  Server,
};

const DatabaseViewer: React.FC = () => {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showRecordDialog, setShowRecordDialog] = useState(false);

  // Fetch all tables using apiService (adds correct auth header)
  const {
    data: tablesData,
    isLoading: tablesLoading,
    error: tablesError,
    refetch: refetchTables,
  } = useQuery({
    queryKey: ['admin-tables'],
    queryFn: async () => {
      const resp = await useDatabaseTables().queryFn?.();
      return resp;
    },
    refetchInterval: 30000,
  });

  // Fetch specific table data
  const tableQuery = useTableData(selectedTable || '', {
    page: currentPage,
    limit: 50,
    search: searchTerm,
    sortBy,
    sortOrder,
  });

  const tableData = tableQuery.data;
  const tableLoading = tableQuery.isLoading;
  const tableError = tableQuery.error;

  const tables: TableInfo[] = tablesData?.data || [];
  const currentTableData: TableData | undefined = tableData?.data;

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Database;
    return IconComponent;
  };

  const formatValue = (value: any, _key: string): string => {
    if (value === null) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.length > 50) return `${value.substring(0, 50)}...`;
    return String(value);
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    setSearchTerm('');
    setSortBy('');
    setSortOrder('asc');
  };

  const handleExportTable = async () => {
    if (!selectedTable) return;
    
    try {
      toast({
        title: 'Export Started',
        description: 'Exporting table data...',
      });
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/admin/data/export?format=csv&collection=${selectedTable}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTable}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: `${selectedTable} data exported successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export table data.',
        variant: 'destructive',
      });
    }
  };

  if (tablesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading database tables...</p>
        </div>
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
      <div className="absolute bottom-40 left-1/3 opacity-10">
        <Server className="w-28 h-28 text-purple-600 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Database Viewer
              </h1>
              <p className="text-gray-600 mt-1">View and analyze all platform data in real-time</p>
            </div>
          </div>
        </div>

        {tablesError && (
          <Card className="bg-red-50 border-red-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <p>Failed to load database tables. Please check your connection and try again.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Table List */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  Database Tables
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {tables.length} tables • Click to view data
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 pr-4">
                    {tables.map(table => {
                      const IconComponent = getIcon(table.icon);
                      return (
                        <div
                          key={table.name}
                          onClick={() => handleTableSelect(table.name)}
                          className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedTable === table.name
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{table.displayName}</p>
                              <p className={`text-xs ${selectedTable === table.name ? 'text-white/80' : 'text-gray-500'}`}>
                                {table.recordCount.toLocaleString()} records
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Table Data */}
          <div className="lg:col-span-3">
            {selectedTable ? (
              <>
                {/* Table Header */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-gray-800 flex items-center gap-2">
                          {React.createElement(
                            getIcon(tables.find(t => t.name === selectedTable)?.icon || 'Database'),
                            { className: 'w-5 h-5 text-blue-600' }
                          )}
                          {tables.find(t => t.name === selectedTable)?.displayName || selectedTable}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {currentTableData?.pagination.totalRecords.toLocaleString() || 0} total records
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            void refetchTables();
                            setCurrentPage(1);
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Refresh
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg"
                          onClick={handleExportTable}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export CSV
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search records..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white border-gray-200"
                        />
                      </div>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-40 bg-white border-gray-200">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">ID</SelectItem>
                          <SelectItem value="createdAt">Created Date</SelectItem>
                          <SelectItem value="updatedAt">Updated Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={sortOrder}
                        onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
                      >
                        <SelectTrigger className="w-32 bg-white border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pagination */}
                    {currentTableData && (
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                          Showing{' '}
                          {(currentTableData.pagination.currentPage - 1) *
                            currentTableData.pagination.limit +
                            1}{' '}
                          to{' '}
                          {Math.min(
                            currentTableData.pagination.currentPage *
                              currentTableData.pagination.limit,
                            currentTableData.pagination.totalRecords
                          )}{' '}
                          of {currentTableData.pagination.totalRecords.toLocaleString()} records
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-200 text-gray-600 hover:bg-gray-50"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-gray-800 font-medium">
                            Page {currentTableData.pagination.currentPage} of{' '}
                            {currentTableData.pagination.totalPages}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-200 text-gray-600 hover:bg-gray-50"
                            onClick={() =>
                              setCurrentPage(prev =>
                                Math.min(currentTableData.pagination.totalPages, prev + 1)
                              )
                            }
                            disabled={currentPage === currentTableData.pagination.totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Table Data */}
                <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
                  <CardContent className="p-0">
                    {tableLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                        <span className="text-gray-600">Loading table data...</span>
                      </div>
                    ) : tableError ? (
                      <div className="text-red-600 text-sm p-6 bg-red-50 rounded-lg border border-red-200 m-6">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        Error loading table data
                      </div>
                    ) : currentTableData && currentTableData.records.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-200 bg-gray-50">
                              {Object.keys(currentTableData.records[0]).map(columnKey => (
                                <TableHead key={columnKey} className="text-gray-700 font-semibold">
                                  {columnKey
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, l => l.toUpperCase())}
                                </TableHead>
                              ))}
                              <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentTableData.records.map((record, index) => (
                              <TableRow key={record.id || index} className="border-gray-100 hover:bg-blue-50/50">
                                {Object.entries(record).map(([key, value]) => (
                                  <TableCell key={key} className="text-gray-700">
                                    <div
                                      className="max-w-xs truncate"
                                      title={formatValue(value, key)}
                                    >
                                      {formatValue(value, key)}
                                    </div>
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                    onClick={() => {
                                      setSelectedRecord(record);
                                      setShowRecordDialog(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No records found</p>
                        <p className="text-gray-400 text-sm">
                          {searchTerm
                            ? 'Try adjusting your search criteria'
                            : 'This table appears to be empty'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              // No table selected
              <Card className="bg-white/90 backdrop-blur-sm border-gray-100 shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Select a Table</h3>
                    <p className="text-gray-600 mb-6">
                      Choose a database table from the sidebar to view its data
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                    {tables.slice(0, 8).map(table => {
                      const IconComponent = getIcon(table.icon);
                      return (
                        <div
                          key={table.name}
                          onClick={() => handleTableSelect(table.name)}
                          className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 border border-blue-100 hover:-translate-y-1"
                        >
                          <IconComponent className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-gray-800 mb-1">{table.displayName}</p>
                          <p className="text-xs text-gray-600">{table.recordCount.toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Record Detail Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Record Details</DialogTitle>
            <DialogDescription className="text-gray-600">
              Complete information for the selected record
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Raw Data (JSON)
                </h4>
                <pre className="text-xs text-gray-700 overflow-x-auto bg-white p-4 rounded border border-gray-200 font-mono">
                  {JSON.stringify(selectedRecord, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedRecord).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-800 break-all font-medium">{formatValue(value, key)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseViewer;
