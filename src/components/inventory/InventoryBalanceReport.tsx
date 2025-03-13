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
import { CSVLink } from 'react-csv';

type Order = 'asc' | 'desc';
type OrderBy = keyof BalanceStock | '';

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
      result = result.filter(item => 
        item.product_name.toLowerCase().includes(lowerQuery) ||
        item.hsn_code.toLowerCase().includes(lowerQuery) ||
        item.unit.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply low stock filter
    if (filterLowStock) {
      result = result.filter(item => 
        (item.balance_qty !== null && item.balance_qty <= lowStockThreshold)
      );
    }
    
    // Apply sorting
    if (orderBy) {
      result = result.sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];
        
        // Handle numeric fields
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return order === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle string fields
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return order === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        // Handle null values
        if (aValue === null) return order === 'asc' ? -1 : 1;
        if (bValue === null) return order === 'asc' ? 1 : -1;
        
        return 0;
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

  // Prepare CSV data for export
  const csvData = filteredStock.map(item => ({
    'Product Name': item.product_name,
    'HSN Code': item.hsn_code,
    'Unit': item.unit,
    'Balance Qty': item.balance_qty !== null ? formatNumber(item.balance_qty) : '0',
    'Balance Value': item.balance_value !== null ? formatCurrency(item.balance_value).replace('₹', '') : '0',
    'Average Rate': item.avg_rate !== null ? formatNumber(item.avg_rate) : '0',
  }));

  const csvHeaders = [
    { label: 'Product Name', key: 'Product Name' },
    { label: 'HSN Code', key: 'HSN Code' },
    { label: 'Unit', key: 'Unit' },
    { label: 'Balance Qty', key: 'Balance Qty' },
    { label: 'Balance Value', key: 'Balance Value' },
    { label: 'Average Rate', key: 'Average Rate' },
  ];

  const currentDate = new Date().toISOString().slice(0, 10);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Inventory Balance Report
        </Typography>
        <Box>
          <CSVLink 
            data={csvData} 
            headers={csvHeaders}
            filename={`inventory-report-${currentDate}.csv`}
            style={{ textDecoration: 'none' }}
          >
            <Button
              startIcon={<FileDownloadIcon />}
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            >
              Export CSV
            </Button>
          </CSVLink>
          
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

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 2, width: 300 }}
        />
        
        <Button
          size="small"
          startIcon={<FilterListIcon />}
          endIcon={<ArrowDropDownIcon />}
          onClick={handleOpenFilterMenu}
          variant={filterLowStock ? "contained" : "outlined"}
          color={filterLowStock ? "warning" : "primary"}
          sx={{ mr: 2 }}
        >
          Filters {filterLowStock && "(1)"}
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

      <TableContainer component={Paper} sx={{ width: '100%', mb: 3, boxShadow: 1 }}>
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
              filteredStock.map((item) => (
                <TableRow 
                  key={item.id}
                  hover
                >
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.hsn_code}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: item.balance_qty !== null && item.balance_qty <= lowStockThreshold 
                          ? 'medium' 
                          : 'normal'
                      }}
                    >
                      {formatNumber(item.balance_qty)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(item.avg_rate)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.balance_value)}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        item.balance_qty === null 
                          ? 'Unknown' 
                          : item.balance_qty <= 0 
                            ? 'Out of Stock' 
                            : item.balance_qty <= lowStockThreshold 
                              ? 'Low Stock' 
                              : 'In Stock'
                      }
                      size="small"
                      color={getStockStatusColor(item.balance_qty)}
                      sx={{ fontWeight: 'normal' }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 