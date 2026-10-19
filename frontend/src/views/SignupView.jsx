import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Grid, Link, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Divider, InputAdornment, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { api } from '../services/api';

function SignupView({ onSignup, themeMode, onToggleAuthType }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Client');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [openWelcome, setOpenWelcome] = useState(false);
  const [assignedAdvisor, setAssignedAdvisor] = useState(null);
  const [signupResponse, setSignupResponse] = useState(null);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !phone) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,12}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be 8-12 characters and include at least one letter and one number.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.auth.signup({
        username,
        email,
        password,
        phone,
        role
      });
      if (res.assigned_advisor) {
        setAssignedAdvisor(res.assigned_advisor);
        setSignupResponse(res);
        setOpenWelcome(true);
      } else {
        onSignup(res.user);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeClose = () => {
    setOpenWelcome(false);
    if (signupResponse) {
      onSignup(signupResponse.user);
    }
    navigate('/');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '420px', p: 2 }}>
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
              Join AssetFlow
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Start managing digital & physical assets today
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSignupSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username"
              type="text"
              fullWidth
              required
              size="small"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
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
            <TextField
              label="Phone Number"
              type="tel"
              fullWidth
              required
              size="small"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />


            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ py: 1.2, fontWeight: 700, mt: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
          </Box>

          <Typography variant="body2" align="center" color="textSecondary">
            Already have an account?{' '}
            {onToggleAuthType ? (
              <Link onClick={(e) => { e.preventDefault(); onToggleAuthType(); }} href="#" color="primary" sx={{ fontWeight: 600, cursor: 'pointer' }}>
                Sign In
              </Link>
            ) : (
              <Link component={RouterLink} to="/login" color="primary" sx={{ fontWeight: 600 }}>
                Sign In
              </Link>
            )}
          </Typography>
        </CardContent>
      </Card>

      {/* Welcome & Assigned Advisor Modal */}
      <Dialog open={openWelcome} onClose={handleWelcomeClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pt: 3, pb: 1, fontFamily: "'Poppins', sans-serif" }}>
          Welcome to AssetFlow! 🎉
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', px: 3, pb: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Thank you for registering. You have been assigned a dedicated Private Wealth Advisor to guide you through your asset management and investment goals.
          </Typography>
          
          <Box 
            sx={{ 
              p: 2.5, 
              backgroundColor: 'rgba(11, 37, 69, 0.04)', 
              borderRadius: '12px', 
              border: '1px solid rgba(11, 37, 69, 0.08)',
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1.5,
              mb: 1
            }}
          >
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
              YOUR DEDICATED WEALTH ADVISOR
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0B2545', fontFamily: "'Outfit', sans-serif" }}>
              {assignedAdvisor?.name}
            </Typography>
            <Divider sx={{ opacity: 0.6 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>📞 <b>{assignedAdvisor?.phone}</b></Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>✉️ <b>{assignedAdvisor?.email}</b></Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
          <Button 
            onClick={handleWelcomeClose} 
            variant="contained" 
            fullWidth 
            sx={{ fontWeight: 700, py: 1.2, textTransform: 'none', borderRadius: '8px' }}
          >
            Go to My Workspace
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SignupView;
