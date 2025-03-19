import React, { useEffect, useState } from 'react';
import { verifySupabaseConnection } from '../utils/supabase/verifyConnection';

/**
 * Component to verify Supabase connection status
 * Currently set to not display anything as per user request
 */
export const SupabaseConnectionStatus: React.FC = () => {
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Still perform the connection check in the background
        await verifySupabaseConnection();
        console.log('Supabase connection verified silently');
      } catch (error) {
        console.error('Supabase connection check failed silently:', error);
      }
    };

    checkConnection();
  }, []);

  // Return null to hide the component completely
  return null;
};

export default SupabaseConnectionStatus; 