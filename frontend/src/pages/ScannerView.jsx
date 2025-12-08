import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { scanQRCode, getEmployeeByUid } from '@/lib/api';
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

export default function ScannerView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState('qr'); // 'qr' or 'barcode'
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const streamRef = useRef(null);
  const quaggaInitialized = useRef(false);
  const lastScanTimeRef = useRef(0);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (quaggaInitialized.current) {
        try {
          Quagga.stop();
        } catch (e) {
          console.warn('Failed to stop Quagga:', e);
        }
        quaggaInitialized.current = false;
      }
    };
  }, []);

  const initQuagga = async () => {
    if (!videoRef.current) return;

    try {
      await new Promise((resolve, reject) => {
        Quagga.init({
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
            reject(err);
            return;
          }
          resolve();
        });
      });

      Quagga.start();
      quaggaInitialized.current = true;

      Quagga.onDetected(handleScanResult);
    } catch (error) {
      console.error("Error initializing Quagga:", error);
      toast({
        title: "Error",
        description: "Failed to initialize barcode scanner",
        variant: "destructive"
      });
    }
  };

  const startScanner = async () => {
    if (!videoRef.current) return;

    try {
      setCameraLoading(true);
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      if (scanMode === 'qr') {
        // Initialize QR scanner
        qrScannerRef.current = new QrScanner(videoRef.current, handleScanResult, {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 2,
        });
        
        await qrScannerRef.current.start();
      } else {
        // Initialize barcode scanner
        await initQuagga();
      }
      
      setScanning(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: error.message || "Failed to access camera. Please check permissions.",
        variant: "destructive"
      });
    } finally {
      setCameraLoading(false);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (quaggaInitialized.current) {
      try {
        Quagga.stop();
      } catch (e) {
        console.warn('Failed to stop Quagga:', e);
      }
      quaggaInitialized.current = false;
    }
    
    setScanning(false);
  };

  const handleScanResult = async (result) => {
    // Debounce scans to prevent multiple rapid scans
    const now = Date.now();
    if (now - lastScanTimeRef.current < 1000) return;
    lastScanTimeRef.current = now;
    
    try {
      // Extract uniqueId from QR code content
      const uniqueId = result.data ? result.data.trim() : result.codeResult.code.trim();
      
      // Send to backend API
      const response = await scanQRCode(uniqueId, 'web-scanner', scanMode === 'qr' ? 'scan' : 'barcode');
      
      // Fetch employee details for display
      let employee = null;
      try {
        employee = await getEmployeeByUid(uniqueId);
      } catch (e) {
        console.warn("Could not fetch employee details:", e);
      }
      
      // Set result based on response
      setScanResult({
        status: response.status,
        message: response.message,
        employee: employee
      });
      
      setShowResult(true);
      
      // Auto-hide result after 3 seconds
      setTimeout(() => {
        setShowResult(false);
      }, 3000);
    } catch (error) {
      setScanResult({
        status: 'error',
        message: error.message || 'Scan failed'
      });
      
      setShowResult(true);
      
      // Auto-hide result after 3 seconds
      setTimeout(() => {
        setShowResult(false);
      }, 3000);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid ID",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Send to backend API
      const response = await scanQRCode(manualInput.trim(), 'web-manual', 'manual');
      
      // Fetch employee details for display
      let employee = null;
      try {
        employee = await getEmployeeByUid(manualInput.trim());
      } catch (e) {
        console.warn("Could not fetch employee details:", e);
      }
      
      // Set result based on response
      setScanResult({
        status: response.status,
        message: response.message,
        employee: employee
      });
      
      setShowResult(true);
      setManualInput('');
      
      // Auto-hide result after 3 seconds
      setTimeout(() => {
        setShowResult(false);
      }, 3000);
    } catch (error) {
      setScanResult({
        status: 'error',
        message: error.message || 'Manual entry failed'
      });
      
      setShowResult(true);
      
      // Auto-hide result after 3 seconds
      setTimeout(() => {
        setShowResult(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">QR Scanner</h1>
              <p className="text-sm text-muted-foreground">
                Scan employee QR codes or enter ID manually
              </p>
              {isConnected && (
                <p className="text-xs text-green-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Live updates connected
                </p>
              )}
            </div>
            <Button onClick={() => navigate('/dashboard')}>
              <Calendar className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Scanner' }]}
          backButtonHref="/dashboard"
          backButtonLabel="Back to Dashboard"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Scan Employee QR Code</CardTitle>
              <CardDescription>
                Position the QR code in the camera view to scan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setScanMode('qr')}
                  variant={scanMode === 'qr' ? 'default' : 'outline'}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code
                </Button>
                <Button
                  onClick={() => setScanMode('barcode')}
                  variant={scanMode === 'barcode' ? 'default' : 'outline'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Barcode
                </Button>
              </div>

              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {scanning ? (
                  <>
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    <Button
                      onClick={stopScanner}
                      variant="destructive"
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                    >
                      <CameraOff className="mr-2 h-4 w-4" />
                      Stop Camera
                    </Button>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Camera is off. Click "Start Camera" to begin scanning.
                    </p>
                    <Button
                      onClick={startScanner}
                      disabled={cameraLoading}
                    >
                      {cameraLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          Start Camera
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Scan Result Overlay */}
              {showResult && scanResult && (
                <div className={`fixed inset-0 flex items-center justify-center z-50 ${
                  scanResult.status === 'success' ? 'bg-green-500/20' : 
                  scanResult.status === 'already_fed' ? 'bg-yellow-500/20' : 
                  'bg-red-500/20'
                }`}>
                  <Card className="max-w-md w-full mx-4 border-2">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        {scanResult.status === 'success' && (
                          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        )}
                        {scanResult.status === 'already_fed' && (
                          <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
                        )}
                        {(scanResult.status === 'not_found' || scanResult.status === 'error') && (
                          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                        )}
                        
                        <h3 className="text-xl font-bold mb-2">
                          {scanResult.status === 'success' && 'Success!'}
                          {scanResult.status === 'already_fed' && 'Already Fed Today'}
                          {scanResult.status === 'not_found' && 'Employee Not Found'}
                          {scanResult.status === 'error' && 'Scan Error'}
                        </h3>
                        
                        <p className="text-muted-foreground mb-4">
                          {scanResult.message}
                        </p>
                        
                        {scanResult.employee && (
                          <div className="bg-muted rounded-lg p-4 mb-4">
                            <h4 className="font-bold">{capitalizeName(scanResult.employee.name)}</h4>
                            <p className="text-sm text-muted-foreground">{scanResult.employee.uniqueId}</p>
                            <p className="text-sm">
                              Valid until: {format(parseISO(scanResult.employee.validUntil), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                        
                        <Button onClick={() => setShowResult(false)}>
                          Continue Scanning
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry Section */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>
                Enter employee ID manually if scanning is not possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter employee ID"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}