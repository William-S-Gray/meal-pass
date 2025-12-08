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
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isBefore } from 'date-fns';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EmployeesList() {
  const { toast } = useToast();
  const { socket, isConnected } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const limit = 10;
  const refresh = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('refresh') === 'true';
  }, [location.search]);

  useEffect(() => {
    loadEmployees();
  }, [currentPage, searchTerm, refresh, itemsPerPage]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Handler for employee creation
    const handleEmployeeCreate = (data: { employee: Employee }) => {
      // Add the new employee to the list if it matches current filters
      setEmployees(prev => {
        // Check if employee already exists to prevent duplicates
        if (prev.some(emp => emp._id === data.employee._id)) {
          return prev;
        }
        // Add new employee to the beginning of the list
        return [data.employee, ...prev];
      });
      // Update total count
      setTotalCount(prev => prev + 1);
    };

    // Handler for employee updates
    const handleEmployeeUpdate = (data: { employee: Employee }) => {
      // Update the employee in the list
      setEmployees(prev => 
        prev.map(emp => emp._id === data.employee._id ? data.employee : emp)
      );
    };

    // Handler for employee deletion
    const handleEmployeeDelete = (data: { employeeId: string }) => {
      // Remove the employee from the list
      setEmployees(prev => 
        prev.filter(emp => emp._id !== data.employeeId)
      );
      // Update total count
      setTotalCount(prev => prev - 1);
    };

    // Register event listeners
    socket.on('employeeCreated', handleEmployeeCreate);
    socket.on('employeeUpdated', handleEmployeeUpdate);
    socket.on('employeeDeleted', handleEmployeeDelete);

    // Cleanup event listeners
    return () => {
      socket.off('employeeCreated', handleEmployeeCreate);
      socket.off('employeeUpdated', handleEmployeeUpdate);
      socket.off('employeeDeleted', handleEmployeeDelete);
    };
  }, [socket]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await getEmployees(searchTerm, currentPage, itemsPerPage);
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
      // No need to manually reload - WebSocket event will update the list
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

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
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
                {/* Table View for Larger Screens */}
                <div className="hidden md:block overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => {
                        const isExpired = isEmployeeExpired(employee.validUntil);
                        
                        return (
                          <TableRow key={employee._id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/employees/${employee.uniqueId}`)}>
                            <TableCell className="font-medium">{capitalizeName(employee.name)}</TableCell>
                            <TableCell className="font-mono">{employee.uniqueId}</TableCell>
                            <TableCell>{employee.gender}</TableCell>
                            <TableCell>{employee.department || 'N/A'}</TableCell>
                            <TableCell>{formatDate(employee.validUntil)}</TableCell>
                            <TableCell>
                              <Badge variant={isExpired ? "destructive" : "default"}>
                                {isExpired ? "Expired" : "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/employees/${employee.uniqueId}`);
                                  }}
                                >
                                  <QrCode className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/employees/edit/${employee.uniqueId}`);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(employee._id, employee.name);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Card View for Mobile Devices */}
                <div className="md:hidden grid grid-cols-1 gap-4">
                  {employees.map((employee) => {
                    const isExpired = isEmployeeExpired(employee.validUntil);
                    
                    return (
                      <Card key={employee._id} className="border-2 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/employees/${employee.uniqueId}`)}>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/employees/${employee.uniqueId}`);
                              }}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/employees/edit/${employee.uniqueId}`);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(employee._id, employee.name);
                              }}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items per page:</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="border rounded p-1 text-sm"
                      disabled={loading}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min(itemsPerPage, totalCount - (currentPage - 1) * itemsPerPage)} of {totalCount} items
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}