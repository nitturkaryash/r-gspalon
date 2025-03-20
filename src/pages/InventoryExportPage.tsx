import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  Inventory as InventoryIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';

const InventoryExportPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Inventory Export"
        subtitle="Export inventory transactions data to Excel"
        icon={<FileDownloadIcon fontSize="large" />}
      />

      <Paper sx={{ 
        borderRadius: 1, 
        overflow: 'hidden',
        boxShadow: 1,
        mb: 3
      }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink 
              component={Link} 
              to="/inventory"
              sx={{ display: 'flex', alignItems: 'center' }}
              underline="hover"
              color="inherit"
            >
              <InventoryIcon sx={{ mr: 0.5 }} fontSize="small" />
              Inventory
            </MuiLink>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <FileDownloadIcon sx={{ mr: 0.5 }} fontSize="small" />
              Export Transactions
            </Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ p: 3 }}>
          <Typography variant="body1" paragraph>
            This tool allows you to export all inventory transactions (purchases, sales, and salon consumption) 
            to a single Excel file with standardized column headers. The export includes detailed information 
            about each transaction, making it easy to analyze your inventory data or import it into other systems.
          </Typography>
          
          <Box sx={{ 
            p: 3, 
            textAlign: 'center',
            bgcolor: 'background.default',
            borderRadius: 1
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Export Feature Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The inventory export functionality is currently being implemented.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default InventoryExportPage; 