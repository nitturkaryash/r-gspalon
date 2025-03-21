import { useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Divider,
  Fade,
  Alert,
  Stack,
  Badge,
  Chip,
  Skeleton
} from '@mui/material'
import { 
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Spa as SpaIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  EmojiPeople as StylistIcon
} from '@mui/icons-material'
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics'
import { formatCurrency } from '../utils/format'
import KPICard from '../components/dashboard/KPICard'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'
import PieChart from '../components/charts/PieChart'
import GaugeChart from '../components/charts/GaugeChart'
import DashboardSettings from '../components/dashboard/DashboardSettings'

export default function Dashboard() {
  const { 
    analyticsSummary, 
    isLoading, 
    refetchAnalytics,
    settings,
    updateSettings
  } = useDashboardAnalytics();
  
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
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h1" gutterBottom sx={{ mb: 0 }}>
          Dashboard
        </Typography>
        
        <Chip 
          label="Real-time Analytics" 
          color="primary" 
          size="small"
          sx={{ 
            backgroundColor: 'primary.light',
            color: 'primary.dark',
            fontWeight: 500
          }}
        />
      </Box>
      
      {isLoading && !analyticsSummary ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      ) : !analyticsSummary ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load analytics data. Please try refreshing the dashboard.
        </Alert>
      ) : (
        <Fade in={!!analyticsSummary}>
          <Box>
            {/* Top KPI Cards */}
            <Grid container spacing={3} mb={4}>
              {settings.visibleMetrics.dailySales && (
                <Grid item xs={12} sm={6} md={4}>
                  <KPICard
                    title="Today's Sales"
                    value={analyticsSummary.todaySales}
                    changeValue={analyticsSummary.salesChangePercentage}
                    icon={<MoneyIcon />}
                    isCurrency={true}
                    tooltipText="Total sales for today, compared to yesterday"
                  />
                </Grid>
              )}
              
              {settings.visibleMetrics.appointments && (
                <Grid item xs={12} sm={6} md={4}>
                  <KPICard
                    title="Today's Appointments"
                    value={analyticsSummary.todayAppointments}
                    icon={<CalendarIcon />}
                    tooltipText="Total appointments scheduled for today"
                  />
                </Grid>
              )}
              
              {settings.visibleMetrics.averageTicket && (
                <Grid item xs={12} sm={6} md={4}>
                  <KPICard
                    title="Average Ticket"
                    value={analyticsSummary.averageTicketPrice}
                    changeValue={analyticsSummary.averageTicketChangePercentage}
                    icon={<ReceiptIcon />}
                    isCurrency={true}
                    tooltipText="Average spend per customer this month, compared to last month"
                  />
                </Grid>
              )}
            </Grid>
            
            {/* Charts and Advanced Metrics */}
            <Grid container spacing={3}>
              {/* Sales Trend Chart */}
              {settings.visibleMetrics.dailySales && (
                <Grid item xs={12} md={8}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      height: 400,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Sales Trend (Last 7 Days)
                    </Typography>
                    {settings.chartTypes.salesTrend === 'line' ? (
                      <LineChart data={salesTrendData} height={330} />
                    ) : (
                      <BarChart data={salesTrendData} height={330} />
                    )}
                  </Paper>
                </Grid>
              )}
              
              {/* Customer Retention Chart */}
              {settings.visibleMetrics.retentionRate && (
                <Grid item xs={12} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      height: 400,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Customer Retention
                    </Typography>
                    <Box textAlign="center" mb={2}>
                      <Typography variant="h3" component="div" color="primary.main">
                        {analyticsSummary.retentionRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Retention Rate
                      </Typography>
                    </Box>
                    <PieChart data={customerRetentionData} height={250} />
                  </Paper>
                </Grid>
              )}
              
              {/* Top Services */}
              {settings.visibleMetrics.topServices && (
                <Grid item xs={12} md={8}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      height: 400,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Highest Selling Services
                    </Typography>
                    <BarChart 
                      data={topServicesData} 
                      height={330} 
                      horizontal={true}
                    />
                  </Paper>
                </Grid>
              )}
              
              {/* Revenue per Stylist */}
              {settings.visibleMetrics.stylistRevenue && analyticsSummary?.stylistRevenue && (
                <Grid item xs={12} md={8}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      height: 400,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Revenue Generated per Stylist
                    </Typography>
                    <BarChart 
                      data={{
                        labels: analyticsSummary.stylistRevenue.map(item => item.stylistName),
                        datasets: [{
                          label: 'Revenue',
                          data: analyticsSummary.stylistRevenue.map(item => item.revenue),
                          backgroundColor: '#6B8E23', // Olive green to match your theme
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                          borderWidth: 1,
                        }]
                      }}
                      height={330}
                      horizontal={false}
                      currencyFormat={true}
                    />
                  </Paper>
                </Grid>
              )}
              
              {/* Staff Utilization */}
              {settings.visibleMetrics.staffUtilization && (
                <Grid item xs={12} md={4}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 3, 
                      height: 400,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Staff Utilization
                    </Typography>
                    <Box textAlign="center" mb={2}>
                      <GaugeChart 
                        value={Math.round(analyticsSummary.staffUtilization.average)} 
                        height={160}
                      />
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        mt={1}
                        sx={{ 
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          mb: 1
                        }}
                      >
                        Average Utilization Rate
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ 
                        mt: 1,
                        mb: 1.5,
                        fontWeight: 600
                      }}
                    >
                      Individual Staff Utilization
                    </Typography>
                    <Box sx={{ 
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
                    }}>
                      <Stack spacing={1.5}>
                        {analyticsSummary.staffUtilization.byStaff.map(staff => (
                          <Box key={staff.stylistId}>
                            <Box 
                              display="flex" 
                              justifyContent="space-between" 
                              mb={0.75}
                              sx={{
                                '& .MuiTypography-root': {
                                  lineHeight: 1.2
                                }
                              }}
                            >
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: '70%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {staff.stylistName}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {Math.round(staff.rate)}%
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                height: 10,
                                width: '100%',
                                backgroundColor: 'background.paper',
                                borderRadius: 3,
                                boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
                              }}
                            >
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${staff.rate}%`,
                                  backgroundColor: staff.rate < 30 
                                    ? '#f44336' 
                                    : staff.rate < 70 
                                      ? '#ff9800' 
                                      : '#4caf50',
                                  borderRadius: 3,
                                  transition: 'width 1s ease-in-out',
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </Fade>
      )}
      
      {/* Dashboard Settings Component */}
      <DashboardSettings 
        settings={settings}
        onSettingsChange={updateSettings}
        onRefresh={refetchAnalytics}
      />
    </Box>
  )
} 