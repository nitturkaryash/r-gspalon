import { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  InputAdornment, 
  IconButton,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Lock as LockIcon, 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon 
} from '@mui/icons-material';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && !isLoading) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      // If successful, the auth context will update and redirect
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo credentials for testing
  const handleDemoLogin = async () => {
    setEmail('demo@example.com');
    setPassword('password123');
    // Auto-fill the form for demo, user still needs to click login
  };

  // Backdoor login for testing (bypasses authentication)
  const handleTestLogin = async () => {
    // Store a fake session in localStorage to simulate authentication
    localStorage.setItem('salon_demo_auth', JSON.stringify({
      isAuthenticated: true,
      user: {
        id: 'demo-user-id',
        email: 'demo@example.com',
        user_metadata: {
          full_name: 'Demo User'
        }
      }
    }));
    
    // Force reload to apply the fake session
    window.location.href = '/dashboard';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: theme.shadows[10],
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              mb: 4,
              color: theme.palette.primary.main 
            }}
          >
            Salon Management
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
              <Link 
                href="#"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  handleDemoLogin();
                }}
              >
                Use demo account
              </Link>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Box>
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2, mb: 2, py: 1.5 }}
              disabled={isSubmitting || isLoading}
              onClick={() => handleTestLogin()}
            >
              Test Login (Bypass Auth)
            </Button>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2, mb: 2, py: 1.5 }}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} Salon Management System
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 