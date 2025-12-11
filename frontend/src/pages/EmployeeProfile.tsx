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
    // Check if uid is available, if not show error and redirect
    if (!uid) {
      console.error('Employee UID is missing from URL parameters');
      toast({
        title: 'Error',
        description: 'Invalid employee identifier',
        variant: 'destructive'
      });
      setLoading(false);
      // Redirect to employees list after a short delay
      setTimeout(() => navigate('/employees'), 2000);
      return;
    }
    
    loadData(uid);
  }, [uid, navigate]);

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
      // Add defensive check for uid
      if (!uid) {
        console.error('UID is undefined or empty');
        toast({
          title: 'Error',
          description: 'Invalid employee identifier',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      setLoading(true);
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
    if (employee?.uniqueId) {
      navigate(`/employees/edit/${employee.uniqueId}`);
    }
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
      if (employee.uniqueId) {
        loadData(employee.uniqueId);
      }
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
                      disabled={actionLoading || isExpired}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Mark Fed
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleEditClick}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {isExpired ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                    {wasFedToday ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">Fed Today</Badge>
                    ) : (
                      <Badge variant="secondary">Not Fed Today</Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Unique ID</p>
                  <p className="text-base font-medium font-mono">{employee.uniqueId}</p>
                </div>
                
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
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Validity Period</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-medium">
                      {format(parseISO(employee.validUntil), 'MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Registered On</p>
                  <p className="text-base font-medium">
                    {format(parseISO(employee.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-2">QR Code</p>
                  <DownloadQRButton 
                    employeeId={employee._id} 
                    employeeUid={employee.uniqueId} 
                    employeeName={employee.name}
                  />
                </div>
              </div>
            </div>
            
            {/* Feed History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Feed History</h3>
                <Badge variant="secondary">{feedHistory.length} records</Badge>
              </div>
              
              {feedHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No feeding records found for this employee</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Scanner</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.time}</TableCell>
                          <TableCell>{record.scannerName || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.method === 'scan' ? 'Scanned' : 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'ok' ? 'default' : 'destructive'}>
                              {record.status === 'ok' ? 'Fed' : 'Duplicate'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}