import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditEmployeeTest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading test page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Edit Employee Test Page</CardTitle>
            <CardDescription>Simple test page to verify routing and display</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                This is a simple test page to verify that the employee edit route is working correctly.
              </p>
              <p className="text-sm">
                Employee ID: <span className="font-mono bg-muted px-2 py-1 rounded">{id}</span>
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate(-1)}>Go Back</Button>
                <Button variant="outline" onClick={() => navigate('/employees')}>Employee List</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}