import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import CameraScanner from '@/components/CameraScanner';

export default function ScannerTest() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'qr' | 'barcode' | 'both'>('both');

  const handleScanSuccess = (data: string) => {
    setScanResult(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Scanner Test</h1>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} size="sm">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <BreadcrumbNavigation 
          items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Scanner Test' }]}
          backButtonHref="/dashboard"
          backButtonLabel="Back to Dashboard"
        />
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Scanner Test</CardTitle>
              <CardDescription>
                Test the camera scanner functionality for both QR codes and barcodes
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
              
              {/* Scan Result */}
              {scanResult && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Scan Result:</h3>
                  <p className="font-mono break-all">{scanResult}</p>
                  <Button 
                    onClick={() => setScanResult(null)} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Clear Result
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}