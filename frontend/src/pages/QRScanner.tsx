import { useState } from 'react';
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
import { format, parseISO, isBefore } from 'date-fns';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { capitalizeName } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import CameraScanner from '@/components/CameraScanner';

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
          {employee.qrCodeUrl ? (
            <img 
              src={employee.qrCodeUrl} 
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
      <div className="text-center mt-2">
        <p className="text-sm font-bold">{employee.uniqueId}</p>
        <p className="text-xs">{capitalizeName(employee.name)}</p>
      </div>
    </div>
  );
};

export default function QRScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const { toast } = useToast();
  const [scanMode, setScanMode] = useState<'qr' | 'barcode' | 'both'>('both');
  const [manualInput, setManualInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkResults, setBulkResults] = useState<Array<{id: string, status: string, message: string, employee?: Employee}>>([]);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'already_fed' | 'not_found' | 'error' | 'expired';
    message: string;
    employee?: Employee;
  } | null>(null);

  const handleScanSuccess = async (uniqueId: string) => {
    if (!uniqueId) return;

    setLoading(true);

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

      // Process the scan
      const response = await scanQRCode(uniqueId, 'web-scanner', 'scan');
      
      setScanResult({
        status: response.status as 'success' | 'already_fed' | 'not_found' | 'error',
        message: response.message,
        employee: employee
      });
      
      setShowResult(true);
    } catch (error) {
      console.error('Scan processing error:', error);
      setScanResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to process scan'
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
      const response = await scanQRCode(manualInput.trim(), 'manual-entry', 'manual');
      
      // Get employee details for display
      let employee = null;
      try {
        employee = await getEmployeeByUid(manualInput.trim());
      } catch (e) {
        console.warn("Could not fetch employee details:", e);
      }
      
      setScanResult({
        status: response.status as 'success' | 'already_fed' | 'not_found' | 'error',
        message: response.message,
        employee: employee || undefined
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

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    setLoading(true);
    const ids = bulkInput.split('\n').filter(id => id.trim()).map(id => id.trim());
    const results = [];

    try {
      for (const id of ids) {
        try {
          const response = await scanQRCode(id, 'bulk-entry', 'manual');
          
          // Get employee details for display
          let employee = null;
          try {
            employee = await getEmployeeByUid(id);
          } catch (e) {
            console.warn("Could not fetch employee details:", e);
          }
          
          results.push({
            id,
            status: response.status,
            message: response.message,
            employee: employee || undefined
          });
        } catch (error) {
          results.push({
            id,
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to process'
          });
        }
      }
      
      setBulkResults(results);
    } catch (error) {
      toast({
        title: 'Bulk Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process bulk entries',
        variant: 'destructive'
      });
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
              <CardTitle>Scan Employee Code</CardTitle>
              <CardDescription>
                Point your camera at an employee's QR code or barcode to mark them as fed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scan Mode Selection */}
              <div className="flex rounded-md overflow-hidden border">
                <Button
                  variant={scanMode === 'qr' ? 'default' : 'outline'}
                  onClick={() => setScanMode('qr')}
                  className="flex-1 rounded-none"
                >
                  QR Code
                </Button>
                <Button
                  variant={scanMode === 'barcode' ? 'default' : 'outline'}
                  onClick={() => setScanMode('barcode')}
                  className="flex-1 rounded-none"
                >
                  Barcode
                </Button>
                <Button
                  variant={scanMode === 'both' ? 'default' : 'outline'}
                  onClick={() => setScanMode('both')}
                  className="flex-1 rounded-none"
                >
                  Both
                </Button>
              </div>
              
              {/* Camera Scanner Component */}
              <div className="space-y-4">
                <CameraScanner 
                  onScanSuccess={handleScanSuccess} 
                  scanMode={scanMode}
                />
              </div>
              
              {/* Manual Entry */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Manual Entry</h3>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="manual-input">Employee ID</Label>
                    <Input
                      id="manual-input"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Enter employee unique ID"
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" disabled={loading || !manualInput.trim()}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        Mark as Fed
                      </>
                    )}
                  </Button>
                </form>
              </div>
              
              {/* Bulk Entry */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Bulk Entry</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsBulkMode(!isBulkMode)}
                  >
                    {isBulkMode ? 'Cancel' : 'Bulk Mark'}
                  </Button>
                </div>
                
                {isBulkMode && (
                  <form onSubmit={handleBulkSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="bulk-input">Employee IDs (one per line)</Label>
                      <textarea
                        id="bulk-input"
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder="Enter employee IDs, one per line&#10;EMP001&#10;EMP002&#10;EMP003"
                        className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                        disabled={loading}
                      />
                    </div>
                    <Button type="submit" disabled={loading || !bulkInput.trim()}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <User className="mr-2 h-4 w-4" />
                          Mark All as Fed
                        </>
                      )}
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
                  </form>
                )}
              </div>
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