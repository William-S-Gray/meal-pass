import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { getEmployees, deleteEmployee, Employee } from '@/lib/api';
import { capitalizeName } from '@/lib/utils'; // Import the capitalizeName function
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  PlusCircle, 
  Edit, 
  Trash2, 
  User, 
  QrCode,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isBefore } from 'date-fns';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';

export default function EmployeesList() {
  const { socket, isConnected } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const refresh = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('refresh') === 'true';
  }, [location.search]);

  useEffect(() => {
    loadEmployees();
  }, [currentPage, searchTerm, refresh]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Handler for employee updates
    const handleEmployeeUpdate = () => {
      // Reload employees when an employee is updated
      loadEmployees();
    };

    // Register event listeners
    socket.on('employeeUpdated', handleEmployeeUpdate);

    // Cleanup event listeners
    return () => {
      socket.off('employeeUpdated', handleEmployeeUpdate);
    };
  }, [socket]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await getEmployees(searchTerm, currentPage, limit);
      setEmployees(response.data);
      setTotalPages(response.pagination.pages);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      await deleteEmployee(id);
      toast({
        title: 'Success',
        description: `Employee ${name} deleted successfully`
      });
      loadEmployees(); // Reload the list
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete employee',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadEmployees();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };

  const isEmployeeExpired = (validUntil: string) => {
    const currentDate = new Date();
    const validUntilDate = parseISO(validUntil);
    return isBefore(validUntilDate, currentDate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">Employees</h1>
              <p className="text-sm text-muted-foreground">
                Manage employee records ({totalCount} total)
              </p>
              {isConnected && (
                <p className="text-xs text-green-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Live updates connected
                </p>
              )}
            </div>
            <Button onClick={() => navigate('/employees/register')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Register New Employee
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees' }]}
          backButtonHref="/dashboard"
          backButtonLabel="Back to Dashboard"
        />
        {/* Search Form */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle>Search Employees</CardTitle>
            <CardDescription>Find employees by name, ID, or department</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Employees Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Employee Records</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `Showing ${employees.length} of ${totalCount} employees`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <p className="text-muted-foreground">Loading employees...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No employees found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm ? 'No employees match your search.' : 'Get started by registering a new employee.'}
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate('/employees/register')}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Register Employee
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee) => {
                    const isExpired = isEmployeeExpired(employee.validUntil);
                    
                    return (
                      <Card key={employee._id} className="border-2 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{capitalizeName(employee.name)}</CardTitle>
                              <CardDescription className="font-mono">{employee.uniqueId}</CardDescription>
                            </div>
                            <Badge variant={isExpired ? "destructive" : "default"}>
                              {isExpired ? "Expired" : "Active"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="space-y-2 text-sm">
                            {employee.phone && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Phone:</span>
                                <span>{employee.phone}</span>
                              </div>
                            )}
                            
                            {employee.gender && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Gender:</span>
                                <span>{employee.gender}</span>
                              </div>
                            )}
                            
                            {employee.department && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Department:</span>
                                <span>{employee.department}</span>
                              </div>
                            )}

                            {employee.position && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Position:</span>
                                <span>{employee.position}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Valid Until:</span>
                              <span>{formatDate(employee.validUntil)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Status:</span>
                              <Badge variant={employee.fedToday ? "default" : "secondary"}>
                                {employee.fedToday ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Fed Today
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Not Fed
                                  </span>
                                )}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/employees/${employee.uniqueId}`)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/employees/edit/${employee.uniqueId}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(employee._id, employee.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}