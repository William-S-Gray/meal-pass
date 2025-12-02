// API Service Layer - Backend Integration Points
// TODO: Replace these placeholder functions with your actual backend API calls

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'volunteer' | 'reporter';
}

export interface Beneficiary {
  id: string;
  uid: string; // BNF-XXXX format
  fullName: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  household?: string;
  notes?: string;
  qrCode: string;
  createdAt: string;
}

export interface FeedRecord {
  id: string;
  beneficiaryUid: string;
  beneficiaryName: string;
  date: string; // YYYY-MM-DD
  time: string;
  status: 'ok' | 'duplicate';
  overrideReason?: string;
  scannerId: string;
  scannerName: string;
}

// ============ AUTH FUNCTIONS ============
export async function loginUser(email: string, password: string): Promise<User> {
  // TODO: Connect to your backend authentication endpoint
  // Example: const response = await fetch('YOUR_API/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  
  // Mock response for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: '1',
        email,
        fullName: 'Admin User',
        role: 'admin'
      });
    }, 1000);
  });
}

export async function logoutUser(): Promise<void> {
  // TODO: Connect to your backend logout endpoint
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}

export async function getCurrentUser(): Promise<User | null> {
  // TODO: Connect to your backend to get current authenticated user
  // This should check session/token and return user if authenticated
  return null;
}

// ============ BENEFICIARY FUNCTIONS ============
export async function createBeneficiary(data: Omit<Beneficiary, 'id' | 'uid' | 'qrCode' | 'createdAt'>): Promise<Beneficiary> {
  // TODO: Connect to your backend to create beneficiary
  // Your backend should:
  // 1. Generate unique UID in format BNF-XXXX
  // 2. Generate QR code based on UID
  // 3. Save to database
  // 4. Return the created beneficiary
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      const uid = `BNF-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      resolve({
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        uid,
        qrCode: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="20">${uid}</text></svg>`)}`,
        createdAt: new Date().toISOString()
      });
    }, 1000);
  });
}

export async function getBeneficiaries(search?: string): Promise<Beneficiary[]> {
  // TODO: Connect to your backend to fetch beneficiaries
  // Support optional search parameter
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 500);
  });
}

export async function getBeneficiaryByUid(uid: string): Promise<Beneficiary | null> {
  // TODO: Connect to your backend to fetch single beneficiary by UID
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 500);
  });
}

export async function updateBeneficiary(id: string, data: Partial<Beneficiary>): Promise<Beneficiary> {
  // TODO: Connect to your backend to update beneficiary
  
  throw new Error('Not implemented');
}

export async function deleteBeneficiary(id: string): Promise<void> {
  // TODO: Connect to your backend to delete beneficiary
  
  throw new Error('Not implemented');
}

// ============ FEED RECORD FUNCTIONS ============
export async function createFeedRecord(beneficiaryUid: string, scannerId: string): Promise<FeedRecord> {
  // TODO: Connect to your backend to create feed record
  // Your backend should:
  // 1. Check if beneficiary already fed today
  // 2. If yes, return error or mark as duplicate
  // 3. If no, create feed record with status 'ok'
  // 4. Return the created record
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Math.random().toString(36).substr(2, 9),
        beneficiaryUid,
        beneficiaryName: 'Mock Beneficiary',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        status: 'ok',
        scannerId,
        scannerName: 'Scanner User'
      });
    }, 1000);
  });
}

export async function checkIfFedToday(beneficiaryUid: string): Promise<boolean> {
  // TODO: Connect to your backend to check if beneficiary fed today
  // Return true if already fed, false if not
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(false);
    }, 500);
  });
}

export async function overrideFeed(beneficiaryUid: string, scannerId: string, reason: string): Promise<FeedRecord> {
  // TODO: Connect to your backend to override duplicate prevention
  // This should allow admin users to mark someone as fed even if already fed today
  
  throw new Error('Not implemented');
}

export async function getTodayFeedRecords(): Promise<FeedRecord[]> {
  // TODO: Connect to your backend to get today's feed records
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 500);
  });
}

export async function getFeedRecordsByDateRange(startDate: string, endDate: string, site?: string): Promise<FeedRecord[]> {
  // TODO: Connect to your backend to get feed records by date range
  // Support optional site filter
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 500);
  });
}

export async function getFeedHistoryForBeneficiary(beneficiaryUid: string): Promise<FeedRecord[]> {
  // TODO: Connect to your backend to get feed history for specific beneficiary
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 500);
  });
}

// ============ STATS FUNCTIONS ============
export async function getStats(): Promise<{
  totalBeneficiaries: number;
  fedToday: number;
}> {
  // TODO: Connect to your backend to get dashboard stats
  
  // Mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalBeneficiaries: 0,
        fedToday: 0
      });
    }, 500);
  });
}

// ============ EXPORT FUNCTIONS ============
export async function exportFeedRecordsToCSV(startDate: string, endDate: string): Promise<string> {
  // TODO: Connect to your backend to generate CSV export
  // Return CSV string or download link
  
  throw new Error('Not implemented');
}
