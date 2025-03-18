import { useEffect, useState } from 'react';
import { usePOS } from './usePOS';
import { useAppointments } from './useAppointments';
import { useServices } from './useServices';
import { useStylists } from './useStylists';
export function useDashboardAnalytics() {
    const { orders, isLoading: loadingOrders } = usePOS();
    const { appointments, isLoading: loadingAppointments } = useAppointments();
    const { services, isLoading: loadingServices } = useServices();
    const { stylists, isLoading: loadingStylists } = useStylists();
    const [analyticsSummary, setAnalyticsSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    // Default settings
    const [settings, setSettings] = useState({
        visibleMetrics: {
            dailySales: true,
            topServices: true,
            appointments: true,
            retentionRate: true,
            averageTicket: true,
            staffUtilization: true,
            stylistRevenue: true,
        },
        chartTypes: {
            salesTrend: 'line',
        },
        refreshInterval: 1000 * 60 * 5, // 5 minutes
    });
    // Mock data for demo mode - defined INSIDE the hook
    const MOCK_ANALYTICS_DATA = {
        todaySales: 1250,
        yesterdaySales: 980,
        salesChangePercentage: 27.5,
        todayAppointments: 15,
        topServices: [
            { serviceName: 'Haircut', revenue: 550, count: 10 },
            { serviceName: 'Hair Color', revenue: 750, count: 5 },
            { serviceName: 'Styling', revenue: 300, count: 6 }
        ],
        newCustomers: 4,
        repeatCustomers: 11,
        retentionRate: 78,
        averageTicketPrice: 83.33,
        previousAverageTicketPrice: 75.4,
        averageTicketChangePercentage: 10.5,
        staffUtilization: {
            average: 65,
            byStaff: [
                { stylistId: '1', stylistName: 'Sarah', rate: 85 },
                { stylistId: '2', stylistName: 'Mike', rate: 70 },
                { stylistId: '3', stylistName: 'Jessica', rate: 60 },
                { stylistId: '4', stylistName: 'John', rate: 45 }
            ]
        },
        dailySalesTrend: Array(7).fill(0).map((_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sales: Math.floor(Math.random() * 1000) + 500
        })),
        stylistRevenue: [
            { stylistId: '1', stylistName: 'Sarah', revenue: 3200 },
            { stylistId: '2', stylistName: 'Mike', revenue: 2800 },
            { stylistId: '3', stylistName: 'Jessica', revenue: 2400 },
            { stylistId: '4', stylistName: 'John', revenue: 2000 }
        ]
    };
    // Function to generate analytics summary with mock data
    const getAnalyticsSummary = () => {
        // Just return mock data for demo purposes
        return MOCK_ANALYTICS_DATA;
    };
    // Initialize and check for demo mode
    useEffect(() => {
        // Check for demo auth
        const demoAuth = localStorage.getItem('salon_demo_auth');
        if (demoAuth) {
            try {
                const demoData = JSON.parse(demoAuth);
                if (demoData.isAuthenticated) {
                    // Use mock data for demo mode
                    setAnalyticsSummary(MOCK_ANALYTICS_DATA);
                    setIsLoading(false);
                    return; // Skip the rest of initialization for demo mode
                }
            }
            catch (err) {
                console.error('Error parsing demo auth:', err);
            }
        }
        // Regular initialization logic for non-demo mode
        // For now, just use mock data
        setAnalyticsSummary(getAnalyticsSummary());
        setIsLoading(false);
        return () => {
            // Cleanup logic
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);
    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };
    const refetchAnalytics = async () => {
        setIsLoading(true);
        // Check if in demo mode
        const demoAuth = localStorage.getItem('salon_demo_auth');
        if (demoAuth) {
            try {
                const demoData = JSON.parse(demoAuth);
                if (demoData.isAuthenticated) {
                    // Use mock data with slight variations
                    const mockData = { ...MOCK_ANALYTICS_DATA };
                    // Update random values
                    mockData.todaySales = Math.floor(Math.random() * 1000) + 800;
                    mockData.todayAppointments = Math.floor(Math.random() * 10) + 10;
                    mockData.dailySalesTrend = MOCK_ANALYTICS_DATA.dailySalesTrend.map(day => ({
                        ...day,
                        sales: Math.floor(Math.random() * 500) + day.sales - 250
                    }));
                    setAnalyticsSummary(mockData);
                    setIsLoading(false);
                    return;
                }
            }
            catch (err) {
                console.error('Error parsing demo auth:', err);
            }
        }
        // For now, use the same mock data
        setAnalyticsSummary(getAnalyticsSummary());
        setIsLoading(false);
    };
    return {
        analyticsSummary,
        isLoading,
        refetchAnalytics,
        settings,
        updateSettings
    };
}
