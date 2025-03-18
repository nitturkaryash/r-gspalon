export interface DailySales {
    date: string;
    sales: number;
}
export interface ServiceSales {
    serviceName: string;
    revenue: number;
    count: number;
}
export interface AnalyticsSummary {
    todaySales: number;
    yesterdaySales: number;
    salesChangePercentage: number;
    todayAppointments: number;
    topServices: ServiceSales[];
    newCustomers: number;
    repeatCustomers: number;
    retentionRate: number;
    averageTicketPrice: number;
    previousAverageTicketPrice: number;
    averageTicketChangePercentage: number;
    staffUtilization: {
        average: number;
        byStaff: {
            stylistId: string;
            stylistName: string;
            rate: number;
        }[];
    };
    dailySalesTrend: DailySales[];
    stylistRevenue: {
        stylistId: string;
        stylistName: string;
        revenue: number;
    }[];
}
export interface DashboardSettings {
    visibleMetrics: {
        dailySales: boolean;
        topServices: boolean;
        appointments: boolean;
        retentionRate: boolean;
        averageTicket: boolean;
        staffUtilization: boolean;
        stylistRevenue: boolean;
    };
    chartTypes: {
        salesTrend: 'line' | 'bar';
    };
    refreshInterval: number;
}
export declare function useDashboardAnalytics(): {
    analyticsSummary: AnalyticsSummary;
    isLoading: boolean;
    refetchAnalytics: () => Promise<void>;
    settings: DashboardSettings;
    updateSettings: (newSettings: Partial<DashboardSettings>) => void;
};
