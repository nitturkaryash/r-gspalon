import { useState } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Button,
  Alert,
  Collapse,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  CalendarMonth,
  People,
  ContentCut,
  Person,
  ShoppingCart,
  PointOfSale,
  ChevronLeft,
  Storefront,
  Category,
  CardMembership,
  Logout,
  Inventory,
  Settings,
  Spa,
  Storage,
  Close as CloseIcon,
  DataObject,
  Storage as DatabaseIcon,
} from '@mui/icons-material'
import * as React from 'react'
import * as FramerMotion from 'framer-motion'
import { styled } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import { useAuth } from './AuthProvider'

// DEVELOPMENT MODE flag
const DEVELOPMENT_MODE = true;

const drawerWidth = 240

interface MenuLink {
  text: string
  path: string
  icon: React.ReactElement
}

const menuLinks: MenuLink[] = [
  { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
  { text: 'Appointments', path: '/appointments', icon: <CalendarMonth /> },
  { text: 'Clients', path: '/clients', icon: <People /> },
  { text: 'Services', path: '/services', icon: <Category /> },
  { text: 'Stylists', path: '/stylists', icon: <Person /> },
  { text: 'Orders', path: '/orders', icon: <ShoppingCart /> },
  { text: 'POS', path: '/pos', icon: <PointOfSale /> },
  { text: 'Members', path: '/members', icon: <CardMembership /> },
  { text: 'Inventory', path: '/inventory', icon: <Inventory /> },
  { text: 'Inventory Setup', path: '/inventory-setup', icon: <Settings /> },
  { text: 'Database Check', path: '/database-check', icon: <DatabaseIcon /> },
  { text: 'Local Data', path: '/local-data', icon: <DataObject /> },
]

const ListItemStyled = styled(ListItem)(({ theme }) => ({
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.salon?.olive || theme.palette.primary.main, 0.1),
    transform: 'translateY(-2px)',
  },
}))

const MenuIconStyled = styled(FramerMotion.motion.div)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const menuItemVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
}

// Simple development mode layout
export default function Layout() {
  const theme = useTheme()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDevBanner, setShowDevBanner] = useState(DEVELOPMENT_MODE)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuItemClick = (path: string) => {
    // Use window.location for navigation instead of React Router Link
    window.location.href = path
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const handleLogout = () => {
    // Clear auth tokens and redirect to login
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/login'
  }

  // Simplified user section with hardcoded development user
  const userSection = (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
          A
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Admin User
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administrator
          </Typography>
        </Box>
      </Box>
      <Button
        fullWidth
        variant="outlined"
        color="primary"
        startIcon={<Logout />}
        onClick={handleLogout}
        sx={{
          justifyContent: 'flex-start',
          px: 2,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          },
        }}
      >
        Logout
      </Button>
    </Box>
  )

  const drawer = (
    <>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: [1]
      }}>
        <Typography variant="h6" noWrap component="div" color="primary">
          R&G Salon
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeft />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        p: 1,
        gap: 1,
        flexGrow: 1
      }}>
        {menuLinks.map((link) => (
          <FramerMotion.motion.div
            key={link.text}
            whileHover="hover"
            variants={menuItemVariants}
            style={{ width: '100%' }}
          >
            <ListItemStyled
              disablePadding
              sx={{ width: '100%' }}
            >
              <ListItemButton
                onClick={() => handleMenuItemClick(link.path)}
                selected={location.pathname === link.path}
                sx={{
                  borderRadius: 1,
                  minHeight: '48px',
                  px: 2,
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: location.pathname === link.path ? 'primary.main' : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {link.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={link.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: location.pathname === link.path ? 'primary.main' : 'inherit',
                      fontWeight: location.pathname === link.path ? 600 : 400,
                    }
                  }}
                />
              </ListItemButton>
            </ListItemStyled>
          </FramerMotion.motion.div>
        ))}
      </List>
      {userSection}
    </>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Development Mode Banner */}
      <Collapse in={showDevBanner}>
        <Alert 
          severity="info"
          sx={{ 
            borderRadius: 0,
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndex.drawer + 2,
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowDevBanner(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Typography variant="body2">
            <strong>Development Mode:</strong> Using mock data. Database operations are simulated and stored in localStorage.
          </Typography>
        </Alert>
      </Collapse>

      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'flex', md: 'none' },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          top: showDevBanner ? '56px' : 0,
          transition: 'top 0.3s',
        }}
      >
        <Toolbar>
          <IconButton
            color="primary"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" color="primary">
            R&G Salon
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1 }}>
        <Box
          component="nav"
          sx={{ 
            width: { md: drawerWidth }, 
            flexShrink: { md: 0 },
            ...(showDevBanner && { 
              '& .MuiDrawer-paper': { 
                top: '56px',
                height: 'calc(100% - 56px)',
              }
            })
          }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                backgroundColor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
                ...(showDevBanner && { 
                  top: '56px',
                  height: 'calc(100% - 56px)',
                })
              },
            }}
          >
            {drawer}
          </Drawer>

          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                backgroundColor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
                ...(showDevBanner && { 
                  top: '56px',
                  height: 'calc(100% - 56px)',
                })
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            mt: { xs: 8, md: 0 },
            minHeight: '100vh',
            backgroundColor: 'background.default',
            ...(showDevBanner && isMobile && {
              mt: { xs: 'calc(56px + 64px)', md: '56px' },
            }),
            ...(showDevBanner && !isMobile && {
              mt: '56px',
            }),
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}