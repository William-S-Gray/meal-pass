import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { getDateRangeReport, FeedRecord, exportFeedRecordsToCSV, PaginatedReport } from '@/lib/api';
import { capitalizeName } from '@/lib/utils'; // Import the capitalizeName function
import { useToast } from '@/hooks/use-toast'; // Use useToast hook instead
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Download, 
  ChevronLeft, 
  Loader2, 
  AlertTriangle,
  CheckCircle,
  Search,
  ArrowLeft
} from 'lucide-react';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';

export default function Reports() {
  const { toast } = useToast(); // Use the toast function from the hook
  const { socket, isConnected } = useWebSocket();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Handler for feeding record creation
    const handleFeedingRecordCreated = () => {
      // Reload records when a new feeding record is created
      loadRecords();
    };

    // Handler for feeding record removal
    const handleFeedingRecordRemoved = () => {
      // Reload records when a feeding record is removed
      loadRecords();
    };

    // Register event listeners
    socket.on('feedingRecordCreated', handleFeedingRecordCreated);
    socket.on('feedingRecordRemoved', handleFeedingRecordRemoved);

    // Cleanup event listeners
    return () => {
      socket.off('feedingRecordCreated', handleFeedingRecordCreated);
      socket.off('feedingRecordRemoved', handleFeedingRecordRemoved);
    };
  }, [socket]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      // Use getDateRangeReport instead of getFeedRecordsByDateRange
      const response: PaginatedReport<FeedRecord> = await getDateRangeReport(startDate, endDate);
      setFeedRecords(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load feed records',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportFeedRecordsToCSV(startDate, endDate);
      toast({
        title: 'Success',
        description: 'CSV exported successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export CSV',
        variant: 'destructive'
      });
    }
  };

  const totalFed = feedRecords.filter(r => r.status === 'ok').length;
  const duplicates = feedRecords.filter(r => r.status === 'duplicate').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="sm:hidden">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            {isConnected && (
              <span className="text-xs text-green-500 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Live Updates
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]}
          backButtonHref="/dashboard"
          backButtonLabel="Back to Dashboard"
        />
        {/* Filters Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Feed Reports</CardTitle>
            <CardDescription>View and export feeding data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site">Site (Optional)</Label>
                <Input
                  id="site"
                  placeholder="Filter by site..."
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={loadRecords} disabled={loading} className="w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'Loading...' : 'Generate Report'}
              </Button>
              <Button onClick={handleExportCSV} variant="outline" disabled={feedRecords.length === 0} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Total Fed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold">{totalFed}</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Duplicates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold">{duplicates}</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl font-bold">{feedRecords.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Feed Records Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Feed Records</CardTitle>
            <CardDescription>Detailed feeding records for the selected date range</CardDescription>
          </CardHeader>
          <CardContent>
            {feedRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>Loading records...</p>
                  </div>
                ) : (
                  <p>No records found for the selected date range</p>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Scanner</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-sm">
                          {record.employeeUid}
                        </TableCell>
                        <TableCell>
                          {capitalizeName(record.employeeName)}
                        </TableCell>
                        <TableCell>
                          {record.date}
                        </TableCell>
                        <TableCell>
                          {record.time}
                        </TableCell>
                        <TableCell>
                          {record.scannerName}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.status === 'ok' ? 'default' : 'destructive'}
                            className={record.status === 'duplicate' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                          >
                            {record.status === 'ok' ? 'Fed' : 'Duplicate'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}