import axios from 'axios';

// Get the base URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Download QR code for an employee
 * @param {string} employeeUid - Employee unique identifier
 * @returns {Promise<Blob>} - QR code image as blob
 */
export async function downloadQRCode(employeeUid) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/employees/uid/${employeeUid}/qrcode`, {
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
}

/**
 * Create a download link for a blob
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired filename
 */
export function createDownloadLink(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default {
  downloadQRCode,
  createDownloadLink
};