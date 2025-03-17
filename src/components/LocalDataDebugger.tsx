import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

interface LocalDataDebuggerProps {
  tableName: string;
  title?: string;
  showRefreshButton?: boolean;
}

export default function LocalDataDebugger({ 
  tableName, 
  title = 'Local Data', 
  showRefreshButton = true 
}: LocalDataDebuggerProps) {
  const [data, setData] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [tableName, refreshCount]);

  const loadData = () => {
    const storageKey = `local_${tableName}`;
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      try {
        setData(JSON.parse(storedData));
      } catch (error) {
        console.error(`Error parsing ${tableName} data:`, error);
        setData([]);
      }
    } else {
      setData([]);
    }
  };

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={toggleExpanded}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {title} - {tableName}
          </Typography>
        </Box>
        {showRefreshButton && (
          <Button 
            size="small" 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh}
            variant="outlined"
          >
            Refresh
          </Button>
        )}
      </Box>
      
      <Collapse in={expanded}>
        <Box sx={{ mt: 1 }}>
          {data.length > 0 ? (
            <pre style={{ 
              overflow: 'auto', 
              maxHeight: '300px', 
              backgroundColor: '#f1f1f1', 
              padding: '8px', 
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <Alert severity="info">No data available for {tableName}</Alert>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
} 