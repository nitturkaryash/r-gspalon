import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Alert,
  Fade,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ContentCut, LockPerson } from '@mui/icons-material';

const LoginContainer = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #111111 0%, #000000 100%)',
  color: theme.palette.common.white,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at top right, rgba(255, 215, 0, 0.1), transparent 70%)',
    pointerEvents: 'none',
  },
}));

const GoldTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: theme.shape.borderRadius,
    '& fieldset': {
      borderColor: 'rgba(255, 215, 0, 0.3)',
      transition: 'all 0.2s ease-in-out',
    },
    '&:hover fieldset': {
      borderColor: '#FFD700',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FFD700',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: '#FFD700',
    },
  },
  '& .MuiInputAdornment-root': {
    color: 'rgba(255, 215, 0, 0.5)',
  },
}));

const LoginButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #B8860B, #FFD700)',
  color: theme.palette.common.black,
  fontWeight: 'bold',
  padding: theme.spacing(1.5, 4),
  fontSize: '1rem',
  borderRadius: theme.shape.borderRadius * 1.5,
  textTransform: 'none',
  '&:hover': {
    background: 'linear-gradient(45deg, #DAA520, #FFF8DC)',
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(218, 165, 32, 0.4)',
  },
  transition: 'all 0.3s ease-in-out',
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(4),
  '& .MuiSvgIcon-root': {
    fontSize: '4rem',
    color: '#FFD700',
    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))',
    animation: 'float 3s ease-in-out infinite',
  },
  '@keyframes float': {
    '0%, 100%': {
      transform: 'rotate(-45deg) translateY(0px)',
    },
    '50%': {
      transform: 'rotate(-45deg) translateY(-10px)',
    },
  },
}));

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(credentials);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, #000000 0%, #1a1a1a 100%)',
        padding: theme.spacing(3),
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={1000}>
          <Box>
            <LogoBox>
              <ContentCut />
            </LogoBox>
            
            <LoginContainer>
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: '#FFD700', 
                      fontWeight: 'bold', 
                      mb: 1,
                      textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                    }}
                  >
                    Welcome to R&G Salon
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      mb: 2,
                      fontWeight: 500,
                    }}
                  >
                    Admin Portal
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      maxWidth: '400px',
                      margin: '0 auto',
                    }}
                  >
                    Enter your credentials to access the salon management system
                  </Typography>
                </Box>

                {error && (
                  <Fade in>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        bgcolor: 'rgba(211, 47, 47, 0.1)',
                        color: '#ff8a80',
                        '& .MuiAlert-icon': {
                          color: '#ff8a80',
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}

                <GoldTextField
                  required
                  fullWidth
                  label="Username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  sx={{ mt: 2 }}
                />

                <GoldTextField
                  required
                  fullWidth
                  label="Password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />

                <LoginButton
                  type="submit"
                  fullWidth
                  size="large"
                  disabled={!credentials.username || !credentials.password}
                  startIcon={<LockPerson />}
                >
                  Sign In to Dashboard
                </LoginButton>

                <Typography 
                  variant="body2" 
                  align="center" 
                  sx={{ 
                    mt: 2,
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.875rem',
                  }}
                >
                  © 2024 R&G Salon. All rights reserved.
                </Typography>
              </Box>
            </LoginContainer>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
} 