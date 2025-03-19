import React from 'react';
import { Sale } from '../../models/inventoryTypes';
interface SalesTabProps {
    sales: Sale[];
    isLoading: boolean;
    error: Error | null;
}
declare const SalesTab: React.FC<SalesTabProps>;
export default SalesTab;
