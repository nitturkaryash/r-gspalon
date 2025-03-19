import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon,
  SortByAlpha as SortIcon,
  Refresh as RefreshIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useStockManagement, BalanceStock } from '../../hooks/useStockManagement';
import { OrderBy } from '../../models/orderTypes';

type Order = 'asc' | 'desc';

interface ExtendedBalanceStock extends BalanceStock {
  product_name: string;
  hsn_code: string;
  unit: string;
  balance_qty: number;
  balance_value: number;
  avg_rate: number;
}

export default function InventoryBalanceReport() {
  const theme = useTheme();
  const { 
    loading, 
    error, 
    balanceStock, 
    fetchBalanceStock,
  } = useStockManagement();
  
  const [orderBy, setOrderBy] = useState<OrderBy>('product_name');
  const [order, setOrder] = useState<Order>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStock, setFilteredStock] = useState<BalanceStock[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [filterLowStock, setFilterLowStock] = useState(false);

  useEffect(() => {
    fetchBalanceStock();
  }, []);

  useEffect(() => {
    let result = [...balanceStock];
    
    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const extendedItem = item as ExtendedBalanceStock;
        return (
          extendedItem.product_name.toLowerCase().includes(lowerQuery) ||
          extendedItem.hsn_code.toLowerCase().includes(lowerQuery) ||
          extendedItem.unit.toLowerCase().includes(lowerQuery)
        );
      });
    }

    // Apply low stock filter
    if (filterLowStock) {
      result = result.filter((item) => {
        const extendedItem = item as ExtendedBalanceStock;
        return (
          extendedItem.balance_qty !== null && extendedItem.balance_qty <= lowStockThreshold
        );
      });
    }
    
    // Apply sorting
    if (orderBy) {
      result = [...result].sort((a, b) => {
        const aValue = (a as ExtendedBalanceStock)[orderBy as keyof ExtendedBalanceStock];
        const bValue = (b as ExtendedBalanceStock)[orderBy as keyof ExtendedBalanceStock];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        if (aValue === null || aValue === undefined) return order === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return order === 'asc' ? 1 : -1;
        
        // Use a safe comparison that handles undefined values
        if (order === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        }
      });
    }
    
    setFilteredStock(result);
  }, [balanceStock, searchQuery, orderBy, order, filterLowStock, lowStockThreshold]);

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleOpenFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilterMenu = () => {
    setAnchorEl(null);
  };

  const handleToggleLowStockFilter = () => {
    setFilterLowStock(!filterLowStock);
    handleCloseFilterMenu();
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number | null, decimals = 2) => {
    if (num === null) return '—';
    return num.toFixed(decimals);
  };

  const getStockStatusColor = (qty: number | null) => {
    if (qty === null) return 'default';
    if (qty <= 0) return 'error';
    if (qty <= lowStockThreshold) return 'warning';
    return 'success';
  };

  const downloadCsv = () => {
    const csvData = filteredStock.map(item => {
      const extendedItem = item as ExtendedBalanceStock;
      return {
        'Product Name': extendedItem.product_name,
        'HSN Code': extendedItem.hsn_code,
        'Unit': extendedItem.unit,
        'Balance Qty': extendedItem.balance_qty !== null ? formatNumber(extendedItem.balance_qty) : '0',
        'Balance Value': extendedItem.balance_value !== null ? formatCurrency(extendedItem.balance_value).replace('₹', '') : '0',
        'Average Rate': extendedItem.avg_rate !== null ? formatNumber(extendedItem.avg_rate) : '0',
      };
    });

    return csvData;
  };

  const csvHeaders = [
    { label: 'Product Name', key: 'Product Name' },
    { label: 'HSN Code', key: 'HSN Code' },
    { label: 'Unit', key: 'Unit' },
    { label: 'Balance Qty', key: 'Balance Qty' },
    { label: 'Balance Value', key: 'Balance Value' },
    { label: 'Average Rate', key: 'Average Rate' },
  ];

  const currentDate = new Date().toISOString().slice(0, 10);

  // Add this function to create a CSV file from data
  const generateCsv = (data: any[]) => {
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const escaped = ('' + row[header]).replace(/"/g, '\\"');
          return `"${escaped}"`;
        }).join(',')
      )
    ];
    return csvRows.join('\n');
  };

  const handleCsvDownload = () => {
    const csvData = downloadCsv();
    const csvString = generateCsv(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-report-${currentDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Inventory Balance Report
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleCsvDownload}
          >
            Download CSV
          </Button>
          
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            size="small"
            onClick={fetchBalanceStock}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          placeholder="Search products..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        
        <Button
          startIcon={<FilterListIcon />}
          endIcon={<ArrowDropDownIcon />}
          variant="outlined"
          size="small"
          onClick={handleOpenFilterMenu}
        >
          Filters
          {filterLowStock && (
            <Chip 
              label="Low Stock" 
              size="small" 
              color="warning" 
              sx={{ ml: 1, height: 20 }} 
            />
          )}
        </Button>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseFilterMenu}
        >
          <MenuItem onClick={handleToggleLowStockFilter}>
            <ListItemIcon>
              <WarningIcon color={filterLowStock ? "warning" : "inherit"} fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              Show only low stock ({lowStockThreshold} or less)
            </ListItemText>
          </MenuItem>
        </Menu>
        
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {filteredStock.length} products found
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: theme.shape.borderRadius }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="inventory balance table">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'product_name'}
                    direction={orderBy === 'product_name' ? order : 'asc'}
                    onClick={() => handleRequestSort('product_name')}
                  >
                    Product Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'hsn_code'}
                    direction={orderBy === 'hsn_code' ? order : 'asc'}
                    onClick={() => handleRequestSort('hsn_code')}
                  >
                    HSN Code
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'unit'}
                    direction={orderBy === 'unit' ? order : 'asc'}
                    onClick={() => handleRequestSort('unit')}
                  >
                    Unit
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'balance_qty'}
                    direction={orderBy === 'balance_qty' ? order : 'asc'}
                    onClick={() => handleRequestSort('balance_qty')}
                  >
                    Balance Qty
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'avg_rate'}
                    direction={orderBy === 'avg_rate' ? order : 'asc'}
                    onClick={() => handleRequestSort('avg_rate')}
                  >
                    Average Rate
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'balance_value'}
                    direction={orderBy === 'balance_value' ? order : 'asc'}
                    onClick={() => handleRequestSort('balance_value')}
                  >
                    Balance Value
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && filteredStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading inventory data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      No inventory data found.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {searchQuery ? 'Try adjusting your search criteria.' : 'Import stock data to view inventory balance.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStock.map((item) => {
                  const extendedItem = item as ExtendedBalanceStock;
                  return (
                    <TableRow 
                      key={extendedItem.id}
                      hover
                      sx={{
                        backgroundColor: extendedItem.balance_qty !== null && extendedItem.balance_qty <= 0 
                          ? '#fff8e1' 
                          : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {extendedItem.product_name}
                        </Box>
                      </TableCell>
                      <TableCell>{extendedItem.hsn_code}</TableCell>
                      <TableCell>{extendedItem.unit}</TableCell>
                      <TableCell align="right" sx={{
                        fontWeight: 'medium',
                        color: extendedItem.balance_qty !== null && extendedItem.balance_qty <= lowStockThreshold
                          ? 'error.main'
                          : 'inherit'
                      }}>
                        {formatNumber(extendedItem.balance_qty)}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(extendedItem.avg_rate)}</TableCell>
                      <TableCell align="right">{formatCurrency(extendedItem.balance_value)}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small"
                          label={
                            extendedItem.balance_qty === null
                              ? "Unknown"
                              : extendedItem.balance_qty <= 0
                                ? "Out of Stock"
                                : extendedItem.balance_qty <= lowStockThreshold
                                  ? "Low Stock"
                                  : "In Stock"
                          }
                          color={getStockStatusColor(extendedItem.balance_qty)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
} 