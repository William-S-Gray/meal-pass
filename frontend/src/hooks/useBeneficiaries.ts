import { useState, useEffect, useCallback } from 'react';
import { getBeneficiaries, deleteBeneficiary } from '../lib/api';
import { toast } from './use-toast';

interface Beneficiary {
  id: string;
  uid: string;
  fullName: string;
  gender: string;
  household?: string;
  qrCode: string;
  createdAt: string;
  fedToday?: boolean;
  active?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Simple in-memory cache
const beneficiaryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useBeneficiaries = (initialSearch = '', initialPage = 1, initialLimit = 10) => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [pagination, setPagination] = useState<Pagination>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0
  });

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const loadBeneficiaries = useCallback(async () => {
    try {
      setLoading(true);
      
      // Create cache key
      const cacheKey = `${debouncedSearchTerm}-${pagination.page}-${pagination.limit}`;
      
      // Check cache first
      const cached = beneficiaryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setBeneficiaries(cached.data.data);
        setPagination(cached.data.pagination);
        setLoading(false);
        return;
      }
      
      const result = await getBeneficiaries(debouncedSearchTerm, pagination.page, pagination.limit);
      
      // Cache the result
      beneficiaryCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      setBeneficiaries(result.data);
      setPagination(result.pagination);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load beneficiaries',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, pagination.page, pagination.limit]);

  const deleteBeneficiaryById = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return false;
    }

    try {
      await deleteBeneficiary(id);
      toast({
        title: 'Success',
        description: 'Beneficiary deleted successfully'
      });
      // Refresh the list after deletion
      loadBeneficiaries();
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete beneficiary',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, [loadBeneficiaries]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return {
    beneficiaries,
    loading,
    pagination,
    searchTerm,
    loadBeneficiaries,
    deleteBeneficiaryById,
    handlePageChange,
    handleItemsPerPageChange,
    handleSearch
  };
};