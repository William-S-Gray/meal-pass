import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBeneficiaryByUid, getFeedHistoryForBeneficiary, Beneficiary, FeedRecord } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Edit } from 'lucide-react';

export default function BeneficiaryProfile() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [feedHistory, setFeedHistory] = useState<FeedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid) {
      loadData(uid);
    }
  }, [uid]);

  const loadData = async (uid: string) => {
    try {
      const [beneficiaryData, historyData] = await Promise.all([
        getBeneficiaryByUid(uid),
        getFeedHistoryForBeneficiary(uid)
      ]);
      setBeneficiary(beneficiaryData);
      setFeedHistory(historyData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/beneficiaries">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
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
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="text-base font-medium">{new Date(beneficiary.dob).toLocaleDateString()}</p>
                </div>
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
                {beneficiary.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-base font-medium">{beneficiary.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
                <img 
                  src={beneficiary.qrCode} 
                  alt="QR Code" 
                  className="w-48 h-48 border-4 border-white shadow-lg"
                />
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
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
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell>{record.scannerName}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'ok' ? 'default' : 'secondary'}>
                            {record.status}
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
