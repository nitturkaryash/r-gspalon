import React from 'react';
import { Purchase } from '../../models/inventoryTypes';
interface PurchaseTabProps {
    purchases: Purchase[];
    isLoading: boolean;
    error: Error | null;
}
declare const PurchaseTab: React.FC<PurchaseTabProps>;
export default PurchaseTab;
