import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePOS } from './usePOS'
import { useAppointments } from './useAppointments'
import { useServices } from './useServices'
import { useStylists } from './useStylists'
import { Order } from './usePOS'
import { io, Socket } from 'socket.io-client'
import { format, subDays, isToday, isThisWeek, isThisMonth, parseISO, isSameDay } from 'date-fns'
import { supabase } from '../supabaseClient'

// Types and interfaces
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
  refreshInterval: number; // in milliseconds
}

export function useDashboardAnalytics() {
  const { orders, isLoading: loadingOrders } = usePOS();
  const { appointments, isLoading: loadingAppointments } = useAppointments();
  const { services, isLoading: loadingServices } = useServices();
  const { stylists, isLoading: loadingStylists } = useStylists();
  
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Default settings
  const [settings, setSettings] = useState<DashboardSettings>({
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
  const MOCK_ANALYTICS_DATA: AnalyticsSummary = {
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
  const getAnalyticsSummary = (): AnalyticsSummary => {
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
      } catch (err) {
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

  const updateSettings = (newSettings: Partial<DashboardSettings>) => {
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
          const mockData = {...MOCK_ANALYTICS_DATA};
          
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
      } catch (err) {
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