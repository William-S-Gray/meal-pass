import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBeneficiaryByUid, updateBeneficiary, Beneficiary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditBeneficiary() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'male' as 'male' | 'female' | 'other',
    household: ''
  });

  useEffect(() => {
    if (uid) {
      loadBeneficiary(uid);
    }
  }, [uid]);

  const loadBeneficiary = async (uid: string) => {
    try {
      const data = await getBeneficiaryByUid(uid);
      if (data) {
        setBeneficiary(data);
        setFormData({
          fullName: data.fullName,
          gender: data.gender as 'male' | 'female' | 'other',
          household: data.household || ''
        });
      } else {
        toast({
          title: 'Error',
          description: 'Beneficiary not found',
          variant: 'destructive'
        });
        navigate('/beneficiaries');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load beneficiary',
        variant: 'destructive'
      });
      navigate('/beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!beneficiary || !formData.fullName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Add validation for beneficiary ID
      if (!beneficiary._id) {
        throw new Error("No ID found for beneficiary.");
      }
      
      await updateBeneficiary(beneficiary._id, formData);
      toast({
        title: 'Success',
        description: 'Beneficiary updated successfully'
      });
      navigate(`/beneficiaries/${uid}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update beneficiary',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={`/beneficiaries/${uid}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Edit Beneficiary</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Edit Beneficiary</CardTitle>
            <CardDescription>Update details for {beneficiary?.uid}</CardDescription>
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
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: 'male' | 'female' | 'other') => setFormData({ ...formData, gender: value })}
                    disabled={saving}
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
                  disabled={saving}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/beneficiaries/${uid}`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}