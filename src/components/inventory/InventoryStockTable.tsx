import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  AddShoppingCartRounded,
  ShoppingCartRounded,
  LocalMallRounded,
  SearchRounded
} from '@mui/icons-material';
import { BalanceStock } from '../../models/inventoryTypes';

interface InventoryStockTableProps {
  balanceStock: BalanceStock[];
  onEditStock: (productId: string, type: string) => void;
}

const InventoryStockTable: React.FC<InventoryStockTableProps> = ({ 
  balanceStock, 
  onEditStock 
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Filter and sort the balance stock
  const filteredStock = balanceStock
    .filter(item => {
      const product = item.product as any;
      if (!product) return false;
      
      const searchString = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchString) ||
        product.hsn_code.toLowerCase().includes(searchString)
      );
    })
    .sort((a, b) => {
      const productA = a.product as any;
      const productB = b.product as any;
      if (!productA || !productB) return 0;
      return productA.name.localeCompare(productB.name);
    });

  // Calculate total stats
  const totalQuantity = filteredStock.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = filteredStock.reduce((sum, item) => sum + item.invoice_value, 0);

  // Pagination
  const paginatedStock = filteredStock.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Current Stock: {filteredStock.length} Products
          <Chip 
            label={`${totalQuantity.toFixed(2)} Units`} 
            color="primary" 
            size="small" 
            sx={{ ml: 1 }} 
          />
          <Chip 
            label={`₹${totalValue.toFixed(2)}`} 
            color="secondary" 
            size="small" 
            sx={{ ml: 1 }} 
          />
        </Typography>
        
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="inventory stock table">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>HSN Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>UOM</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Quantity</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Taxable Value</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>GST Amount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Total Value</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    {searchTerm ? 'No products matching search criteria' : 'No stock available'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedStock.map((row) => {
                const product = row.product as any;
                if (!product) return null;
                
                const gstAmount = row.cgst + row.sgst + row.igst;
                
                return (
                  <TableRow key={row.id} hover>
                    <TableCell component="th" scope="row">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.hsn_code}</TableCell>
                    <TableCell>{product.units}</TableCell>
                    <TableCell align="right">{row.qty.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{row.taxable_value.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{gstAmount.toFixed(2)}</TableCell>
                    <TableCell align="right">₹{row.invoice_value.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        size="small"
                        title="Add Purchase"
                        onClick={() => onEditStock(product.id, 'purchase')}
                      >
                        <AddShoppingCartRounded />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        size="small"
                        title="Add Sale"
                        onClick={() => onEditStock(product.id, 'sale')}
                      >
                        <ShoppingCartRounded />
                      </IconButton>
                      <IconButton
                        color="info"
                        size="small"
                        title="Add Consumption"
                        onClick={() => onEditStock(product.id, 'consumption')}
                      >
                        <LocalMallRounded />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredStock.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default InventoryStockTable; 