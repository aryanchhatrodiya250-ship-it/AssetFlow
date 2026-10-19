import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Switch, FormControl, InputLabel, Select, MenuItem, Button, Divider } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import LanguageIcon from '@mui/icons-material/Language';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import QrCode2Icon from '@mui/icons-material/QrCode2';

function SettingsView({ user, showToast, themeMode }) {
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('INR (₹)');
  const [twoFactor, setTwoFactor] = useState(user.two_factor_enabled || false);
  const [showQR, setShowQR] = useState(false);

  const handle2FAChange = (e) => {
    const checked = e.target.checked;
    setTwoFactor(checked);
    
    // Save to user locally
    const localUser = JSON.parse(localStorage.getItem('assetflow_user'));
    if (localUser) {
      localUser.two_factor_enabled = checked;
      localStorage.setItem('assetflow_user', JSON.stringify(localUser));
      
      // Update in users collection
      const localUsersList = JSON.parse(localStorage.getItem('mf_users') || '[]');
      const idx = localUsersList.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        localUsersList[idx].two_factor_enabled = checked;
        localStorage.setItem('mf_users', JSON.stringify(localUsersList));
      }
    }
    
    if (checked) {
      setShowQR(true);
      showToast('Two-Factor Authentication Setup Activated', 'info');
    } else {
      setShowQR(false);
      showToast('Two-Factor Authentication Disabled', 'warning');
    }
  };

  const handleSavePreferences = () => {
    showToast('Localization preferences saved successfully', 'success');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Settings & Preferences</Typography>
        <Typography variant="body2" color="textSecondary">Configure localized parameters, theme properties, and MFA settings</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Security & 2FA */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <ShieldIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Security Settings</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Two Factor Authentication (MFA)</Typography>
                <Typography variant="caption" color="textSecondary">Requires a 6-digit OTP code from Google Authenticator on login</Typography>
              </Box>
              <Switch checked={twoFactor} onChange={handle2FAChange} />
            </Box>

            {showQR && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3, p: 2, borderRadius: 2, backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                  <Box sx={{ p: 1.5, backgroundColor: '#ffffff', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode2Icon sx={{ fontSize: '100px', color: '#0a192f' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>Scan Authenticator QR</Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                      Scan this QR code with Google Authenticator or Microsoft Authenticator app.
                    </Typography>
                    <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mb: 1 }}>
                      Secret Code: <b>JBSWY3DPEHPK3PXP</b>
                    </Typography>
                    <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                      * Use OTP "123456" for demo verifications.
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Card>
        </Grid>

        {/* Localization Preference */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <LanguageIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Localization preferences</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Interface Language</InputLabel>
                <Select
                  value={language}
                  label="Interface Language"
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <MenuItem value="English">English (United States)</MenuItem>
                  <MenuItem value="Spanish">Español (España)</MenuItem>
                  <MenuItem value="Hindi">हिन्दी (भारत)</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel>Primary Currency</InputLabel>
                <Select
                  value={currency}
                  label="Primary Currency"
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <MenuItem value="INR (₹)">INR - Indian Rupee (₹)</MenuItem>
                  <MenuItem value="USD ($)">USD - US Dollar ($)</MenuItem>
                  <MenuItem value="EUR (€)">EUR - Euro (€)</MenuItem>
                </Select>
              </FormControl>

              <Button variant="contained" startIcon={<CurrencyExchangeIcon />} onClick={handleSavePreferences}>
                Save Preferences
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SettingsView;
