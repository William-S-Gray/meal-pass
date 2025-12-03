import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTodayFeedRecords, FeedRecord } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function FedToday() {
  const navigate = useNavigate();
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedRecords();
  }, []);

  const loadFeedRecords = async () => {
    try {
      const records = await getTodayFeedRecords(1, 100); // Get first 100 records
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">People Fed Today</h1>
            <p className="text-muted-foreground">List of beneficiaries who received meals today</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Feed Records</CardTitle>
            <CardDescription>Showing {feedRecords.length} beneficiaries fed today</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <p className="text-muted-foreground">Loading feed records...</p>
              </div>
            ) : feedRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No beneficiaries have been fed today yet.</p>
              </div>
            ) : (
              <div className="border-2 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beneficiary ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Scanner</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono font-semibold">{record.beneficiaryUid}</TableCell>
                        <TableCell className="font-medium">{record.beneficiaryName}</TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell>{record.scannerName}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'ok' ? 'default' : 'secondary'}>
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