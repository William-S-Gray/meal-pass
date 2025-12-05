import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { 
  getDailyReport, 
  getDateRangeReport, 
  getEmployeeReport, 
  getReportStatistics,
  ReportStatistics,
  FeedRecord,
  PaginatedReport
} from '@/lib/api';
import { capitalizeName } from '@/lib/utils'; // Import the capitalizeName function
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { 
  ArrowLeft, Calendar, TrendingUp, Users, CheckCircle, 
  Loader2, Download, Search, FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';

// Define types for the employee report data
interface EmployeeInfo {
  id: string;
  uniqueId: string;
  name: string;
  department: string;
}

interface FeedLog {
  _id: string;
  fedAt: string;
  servedBy: string;
}

interface EmployeeReportData {
  data: {
    employee: EmployeeInfo;
    feedLogs: FeedLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function ReportsDashboard() {
  const { socket } = useWebSocket();
  const [activeTab, setActiveTab] = useState<'daily' | 'range' | 'employee' | 'statistics'>('daily');
  const [stats, setStats] = useState<ReportStatistics | null>(null);
  const [dailyRecords, setDailyRecords] = useState<PaginatedReport<FeedRecord> | null>(null);
  const [rangeRecords, setRangeRecords] = useState<PaginatedReport<FeedRecord> | null>(null);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [employeeId, setEmployeeId] = useState('');

  useEffect(() => {
    loadStatistics();
    loadDailyReport();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Handler for stats updates
    const handleStatsUpdate = () => {
      loadStatistics();
      if (activeTab === 'daily') {
        loadDailyReport();
      }
    };

    // Handler for feeding record creation
    const handleFeedingRecordCreated = () => {
      // Refresh current view
      if (activeTab === 'daily') {
        loadDailyReport();
      } else if (activeTab === 'statistics') {
        loadStatistics();
      }
    };

    // Handler for feeding record removal
    const handleFeedingRecordRemoved = () => {
      // Refresh current view
      if (activeTab === 'daily') {
        loadDailyReport();
      } else if (activeTab === 'statistics') {
        loadStatistics();
      }
    };

    // Register event listeners
    socket.on('statsUpdated', handleStatsUpdate);
    socket.on('feedingRecordCreated', handleFeedingRecordCreated);
    socket.on('feedingRecordRemoved', handleFeedingRecordRemoved);

    // Cleanup event listeners
    return () => {
      socket.off('statsUpdated', handleStatsUpdate);
      socket.off('feedingRecordCreated', handleFeedingRecordCreated);
      socket.off('feedingRecordRemoved', handleFeedingRecordRemoved);
    };
  }, [socket, activeTab]);

  const loadStatistics = async () => {
    try {
      const data = await getReportStatistics();
      setStats(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        variant: 'destructive'
      });
    }
  };

  const loadDailyReport = async () => {
    setLoading(true);
    try {
      const data = await getDailyReport(1, 50);
      setDailyRecords(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load daily report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDateRangeReport = async () => {
    setLoading(true);
    try {
      const data = await getDateRangeReport(dateRange.from, dateRange.to, 1, 50);
      setRangeRecords(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load date range report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeReport = async () => {
    if (!employeeId.trim()) return;
    
    setLoading(true);
    try {
      const data = await getEmployeeReport(employeeId);
      setEmployeeRecords(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load employee report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="sm:hidden">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports Dashboard' }]}
          backButtonHref="/dashboard"
          backButtonLabel="Back to Dashboard"
        />
        <div>
          <h1 className="text-3xl font-bold text-primary">Reports Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive meal distribution analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b">
          <Button
            variant={activeTab === 'daily' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('daily')}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Daily Report
          </Button>
          <Button
            variant={activeTab === 'range' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('range')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Date Range
          </Button>
          <Button
            variant={activeTab === 'employee' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('employee')}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Employee Report
          </Button>
          <Button
            variant={activeTab === 'statistics' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('statistics')}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Statistics
          </Button>
        </div>

        {/* Daily Report Tab */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Feeding Report</CardTitle>
                <CardDescription>All feeding records for today</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : dailyRecords ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Showing {dailyRecords.data.length} of {dailyRecords.pagination.total} records
                      </p>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>UID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Device</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyRecords.data.length > 0 ? (
                            dailyRecords.data.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell className="font-mono font-semibold">{record.employeeUid}</TableCell>
                                <TableCell>{capitalizeName(record.employeeName)}</TableCell>
                                <TableCell>N/A</TableCell>
                                <TableCell>{record.time}</TableCell>
                                <TableCell>
                                  <Badge variant={record.status === 'duplicate' ? 'secondary' : 'default'}>
                                    {record.status === 'duplicate' ? 'duplicate' : 'scan'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{record.scannerName}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No feeding records found for today
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <p>No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Date Range Tab */}
        {activeTab === 'range' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Date Range Report</CardTitle>
                <CardDescription>Analyze feeding records over a specific period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-date">From</Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to-date">To</Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadDateRangeReport} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : rangeRecords ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Showing {rangeRecords.data.length} of {rangeRecords.pagination.total} records
                      </p>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>UID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Device</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rangeRecords.data.length > 0 ? (
                            rangeRecords.data.map((record) => (
                              <TableRow key={`${record.id}-${record.date}`}>
                                <TableCell className="font-mono font-semibold">{record.employeeUid}</TableCell>
                                <TableCell>{capitalizeName(record.employeeName)}</TableCell>
                                <TableCell>{formatDate(record.date)}</TableCell>
                                <TableCell>{record.time}</TableCell>
                                <TableCell>
                                  <Badge variant={record.status === 'duplicate' ? 'secondary' : 'default'}>
                                    {record.status === 'duplicate' ? 'duplicate' : 'scan'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{record.scannerName}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No feeding records found for the selected date range
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Select a date range and click "Generate Report" to view data
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Employee Report Tab */}
        {activeTab === 'employee' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Report</CardTitle>
                <CardDescription>View detailed feeding history for a specific employee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter Employee UID"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadEmployeeReport()}
                    />
                  </div>
                  <Button onClick={loadEmployeeReport} className="gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : employeeRecords ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Employee Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p><span className="font-semibold">Name:</span> {capitalizeName(employeeRecords.data.employee.name)}</p>
                          <p><span className="font-semibold">UID:</span> {employeeRecords.data.employee.uniqueId}</p>
                          <p><span className="font-semibold">Department:</span> {employeeRecords.data.employee.department}</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Feeding Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-center">
                            {employeeRecords.data.feedLogs.length}
                          </p>
                          <p className="text-center text-muted-foreground">Total Meals</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Last Feeding</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {employeeRecords.data.feedLogs.length > 0 ? (
                            <>
                              <p className="font-semibold">
                                {formatDate(employeeRecords.data.feedLogs[0].fedAt)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(employeeRecords.data.feedLogs[0].fedAt).toLocaleTimeString()}
                              </p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">No feeding records</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Served By</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employeeRecords.data.feedLogs.length > 0 ? (
                            employeeRecords.data.feedLogs.map((log: FeedLog) => (
                              <TableRow key={log._id}>
                                <TableCell>{formatDate(log.fedAt)}</TableCell>
                                <TableCell>{new Date(log.fedAt).toLocaleTimeString()}</TableCell>
                                <TableCell>{log.servedBy || 'Unknown'}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                No feeding records found for this employee
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Enter an Employee UID and click "Search" to view their report
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            {stats ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle>Total Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{stats.totalEmployees}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle>Fed Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-green-500">{stats.totalFedToday}</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle>Feed Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{stats.feedRate}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Weekly Trend Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Weekly Feeding Trend</CardTitle>
                      <CardDescription>Last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.weeklyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Meals Served" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Monthly Trend Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Feeding Trend</CardTitle>
                      <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.monthlyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            name="Meals Served" 
                            stroke="#82ca9d" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Feed Distribution Pie Chart */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Feed Distribution</CardTitle>
                      <CardDescription>Fed vs Not Fed Today</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Fed', value: stats.totalFedToday },
                              { name: 'Not Fed', value: stats.totalEmployees - stats.totalFedToday }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: 'Fed', value: stats.totalFedToday },
                              { name: 'Not Fed', value: stats.totalEmployees - stats.totalFedToday }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Meals']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}