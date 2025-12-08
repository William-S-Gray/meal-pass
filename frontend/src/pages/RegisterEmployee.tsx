import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createEmployee, Employee, downloadQRCode } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { capitalizeName } from '@/lib/utils'; // Import the capitalizeName function
import { ChevronLeft, Loader2, Download, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
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

export default function RegisterEmployee() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { socket } = useWebSocket(); // Use WebSocket context
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<Employee | null>(null);
  const [isRegistered, setIsRegistered] = useState(false); // New state to track registration status

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    uniqueId: '',
    phone: '',
    department: '',
    position: '',
    validUntil: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.gender || !formData.validUntil) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const employee = await createEmployee(formData);
      setCreatedEmployee(employee);
      setIsRegistered(true); // Set registration status to true
      setShowQRModal(true);
      toast({
        title: 'Success',
        description: `Employee ${employee.uniqueId} registered successfully`
      });
    } catch (error) {
      console.error('Employee creation error:', error);
      let errorMessage = 'Failed to register employee';
      
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
      setLoading(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!createdEmployee) return;
    
    // Add validation for employee ID
    if (!createdEmployee._id) {
      console.error("Attempted QR download with no ID", createdEmployee);
      alert("No ID found for employee.");
      return;
    }
    
    try {
      await downloadQRCode(createdEmployee._id, createdEmployee.uniqueId);
      toast({
        title: 'Success',
        description: 'QR code downloaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download QR code',
        variant: 'destructive'
      });
    }
  };

  const handleCloseModal = () => {
    setShowQRModal(false);
    // Navigate to employees list without refresh parameter since real-time updates are now enabled
    navigate('/employees');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/employees">
            <Button variant="ghost" size="sm" className="sm:hidden">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees', href: '/employees' }, { label: 'Register New Employee' }]}
          backButtonHref="/employees"
          backButtonLabel="Back to Employees"
        />
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Register New Employee</CardTitle>
            <CardDescription>Fill in the details to create a new employee record and generate QR code</CardDescription>
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
                    disabled={loading || isRegistered} // Disable when registered
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => setFormData({ ...formData, gender: value as 'Male' | 'Female' | 'Other' })}
                    disabled={loading || isRegistered}
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
                    value={formData.uniqueId}
                    onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                    placeholder="EMP-001"
                    disabled={loading || isRegistered} // Disable when registered
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                    disabled={loading || isRegistered} // Disable when registered
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
                    disabled={loading || isRegistered} // Disable when registered
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Manager, Developer, Analyst..."
                    disabled={loading || isRegistered} // Disable when registered
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
                    disabled={loading || isRegistered} // Disable when registered
                    className="pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={loading || isRegistered} // Disable when registered
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : isRegistered ? (
                    'Registered' // Show "Registered" text when registered
                  ) : (
                    'Register & Generate QR'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')} 
                  disabled={loading} 
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </main>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Employee Registered</DialogTitle>
            <DialogDescription>
              QR code generated successfully for {createdEmployee?.uniqueId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
              <img 
                src={createdEmployee?.qrCode} 
                alt="QR Code" 
                className="max-w-[80vw] max-h-[80vh] md:max-w-[300px] md:max-h-[300px] border-4 border-white shadow-lg w-full h-auto object-contain"
              />
              <div className="text-center">
                <p className="text-xl font-bold sm:text-2xl">{createdEmployee?.uniqueId}</p>
                <p className="text-sm text-muted-foreground">{capitalizeName(createdEmployee?.name)}</p>
                {createdEmployee?.validUntil && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Valid Until: {format(parseISO(createdEmployee.validUntil), 'MMM dd, yyyy')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleDownloadQR} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </Button>
              <Button variant="outline" onClick={handleCloseModal} className="w-full sm:w-auto">
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}