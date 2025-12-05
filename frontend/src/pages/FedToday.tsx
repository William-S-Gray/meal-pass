import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { getTodayFeedRecords, PaginatedFeedRecords, FeedRecord } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';

export default function FedToday() {
  const { socket, isConnected } = useWebSocket();
  const navigate = useNavigate();
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadFeedRecords();
  }, [currentPage, itemsPerPage]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Handler for feeding record creation
    const handleFeedingRecordCreated = () => {
      // Reload records when a new feeding record is created
      loadFeedRecords();
    };

    // Handler for feeding record removal
    const handleFeedingRecordRemoved = () => {
      // Reload records when a feeding record is removed
      loadFeedRecords();
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

  const loadFeedRecords = async () => {
    try {
      setLoading(true);
      const result: PaginatedFeedRecords = await getTodayFeedRecords(currentPage, itemsPerPage);
      setFeedRecords(result.data);
      setTotalPages(result.pagination.pages);
      setTotalItems(result.pagination.total);
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadFeedRecords();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="sm:hidden">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowLeft className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              {isConnected && (
                <span className="text-xs text-green-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Live
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Fed Today' }]}
          backButtonHref="/dashboard"
          backButtonLabel="Back to Dashboard"
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">People Fed Today</h1>
            <p className="text-muted-foreground text-sm sm:text-base">List of beneficiaries who received meals today</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs sm:text-sm text-muted-foreground">
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
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">Loading feed records...</span>
              </div>
            ) : feedRecords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No beneficiaries have been fed today yet.</p>
              </div>
            ) : (
              <>
                {/* Make table responsive with horizontal scrolling on small screens */}
                <div className="overflow-x-auto w-full rounded-lg border-2">
                  <Table className="min-w-[600px] md:min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Beneficiary ID</TableHead>
                        <TableHead className="text-xs sm:text-sm">Name</TableHead>
                        <TableHead className="text-xs sm:text-sm">Time</TableHead>
                        <TableHead className="text-xs sm:text-sm">Scanner</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono font-semibold text-xs sm:text-sm">{record.employeeUid}</TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">{record.employeeName}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{record.time}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{record.scannerName}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'ok' ? 'default' : 'secondary'} className="text-xs sm:text-sm">
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Showing {Math.min(feedRecords.length, itemsPerPage * currentPage)} of {totalItems} feed records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="h-8 sm:h-9"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden xs:inline">Previous</span>
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 sm:w-10 sm:h-10"
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="h-8 sm:h-9"
                    >
                      <span className="hidden xs:inline">Next</span>
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}