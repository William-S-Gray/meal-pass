import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadQRCode as downloadQRCodeApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface DownloadQRButtonProps {
  employeeId: string;
  employeeUid: string;
  fileName?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

export default function DownloadQRButton({
  employeeId,
  employeeUid,
  fileName = `employee-qr-${employeeUid}.png`,
  variant = "outline",
  size = "default",
  className = "",
  disabled = false
}: DownloadQRButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadQRCodeApi(employeeId, employeeUid);
      toast({
        title: 'Success',
        description: 'QR code downloaded successfully'
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to download QR code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Downloading...
        </div>
      ) : (
        <div className="flex items-center">
          <Download className="mr-2 h-4 w-4" />
          Download QR
        </div>
      )}
    </Button>
  );
}