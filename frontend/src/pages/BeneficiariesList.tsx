import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { toast } from '../hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ChevronLeft, 
  Search, 
  Eye, 
  QrCode, 
  Check, 
  X, 
  Loader2, 
  RotateCcw,
  ChevronRight,
  Printer
} from 'lucide-react';
import { 
  getBeneficiaries, 
  deleteBeneficiary, 
  downloadQRCode,
  setManualFeedingStatus,
  printBulkCards // Added import for bulk printing
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Beneficiary {
  id: string;
  uid: string;
  fullName: string;
  dob?: string;
  gender: string;
  household?: string;
  qrCode: string;
  createdAt: string;
  fedToday?: boolean;
  active?: boolean;
}

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
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]); // Added state for selected beneficiaries
  const navigate = useNavigate();
  const { socket, isConnected } = useWebSocket();
  const { isAdmin } = useAuth();

  const loadBeneficiaries = async () => {
    try {
      setLoading(true);
      const result = await getBeneficiaries(searchTerm, currentPage, itemsPerPage);
      setBeneficiaries(result.data);
      setTotalItems(result.pagination.total);
      setTotalPages(result.pagination.pages);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load beneficiaries',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Listen for real-time feeding updates
  useEffect(() => {
    if (!socket) return;

    const handleFeedingUpdate = (data: FeedingUpdateData) => {
      console.log('Received feeding update:', data);
      // Update the beneficiary's fedToday status in the list
      setBeneficiaries(prevBeneficiaries => 
        prevBeneficiaries.map(beneficiary => 
          beneficiary.uid === data.uniqueId 
            ? { ...beneficiary, fedToday: true } 
            : beneficiary
        )
      );
      
      // Show a toast notification
      toast({
        title: 'Feeding Update',
        description: `${data.beneficiary.name} has been marked as fed`,
      });
    };

    const handleFeedingRemoved = (data: FeedingRemovedData) => {
      console.log('Received feeding removal:', data);
      // Update the beneficiary's fedToday status in the list
      setBeneficiaries(prevBeneficiaries => 
        prevBeneficiaries.map(beneficiary => 
          beneficiary.uid === data.uniqueId 
            ? { ...beneficiary, fedToday: false } 
            : beneficiary
        )
      );
      
      // Show a toast notification
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [`delete-${id}`]: true }));
      await deleteBeneficiary(id);
      toast({
        title: 'Success',
        description: 'Beneficiary deleted successfully'
      });
      // Refresh the list after deletion
      loadBeneficiaries();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete beneficiary',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[`delete-${id}`];
        return newState;
      });
    }
  };

  const handleDownloadQR = async (beneficiary: Beneficiary) => {
    try {
      setActionLoading(prev => ({ ...prev, [`qr-${beneficiary.id}`]: true }));
      await downloadQRCode(beneficiary.id, beneficiary.uid);
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
        delete newState[`qr-${beneficiary.id}`];
        return newState;
      });
    }
  };

  const handleSetFeedingStatus = async (beneficiary: Beneficiary, fed: boolean) => {
    try {
      setActionLoading(prev => ({ ...prev, [`feed-${beneficiary.id}`]: true }));
      const result = await setManualFeedingStatus(beneficiary.uid, fed);
      toast({
        title: 'Success',
        description: result.message
      });
      // Update the beneficiary status in the list without reloading all data
      setBeneficiaries(prevBeneficiaries => 
        prevBeneficiaries.map(b => 
          b.id === beneficiary.id 
            ? { ...b, fedToday: fed } 
            : b
        )
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update feeding status',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update feeding status',
          variant: 'destructive'
        });
      }
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[`feed-${beneficiary.id}`];
        return newState;
      });
    }
  };

  const handleRefresh = () => {
    loadBeneficiaries();
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
      const pdfBlob = await printBulkCards(selectedBeneficiaries);
      
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
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search beneficiaries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">Loading beneficiaries...</span>
              </div>
            ) : beneficiaries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No beneficiaries found matching your search.' : 'No beneficiaries registered yet.'}
                </p>
                {isAdmin && (
                  <Button 
                    onClick={() => navigate('/beneficiaries/register')} 
                    className="mt-4"
                  >
                    Register New Beneficiary
                  </Button>
                )}
              </div>
            ) : (
              <>
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

                <div className="border-2 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isAdmin && (
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={selectedBeneficiaries.length === beneficiaries.length && beneficiaries.length > 0}
                              onChange={handleSelectAll}
                              className="h-4 w-4"
                            />
                          </TableHead>
                        )}
                        <TableHead>UID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {beneficiaries.map((beneficiary) => (
                        <TableRow key={beneficiary.id}>
                          {isAdmin && (
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedBeneficiaries.includes(beneficiary.id)}
                                onChange={() => handleSelectBeneficiary(beneficiary.id)}
                                className="h-4 w-4"
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-mono font-semibold">
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-muted-foreground" />
                              {beneficiary.uid}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{beneficiary.fullName}</TableCell>
                          <TableCell>{beneficiary.dob ? new Date(beneficiary.dob).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="capitalize">{beneficiary.gender}</TableCell>
                          <TableCell>
                            <Badge variant={beneficiary.fedToday ? "default" : "outline"}>
                              {beneficiary.fedToday ? 'Fed Today' : 'Not Fed'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link to={`/beneficiaries/${beneficiary.uid}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDownloadQR(beneficiary)}
                                disabled={actionLoading[`qr-${beneficiary.id}`]}
                              >
                                {actionLoading[`qr-${beneficiary.id}`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <QrCode className="h-4 w-4" />
                                )}
                              </Button>
                              {isAdmin && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleSetFeedingStatus(beneficiary, true)}
                                    title="Mark as fed today"
                                    disabled={actionLoading[`feed-${beneficiary.id}`] || beneficiary.fedToday}
                                  >
                                    {actionLoading[`feed-${beneficiary.id}`] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4 text-green-500" />
                                    )}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleSetFeedingStatus(beneficiary, false)}
                                    title="Mark as not fed today"
                                    disabled={actionLoading[`feed-${beneficiary.id}`] || !beneficiary.fedToday}
                                  >
                                    {actionLoading[`feed-${beneficiary.id}`] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4 text-red-500" />
                                    )}
                                  </Button>
                                </>
                              )}
                              {isAdmin && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(beneficiary.id, beneficiary.fullName)}
                                  disabled={actionLoading[`delete-${beneficiary.id}`]}
                                  title="Delete beneficiary"
                                >
                                  {actionLoading[`delete-${beneficiary.id}`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-500" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items per page:</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={handleItemsPerPageChange}
                      className="border rounded p-1 text-sm"
                      disabled={loading}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                    </select>
                    <div className="text-sm text-muted-foreground">
                      Showing {Math.min(beneficiaries.length, itemsPerPage * currentPage)} of {totalItems} beneficiaries
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-10 h-10"
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}