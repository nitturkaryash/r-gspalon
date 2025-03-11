import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  Inventory,
} from '@mui/icons-material'
import * as React from 'react'
import * as FramerMotion from 'framer-motion'
import { styled } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

const drawerWidth = 240

interface LayoutProps {
  children: React.ReactNode
}

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
  { text: 'Inventory', path: '/inventory', icon: <Inventory /> },
  { text: 'Members', path: '/members', icon: <CardMembership /> },
]

const ListItemStyled = styled(ListItem)(({ theme }) => ({
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.salon.olive, 0.1),
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

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

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
        flexDirection: 'row', 
        flexWrap: 'wrap',
        p: 1,
        gap: 1
      }}>
        {menuLinks.map((link) => (
          <FramerMotion.motion.div
            key={link.text}
            whileHover="hover"
            variants={menuItemVariants}
            style={{ width: 'auto', minWidth: '120px', flex: '1 1 auto' }}
          >
            <ListItemStyled
              disablePadding
              sx={{ width: '100%' }}
            >
              <ListItemButton
                component={Link}
                to={link.path}
                selected={location.pathname === link.path}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{
                  borderRadius: 1,
                  justifyContent: 'center',
                  minHeight: '48px',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 1
                }}
              >
                <MenuIconStyled
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: location.pathname === link.path ? 'primary.main' : 'inherit',
                      minWidth: 'auto',
                      mb: 0.5
                    }}
                  >
                    {link.icon}
                  </ListItemIcon>
                </MenuIconStyled>
                <ListItemText 
                  primary={link.text}
                  sx={{
                    m: 0,
                    '& .MuiListItemText-primary': {
                      color: location.pathname === link.path ? 'primary.main' : 'inherit',
                      fontWeight: location.pathname === link.path ? 600 : 400,
                      textAlign: 'center',
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </ListItemButton>
            </ListItemStyled>
          </FramerMotion.motion.div>
        ))}
      </List>
    </>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'flex', md: 'none' },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
          zIndex: (theme) => theme.zIndex.drawer + 1,
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

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
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
        }}
      >
        {children}
      </Box>
    </Box>
  )
} 