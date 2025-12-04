import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getBeneficiaryByUid, 
  getFeedingRecordsForBeneficiary, 
  updateBeneficiary, 
  downloadQRCode, 
  setManualFeedingStatus, 
  Beneficiary, 
  FeedingRecord 
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Download, Edit, Check, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function BeneficiaryProfile() {
  const { isAdmin } = useAuth();
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [feedHistory, setFeedHistory] = useState<FeedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (uid) {
      loadData(uid);
    }
  }, [uid]);

  const loadData = async (uid: string) => {
    try {
      const [beneficiaryData, historyData] = await Promise.all([
        getBeneficiaryByUid(uid),
        getFeedingRecordsForBeneficiary(uid)
      ]);
      setBeneficiary(beneficiaryData);
      setFeedHistory(historyData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load beneficiary data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    navigate(`/beneficiaries/edit/${beneficiary?.uid}`);
  };

  const handleDownloadQR = async () => {
    if (!beneficiary) return;
    
    try {
      setActionLoading(true);
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
      setActionLoading(false);
    }
  };

  const handleSetFeedingStatus = async (fed: boolean) => {
    if (!beneficiary) return;
    
    try {
      setActionLoading(true);
      const result = await setManualFeedingStatus(beneficiary.uid, fed);
      toast({
        title: 'Success',
        description: result.message
      });
      // Refresh the data to show updated status
      loadData(beneficiary.uid);
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
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Beneficiary not found</p>
        <Button onClick={() => navigate('/beneficiaries')}>Back to List</Button>
      </div>
    );
  }

  // Check if beneficiary was fed today by looking at feed history
  const wasFedToday = feedHistory.some(record => {
    // Parse the date string and create a date object for the record date
    const recordDate = new Date(record.date + 'T00:00:00');
    
    // Get today's date in local timezone
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    
    // Compare date strings directly for accurate comparison
    return record.date === todayDateString;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/beneficiaries">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Beneficiary Details */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{beneficiary.fullName}</CardTitle>
                <CardDescription className="text-lg mt-1">
                  <span className="font-mono font-semibold">{beneficiary.uid}</span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <Button 
                      variant={wasFedToday ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleSetFeedingStatus(true)}
                      title="Mark as fed today"
                      disabled={actionLoading || wasFedToday}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Mark Fed
                    </Button>
                    <Button 
                      variant={!wasFedToday ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleSetFeedingStatus(false)}
                      title="Mark as not fed today"
                      disabled={actionLoading || !wasFedToday}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Mark Not Fed
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={handleEditClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {beneficiary.dob && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="text-base font-medium">{new Date(beneficiary.dob).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="text-base font-medium capitalize">{beneficiary.gender}</p>
                </div>
                {beneficiary.household && (
                  <div>
                    <p className="text-sm text-muted-foreground">Household</p>
                    <p className="text-base font-medium">{beneficiary.household}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={wasFedToday ? "default" : "secondary"}>
                    {wasFedToday ? 'Fed Today' : 'Not Fed Today'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Meals</p>
                  <p className="text-base font-medium">{feedHistory.length}</p>
                </div>
                {feedHistory.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Fed</p>
                    <p className="text-base font-medium">
                      {new Date(feedHistory[0].date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
                <img 
                  src={beneficiary.qrCode} 
                  alt="QR Code" 
                  className="w-48 h-48 border-4 border-white shadow-lg"
                />
                <Button variant="outline" className="w-full" onClick={handleDownloadQR} disabled={actionLoading}>
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download QR Code
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Card
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed History */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Feed History</CardTitle>
            <CardDescription>Record of all meals distributed</CardDescription>
          </CardHeader>
          <CardContent>
            {feedHistory.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No feed records yet</p>
            ) : (
              <div className="border-2 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Scanner</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedHistory.map((record) => (
                      <TableRow key={`feed-record-${record.id}`}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(record.fedAt).toLocaleTimeString()}</TableCell>
                        <TableCell>{record.deviceId}</TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {record.method}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}