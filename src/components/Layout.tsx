import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
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
  CssBaseline,
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
  Logout,
} from '@mui/icons-material'
import * as React from 'react'
import * as FramerMotion from 'framer-motion'
import { styled } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'
import { useAuth } from '../hooks/useAuth'
import ThemeToggle from './ThemeToggle'

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
  { text: 'Products', path: '/products', icon: <Storefront /> },
  { text: 'Stylists', path: '/stylists', icon: <Person /> },
  { text: 'Orders', path: '/orders', icon: <ShoppingCart /> },
  { text: 'POS', path: '/pos', icon: <PointOfSale /> },
  { text: 'Inventory', path: '/inventory', icon: <Inventory /> },
  { text: 'Members', path: '/members', icon: <CardMembership /> },
]

const ListItemStyled = styled(ListItem)(({ theme }) => ({
  transition: 'all 0.2s ease-in-out',
  borderRadius: 0,
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

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}))

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  width: '100%',
  height: 'calc(100vh - 8px)',
  overflow: 'auto',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: 0,
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  padding: 0,
  boxSizing: 'border-box',
  position: 'relative',
  [theme.breakpoints.up('md')]: {
    marginLeft: `${drawerWidth}px`,
    width: `calc(100% - ${drawerWidth}px)`,
  },
}))

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  boxSizing: 'border-box',
  backgroundColor: theme.palette.background.default,
  overflow: 'visible',
  transform: 'none',
  zoom: 'normal',
  '& > *': {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box'
  },
  '& .MuiPaper-root, & .MuiCard-root, & .MuiGrid-container': {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    margin: '0 auto'
  },
  '& table': {
    width: '100%',
    tableLayout: 'fixed'
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}))

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    logout()
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
                component={Link}
                to={link.path}
                selected={location.pathname === link.path}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{
                  borderRadius: 0,
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
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, borderRadius: '50%' }}>
            {user?.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {user?.username}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Administrator
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
            Dark Mode
          </Typography>
          <ThemeToggle />
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
            borderRadius: 0,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </>
  )

  return (
    <Box sx={{ 
      display: 'flex', 
      width: '100vw',
      height: '100vh',
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      overflow: 'hidden',
      position: 'relative',
      boxSizing: 'border-box',
      margin: 0,
      padding: 0
    }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'flex', md: 'none' },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderRadius: 0,
          ...(mobileOpen && {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: `${drawerWidth}px`,
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
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
              '& .MuiTypography-root': {
                color: 'text.primary',
              },
              '& .MuiTypography-colorTextSecondary': {
                color: 'text.secondary',
              },
              '& .MuiAvatar-root': {
                bgcolor: 'primary.main',
              },
              '& .MuiListItemIcon-root': {
                color: 'text.primary',
              },
              '& .MuiSvgIcon-root': {
                color: 'inherit',
              },
              '& .MuiButtonBase-root:hover': {
                backgroundColor: alpha(theme.palette.salon.olive, 0.1),
              },
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          open={mobileOpen}
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
              '& .MuiTypography-root': {
                color: 'text.primary',
              },
              '& .MuiTypography-colorTextSecondary': {
                color: 'text.secondary',
              },
              '& .MuiAvatar-root': {
                bgcolor: 'primary.main',
              },
              '& .MuiListItemIcon-root': {
                color: 'text.primary',
              },
              '& .MuiSvgIcon-root': {
                color: 'inherit',
              },
              '& .MuiButtonBase-root:hover': {
                backgroundColor: alpha(theme.palette.salon.olive, 0.1),
              },
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Main open={mobileOpen}>
        <DrawerHeader />
        <ContentContainer>
          {children || <Outlet />}
        </ContentContainer>
      </Main>
    </Box>
  )
}