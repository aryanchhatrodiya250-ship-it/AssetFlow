import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Grid, Link, CircularProgress, Alert, InputAdornment, IconButton, Avatar } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { api } from '../services/api';

function LoginView({ onLogin, themeMode, onToggleAuthType }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please input email and password');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = { email, password };
      if (twoFactorRequired) {
        payload.otp = otp;
      }
      
      const res = await api.auth.login(payload);
      if (res.two_factor_required) {
        setTwoFactorRequired(true);
        setLoading(false);
        return;
      }
      
      onLogin(res.user);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials or login failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '400px', p: 2 }}>
      <Card>
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Brand Heading */}
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #0B2545 0%, #C5A059 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#ffffff',
                mx: 'auto',
                mb: 2
              }}
            >
              AF
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
              Sign In to AssetFlow
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Wealth & Asset Operations Center
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLoginSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!twoFactorRequired ? (
              <>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  size="small"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                
                <Link component={RouterLink} to="/forgot" variant="caption" align="right" color="primary">
                  Forgot Password?
                </Link>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: '#0a192f', width: 48, height: 48, mb: 1 }}>
                  <SecurityIcon />
                </Avatar>
                <Typography variant="subtitle2" align="center">Two Factor Authentication Required</Typography>
                <Typography variant="caption" color="textSecondary" align="center">
                  Please input the 6-digit OTP code from your authenticator app.
                </Typography>
                <TextField
                  label="MFA OTP Verification Code"
                  type="text"
                  fullWidth
                  size="small"
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ py: 1.2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={24} /> : (twoFactorRequired ? 'Verify Authenticator' : 'Secure Login')}
            </Button>
          </Box>

          <Typography variant="body2" align="center" color="textSecondary">
            New to AssetFlow?{' '}
            {onToggleAuthType ? (
              <Link onClick={(e) => { e.preventDefault(); onToggleAuthType(); }} href="#" color="primary" sx={{ fontWeight: 600, cursor: 'pointer' }}>
                Create Account
              </Link>
            ) : (
              <Link component={RouterLink} to="/signup" color="primary" sx={{ fontWeight: 600 }}>
                Create Account
              </Link>
            )}
          </Typography>
          

        </CardContent>
      </Card>
    </Box>
  );
}

export default LoginView;
