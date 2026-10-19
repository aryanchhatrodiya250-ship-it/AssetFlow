import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, Button, TextField, Select, MenuItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Divider, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../services/api';

function ProfileView({ user, showToast, themeMode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Edit Personal Details Dialog state
  const [openEdit, setOpenEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', pan: '', aadhaar: ''
  });

  // Add Bank Account Dialog state
  const [openBank, setOpenBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_name: '', account_number: '', ifsc_code: '', account_type: 'Savings', balance: 50000
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.clients.profile(user.id);
      setProfile(res);
      if (res.personal_details) {
        setEditForm({
          first_name: res.personal_details.first_name || '',
          last_name: '',
          email: res.personal_details.email || user.email || '',
          phone: res.personal_details.phone || '',
          address: res.personal_details.address || '',
          pan: res.personal_details.pan || '',
          aadhaar: res.personal_details.aadhaar || ''
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading profile details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user.id]);

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = {
        ...profile,
        personal_details: {
          ...profile.personal_details,
          first_name: editForm.first_name,
          last_name: '',
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
          pan: editForm.pan,
          aadhaar: editForm.aadhaar
        }
      };
      await api.client.updateProfile(updatedProfile);
      setProfile(updatedProfile);
      setOpenEdit(false);
      showToast('Profile details updated successfully', 'success');
    } catch (err) {
      showToast('Error saving profile changes', 'error');
    }
  };

  const handleAddBank = async () => {
    if (!bankForm.bank_name || !bankForm.account_number || !bankForm.ifsc_code || !bankForm.account_type) {
      showToast('Please fill out all bank fields', 'warning');
      return;
    }
    try {
      const updatedProfile = {
        ...profile,
        bank_accounts: [
          ...(profile.bank_accounts || []),
          {
            ...bankForm,
            balance: parseFloat(bankForm.balance) || 0
          }
        ]
      };
      await api.client.updateProfile(updatedProfile);
      setProfile(updatedProfile);
      setOpenBank(false);
      setBankForm({ bank_name: '', account_number: '', ifsc_code: '', account_type: 'Savings', balance: 50000 });
      showToast('New bank account linked successfully', 'success');
    } catch (err) {
      showToast('Error adding bank account', 'error');
    }
  };

  if (loading || !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>My Private Wealth Profile</Typography>
        <Typography variant="body2" color="textSecondary">Manage your KYC verification compliance, personal records, and linked bank accounts</Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Avatar & Overview */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Account Card */}
            <Card sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: '16px' }}>
              <Avatar sx={{ width: 90, height: 90, bgcolor: 'primary.main', mb: 2, fontSize: '2.5rem', fontWeight: 700 }}>
                {profile.personal_details?.first_name?.charAt(0) || user.username.charAt(0)}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {profile.personal_details?.first_name || user.username}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {user.email}
              </Typography>
              <Chip 
                label={profile.kyc?.status === 'Verified' ? 'KYC Verified' : 'KYC Pending Setup'} 
                color={profile.kyc?.status === 'Verified' ? 'success' : 'warning'}
                size="small"
                sx={{ fontWeight: 700, borderRadius: '6px' }}
              />
            </Card>

            {/* Risk Profile Card */}
            <Card sx={{ p: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Wealth Risk Strategy</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                {profile.risk_profile || 'Moderate Balanced Growth'}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Assets are distributed across secure logistical warehouses, premium commercial assets, and liquid interest instruments for optimized cash yields.
              </Typography>
            </Card>
          </Box>
        </Grid>

        {/* Right Column - Profile details & Bank accounts */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Personal Records Card */}
            <Card sx={{ p: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <BadgeIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Personal Verification Records</Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<EditIcon />} 
                  onClick={() => setOpenEdit(true)}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                >
                  Modify Details
                </Button>
              </Box>

              <Grid container spacing={2}>
                {[
                  { label: 'Name', value: profile.personal_details?.first_name || user.username },
                  { label: 'Phone Number', value: profile.personal_details?.phone || 'No phone registered' },
                  { label: 'Permanent Address', value: profile.personal_details?.address || 'No address registered', fullWidth: true },
                  { label: 'PAN Card Number', value: profile.personal_details?.pan || 'Not provided' },
                  { label: 'Aadhaar Identification', value: profile.personal_details?.aadhaar || 'Not provided' }
                ].map((item, idx) => (
                  <Grid item xs={12} sm={item.fullWidth ? 12 : 6} key={idx}>
                    <Typography variant="caption" color="textSecondary" display="block">{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{item.value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Card>

            {/* Bank Accounts Card */}
            <Card sx={{ p: 3, borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AccountBalanceIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Linked Private Bank Accounts</Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<AddIcon />} 
                  onClick={() => setOpenBank(true)}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                >
                  Link Bank
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(!profile.bank_accounts || profile.bank_accounts.length === 0) ? (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>No bank accounts linked yet.</Typography>
                ) : (
                  profile.bank_accounts.map((bank, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        p: 2, 
                        borderRadius: '10px', 
                        backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{bank.bank_name}</Typography>
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                          A/C: **** {bank.account_number.slice(-4)} | IFSC: {bank.ifsc_code}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>
                        ₹{bank.balance.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Edit Details Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Modify Profile Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField 
              label="Name" 
              fullWidth 
              size="small" 
              value={editForm.first_name} 
              onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
            />
            <TextField 
              label="Email Address" 
              fullWidth 
              size="small" 
              value={editForm.email} 
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField 
              label="Phone Number" 
              fullWidth 
              size="small" 
              value={editForm.phone} 
              onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
            />
            <TextField 
              label="Permanent Address" 
              fullWidth 
              size="small" 
              multiline 
              rows={2} 
              value={editForm.address} 
              onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="PAN Card Number" 
                  fullWidth 
                  size="small" 
                  value={editForm.pan} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, pan: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Aadhaar Number" 
                  fullWidth 
                  size="small" 
                  value={editForm.aadhaar} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, aadhaar: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProfile}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Add Bank Account Dialog */}
      <Dialog open={openBank} onClose={() => setOpenBank(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Link Private Bank Account</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField 
              label="Bank Name" 
              fullWidth 
              size="small" 
              value={bankForm.bank_name} 
              onChange={(e) => setBankForm(prev => ({ ...prev, bank_name: e.target.value }))}
            />
            <TextField 
              label="Account Number" 
              fullWidth 
              size="small" 
              value={bankForm.account_number} 
              onChange={(e) => setBankForm(prev => ({ ...prev, account_number: e.target.value }))}
            />
            <TextField 
              label="IFSC Code" 
              fullWidth 
              size="small" 
              value={bankForm.ifsc_code} 
              onChange={(e) => setBankForm(prev => ({ ...prev, ifsc_code: e.target.value }))}
            />
            <Select
              fullWidth
              size="small"
              value={bankForm.account_type}
              onChange={(e) => setBankForm(prev => ({ ...prev, account_type: e.target.value }))}
            >
              <MenuItem value="Savings">Savings</MenuItem>
              <MenuItem value="Current">Current</MenuItem>
            </Select>
            <TextField 
              label="Initial Linked Balance (₹)" 
              type="number" 
              fullWidth 
              size="small" 
              value={bankForm.balance} 
              onChange={(e) => setBankForm(prev => ({ ...prev, balance: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenBank(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddBank}>Link Account</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ProfileView;
