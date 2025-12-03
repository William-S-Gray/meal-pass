import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getStats } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Check, QrCode, UserPlus, FileText, LogOut, BarChart } from 'lucide-react';

export default function Dashboard() {
  const { user, logout, isAdmin, isVolunteer } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalBeneficiaries: 0, fedToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFedTodayClick = () => {
    navigate('/fed-today');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">MealTrack</h1>
            <p className="text-sm text-muted-foreground">{user?.fullName} • {user?.role}</p>
          </div>
          <Button variant="outline" onClick={logout} size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Total Beneficiaries
              </CardTitle>
              <CardDescription>Registered in system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{loading ? '...' : stats.totalBeneficiaries}</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-success/50 bg-success/5 cursor-pointer hover:bg-success/10 transition-colors"
            onClick={handleFedTodayClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-success" />
                Fed Today
              </CardTitle>
              <CardDescription>Meals distributed today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-success">{loading ? '...' : stats.fedToday}</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/scan" className="block">
            <Button className="w-full h-24 flex-col gap-2 text-base font-semibold" size="lg">
              <QrCode className="h-8 w-8" />
              Scan QR Code
            </Button>
          </Link>

          {(isAdmin || isVolunteer) && (
            <Link to="/beneficiaries/register" className="block">
              <Button variant="secondary" className="w-full h-24 flex-col gap-2 text-base font-semibold" size="lg">
                <UserPlus className="h-8 w-8" />
                Register Beneficiary
              </Button>
            </Link>
          )}

          <Link to="/beneficiaries" className="block">
            <Button variant="outline" className="w-full h-24 flex-col gap-2 text-base font-semibold border-2" size="lg">
              <Users className="h-8 w-8" />
              View Beneficiaries
            </Button>
          </Link>

          <Link to="/reports" className="block">
            <Button variant="outline" className="w-full h-24 flex-col gap-2 text-base font-semibold border-2" size="lg">
              <FileText className="h-8 w-8" />
              Reports
            </Button>
          </Link>

          {isAdmin && (
            <Link to="/statistics" className="block">
              <Button variant="outline" className="w-full h-24 flex-col gap-2 text-base font-semibold border-2" size="lg">
                <BarChart className="h-8 w-8" />
                Statistics
              </Button>
            </Link>
          )}
        </div>

        {/* Quick Info */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Quick Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Scan QR Code</h4>
                <p className="text-sm text-muted-foreground">Use the scanner to mark beneficiaries as fed</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Register New Beneficiaries</h4>
                <p className="text-sm text-muted-foreground">Add new beneficiaries and generate QR codes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">View Reports</h4>
                <p className="text-sm text-muted-foreground">Track feeding data and export CSV files</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <BarChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">View Statistics</h4>
                  <p className="text-sm text-muted-foreground">Analyze feeding trends and patterns</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}