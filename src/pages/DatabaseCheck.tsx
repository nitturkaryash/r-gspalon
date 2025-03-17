import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import { v4 as uuidv4 } from 'uuid';

// Development mode flag
const DEVELOPMENT_MODE = true;

// List of tables in localStorage
const LOCAL_STORAGE_TABLES = [
  'profiles',
  'services',
  'appointments',
  'stylists',
  'clients',
  'orders'
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function DatabaseCheck() {
  const [value, setValue] = useState(0);
  const [localData, setLocalData] = useState<Record<string, any[]>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editTable, setEditTable] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load data from localStorage
  useEffect(() => {
    const loadedData: Record<string, any[]> = {};
    
    LOCAL_STORAGE_TABLES.forEach(table => {
      const storageKey = `local_${table}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        try {
          loadedData[table] = JSON.parse(storedData);
        } catch (error) {
          console.error(`Error parsing ${table} data:`, error);
          loadedData[table] = [];
        }
      } else {
        loadedData[table] = [];
      }
    });
    
    setLocalData(loadedData);
  }, []);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleEditClick = (item: any, table: string) => {
    setEditItem({ ...item });
    setEditTable(table);
    setIsEditing(true);
  };

  const handleAddClick = (table: string) => {
    // Create a new empty item with just an ID
    const newItem = { 
      id: uuidv4(),
      created_at: new Date().toISOString()
    };
    setEditItem(newItem);
    setEditTable(table);
    setIsEditing(true);
  };

  const handleDeleteClick = (id: string, table: string) => {
    // Filter out the item with the given ID
    const updatedData = localData[table].filter(item => item.id !== id);
    
    // Update local state
    setLocalData({
      ...localData,
      [table]: updatedData
    });
    
    // Save to localStorage
    localStorage.setItem(`local_${table}`, JSON.stringify(updatedData));
    
    // Show success message
    setSnackbar({
      open: true,
      message: `Item deleted from ${table}`,
      severity: 'success'
    });
  };

  const handleDialogClose = () => {
    setIsEditing(false);
    setEditItem(null);
  };

  const handleSave = () => {
    if (!editItem || !editTable) return;
    
    const isNewItem = !localData[editTable].some(item => item.id === editItem.id);
    let updatedData;
    
    if (isNewItem) {
      // Add new item
      updatedData = [...localData[editTable], editItem];
    } else {
      // Update existing item
      updatedData = localData[editTable].map(item => 
        item.id === editItem.id ? editItem : item
      );
    }
    
    // Update local state
    setLocalData({
      ...localData,
      [editTable]: updatedData
    });
    
    // Save to localStorage
    localStorage.setItem(`local_${editTable}`, JSON.stringify(updatedData));
    
    // Close dialog
    setIsEditing(false);
    setEditItem(null);
    
    // Show success message
    setSnackbar({
      open: true,
      message: isNewItem ? `New item added to ${editTable}` : `Item updated in ${editTable}`,
      severity: 'success'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditItem({
      ...editItem,
      [name]: value
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Function to render edit dialog fields based on the table
  const renderEditFields = () => {
    if (!editItem) return null;
    
    // Get all keys from the item
    const keys = Object.keys(editItem);
    
    // Add common fields that should be present in all items
    const commonFields = ['id', 'created_at'];
    const allKeys = Array.from(new Set([...commonFields, ...keys]));
    
    return allKeys.map(key => (
      <TextField
        key={key}
        margin="dense"
        name={key}
        label={key}
        type="text"
        fullWidth
        variant="outlined"
        value={editItem[key] || ''}
        onChange={handleInputChange}
        disabled={key === 'id'} // Disable editing of ID
        sx={{ mb: 2 }}
      />
    ));
  };

  // Function to clear all data for a table
  const handleClearTable = (table: string) => {
    // Clear the table data
    setLocalData({
      ...localData,
      [table]: []
    });
    
    // Save to localStorage
    localStorage.setItem(`local_${table}`, JSON.stringify([]));
    
    // Show success message
    setSnackbar({
      open: true,
      message: `All data cleared from ${table}`,
      severity: 'success'
    });
  };

  return (
    <Box>
      <PageHeader title="Database Check">
        {DEVELOPMENT_MODE && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Development Mode: All data is stored in localStorage. You can add, edit, or delete data here.
          </Alert>
        )}
      </PageHeader>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {LOCAL_STORAGE_TABLES.map((table, index) => (
            <Tab key={table} label={table} id={`tab-${index}`} />
          ))}
        </Tabs>

        {LOCAL_STORAGE_TABLES.map((table, index) => (
          <TabPanel key={table} value={value} index={index}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">{table} Table</Typography>
              <Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={() => handleAddClick(table)}
                  sx={{ mr: 1 }}
                >
                  Add New
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={() => handleClearTable(table)}
                >
                  Clear All
                </Button>
              </Box>
            </Box>
            
            {localData[table] && localData[table].length > 0 ? (
              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label={`${table} table`} size="small">
                  <TableHead>
                    <TableRow>
                      {Object.keys(localData[table][0]).map(key => (
                        <TableCell key={key}>{key}</TableCell>
                      ))}
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localData[table].map((row) => (
                      <TableRow key={row.id}>
                        {Object.keys(localData[table][0]).map(key => (
                          <TableCell key={`${row.id}-${key}`}>
                            {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] || '')}
                          </TableCell>
                        ))}
                        <TableCell>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleEditClick(row, table)}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDeleteClick(row.id, table)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ mb: 2 }}>No data available</Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Add New" to create your first entry in this table.
                </Typography>
              </Box>
            )}
          </TabPanel>
        ))}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem && editItem.id ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent>
          {renderEditFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 