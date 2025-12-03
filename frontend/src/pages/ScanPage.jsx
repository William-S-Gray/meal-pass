import React from 'react';
import { Link } from 'react-router-dom';
import Scanner from '@/components/Scanner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ScanPage = () => {
  const handleScanResult = (result) => {
    // Handle scan result if needed
    console.log('Scan result:', result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-primary">QR Code Scanner</h1>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border-2 rounded-xl shadow-sm p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary mb-2">Scan Beneficiary QR Code</h2>
              <p className="text-muted-foreground">
                Point your camera at a beneficiary's QR code to record their meal
              </p>
            </div>

            <div className="mb-6">
              <Scanner onScanResult={handleScanResult} />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>QR codes contain only the beneficiary's unique ID for privacy protection.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScanPage;