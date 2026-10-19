import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, LinearProgress, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemIcon, ListItemText, Chip, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SecurityIcon from '@mui/icons-material/Security';
import CloseIcon from '@mui/icons-material/Close';
import { api } from '../services/api';

function PortfolioView({ user, showToast, themeMode }) {
  const [goals, setGoals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [openGoal, setOpenGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', category: 'Retirement', target_amount: '', current_amount: '', target_date: '2040-12-31', monthly_investment: '', client_id: user.id });

  const fetchData = async () => {
    setLoading(true);
    try {
      const goalsRes = await api.goals.list(user.id);
      const analyticsRes = await api.ai.predictions(user.id);
      
      setGoals(goalsRes);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error(err);
      showToast('Error loading portfolio stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount) {
      showToast('Please specify goal title and target amount', 'warning');
      return;
    }
    try {
      const payload = {
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
        current_amount: parseFloat(newGoal.current_amount || 0),
        monthly_investment: parseFloat(newGoal.monthly_investment || 0)
      };
      await api.goals.create(payload);
      showToast('New financial goal launched!', 'success');
      setOpenGoal(false);
      fetchData();
    } catch (err) {
      showToast('Error registering goal', 'error');
    }
  };

  const handleAddGoalSavings = async (id, currentSaved, increment) => {
    try {
      const goalToUpdate = goals.find(g => g.id === id);
      if (goalToUpdate) {
        const updatedGoal = {
          ...goalToUpdate,
          current_amount: parseFloat(currentSaved) + parseFloat(increment)
        };
        await api.goals.update(id, updatedGoal);
        showToast('Savings added to goal', 'success');
        fetchData();
      }
    } catch(e) {
      console.error(e);
      showToast('Error saving progress', 'error');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Are you sure you want to delete this financial goal?')) {
      try {
        await api.goals.delete(id);
        showToast('Financial goal removed', 'info');
        fetchData();
      } catch (err) {
        console.error(err);
        showToast('Error removing goal', 'error');
      }
    }
  };

  if (loading || !analytics) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Portfolio & Goals</Typography>
          <Typography variant="body2" color="textSecondary">Risk alignment analysis, target rebalancing advices, and goal builders</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenGoal(true)} sx={{ ml: 'auto' }}>
          Create New Goal
        </Button>
      </Box>

      {/* Diversification & Risk Analytics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <SecurityIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Risk Analysis</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Calculated Portfolio Risk Rating</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#e5c158' }}>{analytics.recommendation_engine.risk_profile}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Portfolio Health Status</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{analytics.portfolio_health_score}/100</Typography>
                  <Chip label={analytics.portfolio_health_status} color="success" size="small" sx={{ fontWeight: 600 }} />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Projected Growth Metrics</Typography>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Est. Value (1 Yr)</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{(analytics.predicted_monthly_income_6_months * 12 * 1.09).toLocaleString(undefined, {maximumFractionDigits:0})}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Expected Return (5 Yrs)</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#10b981' }}>+53.4%</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <ShowChartIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Diversification Rebalancer</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {analytics.market_trend_summary}
            </Typography>
            
            <Typography variant="caption" color="primary" sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 1 }}>
              Recommended Adjustments
            </Typography>
            <List dense>
              {analytics.recommendation_engine.recommended_assets.map((asset, idx) => (
                <ListItem key={idx} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32, color: '#10b981' }}><CheckCircleOutlineIcon /></ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{asset.name}</Typography>} 
                    secondary={asset.reason} 
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Goals List */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Financial Goal Trackers</Typography>
          <Grid container spacing={3}>
            {goals.length === 0 ? (
              <Grid item xs={12}>
                <Card sx={{ p: 4, textPosition: 'center' }}>
                  <Typography variant="body1" color="textSecondary" align="center">No active goals found. Click Create New Goal to get started.</Typography>
                </Card>
              </Grid>
            ) : (
              goals.map((goal) => {
                const pct = Math.min(goal.progress_pct || 0, 100);
                return (
                  <Grid item xs={12} md={6} key={goal.id}>
                    <Card sx={{ p: 3, position: 'relative' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteGoal(goal.id)}
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'text.secondary', zIndex: 2 }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pr: 2 }}>
                        <Box>
                          <Chip label={goal.category} size="small" color="secondary" sx={{ mb: 1 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>{goal.name}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>{pct}%</Typography>
                          <Typography variant="caption" color="textSecondary">Target: {goal.target_date}</Typography>
                        </Box>
                      </Box>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={pct} 
                        color={pct >= 75 ? 'success' : (pct >= 40 ? 'primary' : 'warning')} 
                        sx={{ height: 8, borderRadius: 4, mb: 2 }}
                      />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Invested</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{goal.current_amount.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Target Capital</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{goal.target_amount.toLocaleString()}</Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="outlined" onClick={() => handleAddGoalSavings(goal.id, goal.current_amount, goal.monthly_investment)}>
                          Add SIP (₹{goal.monthly_investment.toLocaleString()})
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Goal Creation Dialog */}
      <Dialog open={openGoal} onClose={() => setOpenGoal(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Define Financial Target Goal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Goal Title (e.g. Vacation in Swiss)" 
              fullWidth 
              size="small"
              value={newGoal.name} 
              onChange={e => setNewGoal(prev => ({ ...prev, name: e.target.value }))} 
            />
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={newGoal.category}
                label="Category"
                onChange={e => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="Buy House">Buy House</MenuItem>
                <MenuItem value="Retirement">Retirement</MenuItem>
                <MenuItem value="Child Education">Child Education</MenuItem>
                <MenuItem value="Car">Car</MenuItem>
                <MenuItem value="Vacation">Vacation</MenuItem>
                <MenuItem value="Business Expansion">Business Expansion</MenuItem>
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="Target Capital (INR)" 
                  type="number"
                  fullWidth 
                  size="small"
                  value={newGoal.target_amount} 
                  onChange={e => setNewGoal(prev => ({ ...prev, target_amount: e.target.value }))} 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Initial Capital (INR)" 
                  type="number"
                  fullWidth 
                  size="small"
                  value={newGoal.current_amount} 
                  onChange={e => setNewGoal(prev => ({ ...prev, current_amount: e.target.value }))} 
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="Monthly Contribution" 
                  type="number"
                  fullWidth 
                  size="small"
                  value={newGoal.monthly_investment} 
                  onChange={e => setNewGoal(prev => ({ ...prev, monthly_investment: e.target.value }))} 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Target Date" 
                  type="date"
                  fullWidth 
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={newGoal.target_date} 
                  onChange={e => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))} 
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGoal(false)}>Cancel</Button>
          <Button onClick={handleCreateGoal} variant="contained">Launch Goal</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PortfolioView;
