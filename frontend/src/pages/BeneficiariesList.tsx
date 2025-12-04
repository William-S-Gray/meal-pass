import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { toast } from '../hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronLeft, 
  Search, 
  Loader2, 
  RotateCcw,
  Printer
} from 'lucide-react';
import { 
  downloadQRCode,
  printBulkCards
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useBeneficiaries } from '../hooks/useBeneficiaries';
import { BeneficiaryTable } from '../components/BeneficiaryTable';
import { PaginationControls } from '../components/PaginationControls';

interface FeedingUpdateData {
  uniqueId: string;
  beneficiary: {
    name: string;
    group: string;
    uniqueId: string;
  };
  date: string;
  fedAt: string;
  method: string;
  deviceId: string;
}

interface FeedingRemovedData {
  uniqueId: string;
  date: string;
}

export default function BeneficiariesList() {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const navigate = useNavigate();
  const { socket, isConnected } = useWebSocket();
  const { isAdmin } = useAuth();
  const {
    beneficiaries,
    loading,
    pagination,
    searchTerm,
    handleSearch,
    handlePageChange,
    handleItemsPerPageChange,
    deleteBeneficiaryById
  } = useBeneficiaries();

  // Listen for real-time feeding updates
  React.useEffect(() => {
    if (!socket) return;

    const handleFeedingUpdate = (data: FeedingUpdateData) => {
      console.log('Received feeding update:', data);
      toast({
        title: 'Feeding Update',
        description: `${data.beneficiary.name} has been marked as fed`,
      });
    };

    const handleFeedingRemoved = (data: FeedingRemovedData) => {
      console.log('Received feeding removal:', data);
      toast({
        title: 'Feeding Status Updated',
        description: `Beneficiary has been marked as not fed`,
      });
    };

    socket.on('feedingUpdated', handleFeedingUpdate);
    socket.on('feedingRemoved', handleFeedingRemoved);

    return () => {
      socket.off('feedingUpdated', handleFeedingUpdate);
      socket.off('feedingRemoved', handleFeedingRemoved);
    };
  }, [socket]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDownloadQR = async (beneficiaryId: string, beneficiaryUid: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [`qr-${beneficiaryId}`]: true }));
      await downloadQRCode(beneficiaryId, beneficiaryUid);
      toast({
        title: 'Success',
        description: 'QR code downloaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download QR code',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[`qr-${beneficiaryId}`];
        return newState;
      });
    }
  };

  // Handle checkbox selection for bulk operations
  const handleSelectBeneficiary = (id: string) => {
    setSelectedBeneficiaries(prev => 
      prev.includes(id) 
        ? prev.filter(beneficiaryId => beneficiaryId !== id) 
        : [...prev, id]
    );
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedBeneficiaries.length === beneficiaries.length) {
      setSelectedBeneficiaries([]);
    } else {
      setSelectedBeneficiaries(beneficiaries.map(b => b.id));
    }
  };

  // Handle bulk print
  const handleBulkPrint = async () => {
    if (selectedBeneficiaries.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one beneficiary to print',
        variant: 'destructive'
      });
      return;
    }

    if (selectedBeneficiaries.length > 40) {
      toast({
        title: 'Too Many Selected',
        description: 'You can print a maximum of 40 cards at once',
        variant: 'destructive'
      });
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, 'bulk-print': true }));
      let pdfBlob;
      
      // Retry up to 3 times
      for (let i = 0; i < 3; i++) {
        try {
          pdfBlob = await printBulkCards(selectedBeneficiaries);
          break;
        } catch (error) {
          if (i === 2) throw error; // Last attempt, re-throw
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
      }
      
      // Debugging: Log blob information
      console.log('PDF Blob received:', pdfBlob);
      console.log('PDF Blob size:', pdfBlob.size);
      console.log('PDF Blob type:', pdfBlob.type);
      
      // Check if blob is valid
      if (!pdfBlob.size) {
        throw new Error('Received empty PDF blob');
      }
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beneficiary-cards-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'Bulk print initiated successfully'
      });
    } catch (error) {
      console.error('Error in handleBulkPrint:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate bulk print',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState['bulk-print'];
        return newState;
      });
    }
  };

  const handleRefresh = () => {
    handleSearch(searchTerm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary">Beneficiaries</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
              <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Beneficiary List</CardTitle>
                <CardDescription>Manage registered beneficiaries</CardDescription>
              </div>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search beneficiaries..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 pr-4"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions */}
            {isAdmin && selectedBeneficiaries.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedBeneficiaries.length} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkPrint}
                  disabled={actionLoading['bulk-print']}
                >
                  {actionLoading['bulk-print'] ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4" />
                  )}
                  Print Selected
                </Button>
              </div>
            )}

            <BeneficiaryTable
              beneficiaries={beneficiaries}
              loading={loading}
              actionLoading={actionLoading}
              selectedBeneficiaries={selectedBeneficiaries}
              onSelectBeneficiary={handleSelectBeneficiary}
              onSelectAll={handleSelectAll}
              showSelection={true}
              onDownloadQR={(beneficiary) => handleDownloadQR(beneficiary.id, beneficiary.uid)}
              onSetFeedingStatus={undefined} // We'll handle this in a separate component if needed
              onDelete={isAdmin ? deleteBeneficiaryById : undefined}
              isAdmin={isAdmin}
            />

            <PaginationControls
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              loading={loading}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
