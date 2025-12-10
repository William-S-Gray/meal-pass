import { useEffect, useState, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { getStats } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, Check, QrCode, UserPlus, FileText, LogOut, 
  BarChart, Printer, PlusCircle, TrendingUp, Scan
} from 'lucide-react';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';

// Define the stats type
interface DashboardStats {
  totalEmployees: number;
  fedToday: number;
}

// Define types for WebSocket events
interface FeedingRecordEvent {
  feedingRecord: {
    id: string;
    uniqueId: string;
    employee: {
      name: string;
      department: string;
      uniqueId: string;
    };
    date: string;
    fedAt: string;
    method: string;
    deviceId: string;
    createdAt: string;
    updatedAt: string;
  };
  employee: {
    name: string;
    department: string;
    uniqueId: string;
  };
}

interface FeedingRecordRemovedEvent {
  uniqueId: string;
  date: string;
}

const DashboardComponent = () => {
  const { user, logout, isAdmin, isVolunteer } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ totalEmployees: 0, fedToday: 0 });
  const [notFedToday, setNotFedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats({
        totalEmployees: data.totalEmployees || 0,
        fedToday: data.fedToday || 0
      });
      // Calculate not fed today with proper checks
      const total = data.totalEmployees || 0;
      const fed = data.fedToday || 0;
      setNotFedToday(Math.max(0, total - fed));
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set defaults on error
      setStats({ totalEmployees: 0, fedToday: 0 });
      setNotFedToday(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Handler for stats updates
    const handleStatsUpdate = () => {
      loadStats();
    };

    // Handler for feeding record creation
    const handleFeedingRecordCreated = (data: FeedingRecordEvent) => {
      console.log('Feeding record created:', data);
      // Update stats when a new feeding record is created
      loadStats();
    };

    // Handler for feeding record removal
    const handleFeedingRecordRemoved = (data: FeedingRecordRemovedEvent) => {
      console.log('Feeding record removed:', data);
      // Update stats when a feeding record is removed
      loadStats();
    };

    // Register event listeners
    socket.on('statsUpdated', handleStatsUpdate);
    socket.on('feedingRecordCreated', handleFeedingRecordCreated);
    socket.on('feedingRecordRemoved', handleFeedingRecordRemoved);

    // Cleanup event listeners
    return () => {
      socket.off('statsUpdated', handleStatsUpdate);
      socket.off('feedingRecordCreated', handleFeedingRecordCreated);
      socket.off('feedingRecordRemoved', handleFeedingRecordRemoved);
    };
  }, [socket, loadStats]);

  const handleFedTodayClick = useCallback(() => {
    navigate('/fed-today');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b-2 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Africa Accommodation Providers</h1>
            <p className="text-sm text-muted-foreground">{user?.fullName} • {user?.role}</p>
            {isConnected && (
              <p className="text-xs text-green-500 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Live updates connected
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleLogout} size="sm" className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <BreadcrumbNavigation 
          items={[{ label: 'Home' }]}
        />
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm sm:text-base">Total Employees</span>
              </CardTitle>
              <CardDescription>Registered in system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl sm:text-4xl font-bold">{loading ? '...' : stats.totalEmployees}</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 border-success/50 bg-success/5 cursor-pointer hover:bg-success/10 transition-colors"
            onClick={handleFedTodayClick}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-success" />
                <span className="text-sm sm:text-base">Fed Today</span>
              </CardTitle>
              <CardDescription>Meals distributed today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl sm:text-4xl font-bold text-success">{loading ? '...' : stats.fedToday}</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-warning" />
                <span className="text-sm sm:text-base">Not Fed Today</span>
              </CardTitle>
              <CardDescription>Employees awaiting meals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl sm:text-4xl font-bold text-warning">{loading ? '...' : notFedToday}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Link to="/scan" className="block">
                <Button className="w-full h-20 sm:h-24 flex-col gap-2 text-sm sm:text-base font-semibold" size="lg">
                  <QrCode className="h-6 w-6 sm:h-8 sm:w-8" />
                  Scan QR Code
                </Button>
              </Link>

              <Link to="/scanner-test" className="block">
                <Button variant="secondary" className="w-full h-20 sm:h-24 flex-col gap-2 text-sm sm:text-base font-semibold" size="lg">
                  <Scan className="h-6 w-6 sm:h-8 sm:w-8" />
                  Test Scanner
                </Button>
              </Link>

              {(isAdmin || isVolunteer) && (
                <Link to="/employees/register" className="block">
                  <Button variant="secondary" className="w-full h-20 sm:h-24 flex-col gap-2 text-sm sm:text-base font-semibold" size="lg">
                    <UserPlus className="h-6 w-6 sm:h-8 sm:w-8" />
                    Register Employee
                  </Button>
                </Link>
              )}

              <Link to="/employees" className="block">
                <Button variant="outline" className="w-full h-20 sm:h-24 flex-col gap-2 text-sm sm:text-base font-semibold border-2" size="lg">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                  View Employees
                </Button>
              </Link>

              <Link to="/reports-dashboard" className="block">
                <Button variant="outline" className="w-full h-20 sm:h-24 flex-col gap-2 text-sm sm:text-base font-semibold border-2" size="lg">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                  Reports
                </Button>
              </Link>

              {isAdmin && (
                <Link to="/statistics" className="block">
                  <Button variant="outline" className="w-full h-20 sm:h-24 flex-col gap-2 text-sm sm:text-base font-semibold border-2" size="lg">
                    <BarChart className="h-6 w-6 sm:h-8 sm:w-8" />
                    Statistics
                  </Button>
                </Link>
              )}

              <Link to="/employees" className="block">
                <Button variant="outline" className="w-full h-20 sm:h-24 flex-col gap-2 text-sm sm:text-base font-semibold border-2" size="lg">
                  <Printer className="h-6 w-6 sm:h-8 sm:w-8" />
                  Print Cards
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

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
                <h4 className="font-semibold text-sm sm:text-base">Scan QR Code</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">Use the scanner to mark employees as fed</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Scan className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm sm:text-base">Test Scanner</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">Test QR code and barcode scanning functionality</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm sm:text-base">Register New Employees</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">Add new employees and generate QR codes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm sm:text-base">View Reports</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">Track feeding data and export CSV files</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Printer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm sm:text-base">Print Cards</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">Generate and print employee ID cards</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <BarChart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">View Statistics</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">Analyze trends and feeding patterns</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(DashboardComponent);