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
    // Make table responsive with horizontal scrolling on small screens
    <div className="overflow-x-auto w-full rounded-lg border-2">
      <Table className="min-w-[600px] md:min-w-full">
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
            <TableHead className="text-xs sm:text-sm md:text-base">UID</TableHead>
            <TableHead className="text-xs sm:text-sm md:text-base">Name</TableHead>
            <TableHead className="text-xs sm:text-sm md:text-base">Gender</TableHead>
            <TableHead className="text-xs sm:text-sm md:text-base">Status</TableHead>
            <TableHead className="text-right text-xs sm:text-sm md:text-base">Actions</TableHead>
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
              <TableCell className="font-mono font-semibold text-xs sm:text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  {beneficiary.uid}
                </div>
              </TableCell>
              <TableCell className="font-medium text-xs sm:text-sm md:text-base">{beneficiary.fullName}</TableCell>
              <TableCell className="capitalize text-xs sm:text-sm md:text-base">{beneficiary.gender}</TableCell>
              <TableCell>
                <Badge variant={beneficiary.fedToday ? "default" : "outline"} className="text-xs sm:text-sm">
                  {beneficiary.fedToday ? 'Fed Today' : 'Not Fed'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 sm:gap-2">
                  <Link to={`/beneficiaries/${beneficiary.uid}`}>
                    <Button variant="outline" size="sm" className="h-8 px-2 text-xs sm:h-9 sm:px-4 sm:text-sm">
                      <Eye className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">View</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDownloadQR(beneficiary)}
                    disabled={actionLoading[`qr-${beneficiary._id}`] || !beneficiary._id}
                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                  >
                    {actionLoading[`qr-${beneficiary._id}`] ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
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
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        {actionLoading[`feed-${beneficiary._id}`] ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onSetFeedingStatus(beneficiary, false)}
                        title="Mark as not fed today"
                        disabled={actionLoading[`feed-${beneficiary._id}`] || !beneficiary.fedToday || !beneficiary._id}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        {actionLoading[`feed-${beneficiary._id}`] ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
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
                      className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                      {actionLoading[`delete-${beneficiary._id}`] ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
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