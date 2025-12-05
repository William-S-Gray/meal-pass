import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { scanQRCode, getEmployeeByUid, Employee } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { QrCode, Camera, CameraOff, Loader2, User, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { format, parseISO, isBefore } from 'date-fns';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';

// Add the EmployeeIDCard component inline to avoid import issues
const EmployeeIDCard: React.FC<{ employee: Employee; businessName?: string }> = ({ 
  employee, 
  businessName = "Africa Accommodation Providers" 
}) => {
  return (
    <div className="w-full max-w-[300px] bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden mx-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3">
        <h2 className="text-lg font-bold text-center truncate">{businessName}</h2>
      </div>
      
      {/* Content */}
      <div className="p-3 h-[calc(100%-40px)] flex">
        {/* Left Side - Employee Info */}
        <div className="flex-1 pr-2">
          <div className="mb-2">
            <h3 className="font-bold text-sm truncate">{employee.name}</h3>
            <p className="text-xs text-gray-600">{employee.uniqueId}</p>
          </div>
          
          {employee.department && (
            <div className="mb-1">
              <p className="text-xs">
                <span className="font-semibold">Dept:</span> {employee.department}
              </p>
            </div>
          )}
          
          {employee.position && (
            <div className="mb-1">
              <p className="text-xs">
                <span className="font-semibold">Pos:</span> {employee.position}
              </p>
            </div>
          )}
          
          <div className="mt-2">
            <p className="text-xs">
              <span className="font-semibold">Valid Until:</span>
            </p>
            <p className="text-xs font-medium">
              {format(parseISO(employee.validUntil), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        
        {/* Right Side - QR Code */}
        <div className="w-24 h-24 flex items-center justify-center bg-gray-100 border border-gray-300 rounded">
          {employee.qrCode ? (
            <img 
              src={employee.qrCode} 
              alt="QR Code" 
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="text-gray-400 text-xs text-center p-1">
              QR Code
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function QRScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'already_fed' | 'not_found' | 'error' | 'expired';
    message: string;
    employee?: Employee;
  } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setScanning(true);
      
      // Initialize QR scanner
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          handleScan(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 3,
        }
      );

      await qrScannerRef.current.start();
    } catch (error) {
      console.error('Failed to start camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera. Please check permissions.',
        variant: 'destructive'
      });
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScan = async (uniqueId: string) => {
    if (!uniqueId) return;

    setLoading(true);
    stopScanning();

    try {
      // First, get employee details to check validity
      const employee = await getEmployeeByUid(uniqueId);
      
      if (!employee) {
        setScanResult({
          status: 'not_found',
          message: 'Employee not found in system'
        });
        setShowResult(true);
        setLoading(false);
        return;
      }

      // Check if employee is expired
      const currentDate = new Date();
      const validUntilDate = parseISO(employee.validUntil);
      
      if (isBefore(validUntilDate, currentDate)) {
        setScanResult({
          status: 'expired',
          message: 'Employee meal access expired',
          employee
        });
        setShowResult(true);
        setLoading(false);
        return;
      }

      // If employee is valid, proceed with scanning
      const deviceId = user?.fullName || 'Unknown Device';
      const result = await scanQRCode(uniqueId, deviceId, 'scan');
      
      setScanResult({
        status: result.status,
        message: result.message,
        employee
      });
      setShowResult(true);
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to process QR code'
      });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    setLoading(true);

    try {
      // First, get employee details to check validity
      const employee = await getEmployeeByUid(manualInput.trim());
      
      if (!employee) {
        setScanResult({
          status: 'not_found',
          message: 'Employee not found in system'
        });
        setShowResult(true);
        setLoading(false);
        return;
      }

      // Check if employee is expired
      const currentDate = new Date();
      const validUntilDate = parseISO(employee.validUntil);
      
      if (isBefore(validUntilDate, currentDate)) {
        setScanResult({
          status: 'expired',
          message: 'Employee meal access expired',
          employee
        });
        setShowResult(true);
        setLoading(false);
        return;
      }

      // If employee is valid, proceed with manual entry
      const deviceId = user?.fullName || 'Manual Entry';
      const result = await scanQRCode(manualInput.trim(), deviceId, 'manual');
      
      setScanResult({
        status: result.status,
        message: result.message,
        employee
      });
      setShowResult(true);
      setManualInput('');
    } catch (error) {
      console.error('Manual entry error:', error);
      setScanResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to process manual entry'
      });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const closeResultDialog = () => {
    setShowResult(false);
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">QR Scanner</h1>
            <div className="flex items-center gap-2">
              {isConnected && (
                <span className="text-xs text-green-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Live Connected
                </span>
              )}
              <Button variant="ghost" onClick={() => navigate('/dashboard')} size="sm" className="sm:hidden">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'QR Scanner' }]}
          backButtonHref="/dashboard"
          backButtonLabel="Back to Dashboard"
        />
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Scan Employee QR Code</CardTitle>
              <CardDescription>Point your camera at an employee's QR code to mark them as fed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Camera Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {scanning ? (
                  <>
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-white">
                    <Camera className="mx-auto h-12 w-12 opacity-70" />
                    <p className="mt-2 opacity-70">Camera not active</p>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex justify-center">
                {scanning ? (
                  <Button 
                    onClick={stopScanning} 
                    variant="destructive" 
                    className="gap-2"
                    disabled={loading}
                  >
                    <CameraOff className="h-4 w-4" />
                    Stop Camera
                  </Button>
                ) : (
                  <Button 
                    onClick={startScanning} 
                    variant="default" 
                    className="gap-2"
                    disabled={loading}
                  >
                    <Camera className="h-4 w-4" />
                    Start Camera
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>Enter employee ID manually if scanning is not possible</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employee-id">Employee ID</Label>
                  <Input
                    id="employee-id"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter employee unique ID"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading || !manualInput.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  Mark as Fed
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {scanResult?.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {scanResult?.status === 'already_fed' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {scanResult?.status === 'not_found' && <AlertTriangle className="h-5 w-5 text-destructive" />}
              {scanResult?.status === 'expired' && <AlertTriangle className="h-5 w-5 text-destructive" />}
              {scanResult?.status === 'error' && <AlertTriangle className="h-5 w-5 text-destructive" />}
              Scan Result
            </DialogTitle>
            <DialogDescription>
              {scanResult?.message}
            </DialogDescription>
          </DialogHeader>
          
          {scanResult?.employee && (
            <div className="space-y-4">
              {/* Employee ID Card Display */}
              <EmployeeIDCard employee={scanResult.employee} />
              
              {/* Status Indicators */}
              {scanResult.status === 'expired' && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Access Expired</span>
                </div>
              )}
              
              {scanResult.status === 'already_fed' && (
                <div className="flex items-center gap-2 p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Already Fed Today</span>
                </div>
              )}
              
              {scanResult.status === 'success' && (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 text-green-500 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Successfully Marked as Fed</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button onClick={closeResultDialog}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}