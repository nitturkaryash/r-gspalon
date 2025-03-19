import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePOS } from './usePOS'
import { useAppointments } from './useAppointments'
import { useServices } from './useServices'
import { useStylists } from './useStylists'
import { Order } from './usePOS'
import { io, Socket } from 'socket.io-client'
import { format, subDays, isToday, isThisWeek, isThisMonth, parseISO, isSameDay } from 'date-fns'

// Analytics data types
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
  
  // Default dashboard settings
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
    refreshInterval: 30000, // 30 seconds
  });
  
  // Socket for real-time updates
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Initialize socket connection
  useEffect(() => {
    // In a real implementation, you would connect to your backend socket server
    // For now, we'll simulate real-time with local polling
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);
  
  // Process analytics data
  const getAnalyticsSummary = (): AnalyticsSummary => {
    if (!orders || !appointments || !services || !stylists) {
      return {
        todaySales: 0,
        yesterdaySales: 0,
        salesChangePercentage: 0,
        todayAppointments: 0,
        topServices: [],
        newCustomers: 0,
        repeatCustomers: 0,
        retentionRate: 0,
        averageTicketPrice: 0,
        previousAverageTicketPrice: 0,
        averageTicketChangePercentage: 0,
        staffUtilization: { average: 0, byStaff: [] },
        dailySalesTrend: [],
        stylistRevenue: [],
      };
    }
    
    // Filter orders by complete status
    const completedOrders = orders.filter(order => order.status === 'completed');
    
    // Today's sales
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    const todayOrders = completedOrders.filter(order => 
      isSameDay(parseISO(order.created_at), today)
    );
    
    const yesterdayOrders = completedOrders.filter(order => 
      isSameDay(parseISO(order.created_at), yesterday)
    );
    
    const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const yesterdaySales = yesterdayOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Calculate sales change percentage
    const salesChangePercentage = yesterdaySales === 0 
      ? 100 
      : ((todaySales - yesterdaySales) / yesterdaySales) * 100;
    
    // Today's appointments
    const todayAppointments = appointments.filter((appointment: any) => 
      isToday(parseISO(appointment.start_time))
    ).length;
    
    // Top services by revenue
    const serviceRevenueMap = new Map<string, ServiceSales>();
    
    completedOrders.forEach(order => {
      order.services.forEach(service => {
        if (serviceRevenueMap.has(service.service_id)) {
          const current = serviceRevenueMap.get(service.service_id)!;
          serviceRevenueMap.set(service.service_id, {
            serviceName: service.service_name,
            revenue: current.revenue + service.price,
            count: current.count + 1,
          });
        } else {
          serviceRevenueMap.set(service.service_id, {
            serviceName: service.service_name,
            revenue: service.price,
            count: 1,
          });
        }
      });
    });
    
    const topServices = Array.from(serviceRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Customer retention
    const customerVisitMap = new Map<string, number>();
    
    completedOrders.forEach(order => {
      const customer = order.client_name;
      customerVisitMap.set(customer, (customerVisitMap.get(customer) || 0) + 1);
    });
    
    const newCustomers = Array.from(customerVisitMap.values()).filter(count => count === 1).length;
    const repeatCustomers = Array.from(customerVisitMap.values()).filter(count => count > 1).length;
    const totalCustomers = newCustomers + repeatCustomers;
    const retentionRate = totalCustomers === 0 ? 0 : (repeatCustomers / totalCustomers) * 100;
    
    // Average ticket price
    const thisMonthOrders = completedOrders.filter(order => 
      isThisMonth(parseISO(order.created_at))
    );
    
    const lastMonthOrders = completedOrders.filter(order => {
      const date = parseISO(order.created_at);
      return !isThisMonth(date) && isThisMonth(subDays(date, 30));
    });
    
    const averageTicketPrice = thisMonthOrders.length === 0 
      ? 0 
      : thisMonthOrders.reduce((sum, order) => sum + order.total, 0) / thisMonthOrders.length;
    
    const previousAverageTicketPrice = lastMonthOrders.length === 0 
      ? 0 
      : lastMonthOrders.reduce((sum, order) => sum + order.total, 0) / lastMonthOrders.length;
    
    const averageTicketChangePercentage = previousAverageTicketPrice === 0 
      ? 0 
      : ((averageTicketPrice - previousAverageTicketPrice) / previousAverageTicketPrice) * 100;
    
    // Staff utilization
    const stylistAppointmentMap = new Map<string, number>();
    stylists.forEach(stylist => {
      stylistAppointmentMap.set(stylist.id, 0);
    });
    
    // Count appointments for each stylist
    appointments.forEach((appointment: any) => {
      if (stylistAppointmentMap.has(appointment.stylist_id)) {
        stylistAppointmentMap.set(
          appointment.stylist_id, 
          (stylistAppointmentMap.get(appointment.stylist_id) || 0) + 1
        );
      }
    });
    
    // Calculate utilization rates (assuming 8-hour day, 30-minute slots = 16 possible appointments per day)
    const SLOTS_PER_DAY = 16;
    const staffUtilizationData = stylists.map(stylist => {
      const appointmentCount = stylistAppointmentMap.get(stylist.id) || 0;
      const rate = (appointmentCount / SLOTS_PER_DAY) * 100;
      return {
        stylistId: stylist.id,
        stylistName: stylist.name,
        rate: Math.min(rate, 100), // Cap at 100%
      };
    });
    
    const averageUtilization = staffUtilizationData.reduce((sum, item) => sum + item.rate, 0) / stylists.length;
    
    // Calculate revenue per stylist
    const stylistRevenueMap = new Map<string, number>();
    stylists.forEach(stylist => {
      stylistRevenueMap.set(stylist.id, 0);
    });
    
    // Sum revenue for each stylist from completed orders
    completedOrders.forEach(order => {
      if (stylistRevenueMap.has(order.stylist_id)) {
        stylistRevenueMap.set(
          order.stylist_id,
          (stylistRevenueMap.get(order.stylist_id) || 0) + order.total
        );
      }
    });
    
    // Format stylist revenue data
    const stylistRevenue = stylists
      .map(stylist => ({
        stylistId: stylist.id,
        stylistName: stylist.name,
        revenue: stylistRevenueMap.get(stylist.id) || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue); // Sort by revenue (highest first)
    
    // Daily sales trend for last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));
    
    const dailySalesTrend = last7Days.map(date => {
      const dayOrders = completedOrders.filter(order => isSameDay(parseISO(order.created_at), date));
      const daySales = dayOrders.reduce((sum, order) => sum + order.total, 0);
      return {
        date: format(date, 'MM/dd'),
        sales: daySales,
      };
    });
    
    return {
      todaySales,
      yesterdaySales,
      salesChangePercentage,
      todayAppointments,
      topServices,
      newCustomers,
      repeatCustomers,
      retentionRate,
      averageTicketPrice,
      previousAverageTicketPrice,
      averageTicketChangePercentage,
      staffUtilization: {
        average: averageUtilization,
        byStaff: staffUtilizationData,
      },
      dailySalesTrend,
      stylistRevenue,
    };
  };
  
  // Use query for analytics data
  const { data: analyticsSummary, refetch, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: getAnalyticsSummary,
    enabled: !loadingOrders && !loadingAppointments && !loadingServices && !loadingStylists,
    refetchInterval: settings.refreshInterval,
  });
  
  // Update dashboard settings
  const updateSettings = (newSettings: Partial<DashboardSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  return {
    analyticsSummary,
    isLoading: loadingOrders || loadingAppointments || loadingServices || loadingStylists || loadingAnalytics,
    refetchAnalytics: refetch,
    settings,
    updateSettings,
  };
} 