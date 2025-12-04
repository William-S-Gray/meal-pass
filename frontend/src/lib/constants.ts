// API Constants
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout'
  },
  BENEFICIARIES: {
    BASE: '/api/beneficiaries',
    BY_ID: (id: string) => `/api/beneficiaries/${id}`,
    BY_UID: (uid: string) => `/api/beneficiaries/uid/${uid}`,
    QR_CODE: (id: string) => `/api/beneficiaries/${id}/qrcode`,
    PRINT_CARDS: '/api/beneficiaries/print-cards',
    PRINT_CARD: (id: string) => `/api/beneficiaries/${id}/print-card`
  },
  FEEDING: {
    BASE: '/api/feeding',
    SCAN: '/api/feeding/scan',
    TODAY: '/api/feeding/today',
    BY_BENEFICIARY: (uniqueId: string) => `/api/feeding/beneficiary/${uniqueId}`,
    REMOVE_RECORD: (uniqueId: string) => `/api/feeding/record/${uniqueId}`
  },
  REPORTS: {
    BASE: '/api/reports',
    TODAY: '/api/reports/today',
    DATE_RANGE: '/api/reports/date-range',
    BY_BENEFICIARY: (uniqueId: string) => `/api/reports/beneficiary/${uniqueId}`,
    STATISTICS: '/api/reports/statistics'
  }
};

// App Constants
export const APP_ROLES = {
  ADMIN: 'admin',
  VOLUNTEER: 'volunteer',
  REPORTER: 'reporter'
};

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [5, 10, 20, 50]
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'user',
  THEME: 'theme'
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  TIMESTAMP: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
};

// Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Logged in successfully',
    LOGOUT: 'Logged out successfully',
    BENEFICIARY_CREATED: 'Beneficiary created successfully',
    BENEFICIARY_UPDATED: 'Beneficiary updated successfully',
    BENEFICIARY_DELETED: 'Beneficiary deleted successfully',
    FEEDING_RECORDED: 'Feeding recorded successfully',
    FEEDING_REMOVED: 'Feeding record removed successfully'
  },
  ERROR: {
    NETWORK: 'Network error - please check your connection',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    SERVER: 'Server error - please try again later',
    VALIDATION: 'Please check the form for errors',
    NOT_FOUND: 'Resource not found'
  }
};