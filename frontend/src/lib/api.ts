// API Service Layer - Backend Integration Points

import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // Disable credentials for CORS
});

// Add a request interceptor to add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Simple in-memory cache for GET requests
const apiCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'volunteer' | 'reporter';
}

// Internal interface for storing user with token
interface UserWithToken extends User {
  token: string;
}

export interface Beneficiary {
  _id: string;  // Changed from 'id' to '_id' to match backend
  uid: string; // BNF-XXXX format
  fullName: string;
  gender: 'male' | 'female' | 'other';
  household?: string;
  qrCode: string;
  createdAt: string;
  fedToday?: boolean; // Add fedToday property
  active?: boolean; // Add active property
  dob?: string; // Add dob property
}

// Response interface for QR scan
export interface QRScanResponse {
  status: 'success' | 'already_fed' | 'not_found' | 'error';
  message: string;
}

// Interface for feeding records
export interface FeedingRecord {
  id: string;
  uniqueId: string;
  beneficiary: {
    name: string;
    group: string;
    uniqueId: string;
  };
  date: string; // YYYY-MM-DD
  fedAt: string; // ISO timestamp
  method: 'scan' | 'manual';
  deviceId: string;
}

// Interface for feed records (used in reports)
export interface FeedRecord {
  id: string;
  beneficiaryUid: string;
  beneficiaryName: string;
  date: string;
  time: string;
  scannerName: string;
  status: 'ok' | 'duplicate';
}

// Interface for backend feeding record
interface BackendFeedingRecord {
  _id: string;
  uniqueId: string;
  beneficiary: {
    name: string;
    group: string;
    uniqueId: string;
  };
  date: string; // YYYY-MM-DD
  fedAt: string; // ISO timestamp
  method: 'scan' | 'manual';
  deviceId: string;
}

// Interface for backend feed log
interface BackendFeedLog {
  _id: string;
  beneficiaryId?: {
    uniqueId: string;
    name: string;
  };
  uniqueId: string;
  fedAt: string;
  servedBy: string;
}

// Interface for report statistics
export interface ReportStatistics {
  totalBeneficiaries: number;
  totalFedToday: number;
  feedRate: number;
  weeklyStats: Array<{
    date: string;
    count: number;
  }>;
  monthlyStats: Array<{
    date: string;
    count: number;
  }>;
}

// Interface for paginated reports
export interface PaginatedReport<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Helper function to handle API errors
const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data.error || `HTTP error! status: ${error.response.status}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - no response received');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }
  } else {
    // Non-Axios error
    throw new Error('Unknown error occurred');
  }
};

// Wrapper for GET requests with caching
const cachedGet = async <T>(url: string): Promise<T> => {
  // Check cache first
  const cached = apiCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }

  // If not in cache or expired, make the request
  try {
    const response = await apiClient.get<T>(url);
    // Cache the result
    apiCache.set(url, { data: response.data, timestamp: Date.now() });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Wrapper for POST requests that clears relevant cache
const postWithCacheClear = async <T>(url: string, data?: unknown): Promise<T> => {
  try {
    const response = await apiClient.post<T>(url, data);
    // Clear cache for related GET requests
    apiCache.clear();
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Wrapper for PUT requests that clears relevant cache
const putWithCacheClear = async <T>(url: string, data?: unknown): Promise<T> => {
  try {
    const response = await apiClient.put<T>(url, data);
    // Clear cache for related GET requests
    apiCache.clear();
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Wrapper for DELETE requests that clears relevant cache
const deleteWithCacheClear = async <T>(url: string): Promise<T> => {
  try {
    const response = await apiClient.delete<T>(url);
    // Clear cache for related GET requests
    apiCache.clear();
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ============ AUTH FUNCTIONS ============
export async function loginUser(email: string, password: string): Promise<User> {
  try {
    const response = await postWithCacheClear<{ data: { admin: { id: string; email: string; name: string; role?: string }; token: string } }>('/api/auth/login', { email, password });
    const data = response;
    
    // Store user with token in localStorage
    const userWithToken: UserWithToken = {
      id: data.data.admin.id,
      email: data.data.admin.email,
      fullName: data.data.admin.name,
      role: (data.data.admin.role as 'admin' | 'volunteer' | 'reporter') || 'admin', // Default to admin if no role provided
      token: data.data.token
    };
    
    localStorage.setItem('user', JSON.stringify(userWithToken));
    
    // Return user without token
    return {
      id: data.data.admin.id,
      email: data.data.admin.email,
      fullName: data.data.admin.name,
      role: (data.data.admin.role as 'admin' | 'volunteer' | 'reporter') || 'admin'
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// ============ BENEFICIARY FUNCTIONS ============

export async function createBeneficiary(data: Omit<Beneficiary, '_id' | 'uid' | 'qrCode' | 'createdAt' | 'notes'>): Promise<Beneficiary> {
  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('name', data.fullName);
    formData.append('gender', data.gender);
    formData.append('group', data.household || '');
    
    // Log the data being sent for debugging
    console.log('Sending beneficiary data:', {
      name: data.fullName,
      gender: data.gender,
      group: data.household || ''
    });
    
    // Notes field is not in backend model, so we exclude it
    
    const response = await postWithCacheClear<{ 
      success: boolean; 
      _id: string; 
      data: { 
        _id: string; 
        uniqueId: string; 
        name: string; 
        gender: string; 
        group?: string; 
        qrCodeUrl: string; 
        createdAt: string; 
        fedToday?: boolean; 
        active?: boolean 
      } 
    }>('/api/beneficiaries', formData);
    
    const result = response.data;
    
    // Map backend response to frontend interface
    return {
      _id: result._id,
      uid: result.uniqueId,
      fullName: result.name,
      gender: result.gender.toLowerCase() as 'male' | 'female' | 'other',
      household: result.group || '',
      qrCode: result.qrCodeUrl.startsWith('http') ? result.qrCodeUrl : `${apiClient.defaults.baseURL}${result.qrCodeUrl}`,
      createdAt: result.createdAt,
      fedToday: result.fedToday || false,
      active: result.active !== undefined ? result.active : true
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// Update the Beneficiary interface to include pagination info
export interface PaginatedBeneficiaries {
  data: Beneficiary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getBeneficiaries(search?: string, page: number = 1, limit: number = 10): Promise<PaginatedBeneficiaries> {
  try {
    let url = `/api/beneficiaries?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    const response = await cachedGet<{ data: { _id: string; uniqueId: string; name: string; gender: string; group?: string; qrCodeUrl: string; createdAt: string; fedToday?: boolean; active?: boolean }[]; pagination: { page: number; limit: number; total: number; pages: number } }>(url);
    const result = response;
    
    // Map backend response to frontend interface
    const beneficiaries = result.data.map((item) => ({
      _id: item._id,
      uid: item.uniqueId,
      fullName: item.name,
      gender: item.gender.toLowerCase() as 'male' | 'female' | 'other',
      household: item.group || '',
      qrCode: item.qrCodeUrl.startsWith('http') ? item.qrCodeUrl : `${apiClient.defaults.baseURL}${item.qrCodeUrl}`,
      createdAt: item.createdAt,
      fedToday: item.fedToday || false,
      active: item.active !== undefined ? item.active : true
    }));
    
    return {
      data: beneficiaries,
      pagination: result.pagination
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function getBeneficiaryByUid(uid: string): Promise<Beneficiary | null> {
  try {
    const response = await cachedGet<{ data: { _id: string; uniqueId: string; name: string; gender: string; group?: string; qrCodeUrl: string; createdAt: string; active?: boolean; fedToday?: boolean } }>(`/api/beneficiaries/uid/${uid}`);
    
    // If beneficiary not found, return null
    if ((response as unknown as { status: number }).status === 404) {
      return null;
    }
    
    const result = response;
    
    // Map backend response to frontend interface
    return {
      _id: result.data._id,
      uid: result.data.uniqueId,
      fullName: result.data.name,
      gender: result.data.gender.toLowerCase() as 'male' | 'female' | 'other',
      household: result.data.group || '',
      qrCode: result.data.qrCodeUrl.startsWith('http') ? result.data.qrCodeUrl : `${apiClient.defaults.baseURL}${result.data.qrCodeUrl}`,
      createdAt: result.data.createdAt,
      fedToday: result.data.fedToday || false,
      active: result.data.active !== undefined ? result.data.active : true
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
      return null;
    }
    console.error('Failed to fetch beneficiary by UID:', error);
    return null;
  }
}

export async function updateBeneficiary(id: string, data: Partial<Beneficiary>): Promise<Beneficiary> {
  try {
    const formData = new FormData();
    
    if (data.fullName !== undefined) formData.append('name', data.fullName);
    if (data.gender !== undefined) formData.append('gender', data.gender);
    if (data.household !== undefined) formData.append('group', data.household);
    
    const response = await putWithCacheClear<{ data: { _id: string; uniqueId: string; name: string; gender: string; group?: string; qrCodeUrl: string; createdAt: string; active?: boolean } }>(`/api/beneficiaries/${id}`, formData);
    const result = response;
    
    // Map backend response to frontend interface
    return {
      _id: result.data._id,
      uid: result.data.uniqueId,
      fullName: result.data.name,
      gender: result.data.gender.toLowerCase() as 'male' | 'female' | 'other',
      household: result.data.group || '',
      qrCode: result.data.qrCodeUrl.startsWith('http') ? result.data.qrCodeUrl : `${apiClient.defaults.baseURL}${result.data.qrCodeUrl}`,
      createdAt: result.data.createdAt,
      active: result.data.active !== undefined ? result.data.active : true
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function deleteBeneficiary(id: string): Promise<void> {
  try {
    await deleteWithCacheClear(`/api/beneficiaries/${id}`);
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// ============ PRINTING FUNCTIONS ============
export async function printBulkCards(beneficiaryIds: string[]): Promise<Blob> {
  try {
    const response = await apiClient.post('/api/beneficiaries/print-cards', { beneficiaryIds }, {
      responseType: 'blob',
      timeout: 60000 // Increase timeout for PDF generation
    });
    
    // Validate response
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error(`Expected PDF response but got ${contentType}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in printBulkCards:', error);
    handleApiError(error);
    throw error;
  }
}

export async function printSingleCard(beneficiaryId: string): Promise<Blob> {
  try {
    const response = await apiClient.get(`/api/beneficiaries/${beneficiaryId}/print-card`, {
      responseType: 'blob',
      timeout: 60000 // Increase timeout for PDF generation
    });
    
    // Validate response
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error(`Expected PDF response but got ${contentType}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in printSingleCard:', error);
    handleApiError(error);
    throw error;
  }
}

// ============ QR CODE FUNCTIONS ============
export async function downloadQRCode(beneficiaryId: string, beneficiaryUid: string): Promise<void> {
  try {
    const response = await apiClient.get(`/api/beneficiaries/${beneficiaryId}/qrcode`, {
      responseType: 'blob'
    });
    
    // Create blob from response
    const blob = response.data;
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beneficiary-qr-${beneficiaryUid}.png`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// ============ FEEDING FUNCTIONS ============

export async function getTodayFeedingRecords(): Promise<FeedingRecord[]> {
  try {
    const response = await cachedGet<{ data: BackendFeedingRecord[] }>(`/api/feeding/today`);
    const result = response;
    
    return result.data.map((item) => ({
      id: item._id,
      uniqueId: item.uniqueId,
      beneficiary: item.beneficiary,
      date: item.date,
      fedAt: item.fedAt,
      method: item.method,
      deviceId: item.deviceId
    }));
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function getFeedingRecordsForBeneficiary(uniqueId: string): Promise<FeedingRecord[]> {
  try {
    const response = await cachedGet<{ data: BackendFeedingRecord[] }>(`/api/feeding/beneficiary/${uniqueId}`);
    const result = response;
    
    return result.data.map((item) => ({
      id: item._id,
      uniqueId: item.uniqueId,
      beneficiary: item.beneficiary,
      date: item.date,
      fedAt: item.fedAt,
      method: item.method,
      deviceId: item.deviceId
    }));
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function scanQRCode(uniqueId: string, deviceId: string, method: 'scan' | 'manual'): Promise<QRScanResponse> {
  try {
    const response = await postWithCacheClear<{ status: string; message: string }>('/api/feeding/scan', { uniqueId, deviceId, method });
    return {
      status: response.status as 'success' | 'already_fed' | 'not_found' | 'error',
      message: response.message
    };
  } catch (error) {
    // For this specific endpoint, we don't want to throw an error for business logic responses
    // We'll handle different status codes appropriately
    if (axios.isAxiosError(error)) {
      // Handle specific error cases
      if (error.response?.status === 400) {
        // This is likely a "Beneficiary already fed today" error
        return {
          status: 'already_fed',
          message: error.response.data?.message || 'Beneficiary already fed today'
        };
      } else if (error.response?.status === 404) {
        // This is likely a "Beneficiary not found" error
        return {
          status: 'not_found',
          message: error.response.data?.message || 'Beneficiary not found'
        };
      }
    }
    
    // Re-throw other errors
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function setManualFeedingStatus(uniqueId: string, fed: boolean): Promise<QRScanResponse> {
  // For setting fed status to true, we use the scan endpoint with method 'manual'
  // For setting fed status to false, we use the remove feeding record endpoint
  const deviceId = 'manual-admin'; // Default device ID for admin actions
  
  if (fed) {
    // Mark as fed
    return scanQRCode(uniqueId, deviceId, 'manual');
  } else {
    // Remove feeding status
    return removeFeedingStatus(uniqueId);
  }
}

export async function removeFeedingStatus(uniqueId: string): Promise<QRScanResponse> {
  try {
    const response = await deleteWithCacheClear<{ status: string; message: string }>(`/api/feeding/record/${uniqueId}`);
    return {
      status: response.status as 'success' | 'already_fed' | 'not_found' | 'error',
      message: response.message
    };
  } catch (error) {
    // For this specific endpoint, we don't want to throw an error for business logic responses
    // We'll handle different status codes appropriately
    if (axios.isAxiosError(error) && error.response && error.response.status !== 400 && error.response.status !== 404) {
      handleApiError(error);
    }
    throw error; // Re-throw to maintain existing error handling
  }
}

// ============ REPORTING FUNCTIONS ============
export async function getDailyReport(page: number = 1, limit: number = 50): Promise<PaginatedReport<FeedRecord>> {
  try {
    const response = await cachedGet<{ data: BackendFeedLog[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/api/reports/today?page=${page}&limit=${limit}`);
    const result = response;
    
    // Map the backend response to the FeedRecord interface expected by the frontend
    const feedRecords = result.data.map((item) => ({
      id: item._id,
      beneficiaryUid: item.beneficiaryId?.uniqueId || item.uniqueId,
      beneficiaryName: item.beneficiaryId?.name || 'Unknown',
      date: item.fedAt ? new Date(item.fedAt).toISOString().split('T')[0] : '',
      time: item.fedAt ? new Date(item.fedAt).toTimeString().split(' ')[0] : '',
      scannerName: item.servedBy || 'Unknown',
      status: 'ok' as const // Assuming all records are valid
    }));
    
    return {
      data: feedRecords,
      pagination: result.pagination
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function getDateRangeReport(from: string, to: string, page: number = 1, limit: number = 50): Promise<PaginatedReport<FeedRecord>> {
  try {
    const response = await cachedGet<{ data: BackendFeedLog[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/api/reports/date-range?from=${from}&to=${to}&page=${page}&limit=${limit}`);
    const result = response;
    
    // Map the backend response to the FeedRecord interface expected by the frontend
    const feedRecords = result.data.map((item) => ({
      id: item._id,
      beneficiaryUid: item.beneficiaryId?.uniqueId || item.uniqueId,
      beneficiaryName: item.beneficiaryId?.name || 'Unknown',
      date: item.fedAt ? new Date(item.fedAt).toISOString().split('T')[0] : '',
      time: item.fedAt ? new Date(item.fedAt).toTimeString().split(' ')[0] : '',
      scannerName: item.servedBy || 'Unknown',
      status: 'ok' as const // Assuming all records are valid
    }));
    
    return {
      data: feedRecords,
      pagination: result.pagination
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

interface BeneficiaryReportData {
  data: {
    beneficiary: {
      id: string;
      uniqueId: string;
      name: string;
      gender: string;
      group: string;
    };
    feedLogs: Array<{
      _id: string;
      fedAt: string;
      servedBy: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export async function getBeneficiaryReport(uniqueId: string, page: number = 1, limit: number = 50): Promise<BeneficiaryReportData> {
  try {
    const response = await cachedGet<BeneficiaryReportData>(`/api/reports/beneficiary/${uniqueId}?page=${page}&limit=${limit}`);
    return response;
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function getReportStatistics(): Promise<ReportStatistics> {
  try {
    const response = await cachedGet<{ data: ReportStatistics }>('/api/reports/statistics');
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// ============ AUTH FUNCTIONS (continued) ============
export async function logoutUser(): Promise<void> {
  // In a real app, this would invalidate the session/token
  return Promise.resolve();
}

export async function getCurrentUser(): Promise<User | null> {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user: UserWithToken = JSON.parse(storedUser);
      // Check if token exists and is valid (not expired)
      if (user && user.token) {
        // Verify token is not expired by checking its structure
        try {
          const payload = JSON.parse(atob(user.token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          // Check if token is expired
          if (payload.exp && payload.exp > currentTime) {
            return {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              role: user.role || 'admin' // Default to admin if no role provided
            };
          } else {
            // Token expired, remove it
            localStorage.removeItem('user');
          }
        } catch (tokenError) {
          // Invalid token format, remove it
          localStorage.removeItem('user');
        }
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      // Clear invalid user data
      localStorage.removeItem('user');
    }
  }
  return null;
}

// ============ STATS FUNCTIONS ============
export async function getStats(): Promise<{
  totalBeneficiaries: number;
  fedToday: number;
}> {
  try {
    // Use cached GET wrapper for better performance
    // Get all beneficiaries by using a high limit
    const beneficiariesResponse = await cachedGet<{ pagination: { total: number } }>('/api/beneficiaries?limit=100');
    // Get today's feeding records and count them
    const fedResponse = await getTodayFeedRecords(1, 100); // Get all records for today
    
    return {
      totalBeneficiaries: beneficiariesResponse.pagination.total,
      fedToday: fedResponse.pagination.total // Use the total from pagination
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// Interface for detailed statistics
export interface DetailedStats {
  totalBeneficiaries: number;
  totalFedToday: number;
  totalFedInRange: number;
  feedRate: number;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export async function getDetailedStats(startDate?: string, endDate?: string): Promise<DetailedStats> {
  try {
    let url = '/api/feeding/stats'; // Changed from /api/feed/stats to /api/feeding/stats
    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      url += `?${params.toString()}`;
    }
    
    const response = await cachedGet<{ data: DetailedStats }>(url);
    const result = response;
    
    return {
      totalBeneficiaries: result.data.totalBeneficiaries,
      totalFedToday: result.data.totalFedToday,
      totalFedInRange: result.data.totalFedInRange,
      feedRate: result.data.feedRate,
      dateRange: result.data.dateRange
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// ============ EXPORT FUNCTIONS ============
export async function exportFeedRecordsToCSV(startDate: string, endDate: string): Promise<string> {
  // In a real implementation, this would generate CSV export
  throw new Error('Not implemented');
}

export interface PaginatedFeedRecords {
  data: FeedRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getFeedRecordsByDateRange(startDate: string, endDate: string, site?: string): Promise<FeedRecord[]> {
  try {
    let url = `/api/feed/date-range?startDate=${startDate}&endDate=${endDate}`;
    if (site) {
      url += `&site=${encodeURIComponent(site)}`;
    }
    
    const response = await cachedGet<{ data: { id: string; beneficiaryUid: string; beneficiaryName: string; date: string; time: string; scannerName: string; status?: string }[] }>(url);
    const result = response;
    
    // Map the backend response to the FeedRecord interface expected by the frontend
    const feedRecords = result.data.map((item) => ({
      id: item.id,
      beneficiaryUid: item.beneficiaryUid,
      beneficiaryName: item.beneficiaryName,
      date: item.date,
      time: item.time,
      scannerName: item.scannerName,
      status: (item.status as 'ok' | 'duplicate') || 'ok'
    }));
    
    return feedRecords;
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function getTodayFeedRecords(page: number = 1, limit: number = 10): Promise<PaginatedFeedRecords> {
  try {
    const url = `/api/feeding/today?page=${page}&limit=${limit}`;
    
    const response = await cachedGet<{ data: BackendFeedingRecord[]; pagination: { page: number; limit: number; total: number; pages: number } }>(url);
    const result = response;
    
    // Map the backend response to the FeedRecord interface expected by the frontend
    const feedRecords = result.data.map((item) => ({
      id: item._id,
      beneficiaryUid: item.beneficiary?.uniqueId || item.uniqueId,
      beneficiaryName: item.beneficiary?.name || 'Unknown',
      date: item.date,
      time: item.fedAt ? new Date(item.fedAt).toTimeString().split(' ')[0] : '',
      scannerName: item.deviceId || 'Unknown',
      status: 'ok' as const // Assuming all records are valid
    }));
    
    return {
      data: feedRecords,
      pagination: result.pagination
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}