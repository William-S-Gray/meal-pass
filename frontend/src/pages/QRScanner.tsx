import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { scanQRCode, getBeneficiaryByUid, Beneficiary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';

export default function QRScanner() {
  const { user, isAdmin } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [uniqueId, setUniqueId] = useState('');
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'already_fed' | 'not_found' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const uniqueIdRef = useRef<HTMLInputElement>(null);

  // Handle manual entry submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniqueId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid Unique ID',
        variant: 'destructive'
      });
      return;
    }
    
    await processScan(uniqueId.trim());
  };

  // Process the scanned or entered unique ID
  const processScan = async (uid: string) => {
    try {
      setLoading(true);
      
      // Call the new API endpoint
      const result = await scanQRCode(uid);
      setScanResult(result);
      
      // Fetch beneficiary details for display
      const beneficiaryData = await getBeneficiaryByUid(uid);
      setBeneficiary(beneficiaryData);
      
      // Show appropriate toast message
      if (result.status === 'success') {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'default'
        });
      } else if (result.status === 'already_fed') {
        toast({
          title: 'Already Fed',
          description: result.message,
          variant: 'destructive'
        });
      } else if (result.status === 'not_found') {
        toast({
          title: 'Not Found',
          description: result.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process scan',
        variant: 'destructive'
      });
      setScanResult({
        status: 'error',
        message: 'Failed to process scan'
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset the scanner state
  const resetScanner = () => {
    setScanning(false);
    setManualEntry(false);
    setBeneficiary(null);
    setUniqueId('');
    setScanResult(null);
  };

  // Focus the input when manual entry is opened
  const openManualEntry = () => {
    setManualEntry(true);
    setTimeout(() => {
      if (uniqueIdRef.current) {
        uniqueIdRef.current.focus();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>QR Code Scanner</CardTitle>
            <CardDescription>Scan beneficiary QR codes to mark meals as distributed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!scanning && !manualEntry && !scanResult && (
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-primary" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                  <Button onClick={() => setScanning(true)} size="lg" className="text-lg px-8 py-6 flex-1">
                    <Camera className="mr-2 h-6 w-6" />
                    Start Scanning
                  </Button>
                  <Button onClick={openManualEntry} variant="outline" size="lg" className="text-lg px-8 py-6 flex-1">
                    <Search className="mr-2 h-6 w-6" />
                    Manual Entry
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan QR codes or enter Unique ID manually
                </p>
              </div>
            )}

            {scanning && (
              <div className="space-y-4">
                <div className="aspect-square bg-black rounded-lg flex items-center justify-center">
                  <p className="text-white">
                    {/* TODO: Replace with actual camera feed */}
                    Camera view will appear here when integrated with QR scanner library
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={resetScanner} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  {/* For demo purposes - remove in production */}
                  <Button onClick={() => processScan('BNF-0001')} className="flex-1">
                    Simulate Scan (Demo)
                  </Button>
                </div>
              </div>
            )}

            {manualEntry && !scanResult && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="uniqueId">Beneficiary Unique ID</Label>
                  <Input
                    ref={uniqueIdRef}
                    id="uniqueId"
                    placeholder="Enter Unique ID (e.g., BNF-0001)"
                    value={uniqueId}
                    onChange={(e) => setUniqueId(e.target.value)}
                    className="text-lg py-6"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={resetScanner} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleManualSubmit} className="flex-1" disabled={loading}>
                    {loading ? 'Processing...' : 'Submit'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Result Dialog */}
      <Dialog open={!!scanResult} onOpenChange={(open) => !open && resetScanner()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {scanResult?.status === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  Success
                </>
              ) : scanResult?.status === 'already_fed' ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Already Fed Today
                </>
              ) : scanResult?.status === 'not_found' ? (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Beneficiary Not Found
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Error
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {scanResult?.message}
            </DialogDescription>
          </DialogHeader>
          
          {beneficiary && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">UID:</span>
                  <span className="font-mono font-semibold">{beneficiary.uid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="font-medium">{beneficiary.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={scanResult?.status === 'success' ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                    {scanResult?.status === 'success' ? 'Fed Successfully' : 
                     scanResult?.status === 'already_fed' ? 'Already Fed Today' :
                     scanResult?.status === 'not_found' ? 'Not Found' : 'Error'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={resetScanner} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
          
          {!beneficiary && scanResult?.status === 'not_found' && (
            <div className="flex gap-3">
              <Button onClick={resetScanner} className="flex-1">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}