import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployeeByUid, updateEmployee, Employee } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Loader2, Calendar, User, Phone, Building, Briefcase, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { socket } = useWebSocket();
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);

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
    
    loadEmployee(uid);
  }, [uid, navigate]);

  // Listen for real-time employee updates
  useEffect(() => {
    if (!socket || !employee) return;

    const handleEmployeeUpdate = (data: { employee: Employee }) => {
      // If the updated employee is the one we're currently editing, update the form
      if (data.employee._id === employee._id) {
        setEmployee(data.employee);
        // Only update form data if it's different to prevent unnecessary re-renders
        setFormData(prevFormData => {
          const newFormData = {
            name: data.employee.name || '',
            gender: data.employee.gender || 'Male',
            phone: data.employee.phone || '',
            department: data.employee.department || '',
            position: data.employee.position || '',
            validUntil: data.employee.validUntil ? format(parseISO(data.employee.validUntil), 'yyyy-MM-dd') : ''
          };
          
          // Check if form data actually changed
          const isSame = Object.keys(newFormData).every(
            key => prevFormData[key as keyof typeof prevFormData] === newFormData[key as keyof typeof newFormData]
          );
          
          return isSame ? prevFormData : newFormData;
        });
        
        // Show notification about external update
        toast({
          title: 'Employee Updated',
          description: 'This employee record was updated by another user. The form has been synchronized.',
        });
      }
    };

    // Register event listener
    socket.on('employeeUpdated', handleEmployeeUpdate);

    // Cleanup event listener
    return () => {
      socket.off('employeeUpdated', handleEmployeeUpdate);
    };
  }, [socket, employee, toast]);

  const loadEmployee = useCallback(async (id: string) => {
    try {
      // Add defensive check
      if (!id) {
        throw new Error('Employee ID is required');
      }

      setLoading(true);
      const employeeData = await getEmployeeByUid(id);
      if (employeeData) {
        setEmployee(employeeData);
        const formattedDate = employeeData.validUntil ? format(parseISO(employeeData.validUntil), 'yyyy-MM-dd') : '';
        setFormData({
          name: employeeData.name || '',
          gender: employeeData.gender || 'Male',
          phone: employeeData.phone || '',
          department: employeeData.department || '',
          position: employeeData.position || '',
          validUntil: formattedDate
        });
      } else {
        toast({
          title: 'Error',
          description: 'Employee not found',
          variant: 'destructive'
        });
        navigate('/employees');
      }
    } catch (error) {
      console.error('Failed to load employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee data',
        variant: 'destructive'
      });
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  }, [toast, navigate]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }
    
    if (!formData.validUntil) {
      newErrors.validUntil = 'Validity period is required';
    } else {
      const validUntilDate = new Date(formData.validUntil);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (validUntilDate < today) {
        newErrors.validUntil = 'Validity period cannot be in the past';
      }
    }
    
    if (formData.phone && !/^[+]?[0-9\s\-()]{10,20}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form',
        variant: 'destructive'
      });
      return;
    }

    if (!employee) {
      toast({
        title: 'Error',
        description: 'Employee data not loaded',
        variant: 'destructive'
      });
      return;
    }

    setUpdating(true);
    try {
      const updatedEmployee = await updateEmployee(employee._id, formData);
      setLastSaved(new Date().toLocaleTimeString());
      toast({
        title: 'Success',
        description: 'Employee updated successfully'
      });
      navigate(`/employees/${updatedEmployee.uniqueId}`);
    } catch (error) {
      console.error('Employee update error:', error);
      let errorMessage = 'Failed to update employee';
      
      // Try to extract more specific error information
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          errorMessage = error.response.data?.error || error.response.data?.message || `HTTP error! status: ${error.response.status}`;
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = 'Network error - no response received from server. Please check if the backend is running.';
        } else {
          // Something else happened
          errorMessage = error.message || 'Unknown error occurred';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
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

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

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
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Employee not found
          </AlertDescription>
        </Alert>
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

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <BreadcrumbNavigation 
          items={[
            { label: 'Dashboard', href: '/dashboard' }, 
            { label: 'Employees', href: '/employees' }, 
            { label: employee?.name || 'Employee', href: `/employees/${employee?.uniqueId}` }, 
            { label: 'Edit' }
          ]}
          backButtonHref={`/employees/${employee?.uniqueId}`}
          backButtonLabel="Back to Profile"
        />
        
        <div className="space-y-6">
          {lastSaved && (
            <Alert className="border-green-200 bg-green-50">
              <AlertTitle className="text-green-800">Changes Saved</AlertTitle>
              <AlertDescription className="text-green-700">
                Your changes were saved at {lastSaved}
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Edit Employee</CardTitle>
                  <CardDescription>Update employee details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="John Doe"
                      required
                      disabled={updating}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="flex items-center gap-2">
                      Gender *
                    </Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => handleInputChange('gender', value)}
                      disabled={updating}
                    >
                      <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="uniqueId" className="flex items-center gap-2">
                      Unique Identifier
                    </Label>
                    <div className="relative">
                      <Input
                        id="uniqueId"
                        value={employee.uniqueId}
                        disabled
                        className="font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Unique identifiers cannot be changed after creation
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1234567890"
                      disabled={updating}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Department
                    </Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Engineering"
                      disabled={updating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Position
                    </Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Software Engineer"
                      disabled={updating}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validUntil" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Valid Until *
                  </Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    disabled={updating}
                    className={errors.validUntil ? 'border-red-500' : ''}
                  />
                  {errors.validUntil && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.validUntil}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={updating}
                    className="w-full sm:w-auto"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
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
        </div>
      </main>
    </div>
  );
}