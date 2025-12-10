// API Service Layer - Backend Integration Points

import axios from 'axios';

// Debug log to verify the API URL
console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('Using baseURL:', import.meta.env.VITE_API_URL || 'http://localhost:5000');

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Disable credentials for CORS
  timeout: 10000 // Set timeout to 10 seconds
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
const EMPLOYEE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for employee data

// Function to clear employee-related cache entries
const clearEmployeeCache = () => {
  // Remove all cache entries related to employees
  const keysToRemove: string[] = [];
  for (const key of apiCache.keys()) {
    if (key.includes('/api/employees')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => apiCache.delete(key));
};

// Function to get cache key for employee data
const getEmployeeCacheKey = (uid: string) => {
  return `/api/employees/uid/${uid}`;
};

// Function to check if employee data is in cache
const isEmployeeInCache = (uid: string) => {
  const cacheKey = getEmployeeCacheKey(uid);
  const cached = apiCache.get(cacheKey);
  return cached && Date.now() - cached.timestamp < EMPLOYEE_CACHE_DURATION;
};

// Function to get employee data from cache
const getEmployeeFromCache = (uid: string) => {
  const cacheKey = getEmployeeCacheKey(uid);
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < EMPLOYEE_CACHE_DURATION) {
    return cached.data as { data: { _id: string; uniqueId: string; name: string; gender: 'Male' | 'Female' | 'Other'; phone?: string; department?: string; position?: string; validUntil: string; qrCodeUrl: string; createdAt: string; active?: boolean; fedToday?: boolean } };
  }
  return null;
};

// Function to clear cache for a specific employee
const clearSpecificEmployeeCache = (employeeId: string) => {
  // Remove cache entries for a specific employee
  const keysToRemove: string[] = [];
  for (const key of apiCache.keys()) {
    if (key.includes(`/api/employees/uid/${employeeId}`) || key.includes(`/api/employees/${employeeId}`)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => apiCache.delete(key));
};

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

export interface Employee {
  _id: string;
  uniqueId: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  phone?: string;
  department?: string;
  position?: string;
  validUntil: string;
  qrCodeUrl: string;
  photo?: string;
  active?: boolean;
  createdAt: string;
  fedToday?: boolean;
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
  employee: {
    name: string;
    department: string;
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
  employeeUid: string;
  employeeName: string;
  date: string;
  time: string;
  scannerName: string;
  status: 'ok' | 'duplicate';
}

// Interface for backend feeding record
interface BackendFeedingRecord {
  _id: string;
  uniqueId: string;
  employee: {
    name: string;
    department: string;
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
  employeeId?: {
    uniqueId: string;
    name: string;
  };
  uniqueId: string;
  fedAt: string;
  servedBy: string;
}

// Interface for report statistics
export interface ReportStatistics {
  totalEmployees: number;
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
      const errorMessage = error.response.data?.error || error.response.data?.message || `HTTP error! status: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - no response received from server. Please check if the backend is running.');
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
const cachedGet = async <T>(url: string, cacheDuration: number = CACHE_DURATION): Promise<T> => {
  // Check cache first
  const cached = apiCache.get(url);
  if (cached && Date.now() - cached.timestamp < cacheDuration) {
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

// Specialized caching function for employee data
const cachedEmployeeGet = async <T>(url: string): Promise<T> => {
  return cachedGet<T>(url, EMPLOYEE_CACHE_DURATION);
};

// Wrapper for POST requests that clears relevant cache
const postWithCacheClear = async <T>(url: string, data?: unknown): Promise<T> => {
  try {
    const response = await apiClient.post<T>(url, data);
    // Clear cache for related GET requests
    clearEmployeeCache();
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
    clearEmployeeCache();
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
    clearEmployeeCache();
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
    
    // Store user with token in localStorage
    const userWithToken: UserWithToken = {
      id: response.data.admin.id,
      email: response.data.admin.email,
      fullName: response.data.admin.name,
      role: (response.data.admin.role as 'admin' | 'volunteer' | 'reporter') || 'admin', // Default to admin if no role provided
      token: response.data.token
    };
    
    localStorage.setItem('user', JSON.stringify(userWithToken));
    
    // Return user without token
    return {
      id: response.data.admin.id,
      email: response.data.admin.email,
      fullName: response.data.admin.name,
      role: (response.data.admin.role as 'admin' | 'volunteer' | 'reporter') || 'admin'
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// ============ EMPLOYEE FUNCTIONS ============

export async function createEmployee(data: Omit<Employee, '_id' | 'qrCodeUrl' | 'createdAt' | 'fedToday'>): Promise<Employee> {
  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('gender', data.gender);
    if (data.uniqueId) formData.append('uniqueId', data.uniqueId);
    if (data.phone) formData.append('phone', data.phone);
    if (data.department) formData.append('department', data.department);
    if (data.position) formData.append('position', data.position);
    formData.append('validUntil', data.validUntil);
    
    // Log the data being sent for debugging
    console.log('Sending employee data:', {
      name: data.name,
      gender: data.gender,
      uniqueId: data.uniqueId,
      phone: data.phone,
      department: data.department,
      position: data.position,
      validUntil: data.validUntil
    });
    
    const response = await postWithCacheClear<{ 
      success: boolean; 
      data: { 
        _id: string; 
        uniqueId: string; 
        name: string; 
        gender: 'Male' | 'Female' | 'Other';
        phone?: string;
        department?: string;
        position?: string;
        validUntil: string;
        qrCodeUrl: string; 
        createdAt: string; 
        fedToday?: boolean; 
        active?: boolean 
      } 
    }>('/api/employees', formData);
    
    // Clear cache for employee lists since we've added a new employee
    clearEmployeeCache();
    
    // Map backend response to frontend interface
    return {
      _id: response.data._id,
      uniqueId: response.data.uniqueId,
      name: response.data.name,
      gender: response.data.gender,
      phone: response.data.phone,
      department: response.data.department,
      position: response.data.position,
      validUntil: response.data.validUntil,
      qrCodeUrl: response.data.qrCodeUrl.startsWith('http') ? 
        // If it's already a full URL, make sure it uses the correct domain
        response.data.qrCodeUrl.replace(/https?:\/\/[^/]+/, apiClient.defaults.baseURL) : 
        // If it's a relative URL, prepend the baseURL
        `${apiClient.defaults.baseURL}${response.data.qrCodeUrl}`,
      createdAt: response.data.createdAt,
      fedToday: response.data.fedToday || false,
      active: response.data.active !== undefined ? response.data.active : true
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// Update the Employee interface to include pagination info
export interface PaginatedEmployees {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export async function getEmployees(search?: string, page: number = 1, limit: number = 10): Promise<PaginatedEmployees> {
  try {
    let url = `/api/employees?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    const response = await cachedEmployeeGet<{ data: { _id: string; uniqueId: string; name: string; gender: 'Male' | 'Female' | 'Other'; phone?: string; department?: string; position?: string; validUntil: string; qrCodeUrl: string; createdAt: string; fedToday?: boolean; active?: boolean }[]; pagination: { page: number; limit: number; total: number; pages: number } }>(url);
    
    // Map backend response to frontend interface
    const employees = response.data.map((item) => ({
      _id: item._id,
      uniqueId: item.uniqueId,
      name: item.name,
      gender: item.gender,
      phone: item.phone,
      department: item.department,
      position: item.position,
      validUntil: item.validUntil,
      qrCodeUrl: item.qrCodeUrl.startsWith('http') ? 
        // If it's already a full URL, make sure it uses the correct domain
        item.qrCodeUrl.replace(/https?:\/\/[^/]+/, apiClient.defaults.baseURL) : 
        // If it's a relative URL, prepend the baseURL
        `${apiClient.defaults.baseURL}${item.qrCodeUrl}`,
      createdAt: item.createdAt,
      fedToday: item.fedToday || false,
      active: item.active !== undefined ? item.active : true
    }));
    
    return {
      data: employees,
      pagination: response.pagination
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function getEmployeeByUid(uid: string): Promise<Employee | null> {
  try {
    // Simplified caching approach - check cache first
    const cacheKey = `/api/employees/uid/${uid}`;
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < EMPLOYEE_CACHE_DURATION) {
      const result = cached.data as { data: { _id: string; uniqueId: string; name: string; gender: 'Male' | 'Female' | 'Other'; phone?: string; department?: string; position?: string; validUntil: string; qrCodeUrl: string; createdAt: string; active?: boolean; fedToday?: boolean } };
      
      // Ensure qrCodeUrl uses the correct domain
      const qrCodeUrl = result.data.qrCodeUrl.startsWith('http') ? 
        // If it's already a full URL, make sure it uses the correct domain
        result.data.qrCodeUrl.replace(/https?:\/\/[^/]+/, apiClient.defaults.baseURL) : 
        // If it's a relative URL, prepend the baseURL
        `${apiClient.defaults.baseURL}${result.data.qrCodeUrl}`;

      return {
        _id: result.data._id,
        uniqueId: result.data.uniqueId,
        name: result.data.name,
        gender: result.data.gender,
        phone: result.data.phone,
        department: result.data.department,
        position: result.data.position,
        validUntil: result.data.validUntil,
        qrCodeUrl: qrCodeUrl,
        createdAt: result.data.createdAt,
        fedToday: result.data.fedToday || false,
        active: result.data.active !== undefined ? result.data.active : true
      };
    }
    
    // Make API request with optimized timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await apiClient.get<{ _id: string; uniqueId: string; name: string; gender: 'Male' | 'Female' | 'Other'; phone?: string; department?: string; position?: string; validUntil: string; qrCodeUrl: string; createdAt: string; active?: boolean; fedToday?: boolean }>(`/api/employees/uid/${uid}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Cache the result
    apiCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    
    // Ensure qrCodeUrl uses the correct domain
    const qrCodeUrl = response.data.qrCodeUrl.startsWith('http') ? 
      // If it's already a full URL, make sure it uses the correct domain
      response.data.qrCodeUrl.replace(/https?:\/\/[^/]+/, apiClient.defaults.baseURL) : 
      // If it's a relative URL, prepend the baseURL
      `${apiClient.defaults.baseURL}${response.data.qrCodeUrl}`;

    // Map backend response to frontend interface
    return {
      _id: response.data._id,
      uniqueId: response.data.uniqueId,
      name: response.data.name,
      gender: response.data.gender,
      phone: response.data.phone,
      department: response.data.department,
      position: response.data.position,
      validUntil: response.data.validUntil,
      qrCodeUrl: qrCodeUrl,
      createdAt: response.data.createdAt,
      fedToday: response.data.fedToday || false,
      active: response.data.active !== undefined ? response.data.active : true
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_CANCELED') {
        console.warn('Request timeout for employee:', uid);
        throw new Error('Request timeout - please try again');
      }
      
      if (error.response && error.response.status === 404) {
        return null;
      }
    }
    console.error('Failed to fetch employee by UID:', error);
    return null;
  }
}

export async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
  try {
    const formData = new FormData();
    
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.gender !== undefined) formData.append('gender', data.gender);
    if (data.phone !== undefined) formData.append('phone', data.phone || '');
    if (data.department !== undefined) formData.append('department', data.department || '');
    if (data.position !== undefined) formData.append('position', data.position || '');
    if (data.validUntil !== undefined) formData.append('validUntil', data.validUntil);
    
    const response = await putWithCacheClear<{ success: boolean; message: string; data: { _id: string; uniqueId: string; name: string; gender: 'Male' | 'Female' | 'Other'; phone?: string; department?: string; position?: string; validUntil: string; qrCodeUrl: string; createdAt: string; active?: boolean } }>(`/api/employees/${id}`, formData);
    
    // Clear cache for this specific employee
    if (response.data.uniqueId) {
      clearSpecificEmployeeCache(response.data.uniqueId);
    }
    
    // Map backend response to frontend interface
    return {
      _id: response.data._id,
      uniqueId: response.data.uniqueId,
      name: response.data.name,
      gender: response.data.gender,
      phone: response.data.phone,
      department: response.data.department,
      position: response.data.position,
      validUntil: response.data.validUntil,
      qrCodeUrl: response.data.qrCodeUrl.startsWith('http') ? 
        // If it's already a full URL, make sure it uses the correct domain
        response.data.qrCodeUrl.replace(/https?:\/\/[^/]+/, apiClient.defaults.baseURL) : 
        // If it's a relative URL, prepend the baseURL
        `${apiClient.defaults.baseURL}${response.data.qrCodeUrl}`,
      createdAt: response.data.createdAt,
      fedToday: false, // fedToday is not returned from update
      active: response.data.active !== undefined ? response.data.active : true
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function deleteEmployee(id: string): Promise<void> {
  try {
    await deleteWithCacheClear(`/api/employees/${id}`);
    // Also clear cache for this specific employee if we have the ID
    clearSpecificEmployeeCache(id);
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// ============ PRINTING FUNCTIONS ============
export async function printBulkCards(employeeIds: string[]): Promise<Blob> {
  try {
    const response = await apiClient.post('/api/employees/print-cards', { employeeIds }, {
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

// Generate QR code dynamically without storing it
export async function generateDynamicQRCode(employeeUid: string): Promise<string> {
  try {
    const response = await apiClient.get(`/api/employees/uid/${employeeUid}/qrcode/dynamic`, {
      responseType: 'blob'
    });
    
    // Create object URL from blob
    const url = window.URL.createObjectURL(response.data);
    return url;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============ QR CODE FUNCTIONS ============
export async function downloadQRCode(employeeId: string, employeeUid: string): Promise<void> {
  try {
    // Use the new endpoint that accepts uniqueId instead of _id
    const response = await apiClient.get(`/api/employees/uid/${employeeUid}/qrcode`, {
      responseType: 'blob'
    });
    
    // Create blob from response
    const blob = response.data;
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-qr-${employeeUid}.png`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('QR Code download error:', error);
    
    // Handle specific error cases for blob responses
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (error.response.status === 403) {
          throw new Error('Access denied. You do not have permission to download this QR code.');
        } else if (error.response.status === 404) {
          throw new Error('Employee not found.');
        } else {
          throw new Error(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('Network error - no response received from server');
      } else {
        // Something else happened
        throw new Error(error.message || 'Unknown error occurred');
      }
    } else {
      // Non-Axios error
      throw new Error('Unknown error occurred');
    }
  }
}

// ============ FEEDING FUNCTIONS ============

export async function getTodayFeedingRecords(): Promise<FeedingRecord[]> {
  try {
    const response = await cachedGet<{ data: BackendFeedingRecord[] }>(`/api/feeding/today`);
    
    return response.data.map((item) => ({
      id: item._id,
      uniqueId: item.uniqueId,
      employee: item.employee,
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

export async function getFeedingRecordsForEmployee(uniqueId: string): Promise<FeedingRecord[]> {
  try {
    const response = await cachedGet<{ data: BackendFeedingRecord[] }>(`/api/feeding/employee/${uniqueId}`);
    
    return response.data.map((item) => ({
      id: item._id,
      uniqueId: item.uniqueId,
      employee: item.employee,
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
        // This is likely a "Employee already fed today" error
        return {
          status: 'already_fed',
          message: error.response.data?.message || 'Employee already fed today'
        };
      } else if (error.response?.status === 404) {
        // This is likely a "Employee not found" error
        return {
          status: 'not_found',
          message: error.response.data?.message || 'Employee not found'
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
    
    // Map the backend response to the FeedRecord interface expected by the frontend
    const feedRecords = response.data.map((item) => ({
      id: item._id,
      employeeUid: item.employeeId?.uniqueId || item.uniqueId,
      employeeName: item.employeeId?.name || 'Unknown',
      date: item.fedAt ? new Date(item.fedAt).toISOString().split('T')[0] : '',
      time: item.fedAt ? new Date(item.fedAt).toTimeString().split(' ')[0] : '',
      scannerName: item.servedBy || 'Unknown',
      status: 'ok' as const // Assuming all records are valid
    }));
    
    return {
      data: feedRecords,
      pagination: response.pagination
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

export async function getDateRangeReport(from: string, to: string, page: number = 1, limit: number = 50): Promise<PaginatedReport<FeedRecord>> {
  try {
    const response = await cachedGet<{ data: BackendFeedLog[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/api/reports/date-range?from=${from}&to=${to}&page=${page}&limit=${limit}`);
    
    // Map the backend response to the FeedRecord interface expected by the frontend
    const feedRecords = response.data.map((item) => ({
      id: item._id,
      employeeUid: item.employeeId?.uniqueId || item.uniqueId,
      employeeName: item.employeeId?.name || 'Unknown',
      date: item.fedAt ? new Date(item.fedAt).toISOString().split('T')[0] : '',
      time: item.fedAt ? new Date(item.fedAt).toTimeString().split(' ')[0] : '',
      scannerName: item.servedBy || 'Unknown',
      status: 'ok' as const // Assuming all records are valid
    }));
    
    return {
      data: feedRecords,
      pagination: response.pagination
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

interface EmployeeReportData {
  data: {
    employee: {
      id: string;
      uniqueId: string;
      name: string;
      department: string;
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

export async function getEmployeeReport(uniqueId: string, page: number = 1, limit: number = 50): Promise<EmployeeReportData> {
  try {
    const response = await cachedGet<EmployeeReportData>(`/api/reports/employee/${uniqueId}?page=${page}&limit=${limit}`);
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
  totalEmployees: number;
  fedToday: number;
}> {
  try {
    // Use the dedicated stats endpoint which provides all the data we need
    const response = await cachedGet<{ data: { totalEmployees: number; totalFedToday: number } }>('/api/feeding/stats');
    
    return {
      totalEmployees: response.data.totalEmployees,
      fedToday: response.data.totalFedToday
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}

// Interface for detailed statistics
export interface DetailedStats {
  totalEmployees: number;
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
    
    return {
      totalEmployees: response.data.totalEmployees,
      totalFedToday: response.data.totalFedToday,
      totalFedInRange: response.data.totalFedInRange,
      feedRate: response.data.feedRate,
      dateRange: response.data.dateRange
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
    
    const response = await cachedGet<{ data: { id: string; employeeUid: string; employeeName: string; date: string; time: string; scannerName: string; status?: string }[] }>(url);
    
    // Map the backend response to the FeedRecord interface expected by the frontend
    const feedRecords = response.data.map((item) => ({
      id: item.id,
      employeeUid: item.employeeUid,
      employeeName: item.employeeName,
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
    
    // Map the backend response to the FeedRecord interface expected by the frontend
    const feedRecords = response.data.map((item) => ({
      id: item._id,
      employeeUid: item.employee?.uniqueId || item.uniqueId,
      employeeName: item.employee?.name || 'Unknown',
      date: item.date,
      time: item.fedAt ? new Date(item.fedAt).toTimeString().split(' ')[0] : '',
      scannerName: item.deviceId || 'Unknown',
      status: 'ok' as const // Assuming all records are valid
    }));
    
    return {
      data: feedRecords,
      pagination: response.pagination
    };
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}