import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
  Storage as StorageIcon,
  SwapHoriz as SwapHorizIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon,
  Sync as SyncIcon,
  Receipt as ReceiptIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import { useCollections } from '../hooks/useCollections'
import type { Collection } from '../models/inventoryTypes'
import PageHeader from '../components/PageHeader'

// Import our new components
import StockDataExtractor from '../components/inventory/StockDataExtractor'
import TransactionConverter from '../components/inventory/TransactionConverter'
import InventoryBalanceReport from '../components/inventory/InventoryBalanceReport'
import StockInsights from '../components/inventory/StockInsights'
import InventoryExport from '../components/inventory/InventoryExport'

// Initial form data for collections
const initialFormData = {
  name: '',
  description: '',
}

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `inventory-tab-${index}`,
    'aria-controls': `inventory-tabpanel-${index}`,
  };
}

export default function Inventory() {
  const { collections, isLoading, createCollection, updateCollection, deleteCollection } = useCollections()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const navigate = useNavigate()
  const theme = useTheme()

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setFormData(initialFormData)
    setEditingId(null)
  }

  const handleEdit = (collection: Collection) => {
    setFormData({
      name: collection.name,
      description: collection.description,
    })
    setEditingId(collection.id)
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim()) {
      return
    }
    
    if (editingId) {
      updateCollection({ ...formData, id: editingId })
    } else {
      createCollection(formData)
    }
    
    handleClose()
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection? All products in this collection will also be deleted.')) {
      deleteCollection(id)
    }
  }

  const handleCollectionClick = (id: string) => {
    navigate(`/inventory/${id}`)
  }

  if (isLoading && tabValue === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Inventory Management"
        subtitle="Track and manage your salon's product inventory"
        icon={<InventoryIcon fontSize="large" />}
      />

      <Paper sx={{ 
        borderRadius: 1, 
        overflow: 'hidden',
        boxShadow: 1,
        mb: 3
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="inventory management tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 48,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          <Tab 
            icon={<InventoryIcon fontSize="small" />} 
            label="Inventory Balance" 
            iconPosition="start"
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<AnalyticsIcon fontSize="small" />} 
            label="Insights & Analytics" 
            iconPosition="start"
            {...a11yProps(1)} 
          />
          <Tab 
            icon={<SyncIcon fontSize="small" />} 
            label="Data Import" 
            iconPosition="start"
            {...a11yProps(2)} 
          />
          <Tab 
            icon={<SwapHorizIcon fontSize="small" />} 
            label="Transactions" 
            iconPosition="start"
            {...a11yProps(3)} 
          />
          <Tab 
            icon={<FileDownloadIcon fontSize="small" />} 
            label="Export Data" 
            iconPosition="start"
            {...a11yProps(4)} 
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Inventory Balance Tab */}
          <TabPanel value={tabValue} index={0}>
            <InventoryBalanceReport />
          </TabPanel>

          {/* Insights & Analytics Tab */}
          <TabPanel value={tabValue} index={1}>
            <StockInsights />
          </TabPanel>

          {/* Data Import Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Import Stock Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Upload your Excel inventory data to keep your stock information up-to-date.
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <StockDataExtractor />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Transactions Tab */}
          <TabPanel value={tabValue} index={3}>
            <TransactionConverter />
          </TabPanel>
          
          {/* Export Data Tab */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Export Inventory Data
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Export your inventory transactions data to Excel for analysis or record-keeping.
              </Typography>
              
              <Button
                component={Link}
                to="/inventory/export"
                variant="contained"
                startIcon={<FileDownloadIcon />}
                sx={{ mt: 2 }}
              >
                Go to Export Page
              </Button>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  )
} 