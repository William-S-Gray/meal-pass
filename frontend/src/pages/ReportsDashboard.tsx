import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getDailyReport, 
  getDateRangeReport, 
  getBeneficiaryReport, 
  getReportStatistics,
  ReportStatistics,
  FeedRecord,
  PaginatedReport
} from '@/lib/api';
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

// Define types for the beneficiary report data
interface BeneficiaryInfo {
  id: string;
  uniqueId: string;
  name: string;
  gender: string;
  group: string;
}

interface FeedLog {
  _id: string;
  fedAt: string;
  servedBy: string;
}

interface BeneficiaryReportData {
  data: {
    beneficiary: BeneficiaryInfo;
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
  const [activeTab, setActiveTab] = useState<'daily' | 'range' | 'beneficiary' | 'statistics'>('daily');
  const [stats, setStats] = useState<ReportStatistics | null>(null);
  const [dailyRecords, setDailyRecords] = useState<PaginatedReport<FeedRecord> | null>(null);
  const [rangeRecords, setRangeRecords] = useState<PaginatedReport<FeedRecord> | null>(null);
  const [beneficiaryRecords, setBeneficiaryRecords] = useState<BeneficiaryReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [beneficiaryId, setBeneficiaryId] = useState('');

  useEffect(() => {
    loadStatistics();
    loadDailyReport();
  }, []);

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
      const data = await getDailyReport();
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
      const data = await getDateRangeReport(dateRange.from, dateRange.to);
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

  const loadBeneficiaryReport = async () => {
    if (!beneficiaryId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a beneficiary ID',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const data = await getBeneficiaryReport(beneficiaryId);
      setBeneficiaryRecords(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load beneficiary report',
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
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Reports Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive meal distribution analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b">
          <Button
            variant={activeTab === 'daily' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('daily')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Daily Report
          </Button>
          <Button
            variant={activeTab === 'range' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('range')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button
            variant={activeTab === 'beneficiary' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('beneficiary')}
          >
            <Users className="mr-2 h-4 w-4" />
            Beneficiary History
          </Button>
          <Button
            variant={activeTab === 'statistics' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('statistics')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Statistics
          </Button>
        </div>

        {/* Daily Report Tab */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Daily Feeding Report</CardTitle>
                <CardDescription>All meals distributed today</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <span>Loading daily report...</span>
                  </div>
                ) : dailyRecords ? (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Beneficiary ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Scanner</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailyRecords.data.length > 0 ? (
                            dailyRecords.data.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell className="font-mono">{record.beneficiaryUid}</TableCell>
                                <TableCell>{record.beneficiaryName}</TableCell>
                                <TableCell>{formatDate(record.date)}</TableCell>
                                <TableCell>{record.time}</TableCell>
                                <TableCell>{record.scannerName}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No feeding records found for today
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {dailyRecords.data.length > 0 && (
                      <div className="mt-4 flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Showing {dailyRecords.data.length} of {dailyRecords.pagination.total} records
                        </p>
                        <Button variant="outline" size="sm" onClick={loadDailyReport}>
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Date Range Tab */}
        {activeTab === 'range' && (
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Date Range Report</CardTitle>
                <CardDescription>Meals distributed within a specific date range</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input
                      id="fromDate"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toDate">To Date</Label>
                    <Input
                      id="toDate"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={loadDateRangeReport} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Generate Report
                    </Button>
                  </div>
                </div>

                {rangeRecords && (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Beneficiary ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Scanner</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rangeRecords.data.length > 0 ? (
                            rangeRecords.data.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell className="font-mono">{record.beneficiaryUid}</TableCell>
                                <TableCell>{record.beneficiaryName}</TableCell>
                                <TableCell>{formatDate(record.date)}</TableCell>
                                <TableCell>{record.time}</TableCell>
                                <TableCell>{record.scannerName}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                No feeding records found for the selected date range
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {rangeRecords.data.length > 0 && (
                      <div className="mt-4 flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Showing {rangeRecords.data.length} of {rangeRecords.pagination.total} records
                        </p>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Beneficiary History Tab */}
        {activeTab === 'beneficiary' && (
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Beneficiary Feeding History</CardTitle>
                <CardDescription>View feeding history for a specific beneficiary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="beneficiaryId">Beneficiary ID</Label>
                    <Input
                      id="beneficiaryId"
                      placeholder="Enter beneficiary ID (e.g., BNF-0001)"
                      value={beneficiaryId}
                      onChange={(e) => setBeneficiaryId(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={loadBeneficiaryReport} 
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Search
                    </Button>
                  </div>
                </div>

                {beneficiaryRecords && (
                  <div className="space-y-6">
                    <Card className="border">
                      <CardHeader>
                        <CardTitle>{beneficiaryRecords.data.beneficiary.name}</CardTitle>
                        <CardDescription>
                          ID: {beneficiaryRecords.data.beneficiary.uniqueId}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Gender</p>
                            <p className="font-medium capitalize">{beneficiaryRecords.data.beneficiary.gender}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Group</p>
                            <p className="font-medium">{beneficiaryRecords.data.beneficiary.group || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Meals</p>
                            <p className="font-medium">{beneficiaryRecords.data.feedLogs.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Scanner</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {beneficiaryRecords.data.feedLogs.length > 0 ? (
                            beneficiaryRecords.data.feedLogs.map((log: FeedLog) => (
                              <TableRow key={log._id}>
                                <TableCell>{formatDate(log.fedAt)}</TableCell>
                                <TableCell>{new Date(log.fedAt).toLocaleTimeString()}</TableCell>
                                <TableCell>{log.servedBy || 'Unknown'}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                No feeding records found for this beneficiary
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
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
                      <CardTitle>Total Beneficiaries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold">{stats.totalBeneficiaries}</p>
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
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle>Weekly Feeding Trend</CardTitle>
                      <CardDescription>Last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.weeklyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [value, 'Meals']}
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#8884d8" 
                            activeDot={{ r: 8 }} 
                            name="Meals Distributed"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Monthly Trend Chart */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle>Monthly Feeding Trend</CardTitle>
                      <CardDescription>Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [value, 'Meals']}
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <Legend />
                          <Bar dataKey="count" fill="#82ca9d" name="Meals Distributed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Fed vs Not Fed Pie Chart */}
                  <Card className="border-2 lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Fed vs Not Fed Today</CardTitle>
                      <CardDescription>Current distribution status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Fed Today', value: stats.totalFedToday },
                              { name: 'Not Fed', value: stats.totalBeneficiaries - stats.totalFedToday }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell key="fed" fill={COLORS[0]} />
                            <Cell key="not-fed" fill={COLORS[1]} />
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Beneficiaries']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Loading statistics...</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}