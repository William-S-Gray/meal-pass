// API Service Layer - Backend Integration Points

// Get base URL from environment or default to localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
  id: string;
  uid: string; // BNF-XXXX format
  fullName: string;
  dob?: string; // Make DOB optional
  gender: 'male' | 'female' | 'other';
  household?: string;
  notes?: string;
  qrCode: string;
  createdAt: string;
  fedToday?: boolean; // Add fedToday property
  active?: boolean; // Add active property
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

// Helper function to get auth headers
const getAuthHeaders = () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const user: UserWithToken = JSON.parse(storedUser);
      if (user && user.token) {
        return {
          'Authorization': `Bearer ${user.token}`
        };
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }
  return {};
};

// Helper function to handle API errors
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response;
};

// ============ AUTH FUNCTIONS ============
export async function loginUser(email: string, password: string): Promise<User> {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  await handleApiError(response);
  const data = await response.json();
  
  // Store user with token in localStorage
  const userWithToken: UserWithToken = {
    id: data.data.admin.id,
    email: data.data.admin.email,
    fullName: data.data.admin.name,
    role: data.data.admin.role || 'admin', // Default to admin if no role provided
    token: data.data.token
  };
  
  localStorage.setItem('user', JSON.stringify(userWithToken));
  
  // Return user without token
  return {
    id: data.data.admin.id,
    email: data.data.admin.email,
    fullName: data.data.admin.name,
    role: data.data.admin.role || 'admin'
  };
}

// ============ BENEFICIARY FUNCTIONS ============

export async function createBeneficiary(data: Omit<Beneficiary, 'id' | 'uid' | 'qrCode' | 'createdAt'>): Promise<Beneficiary> {
  // Prepare form data
  const formData = new FormData();
  formData.append('name', data.fullName);
  formData.append('gender', data.gender);
  formData.append('group', data.household || '');
  
  // Only append DOB if it's provided
  if (data.dob) {
    formData.append('dob', data.dob);
  }
  
  // Notes field is not in backend model, so we'll skip it for now
  
  const response = await fetch(`${BASE_URL}/api/beneficiaries`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    body: formData,
  });

  await handleApiError(response);
  const result = await response.json();
  
  // Map backend response to frontend interface
  return {
    id: result.data._id,
    uid: result.data.uniqueId,
    fullName: result.data.name,
    dob: result.data.dob || '', // Backend doesn't have dob field, so we'll use empty string
    gender: result.data.gender.toLowerCase() as 'male' | 'female' | 'other',
    household: result.data.group || '',
    qrCode: `${BASE_URL}${result.data.qrCodeUrl}`,
    createdAt: result.data.createdAt,
    fedToday: result.data.fedToday || false,
    active: result.data.active !== undefined ? result.data.active : true
  };
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
  let url = `${BASE_URL}/api/beneficiaries?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders()
    }
  });
  await handleApiError(response);
  const result = await response.json();
  
  // Define the backend beneficiary type
  interface BackendBeneficiary {
    _id: string;
    uniqueId: string;
    name: string;
    dob?: string;
    gender: string;
    group?: string;
    qrCodeUrl: string;
    createdAt: string;
    fedToday?: boolean;
    active?: boolean;
  }
  
  // Map backend response to frontend interface
  const beneficiaries = result.data.map((item: BackendBeneficiary) => ({
    id: item._id,
    uid: item.uniqueId,
    fullName: item.name,
    dob: item.dob || '', // Backend doesn't have dob field
    gender: item.gender.toLowerCase() as 'male' | 'female' | 'other',
    household: item.group || '',
    qrCode: `${BASE_URL}${item.qrCodeUrl}`,
    createdAt: item.createdAt,
    fedToday: item.fedToday || false,
    active: item.active !== undefined ? item.active : true
  }));
  
  return {
    data: beneficiaries,
    pagination: result.pagination
  };
}

export async function getBeneficiaryByUid(uid: string): Promise<Beneficiary | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/beneficiaries/uid/${uid}`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    
    // If beneficiary not found, return null
    if (response.status === 404) {
      return null;
    }
    
    await handleApiError(response);
    const result = await response.json();
    
    // Define the backend beneficiary type
    interface BackendBeneficiary {
      _id: string;
      uniqueId: string;
      name: string;
      dob?: string;
      gender: string;
      group?: string;
      qrCodeUrl: string;
      createdAt: string;
      active?: boolean;
    }
    
    const item: BackendBeneficiary = result.data;
    
    // Map backend response to frontend interface
    return {
      id: item._id,
      uid: item.uniqueId,
      fullName: item.name,
      dob: item.dob || '',
      gender: item.gender.toLowerCase() as 'male' | 'female' | 'other',
      household: item.group || '',
      qrCode: `${BASE_URL}${item.qrCodeUrl}`,
      createdAt: item.createdAt,
      active: item.active !== undefined ? item.active : true
    };
  } catch (error) {
    console.error('Failed to fetch beneficiary by UID:', error);
    return null;
  }
}

export async function updateBeneficiary(id: string, data: Partial<Beneficiary>): Promise<Beneficiary> {
  const formData = new FormData();
  
  if (data.fullName) formData.append('name', data.fullName);
  if (data.gender) formData.append('gender', data.gender);
  if (data.household) formData.append('group', data.household);
  
  // Only append DOB if it's provided
  if (data.dob) {
    formData.append('dob', data.dob);
  }
  
  const response = await fetch(`${BASE_URL}/api/beneficiaries/${id}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders()
    },
    body: formData,
  });

  await handleApiError(response);
  const result = await response.json();
  
  // Map backend response to frontend interface
  return {
    id: result.data._id,
    uid: result.data.uniqueId,
    fullName: result.data.name,
    dob: result.data.dob || '',
    gender: result.data.gender.toLowerCase() as 'male' | 'female' | 'other',
    household: result.data.group || '',
    qrCode: `${BASE_URL}${result.data.qrCodeUrl}`,
    createdAt: result.data.createdAt,
    active: result.data.active !== undefined ? result.data.active : true
  };
}

export async function deleteBeneficiary(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/beneficiaries/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    },
  });

  await handleApiError(response);
  return Promise.resolve();
}

// ============ QR CODE FUNCTIONS ============
export async function downloadQRCode(beneficiaryId: string, beneficiaryUid: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/beneficiaries/${beneficiaryId}/qrcode`, {
    headers: {
      ...getAuthHeaders()
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to download QR code');
  }
  
  // Create blob from response
  const blob = await response.blob();
  
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
}

// ============ FEEDING FUNCTIONS ============
export async function scanQRCode(uniqueId: string, deviceId: string, method: 'scan' | 'manual'): Promise<QRScanResponse> {
  const response = await fetch(`${BASE_URL}/api/feeding/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ uniqueId, deviceId, method })
  });

  // For this specific endpoint, we don't want to throw an error for business logic responses
  // We'll handle different status codes appropriately
  if (!response.ok && response.status !== 400 && response.status !== 404) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

export async function getTodayFeedingRecords(): Promise<FeedingRecord[]> {
  const response = await fetch(`${BASE_URL}/api/feeding/today`, {
    headers: {
      ...getAuthHeaders()
    }
  });
  
  await handleApiError(response);
  const result = await response.json();
  
  return result.data.map((item: BackendFeedingRecord) => ({
    id: item._id,
    uniqueId: item.uniqueId,
    beneficiary: item.beneficiary,
    date: item.date,
    fedAt: item.fedAt,
    method: item.method,
    deviceId: item.deviceId
  }));
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
  // Fetch beneficiaries count
  const beneficiariesResponse = await fetch(`${BASE_URL}/api/beneficiaries`, {
    headers: {
      ...getAuthHeaders()
    }
  });
  await handleApiError(beneficiariesResponse);
  const beneficiariesResult = await beneficiariesResponse.json();
  
  // Fetch fed today count
  const fedResponse = await fetch(`${BASE_URL}/api/feed/today`, {
    headers: {
      ...getAuthHeaders()
    }
  });
  await handleApiError(fedResponse);
  const fedResult = await fedResponse.json();
  
  return {
    totalBeneficiaries: beneficiariesResult.pagination.total,
    fedToday: fedResult.count
  };
}

// ============ EXPORT FUNCTIONS ============
export async function exportFeedRecordsToCSV(startDate: string, endDate: string): Promise<string> {
  // In a real implementation, this would generate CSV export
  throw new Error('Not implemented');
}