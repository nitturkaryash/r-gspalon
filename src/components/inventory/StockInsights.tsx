import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useStockManagement } from '../../hooks/useStockManagement';

export default function StockInsights() {
  const theme = useTheme();
  const { loading, error, stats, processStats, fetchInsights, insights } = useStockManagement();
  const [topProducts, setTopProducts] = useState<{ name: string; value: number }[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<{ name: string; value: number }[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<{ name: string; purchases: number; sales: number; consumption: number }[]>([]);
  const [processedData, setProcessedData] = useState<any>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  useEffect(() => {
    if (insights) {
      const data = processStats();
      setProcessedData(data);
    }
  }, [insights, processStats]);

  useEffect(() => {
    if (processedData && processedData.topProducts) {
      setTopProducts(processedData.topProducts.slice(0, 5).map((p: any) => ({
        name: p.product_name,
        value: p.total_value
      })));
    }

    if (processedData && processedData.categoryDistribution) {
      setCategoryDistribution(processedData.categoryDistribution.map((c: any) => ({
        name: c.category || 'Uncategorized',
        value: c.count
      })));
    }

    if (processedData && processedData.monthlyTrends) {
      setMonthlyTrends(processedData.monthlyTrends.map((m: any) => ({
        name: m.name,
        purchases: m.purchases,
        sales: m.sales,
        consumption: m.consumption
      })));
    }
  }, [processedData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Generate colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading stock insights...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!insights) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No stock data available for insights. Please import stock data first.
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Stock Insights & Analytics
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            backgroundColor: `${theme.palette.primary.main}10`,
            borderLeft: `4px solid ${theme.palette.primary.main}`,
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Inventory Value
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
                {formatCurrency(insights?.totalInventoryValue || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Across {insights?.totalProducts || 0} products
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            backgroundColor: `${theme.palette.secondary.main}10`,
            borderLeft: `4px solid ${theme.palette.secondary.main}`,
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Monthly Purchases
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
                {formatCurrency(insights?.averagePurchaseValue * 30 || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 30 days (estimated)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            backgroundColor: `${theme.palette.success.main}10`,
            borderLeft: `4px solid ${theme.palette.success.main}`,
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Monthly Sales
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
                {formatCurrency(insights?.averageSaleValue * 30 || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 30 days (estimated)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            backgroundColor: `${theme.palette.warning.main}10`,
            borderLeft: `4px solid ${theme.palette.warning.main}`,
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Low Stock Items
              </Typography>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
                {(processedData?.lowStockItems || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Products below threshold
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Top Products by Value */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
              Top Products by Value
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={150}
                    tickFormatter={(value) => 
                      value.length > 20 ? `${value.substring(0, 18)}...` : value
                    }
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
              Category Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} Products`, 'Count']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Monthly Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
              Monthly Trends
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="purchases"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Purchases"
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke={theme.palette.success.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Sales"
                  />
                  <Line
                    type="monotone"
                    dataKey="consumption"
                    stroke={theme.palette.warning.main}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Consumption"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 