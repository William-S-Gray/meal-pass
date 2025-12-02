import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { checkIfFedToday, createFeedRecord, getBeneficiaryByUid, overrideFeed, Beneficiary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, CheckCircle, AlertTriangle } from 'lucide-react';

export default function QRScanner() {
  const { user, isAdmin } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [alreadyFed, setAlreadyFed] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // TODO: Integrate with actual QR scanner library (e.g., html5-qrcode, react-qr-scanner)
  // For now, this is a mock interface
  const handleStartScan = () => {
    setScanning(true);
    toast({
      title: 'Scanner Ready',
      description: 'Point camera at QR code to scan'
    });
  };

  const handleStopScan = () => {
    setScanning(false);
    setBeneficiary(null);
    setAlreadyFed(false);
    setShowResult(false);
  };

  // This would be called by your QR scanner library when a code is detected
  const handleQRCodeScanned = async (uid: string) => {
    try {
      setScanning(false);
      
      // Fetch beneficiary details
      const beneficiaryData = await getBeneficiaryByUid(uid);
      if (!beneficiaryData) {
        toast({
          title: 'Error',
          description: 'Beneficiary not found',
          variant: 'destructive'
        });
        return;
      }

      setBeneficiary(beneficiaryData);

      // Check if already fed today
      const fedToday = await checkIfFedToday(uid);
      setAlreadyFed(fedToday);
      setShowResult(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process QR code',
        variant: 'destructive'
      });
      handleStopScan();
    }
  };

  const handleMarkAsFed = async () => {
    if (!beneficiary || !user) return;

    try {
      await createFeedRecord(beneficiary.uid, user.id);
      toast({
        title: 'Success',
        description: `${beneficiary.fullName} marked as fed`,
        variant: 'default'
      });
      handleStopScan();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark as fed',
        variant: 'destructive'
      });
    }
  };

  const handleOverride = async () => {
    if (!beneficiary || !user) return;

    try {
      const reason = prompt('Enter reason for override:');
      if (!reason) return;

      await overrideFeed(beneficiary.uid, user.id, reason);
      toast({
        title: 'Success',
        description: `Override recorded for ${beneficiary.fullName}`,
        variant: 'default'
      });
      handleStopScan();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to override',
        variant: 'destructive'
      });
    }
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
            {!scanning && !showResult && (
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-primary" />
                </div>
                <Button onClick={handleStartScan} size="lg" className="text-lg px-8 py-6">
                  <Camera className="mr-2 h-6 w-6" />
                  Start Scanning
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Click to activate camera and scan QR codes
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
                  <Button onClick={handleStopScan} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  {/* For demo purposes - remove in production */}
                  <Button onClick={() => handleQRCodeScanned('BNF-0001')} className="flex-1">
                    Simulate Scan (Demo)
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {alreadyFed ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Already Fed Today
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  Ready to Feed
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Beneficiary: {beneficiary?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">UID:</span>
                <span className="font-mono font-semibold">{beneficiary?.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="font-medium">{beneficiary?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={alreadyFed ? 'text-destructive font-semibold' : 'text-success font-semibold'}>
                  {alreadyFed ? 'Already Fed' : 'Not Fed'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {!alreadyFed ? (
                <Button onClick={handleMarkAsFed} className="flex-1 bg-success hover:bg-success/90">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Fed
                </Button>
              ) : isAdmin ? (
                <Button onClick={handleOverride} variant="destructive" className="flex-1">
                  Override Feed
                </Button>
              ) : null}
              <Button onClick={handleStopScan} variant="outline">
                {alreadyFed && !isAdmin ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
