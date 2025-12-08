import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployeeByUid, updateEmployee, Employee } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Loader2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebSocket } from '@/contexts/WebSocketContext'; // Import WebSocket context

// Define error type for better type safety
interface ApiError extends Error {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

export default function EditEmployee() {
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { socket } = useWebSocket(); // Use WebSocket context
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    department: '',
    position: '',
    validUntil: ''
  });

  useEffect(() => {
    if (id) {
      loadEmployee(id);
    }
  }, [id]);

  // Initialize form data when employee data is loaded
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        gender: employee.gender,
        phone: employee.phone || '',
        department: employee.department || '',
        position: employee.position || '',
        validUntil: employee.validUntil ? format(parseISO(employee.validUntil), 'yyyy-MM-dd') : ''
      });
    }
  }, [employee]);

  // Listen for real-time employee updates
  useEffect(() => {
    if (!socket || !employee) return;

    const handleEmployeeUpdate = (data: { employee: Employee }) => {
      // If the updated employee is the one we're currently editing, update the form
      if (data.employee._id === employee._id) {
        setEmployee(data.employee);
        setFormData({
          name: data.employee.name,
          gender: data.employee.gender,
          phone: data.employee.phone || '',
          department: data.employee.department || '',
          position: data.employee.position || '',
          validUntil: data.employee.validUntil ? format(parseISO(data.employee.validUntil), 'yyyy-MM-dd') : ''
        });
      }
    };

    // Register event listener
    socket.on('employeeUpdated', handleEmployeeUpdate);

    // Cleanup event listener
    return () => {
      socket.off('employeeUpdated', handleEmployeeUpdate);
    };
  }, [socket, employee]);

  const loadEmployee = async (id: string) => {
    try {
      const employeeData = await getEmployeeByUid(id);
      if (employeeData) {
        setEmployee(employeeData);
        setFormData({
          name: employeeData.name,
          gender: employeeData.gender,
          phone: employeeData.phone || '',
          department: employeeData.department || '',
          position: employeeData.position || '',
          validUntil: employeeData.validUntil ? format(parseISO(employeeData.validUntil), 'yyyy-MM-dd') : ''
        });
      }
    } catch (error) {
      console.error('Failed to load employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employee || !formData.name || !formData.validUntil) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setUpdating(true);
    try {
      await updateEmployee(employee._id, formData);
      toast({
        title: 'Success',
        description: 'Employee updated successfully'
      });
      navigate(`/employees/${employee.uniqueId}`);
    } catch (error) {
      console.error('Employee update error:', error);
      let errorMessage = 'Failed to update employee';
      
      // Try to extract more specific error information
      const apiError = error as ApiError;
      if (apiError.response && apiError.response.data && apiError.response.data.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading employee data...</p>
        </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to={`/employees/${employee.uniqueId}`}>
            <Button variant="ghost" size="sm" className="sm:hidden">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees', href: '/employees' }, { label: employee?.name || 'Employee', href: `/employees/${employee?.uniqueId}` }, { label: 'Edit' }]}
          backButtonHref={`/employees/${employee?.uniqueId}`}
          backButtonLabel="Back to Profile"
        />
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Edit Employee</CardTitle>
            <CardDescription>Update employee details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    disabled={updating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => setFormData({ ...formData, gender: value as 'Male' | 'Female' | 'Other' })}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uniqueId">Unique Identifier</Label>
                  <Input
                    id="uniqueId"
                    value={employee.uniqueId}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifiers cannot be changed after creation
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="HR, IT, Operations..."
                    disabled={updating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Manager, Developer, Analyst..."
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Validity Period *</Label>
                <div className="relative">
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                    disabled={updating}
                    className="pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1" disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Employee'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/employees/${employee.uniqueId}`)} 
                  disabled={updating}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}