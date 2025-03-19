import React from 'react';
import { Consumption } from '../../models/inventoryTypes';
interface ConsumptionTabProps {
    consumption: Consumption[];
    isLoading: boolean;
    error: Error | null;
}
declare const ConsumptionTab: React.FC<ConsumptionTabProps>;
export default ConsumptionTab;
