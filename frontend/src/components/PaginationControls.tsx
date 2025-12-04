import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  loading: boolean;
  onPageChange: (newPage: number) => void;
  onItemsPerPageChange: (newLimit: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  loading,
  onPageChange,
  onItemsPerPageChange
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      // Show first 5 pages
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      // Show last 5 pages
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page and 2 pages on each side
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Items per page:</span>
        <select 
          value={itemsPerPage} 
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border rounded p-1 text-sm"
          disabled={loading}
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
        <div className="text-sm text-muted-foreground">
          Showing {Math.min(itemsPerPage, totalItems - (currentPage - 1) * itemsPerPage)} of {totalItems} items
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-1">
          {getPageNumbers().map(pageNum => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className="w-10 h-10"
              disabled={loading}
            >
              {pageNum}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};