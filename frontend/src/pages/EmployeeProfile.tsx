import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext'; // Import WebSocket context
import { 
  getEmployeeByUid, 
  getFeedingRecordsForEmployee, 
  updateEmployee, 
  setManualFeedingStatus, 
  Employee, 
  FeedingRecord 
} from '@/lib/api';
import DownloadQRButton from '@/components/DownloadQRButton';
import { capitalizeName } from '@/lib/utils'; // Import the capitalizeName function
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Edit, Check, X, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isBefore } from 'date-fns';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';

export default function EmployeeProfile() {
  const { isAdmin } = useAuth();
  const { socket } = useWebSocket(); // Use WebSocket context
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [feedHistory, setFeedHistory] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (uid) {
      loadData(uid);
    }
  }, [uid]);

  // Listen for real-time employee updates
  useEffect(() => {
    if (!socket || !employee) return;

    const handleEmployeeUpdate = (data: { employee: Employee }) => {
      // If the updated employee is the one we're currently viewing, update the profile
      if (data.employee._id === employee._id) {
        setEmployee(data.employee);
      }
    };

    const handleEmployeeDelete = (data: { employeeId: string }) => {
      // If the deleted employee is the one we're currently viewing, navigate back to the list
      if (data.employeeId === employee._id) {
        toast({
          title: 'Employee Deleted',
          description: 'This employee has been deleted by another user.'
        });
        navigate('/employees');
      }
    };

    // Register event listeners
    socket.on('employeeUpdated', handleEmployeeUpdate);
    socket.on('employeeDeleted', handleEmployeeDelete);

    // Cleanup event listeners
    return () => {
      socket.off('employeeUpdated', handleEmployeeUpdate);
      socket.off('employeeDeleted', handleEmployeeDelete);
    };
  }, [socket, employee, navigate]);

  const loadData = async (uid: string) => {
    try {
      const [employeeData, historyData] = await Promise.all([
        getEmployeeByUid(uid),
        getFeedingRecordsForEmployee(uid)
      ]);
      setEmployee(employeeData);
      setFeedHistory(historyData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    navigate(`/employees/edit/${employee?.uniqueId}`);
  };

  const handleSetFeedingStatus = async (fed: boolean) => {
    if (!employee) return;
    
    try {
      setActionLoading(true);
      const result = await setManualFeedingStatus(employee.uniqueId, fed);
      toast({
        title: 'Success',
        description: result.message
      });
      // Refresh the data to show updated status
      loadData(employee.uniqueId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update feeding status',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update feeding status',
          variant: 'destructive'
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Employee not found</p>
        <Button onClick={() => navigate('/employees')}>Back to List</Button>
      </div>
    );
  }

  // Check if employee was fed today by looking at feed history
  const wasFedToday = feedHistory.some(record => {
    // Parse the date string and create a date object for the record date
    const recordDate = new Date(record.date + 'T00:00:00');
    
    // Get today's date in local timezone
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    
    // Compare date strings directly for accurate comparison
    return record.date === todayDateString;
  });

  // Check if employee is expired
  const isExpired = isBefore(parseISO(employee.validUntil), new Date());

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/employees">
            <Button variant="ghost" size="sm" className="sm:hidden">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees', href: '/employees' }, { label: capitalizeName(employee?.name) || 'Employee Profile' }]}
          backButtonHref="/employees"
          backButtonLabel="Back to Employees"
        />
        {/* Employee Details */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{capitalizeName(employee.name)}</CardTitle>
                <CardDescription className="text-lg mt-1">
                  <span className="font-mono font-semibold">{employee.uniqueId}</span>
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {isAdmin && (
                  <>
                    <Button 
                      variant={wasFedToday ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleSetFeedingStatus(true)}
                      title="Mark as fed today"
                      disabled={actionLoading || wasFedToday || isExpired}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Mark Fed
                    </Button>
                    <Button 
                      variant={!wasFedToday ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleSetFeedingStatus(false)}
                      title="Mark as not fed today"
                      disabled={actionLoading || !wasFedToday}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Mark Not Fed
                    </Button>
                  </>
                )}
                <DownloadQRButton 
                  employeeId={employee._id} 
                  employeeUid={employee.uniqueId} 
                  variant="outline" 
                  size="sm" 
                />
                <Button variant="outline" onClick={handleEditClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {employee.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="text-base font-medium">{employee.phone}</p>
                  </div>
                )}
                
                {employee.gender && (
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="text-base font-medium">{employee.gender}</p>
                  </div>
                )}
                
                {employee.department && (
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="text-base font-medium">{employee.department}</p>
                  </div>
                )}
                
                {employee.position && (
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p className="text-base font-medium">{employee.position}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Validity Period</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className={`text-base font-medium ${isExpired ? "text-destructive" : ""}`}>
                      {format(parseISO(employee.validUntil), 'MMMM dd, yyyy')}
                    </p>
                    {isExpired && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={wasFedToday ? "default" : "secondary"}>
                    {wasFedToday ? 'Fed Today' : 'Not Fed Today'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Total Meals</p>
                  <p className="text-base font-medium">{feedHistory.length}</p>
                </div>
                
                {feedHistory.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Fed</p>
                    <p className="text-base font-medium">
                      {new Date(feedHistory[0].date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
                <img 
                  src={employee.qrCode} 
                  alt="QR Code" 
                  className="max-w-[80vw] max-h-[80vh] md:max-w-[300px] md:max-h-[300px] border-4 border-white shadow-lg w-full h-auto object-contain"
                />
                <DownloadQRButton 
                  employeeId={employee._id} 
                  employeeUid={employee.uniqueId} 
                  variant="outline" 
                  className="w-full"
                  disabled={actionLoading}
                />
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Card
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed History */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Feed History</CardTitle>
            <CardDescription>Record of all meals distributed</CardDescription>
          </CardHeader>
          <CardContent>
            {feedHistory.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No feed records yet</p>
            ) : (
              // Make table responsive with horizontal scrolling on small screens
              <div className="overflow-x-auto w-full rounded-lg border-2">
                <Table className="min-w-[600px] md:min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Time</TableHead>
                      <TableHead className="text-xs sm:text-sm">Scanner</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedHistory.map((record) => (
                      <TableRow key={`feed-record-${record.id}`}>
                        <TableCell className="text-xs sm:text-sm">{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{new Date(record.fedAt).toLocaleTimeString()}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{record.deviceId}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="text-xs sm:text-sm">
                            {record.method}
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