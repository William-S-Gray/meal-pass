import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeedRecordsByDateRange, FeedRecord, exportFeedRecordsToCSV } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Search } from 'lucide-react';

export default function Reports() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const records = await getFeedRecordsByDateRange(startDate, endDate, site || undefined);
      setFeedRecords(records);
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
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
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

        {/* Records Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Feed Records</CardTitle>
          </CardHeader>
          <CardContent>
            {feedRecords.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {loading ? 'Loading records...' : 'No records found for selected date range'}
              </p>
            ) : (
              // Make table responsive with horizontal scrolling on small screens
              <div className="overflow-x-auto w-full rounded-lg border-2">
                <Table className="min-w-[600px] md:min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">UID</TableHead>
                      <TableHead className="text-xs sm:text-sm">Name</TableHead>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Time</TableHead>
                      <TableHead className="text-xs sm:text-sm">Scanner</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono font-semibold text-xs sm:text-sm">{record.beneficiaryUid}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{record.beneficiaryName}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{record.time}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{record.scannerName}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.status === 'ok' ? 'default' : 'secondary'}
                            className={`text-xs sm:text-sm ${record.status === 'ok' ? 'bg-success' : ''}`}
                          >
                            {record.status}
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