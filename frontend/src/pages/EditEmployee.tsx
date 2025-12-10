import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useWebSocket } from '@/contexts/WebSocketContext';
import { performanceMonitor, tracePerformance } from '@/utils/performance-monitor';

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

  // Refs for tracking component lifecycle
  const componentMountTime = useRef<number>(performance.now());
  const dataFetchStartTime = useRef<number | null>(null);

  // Trace the entire component mount process
  useEffect(() => {
    const mountDuration = performance.now() - componentMountTime.current;
    performanceMonitor.trackComponentLifecycle('EditEmployee', 'mount', componentMountTime.current, performance.now());
    
    console.log(`🔧 EditEmployee component mounted in ${mountDuration.toFixed(2)}ms`);
    
    return () => {
      console.log('🧹 EditEmployee component unmounted');
    };
  }, []);

  // Memoized employee loading function with enhanced performance monitoring
  const loadEmployee = useCallback(
    tracePerformance('Load Employee Data', async (id: string) => {
      try {
        setLoading(true);
        performanceMonitor.startPageLoad();
        dataFetchStartTime.current = performance.now();
        
        console.group('🔄 Employee Data Loading Process');
        console.log(`🚀 Starting to load employee data for ID: ${id}`);
        
        // Track different phases of the loading process
        performanceMonitor.startPageLoadPhase('API_Request_Startup');
        
        const { result: employeeData, duration } = await performanceMonitor.measureApiCall(getEmployeeByUid, id);
        
        performanceMonitor.endPageLoadPhase('API_Request_Startup');
        performanceMonitor.startPageLoadPhase('Data_Processing');
        
        if (employeeData) {
          console.log(`📥 Received employee data:`, {
            name: employeeData.name,
            uniqueId: employeeData.uniqueId,
            department: employeeData.department,
            position: employeeData.position
          });
          
          // Track data processing time
          const processingStart = performance.now();
          
          setEmployee(employeeData);
          setFormData({
            name: employeeData.name,
            gender: employeeData.gender,
            phone: employeeData.phone || '',
            department: employeeData.department || '',
            position: employeeData.position || '',
            validUntil: employeeData.validUntil ? format(parseISO(employeeData.validUntil), 'yyyy-MM-dd') : ''
          });
          
          const processingDuration = performance.now() - processingStart;
          console.log(`⚙️  Data processing completed in ${processingDuration.toFixed(2)}ms`);
        }
        
        performanceMonitor.endPageLoadPhase('Data_Processing');
        performanceMonitor.startPageLoadPhase('UI_Render_Preparation');
        
        performanceMonitor.endPageLoad();
        
        // Track network performance
        if (dataFetchStartTime.current) {
          performanceMonitor.trackNetwork(
            'FETCH_EMPLOYEE_DATA', 
            `/api/employees/uid/${id}`, 
            dataFetchStartTime.current, 
            performance.now(),
            JSON.stringify(employeeData).length
          );
        }
        
        performanceMonitor.endPageLoadPhase('UI_Render_Preparation');
        
        console.log(`✅ Employee data loaded successfully in ${duration.toFixed(2)}ms`);
        console.groupEnd();
        
      } catch (error) {
        console.error('💥 Failed to load employee:', error);
        toast({
          title: 'Error',
          description: 'Failed to load employee data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }),
    [toast]
  );

  useEffect(() => {
    if (id) {
      console.log(`📍 useEffect triggered with employee ID: ${id}`);
      loadEmployee(id);
    }
  }, [id, loadEmployee]);

  // Listen for real-time employee updates with proper cleanup
  useEffect(() => {
    if (!socket || !employee) return;

    console.log(`📡 Setting up WebSocket listener for employee updates: ${employee._id}`);
    
    const handleEmployeeUpdateStart = performance.now();
    
    const handleEmployeeUpdate = (data: { employee: Employee }) => {
      const handleDuration = performance.now() - handleEmployeeUpdateStart;
      console.log(`📨 Received employee update event in ${handleDuration.toFixed(2)}ms`);
      
      // If the updated employee is the one we're currently editing, update the form
      if (data.employee._id === employee._id) {
        console.log('🔄 Updating form with real-time employee data');
        
        const updateStart = performance.now();
        setEmployee(data.employee);
        
        // Batch state updates to prevent unnecessary re-renders
        setFormData(prevFormData => {
          const newFormData = {
            name: data.employee.name,
            gender: data.employee.gender,
            phone: data.employee.phone || '',
            department: data.employee.department || '',
            position: data.employee.position || '',
            validUntil: data.employee.validUntil ? format(parseISO(data.employee.validUntil), 'yyyy-MM-dd') : ''
          };
          
          // Check if form data actually changed
          const isSame = Object.keys(newFormData).every(
            key => prevFormData[key as keyof typeof prevFormData] === newFormData[key as keyof typeof newFormData]
          );
          
          const updateDuration = performance.now() - updateStart;
          console.log(`🔄 Form update ${isSame ? 'skipped' : 'applied'} in ${updateDuration.toFixed(2)}ms`);
          
          return isSame ? prevFormData : newFormData;
        });
      }
    };

    // Register event listener
    socket.on('employeeUpdated', handleEmployeeUpdate);

    console.log('✅ WebSocket listener registered successfully');

    // Cleanup event listener
    return () => {
      console.log('🧹 Cleaning up WebSocket listener');
      socket.off('employeeUpdated', handleEmployeeUpdate);
    };
  }, [socket, employee]);

  const handleSubmit = tracePerformance('Update Employee', async (e: React.FormEvent) => {
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
      console.group('💾 Employee Update Process');
      console.log('📤 Sending employee update request');
      
      performanceMonitor.startPageLoadPhase('Update_Form_Submission');
      
      const { result, duration } = await performanceMonitor.measureApiCall(updateEmployee, employee._id, formData);
      console.log(`📥 Received update response in ${duration.toFixed(2)}ms`);
      
      performanceMonitor.endPageLoadPhase('Update_Form_Submission');
      
      toast({
        title: 'Success',
        description: 'Employee updated successfully'
      });
      navigate(`/employees/${employee.uniqueId}`);
      
      console.groupEnd();
    } catch (error) {
      console.error('💥 Employee update error:', error);
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
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading employee data...</p>
          <p className="text-xs text-muted-foreground">This may take a moment</p>
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
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              data-testid="edit-employee-form"
            >
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
                <Button type="submit" className="flex-1" disabled={updating} data-testid="save-button">
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
        
        {/* Performance Summary Button */}
        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => performanceMonitor.logComprehensiveDebug()}
          >
            Show Detailed Performance Report
          </Button>
        </div>
      </main>
    </div>
  );
}