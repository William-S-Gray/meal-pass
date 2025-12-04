import { useState } from 'react';
import { scanQRCode, removeFeedingStatus } from '../lib/api';
import { toast } from './use-toast';

interface FeedingResponse {
  status: 'success' | 'already_fed' | 'not_found' | 'error';
  message: string;
}

export const useFeeding = () => {
  const [loading, setLoading] = useState(false);

  const recordFeeding = async (uniqueId: string, deviceId: string, method: 'scan' | 'manual'): Promise<FeedingResponse | null> => {
    try {
      setLoading(true);
      const result = await scanQRCode(uniqueId, deviceId, method);
      toast({
        title: 'Success',
        description: result.message
      });
      return result;
    } catch (error: unknown) {
      let message = 'Failed to record feeding';
      
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      
      return {
        status: 'error',
        message
      };
    } finally {
      setLoading(false);
    }
  };

  const removeFeeding = async (uniqueId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await removeFeedingStatus(uniqueId);
      toast({
        title: 'Success',
        description: result.message
      });
      return true;
    } catch (error: unknown) {
      let message = 'Failed to remove feeding status';
      
      if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    recordFeeding,
    removeFeeding
  };
};