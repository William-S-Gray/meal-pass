import React from 'react';
import { Employee } from '@/lib/api';
import { capitalizeName } from '@/lib/utils'; // Import the capitalizeName function
import { format, parseISO } from 'date-fns';

interface EmployeeIDCardProps {
  employee: Employee;
  businessName?: string;
}

const EmployeeIDCard: React.FC<EmployeeIDCardProps> = ({ 
  employee, 
  businessName = "Africa Accommodation Providers" 
}) => {
  return (
    <div className="w-[300px] h-[200px] bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3">
        <h2 className="text-lg font-bold text-center truncate">{businessName}</h2>
      </div>
      
      {/* Content */}
      <div className="p-3 h-[calc(100%-40px)] flex">
        {/* Left Side - Employee Info */}
        <div className="flex-1 pr-2">
          <div className="mb-2">
            <h3 className="font-bold text-sm truncate">{capitalizeName(employee.name)}</h3>
            <p className="text-xs text-gray-600">{employee.uniqueId}</p>
          </div>
          
          {employee.gender && (
            <div className="mb-1">
              <p className="text-xs">
                <span className="font-semibold">Gender:</span> {employee.gender}
              </p>
            </div>
          )}
          
          {employee.department && (
            <div className="mb-1">
              <p className="text-xs">
                <span className="font-semibold">Dept:</span> {employee.department}
              </p>
            </div>
          )}

          {employee.position && (
            <div className="mb-1">
              <p className="text-xs">
                <span className="font-semibold">Pos:</span> {employee.position}
              </p>
            </div>
          )}
          
          <div className="mt-2">
            <p className="text-xs">
              <span className="font-semibold">Valid Until:</span>
            </p>
            <p className="text-xs font-medium">
              {format(parseISO(employee.validUntil), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        
        {/* Right Side - QR Code */}
        <div className="w-24 h-24 flex items-center justify-center bg-gray-100 border border-gray-300 rounded">
          {employee.qrCodeUrl ? (
            <img 
              src={employee.qrCodeUrl} 
              alt="QR Code" 
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="text-gray-400 text-xs text-center p-1">
              QR Code
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeIDCard;