import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Slider, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, LinearProgress } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { api } from '../services/api';

function ClientHomeView({ user, showToast, themeMode, onTabChange }) {
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState(null);

  // SIP Calculator State
  const [monthlyInvest, setMonthlyInvest] = useState(50000);
  const [expectedYield, setExpectedYield] = useState(10);
  const [years, setYears] = useState(5);

  // Investment Dialog state
  const [openInvest, setOpenInvest] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [investForm, setInvestForm] = useState({ name: user.username, amount: 1000000, note: '' });

  const opportunities = [
    {
      id: 'opp_1',
      title: 'Pre-Leased Logistical Warehouse (Mumbai)',
      yield: '9.4% IRR',
      min: '₹10,00,000',
      description: 'Grade-A warehouse leased to leading e-commerce MNC. Stable monthly rental yields with strong capital appreciation.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'opp_2',
      title: 'Grade-A Commercial Business Office (Bangalore)',
      yield: '11.2% IRR',
      min: '₹25,00,000',
      description: 'Premium co-working and corporate hub in Tech District. Fully occupied with standard annual lease escalation clauses.',
      image: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'opp_3',
      title: 'Boutique Hospitality Resort Fund (Goa)',
      yield: '12.5% IRR',
      min: '₹15,00,000',
      description: 'Fractional ownership of luxury eco-resort operated by international hospitality brand. Dual yield of payout + stay nights.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.clients.profile(user.id);
      setClientProfile(res);
    } catch (err) {
      console.error(err);
      showToast('Error loading profile checklist', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user.id]);

  // SIP Future Value formula
  const getFutureValue = () => {
    const P = monthlyInvest;
    const r = (expectedYield / 100) / 12;
    const n = years * 12;
    if (r === 0) return P * n;
    return P * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  };

  const totalInvested = monthlyInvest * 12 * years;
  const projectedValue = getFutureValue();
  const projectedGains = Math.max(0, projectedValue - totalInvested);

  const handleOpenInvest = (opp) => {
    setSelectedOpportunity(opp);
    setInvestForm({ name: user.username, amount: parseInt(opp.min.replace(/[^\d]/g, '')) || 1000000, note: '' });
    setOpenInvest(true);
  };

  const handleRegisterInterest = async () => {
    if (!investForm.amount) {
      showToast('Please input investment amount', 'warning');
      return;
    }
    try {
      // Simulate registering interest by creating a task and audit log
      await api.tasks.create({
        title: `Asset Interest Request: ${selectedOpportunity.title}`,
        description: `Client requested allocation of ₹${investForm.amount.toLocaleString()} into ${selectedOpportunity.title}. Note: ${investForm.note}`,
        category: 'Client Meeting',
        client_id: user.id,
        due_date: (Date.now() / 1000) + 86400 * 2, // 2 days due
        status: 'Pending'
      });
      showToast('Allocation request registered! A relationship manager will call you shortly.', 'success');
      setOpenInvest(false);
    } catch (e) {
      showToast('Error registering allocation request', 'error');
    }
  };

  if (loading || !clientProfile) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  const completionPct = clientProfile.profile_completion_pct || 20;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 1. Welcome Banner */}
      <Box
        sx={{
          p: 4,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0B2545 0%, #134074 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(11, 37, 69, 0.15)'
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Poppins', sans-serif" }}>
          Welcome back, {clientProfile.personal_details?.first_name || user.username}!
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mt: 1, fontWeight: 300 }}>
          Manage your properties, inspect fractional yields, and discover premium investment cases.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
          <Button variant="contained" color="secondary" onClick={() => onTabChange('assets')} sx={{ px: 3, fontWeight: 600 }}>
            View My Ledger
          </Button>
          <Button
            variant="outlined"
            onClick={() => onTabChange('crm')}
            sx={{
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.4)',
              '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.08)' }
            }}
          >
            Advisory Desk
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const el = document.getElementById('discover-deals');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            sx={{
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.4)',
              '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.08)' }
            }}
          >
            Explore Markets
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 2. Onboarding Status Check */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Account Setup Status</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Complete the remaining items to unlock fractional capital investments.
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ width: '100%' }}>
                  <LinearProgress variant="determinate" value={completionPct} color="primary" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{completionPct}%</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon color={clientProfile.kyc?.status === 'Verified' ? 'success' : 'disabled'} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: clientProfile.kyc?.status === 'Verified' ? 'text.primary' : 'text.secondary' }}>
                    KYC Documents Verification ({clientProfile.kyc?.status || 'Pending'})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon color={clientProfile.bank_accounts?.length > 0 ? 'success' : 'disabled'} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: clientProfile.bank_accounts?.length > 0 ? 'text.primary' : 'text.secondary' }}>
                    Primary Bank Account Linked
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon color={clientProfile.nominee?.name ? 'success' : 'disabled'} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: clientProfile.nominee?.name ? 'text.primary' : 'text.secondary' }}>
                    Nominee Setup Completed
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Button
              variant="outlined"
              onClick={() => onTabChange('settings')}
              startIcon={<AssignmentTurnedInIcon />}
              sx={{ mt: 3, textTransform: 'none', fontWeight: 600 }}
            >
              Complete Profile Now
            </Button>
          </Card>
        </Grid>

        {/* 3. SIP Wealth Projection Calculator */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Investment SIP Calculator</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Project future wealth growth based on expected asset appreciation and compound rates.
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Monthly SIP Contribution: <b>₹{monthlyInvest.toLocaleString()}</b>
                  </Typography>
                  <Slider
                    value={monthlyInvest}
                    min={10000}
                    max={200000}
                    step={5000}
                    onChange={(e, val) => setMonthlyInvest(val)}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Expected Annual Yield: <b>{expectedYield}%</b>
                  </Typography>
                  <Slider
                    value={expectedYield}
                    min={5}
                    max={20}
                    step={0.5}
                    onChange={(e, val) => setExpectedYield(val)}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Investment Period: <b>{years} Years</b>
                  </Typography>
                  <Slider
                    value={years}
                    min={1}
                    max={15}
                    onChange={(e, val) => setYears(val)}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', justifyBlock: 'center', justifyContent: 'center', p: 3, backgroundColor: 'rgba(11, 37, 69, 0.02)', borderRadius: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary" display="block">Total Invested Capital</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>₹{totalInvested.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary" display="block">Estimated Appreciation Gains</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>+₹{Math.round(projectedGains).toLocaleString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block">Projected Portfolio Value</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>₹{Math.round(projectedValue).toLocaleString()}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* 4. Live Investment Opportunities Discovery Grid */}
      <Box id="discover-deals" sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "'Poppins', sans-serif" }}>Live Fractional Opportunities</Typography>
        </Box>

        <Grid container spacing={3}>
          {opportunities.map((opp) => (
            <Grid item xs={12} md={4} key={opp.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                  <img src={opp.image} alt={opp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <Box sx={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'secondary.main', color: '#0B2545', fontWeight: 700, px: 1.5, py: 0.5, borderRadius: '4px', fontSize: '0.85rem' }}>
                    {opp.yield}
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 2, p: 3 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, minHeight: '60px', fontSize: '1.05rem', lineHeight: 1.3 }}>{opp.title}</Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1.5 }}>
                      Min Investment: <b>{opp.min}</b>
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {opp.description}
                    </Typography>
                  </Box>
                  <Button variant="contained" fullWidth onClick={() => handleOpenInvest(opp)} sx={{ mt: 2 }}>
                    Invest Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 5. Advisory News Feed */}
      <Box sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <TrendingUpIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "'Poppins', sans-serif" }}>Wealth Advisory & Insights</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                Fractional Property Ownership vs REITs: Guide for 2026
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                Understand how fractional yield tokens give direct ownership control, better tax slabs, and real-time capital growth payouts compared to traditional real estate investment trusts.
              </Typography>
              <Button size="small" variant="text" sx={{ fontWeight: 600 }}>Read Article &rarr;</Button>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                Managing Capital Gains under Section 54F in India
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                Learn how you can claim tax exemption on your long-term capital gains from gold or equities by reinvesting directly into premium real estate and fractional asset class ledger properties.
              </Typography>
              <Button size="small" variant="text" sx={{ fontWeight: 600 }}>Read Article &rarr;</Button>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Invest Allocation Dialog */}
      <Dialog open={openInvest} onClose={() => setOpenInvest(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Request Allocation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Register your interest for <b>{selectedOpportunity?.title}</b>. A Relationship Manager will contact you with lease agreement deeds and bank transfer details.
            </Typography>
            <TextField
              label="Applicant Name"
              fullWidth
              size="small"
              value={investForm.name}
              onChange={e => setInvestForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              label="Investment Amount (INR)"
              type="number"
              fullWidth
              size="small"
              value={investForm.amount}
              onChange={e => setInvestForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
            />
            <TextField
              label="Notes or Special Queries"
              fullWidth
              size="small"
              multiline
              rows={3}
              value={investForm.note}
              onChange={e => setInvestForm(prev => ({ ...prev, note: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInvest(false)}>Cancel</Button>
          <Button onClick={handleRegisterInterest} variant="contained">Register Interest</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClientHomeView;
