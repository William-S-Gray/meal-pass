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
import { useToast } from '@/hooks/use-toast';
import { QrCode, Camera, CameraOff, Loader2, User, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';
import Quagga from 'quagga';
import { format, parseISO, isBefore } from 'date-fns';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { capitalizeName } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';

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
            <h3 className="font-bold text-sm truncate">{capitalizeName(employee.name)}</h3>
            <p className="text-xs text-gray-600">{employee.uniqueId}</p>
          </div>
          
          {employee.gender && (
            <div className="mb-1">
              <p className="text-xs">
                <span className="font-semibold">Gender:</span> {employee.gender}
              </p>
            </div>
          )}
          
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
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'qr' | 'barcode'>('qr'); // New state for scan mode
  const [manualInput, setManualInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkResults, setBulkResults] = useState<Array<{id: string, status: string, message: string, employee?: Employee}>>([]);
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false); // New state for camera initialization
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'already_fed' | 'not_found' | 'error' | 'expired';
    message: string;
    employee?: Employee;
  } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // To hold the media stream
  const quaggaInitialized = useRef(false);

  // Cleanup scanner on unmount
  useEffect(() => {
    // Initialize video element to be hidden
    if (videoRef.current) {
      videoRef.current.style.display = 'none';
    }
    
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
      // Stop any active media streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Stop Quagga if initialized
      if (quaggaInitialized.current) {
        Quagga.stop();
        quaggaInitialized.current = false;
      }
    };
  }, []);

  const initQuagga = async () => {
    if (!videoRef.current) return;

    try {
      // Configure Quagga for barcode detection
      await Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locate: true
      }, (err) => {
        if (err) {
          console.error("Quagga initialization error:", err);
          toast({
            title: 'Barcode Scanner Error',
            description: 'Failed to initialize barcode scanner',
            variant: 'destructive'
          });
          return;
        }
        
        Quagga.start();
        quaggaInitialized.current = true;
      });

      // Set up result processing
      Quagga.onDetected((data) => {
        if (data && data.codeResult && data.codeResult.code) {
          handleScan(data.codeResult.code);
        }
      });
    } catch (error) {
      console.error('Failed to initialize Quagga:', error);
      toast({
        title: 'Barcode Scanner Error',
        description: error instanceof Error ? error.message : 'Failed to initialize barcode scanner',
        variant: 'destructive'
      });
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setCameraLoading(true);
      setScanning(true);
      
      // Stop any existing scanner
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
      
      // Stop any existing media streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Stop Quagga if running
      if (quaggaInitialized.current) {
        Quagga.stop();
        quaggaInitialized.current = false;
      }
      
      // Check for camera permissions first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer rear camera for scanning
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Store the stream reference for cleanup
      streamRef.current = stream;
      
      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.display = 'block';
      }
      
      // For QR scanning, initialize QR scanner
      if (scanMode === 'qr') {
        // Initialize QR scanner
        qrScannerRef.current = new QrScanner(
          videoRef.current!,
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
      } else {
        // For barcode scanning, initialize Quagga
        await initQuagga();
        // Play the video stream
        if (videoRef.current) {
          await videoRef.current.play();
        }
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      toast({
        title: 'Camera Error',
        description: error instanceof Error ? error.message : 'Failed to access camera. Please check permissions.',
        variant: 'destructive'
      });
      setScanning(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    // Stop media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Stop Quagga if initialized
    if (quaggaInitialized.current) {
      Quagga.stop();
      quaggaInitialized.current = false;
    }
    
    setScanning(false);
    
    // Hide the video element when not scanning
    if (videoRef.current) {
      videoRef.current.style.display = 'none';
      videoRef.current.srcObject = null;
    }
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
        message: error instanceof Error ? error.message : 'Failed to process code'
      });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBulkMode) {
      // Handle bulk submission
      if (!bulkInput.trim()) return;
      
      setLoading(true);
      setBulkResults([]);
      
      try {
        // Split input by newlines and commas, then clean and filter
        const employeeIds = bulkInput
          .split(/[\n,]+/)
          .map(id => id.trim())
          .filter(id => id.length > 0);
        
        if (employeeIds.length === 0) {
          toast({
            title: 'Error',
            description: 'No valid employee IDs found',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
        
        // Process each employee ID
        const results = [];
        for (const employeeId of employeeIds) {
          try {
            // First, get employee details to check validity
            const employee = await getEmployeeByUid(employeeId);
            
            if (!employee) {
              results.push({
                id: employeeId,
                status: 'not_found',
                message: 'Employee not found in system'
              });
              continue;
            }
            
            // Check if employee is expired
            const currentDate = new Date();
            const validUntilDate = parseISO(employee.validUntil);
            
            if (isBefore(validUntilDate, currentDate)) {
              results.push({
                id: employeeId,
                status: 'expired',
                message: 'Employee meal access expired',
                employee
              });
              continue;
            }
            
            // If employee is valid, proceed with manual entry
            const deviceId = user?.fullName || 'Manual Entry';
            const result = await scanQRCode(employeeId, deviceId, 'manual');
            
            results.push({
              id: employeeId,
              status: result.status,
              message: result.message,
              employee
            });
          } catch (error) {
            console.error(`Error processing employee ${employeeId}:`, error);
            results.push({
              id: employeeId,
              status: 'error',
              message: error instanceof Error ? error.message : 'Failed to process employee'
            });
          }
        }
        
        setBulkResults(results);
        
        // Show summary toast
        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.length - successCount;
        
        toast({
          title: 'Bulk Processing Complete',
          description: `Successfully processed: ${successCount}, Errors: ${errorCount}`,
          variant: successCount > 0 ? 'default' : 'destructive'
        });
      } catch (error) {
        console.error('Bulk entry error:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to process bulk entry',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Handle single submission
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
            <h1 className="text-2xl font-bold text-primary">Scanner</h1>
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
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Scanner' }]}
          backButtonHref="/dashboard"
          backButtonLabel="Back to Dashboard"
        />
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>{scanMode === 'qr' ? 'QR Code Scanner' : 'Barcode Scanner'}</CardTitle>
              <CardDescription>
                Point your camera at an employee's {scanMode === 'qr' ? 'QR code' : 'barcode'} to mark them as fed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scan Mode Toggle */}
              <div className="flex rounded-md overflow-hidden border">
                <Button
                  variant={scanMode === 'qr' ? 'default' : 'outline'}
                  onClick={() => setScanMode('qr')}
                  className="flex-1 rounded-none"
                  disabled={scanning || cameraLoading}
                >
                  QR Code
                </Button>
                <Button
                  variant={scanMode === 'barcode' ? 'default' : 'outline'}
                  onClick={() => setScanMode('barcode')}
                  className="flex-1 rounded-none"
                  disabled={scanning || cameraLoading}
                >
                  Barcode
                </Button>
              </div>
              
              {/* Camera Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {scanning ? (
                  <>
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover"
                      playsInline
                      muted
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
                
                {/* Camera Loading Overlay */}
                {cameraLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <LoadingSpinner size="lg" message="Initializing camera..." />
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
                    disabled={loading || cameraLoading}
                  >
                    {cameraLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        Start Camera
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Scan Mode Info */}
              <div className="text-center text-sm text-muted-foreground">
                {scanMode === 'qr' 
                  ? 'Scanning QR codes from employee ID cards' 
                  : 'Scanning barcodes from employee ID cards (Code 128, EAN, UPC, etc.)'}
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
              {/* Toggle between single and bulk mode */}
              <div className="flex mb-4">
                <Button
                  variant={!isBulkMode ? "default" : "outline"}
                  onClick={() => setIsBulkMode(false)}
                  className="rounded-r-none"
                >
                  Single Entry
                </Button>
                <Button
                  variant={isBulkMode ? "default" : "outline"}
                  onClick={() => setIsBulkMode(true)}
                  className="rounded-l-none"
                >
                  Bulk Entry
                </Button>
              </div>
              
              <form onSubmit={handleManualSubmit} className="space-y-4">
                {!isBulkMode ? (
                  // Single entry mode
                  <>
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
                  </>
                ) : (
                  // Bulk entry mode
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bulk-ids">Employee IDs (one per line or comma separated)</Label>
                      <textarea
                        id="bulk-ids"
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder="Enter employee IDs, one per line or separated by commas&#10;Example:&#10;EMP001&#10;EMP002&#10;EMP003&#10;&#10;Or: EMP001, EMP002, EMP003"
                        disabled={loading}
                        className="w-full min-h-[120px] p-3 border border-input rounded-md bg-background text-foreground"
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={loading || !bulkInput.trim()}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      Mark All as Fed
                    </Button>
                    
                    {/* Bulk results display */}
                    {bulkResults.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Results:</h3>
                        <div className="max-h-60 overflow-y-auto border rounded-md">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left p-2">ID</th>
                                <th className="text-left p-2">Status</th>
                                <th className="text-left p-2">Message</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkResults.map((result, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                                  <td className="p-2 font-mono">{result.id}</td>
                                  <td className="p-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                      result.status === 'success' ? 'bg-green-100 text-green-800' :
                                      result.status === 'already_fed' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {result.status}
                                    </span>
                                  </td>
                                  <td className="p-2">{result.message}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
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