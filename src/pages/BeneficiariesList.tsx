import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBeneficiaries, Beneficiary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, QrCode, Eye } from 'lucide-react';

export default function BeneficiariesList() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const loadBeneficiaries = async () => {
    try {
      const data = await getBeneficiaries();
      setBeneficiaries(data);
    } catch (error) {
      console.error('Failed to load beneficiaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter((b) =>
    b.fullName.toLowerCase().includes(search.toLowerCase()) ||
    b.uid.toLowerCase().includes(search.toLowerCase())
  );

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

      <main className="container mx-auto px-4 py-8">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Beneficiaries</CardTitle>
            <CardDescription>View and manage all registered beneficiaries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading beneficiaries...</div>
            ) : filteredBeneficiaries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? 'No beneficiaries found matching your search' : 'No beneficiaries registered yet'}
              </div>
            ) : (
              <div className="border-2 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBeneficiaries.map((beneficiary) => (
                      <TableRow key={beneficiary.id}>
                        <TableCell className="font-mono font-semibold">{beneficiary.uid}</TableCell>
                        <TableCell className="font-medium">{beneficiary.fullName}</TableCell>
                        <TableCell>{new Date(beneficiary.dob).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{beneficiary.gender}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={`/beneficiaries/${beneficiary.uid}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
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
