import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid,
  Divider,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import LocalDataDebugger from '../components/LocalDataDebugger';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// List of tables in localStorage
const LOCAL_STORAGE_TABLES = [
  'profiles',
  'services',
  'appointments',
  'stylists',
  'clients',
  'orders'
];

export default function LocalDataTest() {
  const [selectedTable, setSelectedTable] = useState('services');
  const [operation, setOperation] = useState('select');
  const [queryParams, setQueryParams] = useState({
    column: 'id',
    value: '',
    updateData: '{}'
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshDebugger, setRefreshDebugger] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleTableChange = (event: SelectChangeEvent) => {
    setSelectedTable(event.target.value);
    // Reset result and error
    setResult(null);
    setError(null);
  };

  const handleOperationChange = (event: SelectChangeEvent) => {
    setOperation(event.target.value);
    // Reset result and error
    setResult(null);
    setError(null);
  };

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQueryParams({
      ...queryParams,
      [name]: value
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const executeQuery = async () => {
    try {
      setError(null);
      setResult(null);
      
      let response;
      
      switch (operation) {
        case 'select':
          response = await supabase
            .from(selectedTable)
            .select()
            .eq(queryParams.column, queryParams.value);
          break;
          
        case 'insert':
          try {
            const insertData = JSON.parse(queryParams.updateData);
            response = await supabase
              .from(selectedTable)
              .insert(insertData);
          } catch (e) {
            throw new Error(`Invalid JSON for insert: ${e instanceof Error ? e.message : String(e)}`);
          }
          break;
          
        case 'update':
          try {
            const updateData = JSON.parse(queryParams.updateData);
            response = await supabase
              .from(selectedTable)
              .update(updateData)
              .eq(queryParams.column, queryParams.value);
          } catch (e) {
            throw new Error(`Invalid JSON for update: ${e instanceof Error ? e.message : String(e)}`);
          }
          break;
          
        case 'delete':
          response = await supabase
            .from(selectedTable)
            .delete()
            .eq(queryParams.column, queryParams.value);
          break;
          
        default:
          throw new Error('Invalid operation');
      }
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setResult(response.data);
      setSnackbar({
        open: true,
        message: `Operation ${operation} completed successfully`,
        severity: 'success'
      });
      
      // Refresh the debugger
      setRefreshDebugger(prev => prev + 1);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error occurred');
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : 'Unknown error occurred',
        severity: 'error'
      });
    }
  };

  // Helper function to generate example data for insert/update
  const generateExampleData = () => {
    let exampleData: any = {};
    
    switch (selectedTable) {
      case 'services':
        exampleData = {
          name: `Service ${Math.floor(Math.random() * 1000)}`,
          description: 'Example service description',
          duration: 30,
          price: 5000,
          category: 'Example',
          active: true
        };
        break;
        
      case 'clients':
        exampleData = {
          profile_id: uuidv4(),
          phone: '555-123-4567',
          preferences: 'Example preferences',
          last_visit: new Date().toISOString()
        };
        break;
        
      case 'appointments':
        exampleData = {
          client_id: '1',
          stylist_id: '1',
          service_id: '1',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          status: 'scheduled',
          notes: 'Example appointment',
          paid: false
        };
        break;
        
      default:
        exampleData = {
          name: 'Example',
          description: 'Example description'
        };
    }
    
    setQueryParams({
      ...queryParams,
      updateData: JSON.stringify(exampleData, null, 2)
    });
  };

  return (
    <Box>
      <PageHeader title="Local Data Test">
        <Alert severity="info" sx={{ mb: 2 }}>
          This page allows you to test CRUD operations with localStorage data and verify routing.
        </Alert>
      </PageHeader>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Test Operations</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="table-select-label">Table</InputLabel>
                  <Select
                    labelId="table-select-label"
                    value={selectedTable}
                    label="Table"
                    onChange={handleTableChange}
                  >
                    {LOCAL_STORAGE_TABLES.map(table => (
                      <MenuItem key={table} value={table}>{table}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="operation-select-label">Operation</InputLabel>
                  <Select
                    labelId="operation-select-label"
                    value={operation}
                    label="Operation"
                    onChange={handleOperationChange}
                  >
                    <MenuItem value="select">Select</MenuItem>
                    <MenuItem value="insert">Insert</MenuItem>
                    <MenuItem value="update">Update</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {(operation === 'select' || operation === 'update' || operation === 'delete') && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Column"
                      name="column"
                      value={queryParams.column}
                      onChange={handleParamChange}
                      margin="normal"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Value"
                      name="value"
                      value={queryParams.value}
                      onChange={handleParamChange}
                      margin="normal"
                    />
                  </Grid>
                </>
              )}
              
              {(operation === 'insert' || operation === 'update') && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">Data (JSON)</Typography>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={generateExampleData}
                    >
                      Generate Example
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    name="updateData"
                    value={queryParams.updateData}
                    onChange={handleParamChange}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={executeQuery}
                  fullWidth
                >
                  Execute {operation}
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Result</Typography>
            
            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : result ? (
              <pre style={{ 
                overflow: 'auto', 
                maxHeight: '300px', 
                backgroundColor: '#f1f1f1', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '0.75rem'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Execute an operation to see results
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Current Data State</Typography>
          <LocalDataDebugger 
            tableName={selectedTable} 
            title="Current Table Data" 
            key={`${selectedTable}-${refreshDebugger}`}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>Related Tables</Typography>
          {LOCAL_STORAGE_TABLES.filter(table => table !== selectedTable).map(table => (
            <LocalDataDebugger 
              key={`${table}-${refreshDebugger}`}
              tableName={table}
              title="Related Table"
            />
          ))}
        </Grid>
      </Grid>
      
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