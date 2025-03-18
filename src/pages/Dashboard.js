import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress, Divider, Fade, Alert, Stack, Chip } from '@mui/material';
import { AttachMoney as MoneyIcon, CalendarToday as CalendarIcon, Receipt as ReceiptIcon } from '@mui/icons-material';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import KPICard from '../components/dashboard/KPICard';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';
import GaugeChart from '../components/charts/GaugeChart';
import DashboardSettings from '../components/dashboard/DashboardSettings';
export default function Dashboard() {
    const { analyticsSummary, isLoading, refetchAnalytics, settings, updateSettings } = useDashboardAnalytics();
    // Refresh data on initial load
    useEffect(() => {
        refetchAnalytics();
    }, []);
    // Prepare chart data
    const salesTrendData = analyticsSummary ? {
        labels: analyticsSummary.dailySalesTrend.map(day => day.date),
        datasets: [
            {
                label: 'Daily Sales',
                data: analyticsSummary.dailySalesTrend.map(day => day.sales),
                borderColor: '#6B8E23', // Olive green
                backgroundColor: 'rgba(107, 142, 35, 0.1)',
                tension: 0.3
            },
        ],
    } : { labels: [], datasets: [] };
    const topServicesData = analyticsSummary ? {
        labels: analyticsSummary.topServices.map(service => service.serviceName),
        datasets: [
            {
                label: 'Revenue',
                data: analyticsSummary.topServices.map(service => service.revenue),
                backgroundColor: [
                    '#6B8E23', // Olive green - highlight for top service
                    '#92AF42',
                    '#B8D058',
                    '#D6E8A0',
                    '#F0F7D4',
                ],
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderWidth: 1,
            },
        ],
    } : { labels: [], datasets: [] };
    const customerRetentionData = analyticsSummary ? {
        labels: ['Repeat Customers', 'New Customers'],
        datasets: [
            {
                label: 'Customer Distribution',
                data: [
                    analyticsSummary.repeatCustomers || 0,
                    analyticsSummary.newCustomers || 0,
                ],
                backgroundColor: [
                    '#6B8E23', // Olive green - for repeat customers
                    '#D2B48C', // Tan - for new customers
                ],
                borderColor: ['#FFFFFF', '#FFFFFF'],
                borderWidth: 1,
            },
        ],
    } : { labels: [], datasets: [] };
    return (_jsxs(Box, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsx(Typography, { variant: "h1", gutterBottom: true, sx: { mb: 0 }, children: "Dashboard" }), _jsx(Chip, { label: "Real-time Analytics", color: "primary", size: "small", sx: {
                            backgroundColor: 'primary.light',
                            color: 'primary.dark',
                            fontWeight: 500
                        } })] }), isLoading && !analyticsSummary ? (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", children: _jsx(CircularProgress, {}) })) : !analyticsSummary ? (_jsx(Alert, { severity: "error", sx: { mb: 3 }, children: "Failed to load analytics data. Please try refreshing the dashboard." })) : (_jsx(Fade, { in: !!analyticsSummary, children: _jsxs(Box, { children: [_jsxs(Grid, { container: true, spacing: 3, mb: 4, children: [settings.visibleMetrics.dailySales && (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(KPICard, { title: "Today's Sales", value: analyticsSummary.todaySales, changeValue: analyticsSummary.salesChangePercentage, icon: _jsx(MoneyIcon, {}), isCurrency: true, tooltipText: "Total sales for today, compared to yesterday" }) })), settings.visibleMetrics.appointments && (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(KPICard, { title: "Today's Appointments", value: analyticsSummary.todayAppointments, icon: _jsx(CalendarIcon, {}), tooltipText: "Total appointments scheduled for today" }) })), settings.visibleMetrics.averageTicket && (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(KPICard, { title: "Average Ticket", value: analyticsSummary.averageTicketPrice, changeValue: analyticsSummary.averageTicketChangePercentage, icon: _jsx(ReceiptIcon, {}), isCurrency: true, tooltipText: "Average spend per customer this month, compared to last month" }) }))] }), _jsxs(Grid, { container: true, spacing: 3, children: [settings.visibleMetrics.dailySales && (_jsx(Grid, { item: true, xs: 12, md: 8, children: _jsxs(Paper, { elevation: 0, sx: {
                                            p: 3,
                                            height: 400,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Sales Trend (Last 7 Days)" }), settings.chartTypes.salesTrend === 'line' ? (_jsx(LineChart, { data: salesTrendData, height: 330 })) : (_jsx(BarChart, { data: salesTrendData, height: 330 }))] }) })), settings.visibleMetrics.retentionRate && (_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsxs(Paper, { elevation: 0, sx: {
                                            p: 3,
                                            height: 400,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Customer Retention" }), _jsxs(Box, { textAlign: "center", mb: 2, children: [_jsxs(Typography, { variant: "h3", component: "div", color: "primary.main", children: [analyticsSummary.retentionRate.toFixed(1), "%"] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Retention Rate" })] }), _jsx(PieChart, { data: customerRetentionData, height: 250 })] }) })), settings.visibleMetrics.topServices && (_jsx(Grid, { item: true, xs: 12, md: 8, children: _jsxs(Paper, { elevation: 0, sx: {
                                            p: 3,
                                            height: 400,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Highest Selling Services" }), _jsx(BarChart, { data: topServicesData, height: 330, horizontal: true })] }) })), settings.visibleMetrics.stylistRevenue && analyticsSummary?.stylistRevenue && (_jsx(Grid, { item: true, xs: 12, md: 8, children: _jsxs(Paper, { elevation: 0, sx: {
                                            p: 3,
                                            height: 400,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                        }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Revenue Generated per Stylist" }), _jsx(BarChart, { data: {
                                                    labels: analyticsSummary.stylistRevenue.map(item => item.stylistName),
                                                    datasets: [{
                                                            label: 'Revenue',
                                                            data: analyticsSummary.stylistRevenue.map(item => item.revenue),
                                                            backgroundColor: '#6B8E23', // Olive green to match your theme
                                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                                            borderWidth: 1,
                                                        }]
                                                }, height: 330, horizontal: false, currencyFormat: true })] }) })), settings.visibleMetrics.staffUtilization && (_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsxs(Paper, { elevation: 0, sx: {
                                            p: 3,
                                            height: 400,
                                            borderRadius: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Staff Utilization" }), _jsxs(Box, { textAlign: "center", mb: 2, children: [_jsx(GaugeChart, { value: Math.round(analyticsSummary.staffUtilization.average), height: 160 }), _jsx(Typography, { variant: "body2", color: "text.secondary", mt: 1, sx: {
                                                            fontSize: '0.9rem',
                                                            fontWeight: 500,
                                                            mb: 1
                                                        }, children: "Average Utilization Rate" })] }), _jsx(Divider, { sx: { my: 1 } }), _jsx(Typography, { variant: "subtitle2", gutterBottom: true, sx: {
                                                    mt: 1,
                                                    mb: 1.5,
                                                    fontWeight: 600
                                                }, children: "Individual Staff Utilization" }), _jsx(Box, { sx: {
                                                    overflowY: 'auto',
                                                    flex: 1,
                                                    pr: 0.5,
                                                    '&::-webkit-scrollbar': {
                                                        width: '6px',
                                                    },
                                                    '&::-webkit-scrollbar-thumb': {
                                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                                        borderRadius: '3px',
                                                    }
                                                }, children: _jsx(Stack, { spacing: 1.5, children: analyticsSummary.staffUtilization.byStaff.map(staff => (_jsxs(Box, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", mb: 0.75, sx: {
                                                                    '& .MuiTypography-root': {
                                                                        lineHeight: 1.2
                                                                    }
                                                                }, children: [_jsx(Typography, { variant: "body2", sx: {
                                                                            maxWidth: '70%',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }, children: staff.stylistName }), _jsxs(Typography, { variant: "body2", fontWeight: "bold", children: [Math.round(staff.rate), "%"] })] }), _jsx(Box, { sx: {
                                                                    height: 10,
                                                                    width: '100%',
                                                                    backgroundColor: 'background.paper',
                                                                    borderRadius: 3,
                                                                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
                                                                }, children: _jsx(Box, { sx: {
                                                                        height: '100%',
                                                                        width: `${staff.rate}%`,
                                                                        backgroundColor: staff.rate < 30
                                                                            ? '#f44336'
                                                                            : staff.rate < 70
                                                                                ? '#ff9800'
                                                                                : '#4caf50',
                                                                        borderRadius: 3,
                                                                        transition: 'width 1s ease-in-out',
                                                                    } }) })] }, staff.stylistId))) }) })] }) }))] })] }) })), _jsx(DashboardSettings, { settings: settings, onSettingsChange: updateSettings, onRefresh: refetchAnalytics })] }));
}
