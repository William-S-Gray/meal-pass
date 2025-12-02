import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createBeneficiary, Beneficiary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Download } from 'lucide-react';

export default function RegisterBeneficiary() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdBeneficiary, setCreatedBeneficiary] = useState<Beneficiary | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: 'male' as 'male' | 'female' | 'other',
    household: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.dob) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const beneficiary = await createBeneficiary(formData);
      setCreatedBeneficiary(beneficiary);
      setShowQRModal(true);
      toast({
        title: 'Success',
        description: `Beneficiary ${beneficiary.uid} registered successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register beneficiary',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!createdBeneficiary) return;
    
    // TODO: Implement actual QR code download
    // For now, just show a message
    toast({
      title: 'Download QR',
      description: 'QR code download functionality will be connected to your backend'
    });
  };

  const handleCloseModal = () => {
    setShowQRModal(false);
    navigate('/beneficiaries');
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
            <CardTitle>Register New Beneficiary</CardTitle>
            <CardDescription>Fill in the details to create a new beneficiary record and generate QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: 'male' | 'female' | 'other') => setFormData({ ...formData, gender: value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="household">Household (Optional)</Label>
                <Input
                  id="household"
                  value={formData.household}
                  onChange={(e) => setFormData({ ...formData, household: e.target.value })}
                  placeholder="Family or household identifier"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information..."
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register & Generate QR'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Beneficiary Registered</DialogTitle>
            <DialogDescription>
              QR code generated successfully for {createdBeneficiary?.uid}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-6 bg-muted rounded-lg">
              <img 
                src={createdBeneficiary?.qrCode} 
                alt="QR Code" 
                className="w-48 h-48 border-4 border-white shadow-lg"
              />
              <div className="text-center">
                <p className="text-2xl font-bold">{createdBeneficiary?.uid}</p>
                <p className="text-sm text-muted-foreground">{createdBeneficiary?.fullName}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleDownloadQR} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </Button>
              <Button variant="outline" onClick={handleCloseModal}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
