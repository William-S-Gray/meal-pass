import React, { memo } from 'react';
import { Link } from 'react-router-dom';
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
  Eye, 
  QrCode, 
  Check, 
  X, 
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Beneficiary {
  _id: string;
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

interface BeneficiaryTableProps {
  beneficiaries: Beneficiary[];
  loading: boolean;
  actionLoading: Record<string, boolean>;
  selectedBeneficiaries?: string[];
  onSelectBeneficiary?: (id: string) => void;
  onSelectAll?: () => void;
  showSelection?: boolean;
  onDownloadQR: (beneficiary: Beneficiary) => void;
  onSetFeedingStatus?: (beneficiary: Beneficiary, fed: boolean) => void;
  onDelete?: (id: string, name: string) => void;
  isAdmin?: boolean;
}

const BeneficiaryTableComponent: React.FC<BeneficiaryTableProps> = ({
  beneficiaries,
  loading,
  actionLoading,
  selectedBeneficiaries = [],
  onSelectBeneficiary,
  onSelectAll,
  showSelection = false,
  onDownloadQR,
  onSetFeedingStatus,
  onDelete,
  isAdmin = false
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-muted-foreground">Loading beneficiaries...</span>
      </div>
    );
  }

  if (beneficiaries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No beneficiaries found.</p>
      </div>
    );
  }

  return (
    <div className="border-2 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {showSelection && isAdmin && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedBeneficiaries.length === beneficiaries.length && beneficiaries.length > 0}
                  onChange={onSelectAll}
                  className="h-4 w-4"
                />
              </TableHead>
            )}
            <TableHead>UID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {beneficiaries.map((beneficiary, index) => (
            <TableRow key={`beneficiary-${beneficiary._id || beneficiary.uid || `fallback-${index}`}`}>
              {showSelection && isAdmin && (
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedBeneficiaries.includes(beneficiary._id)}
                    onChange={() => onSelectBeneficiary?.(beneficiary._id)}
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
                    onClick={() => onDownloadQR(beneficiary)}
                    disabled={actionLoading[`qr-${beneficiary._id}`] || !beneficiary._id}
                  >
                    {actionLoading[`qr-${beneficiary._id}`] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="h-4 w-4" />
                    )}
                  </Button>
                  {isAdmin && onSetFeedingStatus && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onSetFeedingStatus(beneficiary, true)}
                        title="Mark as fed today"
                        disabled={actionLoading[`feed-${beneficiary._id}`] || beneficiary.fedToday || !beneficiary._id}
                      >
                        {actionLoading[`feed-${beneficiary._id}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onSetFeedingStatus(beneficiary, false)}
                        title="Mark as not fed today"
                        disabled={actionLoading[`feed-${beneficiary._id}`] || !beneficiary.fedToday || !beneficiary._id}
                      >
                        {actionLoading[`feed-${beneficiary._id}`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </>
                  )}
                  {isAdmin && onDelete && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDelete(beneficiary._id, beneficiary.fullName)}
                      disabled={actionLoading[`delete-${beneficiary._id}`] || !beneficiary._id}
                      title="Delete beneficiary"
                    >
                      {actionLoading[`delete-${beneficiary._id}`] ? (
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
  );
};

// Memoize the component to prevent unnecessary re-renders
export const BeneficiaryTable = memo(BeneficiaryTableComponent, (prevProps, nextProps) => {
  // Custom comparison function to optimize re-renders
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.beneficiaries === nextProps.beneficiaries &&
    prevProps.selectedBeneficiaries === nextProps.selectedBeneficiaries &&
    prevProps.showSelection === nextProps.showSelection &&
    prevProps.isAdmin === nextProps.isAdmin
  );
});