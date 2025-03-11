import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useStockManagement } from '../../hooks/useStockManagement';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  textAlign: 'center',
  border: `2px dashed ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.background.default,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.dark,
    backgroundColor: theme.palette.action.hover,
  },
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
}));

export default function StockDataExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const { loading, error, stats, extractStockData } = useStockManagement();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      // Check if file is an Excel file
      if (
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel'
      ) {
        setFile(selectedFile);
      } else {
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    await extractStockData(file);
    setFile(null);
    
    // Clear the file input
    const fileInput = document.getElementById('stock-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Extract Stock Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload your STOCK DETAILS Excel file to extract and update your inventory data.
        The file should contain Purchase, Sales, Consumption, and Balance Stock sections.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* File Upload Area */}
      <UploadPaper sx={{ mb: 3 }}>
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <UploadFileIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Select STOCK DETAILS File
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            File must be in Excel format (.xlsx or .xls) and contain the STOCK DETAILS sheet
          </Typography>

          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
          >
            Browse Files
            <VisuallyHiddenInput
              id="stock-file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </Button>

          {file && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </Typography>
          )}
        </Box>
      </UploadPaper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {stats && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Success</AlertTitle>
          Stock data has been successfully extracted and stored!

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <StatsCard>
              <Typography variant="body2" color="text.secondary">
                Products
              </Typography>
              <Typography variant="h6">{stats.products}</Typography>
            </StatsCard>
            <StatsCard>
              <Typography variant="body2" color="text.secondary">
                Purchases
              </Typography>
              <Typography variant="h6">{stats.purchases}</Typography>
            </StatsCard>
            <StatsCard>
              <Typography variant="body2" color="text.secondary">
                Sales
              </Typography>
              <Typography variant="h6">{stats.sales}</Typography>
            </StatsCard>
            <StatsCard>
              <Typography variant="body2" color="text.secondary">
                Consumption
              </Typography>
              <Typography variant="h6">{stats.consumption}</Typography>
            </StatsCard>
          </Stack>
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          onClick={handleUpload}
          disabled={!file || loading}
          sx={{ px: 4, py: 1.5 }}
        >
          {loading ? 'Processing...' : 'Extract Stock Data'}
        </Button>
      </Box>

      <Box sx={{ mt: 4, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Note:</strong> This feature assumes compliance with local tax laws. Data extraction
          should be done periodically to keep your inventory up to date.
        </Typography>
      </Box>
    </Box>
  );
} 