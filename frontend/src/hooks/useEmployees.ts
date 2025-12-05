import { useState, useEffect, useCallback } from 'react';
import { getEmployees, deleteEmployee, Employee, PaginatedEmployees } from '../lib/api';
import { toast } from './use-toast';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Simple in-memory cache
const employeeCache = new Map<string, { data: PaginatedEmployees; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useEmployees = (initialSearch = '', initialPage = 1, initialLimit = 10) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      
      // Create cache key
      const cacheKey = `${debouncedSearchTerm}-${pagination.page}-${pagination.limit}`;
      
      // Check cache first
      const cached = employeeCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setEmployees(cached.data.data);
        setPagination(cached.data.pagination);
        setLoading(false);
        return;
      }
      
      const result = await getEmployees(debouncedSearchTerm, pagination.page, pagination.limit);
      
      // Cache the result
      employeeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      setEmployees(result.data);
      setPagination(result.pagination);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, pagination.page, pagination.limit]);

  const deleteEmployeeById = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return false;
    }

    try {
      await deleteEmployee(id);
      toast({
        title: 'Success',
        description: 'Employee deleted successfully'
      });
      // Refresh the list after deletion
      loadEmployees();
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

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
    employees,
    loading,
    pagination,
    searchTerm,
    loadEmployees,
    deleteEmployeeById,
    handlePageChange,
    handleItemsPerPageChange,
    handleSearch
  };
};