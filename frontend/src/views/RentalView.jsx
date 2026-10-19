import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PaymentsIcon from '@mui/icons-material/Payments';
import ConstructionIcon from '@mui/icons-material/Construction';
import HistoryIcon from '@mui/icons-material/History';
import { api } from '../services/api';

function RentalView({ user, showToast, themeMode }) {
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [openLease, setOpenLease] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [openMaint, setOpenMaint] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [selectedLeaseHistory, setSelectedLeaseHistory] = useState(null);

  // Form states
  const [newLease, setNewLease] = useState({ property_id: '', tenant_name: '', tenant_email: '', tenant_phone: '', rent_amount: '', rent_due_day: 5, lease_start: '2026-07-24', lease_end: '2027-07-24', security_deposit: '' });
  const [payment, setPayment] = useState({ lease_id: '', amount: '', month: 'July 2026' });
  const [maint, setMaint] = useState({ lease_id: '', issue: '', cost: '' });

  const isNonEmpty = (value, maxLength = 250) => {
    const text = String(value ?? '').trim();
    return text.length > 0 && text.length <= maxLength;
  };

  const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
  const isValidDate = (value) => value && !Number.isNaN(new Date(value).getTime());

  const fetchData = async () => {
    setLoading(true);
    try {
      const leasesRes = await api.rental.list({ client_id: user.id });
      const assetsRes = await api.assets.list({ category: 'Real Estate', client_id: user.id });
      const analyticsRes = await api.rental.analytics({ client_id: user.id });
      
      setLeases(leasesRes.results);
      setProperties(assetsRes.results);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error(err);
      showToast('Error fetching rental details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleCreateLease = async () => {
    if (!newLease.property_id) {
      showToast('Please choose a property', 'warning');
      return;
    }
    if (!isNonEmpty(newLease.tenant_name, 150)) {
      showToast('Tenant name is required and must be under 150 characters', 'warning');
      return;
    }
    if (newLease.tenant_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLease.tenant_email.trim())) {
      showToast('Please enter a valid tenant email', 'warning');
      return;
    }
    if (newLease.tenant_phone && !/^\d{10}$/.test(newLease.tenant_phone.trim())) {
      showToast('Tenant phone must be exactly 10 digits', 'warning');
      return;
    }
    if (!isPositiveNumber(newLease.rent_amount)) {
      showToast('Monthly rent must be greater than 0', 'warning');
      return;
    }
    if (newLease.rent_due_day < 1 || newLease.rent_due_day > 31) {
      showToast('Rent due day must be between 1 and 31', 'warning');
      return;
    }
    if (!isValidDate(newLease.lease_start) || !isValidDate(newLease.lease_end)) {
      showToast('Lease dates must be valid', 'warning');
      return;
    }
    if (new Date(newLease.lease_end) < new Date(newLease.lease_start)) {
      showToast('Lease end cannot be before lease start', 'warning');
      return;
    }
    if (newLease.security_deposit && Number(newLease.security_deposit) < 0) {
      showToast('Security deposit cannot be negative', 'warning');
      return;
    }
    try {
      const payload = {
        ...newLease,
        rent_amount: parseFloat(newLease.rent_amount),
        rent_due_day: parseInt(newLease.rent_due_day),
        security_deposit: parseFloat(newLease.security_deposit || 0)
      };
      await api.rental.createLease(payload);
      showToast('Lease signed successfully', 'success');
      setOpenLease(false);
      fetchData();
    } catch (err) {
      showToast('Error creating lease', 'error');
    }
  };

  const handleRecordPayment = async () => {
    if (!payment.lease_id) {
      showToast('Please select a lease', 'warning');
      return;
    }
    if (!isPositiveNumber(payment.amount)) {
      showToast('Rent payment amount must be greater than 0', 'warning');
      return;
    }
    if (!isNonEmpty(payment.month, 20)) {
      showToast('Please enter a valid payment month', 'warning');
      return;
    }
    try {
      await api.rental.recordPayment({
        lease_id: payment.lease_id,
        amount: parseFloat(payment.amount),
        month: payment.month
      });
      showToast('Rent payment logged successfully', 'success');
      setOpenPay(false);
      fetchData();
    } catch (err) {
      showToast('Error recording payment', 'error');
    }
  };

  const handleRecordMaintenance = async () => {
    if (!maint.lease_id) {
      showToast('Please select a lease', 'warning');
      return;
    }
    if (!isNonEmpty(maint.issue, 250)) {
      showToast('Issue description is required and must be under 250 characters', 'warning');
      return;
    }
    if (maint.cost && Number(maint.cost) < 0) {
      showToast('Maintenance cost cannot be negative', 'warning');
      return;
    }
    try {
      await api.rental.recordMaintenance({
        lease_id: maint.lease_id,
        issue: maint.issue,
        cost: parseFloat(maint.cost || 0)
      });
      showToast('Maintenance request completed & logged in expenses', 'success');
      setOpenMaint(false);
      fetchData();
    } catch (err) {
      showToast('Error saving maintenance details', 'error');
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
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Rental Management</Typography>
          <Typography variant="body2" color="textSecondary">Track real estate occupancy, lease documents, and monthly rent receivables</Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<PaymentsIcon />} onClick={() => setOpenPay(true)}>Record Rent</Button>
          <Button variant="outlined" startIcon={<ConstructionIcon />} onClick={() => setOpenMaint(true)}>Log Maintenance</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenLease(true)}>Sign Lease</Button>
        </Box>
      </Box>

      {/* Analytics Cards Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">Occupancy Rate</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>{analytics.occupancy_rate}%</Typography>
              <Typography variant="caption" color="textSecondary">{analytics.active_leases} of {analytics.total_properties} properties occupied</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">Total Rent Collected</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{analytics.total_rent_collected.toLocaleString()}</Typography>
              <Typography variant="caption" color="success.main">Credited into core balance</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">Property Maintenance Cost</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444' }}>₹{analytics.total_maintenance_spent.toLocaleString()}</Typography>
              <Typography variant="caption" color="textSecondary">Debited from asset yields</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leases Table */}
      <Card sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Active Tenancy Ledger</Typography>
        <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>Rent & Deposit</TableCell>
                <TableCell>Due Day</TableCell>
                <TableCell>Lease Term</TableCell>
                <TableCell>Last Paid Month</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>No leases registered. Click Sign Lease to create one.</TableCell>
                </TableRow>
              ) : (
                leases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{lease.property_name || 'Cyber Towers Space'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{lease.tenant_name}</Typography>
                      <Typography variant="caption" color="textSecondary">{lease.tenant_email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{lease.rent_amount?.toLocaleString()} / mo</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Dep: {(() => {
                           const depPayments = (lease.payment_history || []).filter(p => p.month.toLowerCase().includes('deposit'));
                           const totalDep = depPayments.reduce((sum, p) => sum + p.amount, 0);
                           return totalDep > 0 ? `₹${totalDep.toLocaleString()} Paid` : `₹${(lease.security_deposit || 0).toLocaleString()} (Due)`;
                        })()}
                      </Typography>
                    </TableCell>
                    <TableCell>Day {lease.rent_due_day}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{lease.lease_start} to {lease.lease_end}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>
                      {(() => {
                         const rentPayments = (lease.payment_history || []).filter(p => !p.month.toLowerCase().includes('deposit'));
                         if (rentPayments.length === 0) {
                           return <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>No records</Typography>;
                         }
                         const lastP = rentPayments[rentPayments.length - 1];
                         return (
                           <>
                             <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>{lastP.month}</Typography>
                             <Typography variant="caption" color="textSecondary">₹{lastP.amount.toLocaleString()} Paid</Typography>
                           </>
                         );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={lease.status} size="small" color={lease.status === 'Active' ? 'success' : 'warning'} />
                        <IconButton size="small" color="primary" onClick={() => {
                          setSelectedLeaseHistory(lease);
                          setOpenHistory(true);
                        }} title="View Payment History">
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog Sign Lease */}
      <Dialog open={openLease} onClose={() => setOpenLease(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Sign New Lease Contract</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Target Real Estate Property</InputLabel>
              <Select
                value={newLease.property_id}
                label="Target Real Estate Property"
                onChange={e => setNewLease(prev => ({ ...prev, property_id: e.target.value }))}
              >
                {properties.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name} - {p.address}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              label="Tenant Business / Name" 
              fullWidth 
              size="small"
              value={newLease.tenant_name} 
              onChange={e => setNewLease(prev => ({ ...prev, tenant_name: e.target.value }))} 
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="Tenant Email" 
                  fullWidth 
                  size="small"
                  value={newLease.tenant_email} 
                  onChange={e => setNewLease(prev => ({ ...prev, tenant_email: e.target.value }))} 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Tenant Phone" 
                  fullWidth 
                  size="small"
                  value={newLease.tenant_phone} 
                  onChange={e => setNewLease(prev => ({ ...prev, tenant_phone: e.target.value }))} 
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="Monthly Rent Amount (INR)" 
                  type="number"
                  fullWidth 
                  size="small"
                  value={newLease.rent_amount} 
                  onChange={e => setNewLease(prev => ({ ...prev, rent_amount: e.target.value }))} 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Security Deposit (INR)" 
                  type="number"
                  fullWidth 
                  size="small"
                  value={newLease.security_deposit} 
                  onChange={e => setNewLease(prev => ({ ...prev, security_deposit: e.target.value }))} 
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField 
                  label="Rent Due Day" 
                  type="number"
                  fullWidth 
                  size="small"
                  value={newLease.rent_due_day} 
                  onChange={e => setNewLease(prev => ({ ...prev, rent_due_day: e.target.value }))} 
                />
              </Grid>
              <Grid item xs={4}>
                <TextField 
                  label="Lease Start" 
                  type="date"
                  fullWidth 
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={newLease.lease_start} 
                  onChange={e => setNewLease(prev => ({ ...prev, lease_start: e.target.value }))} 
                />
              </Grid>
              <Grid item xs={4}>
                <TextField 
                  label="Lease End" 
                  type="date"
                  fullWidth 
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={newLease.lease_end} 
                  onChange={e => setNewLease(prev => ({ ...prev, lease_end: e.target.value }))} 
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLease(false)}>Cancel</Button>
          <Button onClick={handleCreateLease} variant="contained">Execute Lease</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Record Rent Payment */}
      <Dialog open={openPay} onClose={() => setOpenPay(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Record Tenant Rent Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Active Lease Contract</InputLabel>
              <Select
                value={payment.lease_id}
                label="Active Lease Contract"
                onChange={e => {
                  const lease = leases.find(l => l.id === e.target.value);
                  setPayment(prev => ({ ...prev, lease_id: e.target.value, amount: lease ? lease.rent_amount : '' }));
                }}
              >
                {leases.map(l => (
                  <MenuItem key={l.id} value={l.id}>{l.tenant_name} - {l.property_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              label="Billing Month (e.g. July 2026)" 
              fullWidth 
              size="small"
              value={payment.month} 
              onChange={e => setPayment(prev => ({ ...prev, month: e.target.value }))} 
            />
            <TextField 
              label="Paid Amount (INR)" 
              type="number"
              fullWidth 
              size="small"
              value={payment.amount} 
              onChange={e => setPayment(prev => ({ ...prev, amount: e.target.value }))} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPay(false)}>Cancel</Button>
          <Button onClick={handleRecordPayment} variant="contained">Record Payment</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Log Maintenance */}
      <Dialog open={openMaint} onClose={() => setOpenMaint(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Log Property Upkeep & Maintenance</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Target Lease Space</InputLabel>
              <Select
                value={maint.lease_id}
                label="Target Lease Space"
                onChange={e => setMaint(prev => ({ ...prev, lease_id: e.target.value }))}
              >
                {leases.map(l => (
                  <MenuItem key={l.id} value={l.id}>{l.property_name} ({l.tenant_name})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              label="Upkeep Issue (e.g. Plumbing repair)" 
              fullWidth 
              size="small"
              value={maint.issue} 
              onChange={e => setMaint(prev => ({ ...prev, issue: e.target.value }))} 
            />
            <TextField 
              label="Cost Spent (INR)" 
              type="number"
              fullWidth 
              size="small"
              value={maint.cost} 
              onChange={e => setMaint(prev => ({ ...prev, cost: e.target.value }))} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMaint(false)}>Cancel</Button>
          <Button onClick={handleRecordMaintenance} variant="contained">Log Upkeep Expense</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Payment History */}
      <Dialog open={openHistory} onClose={() => setOpenHistory(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Payment History</DialogTitle>
        <DialogContent dividers>
          {(() => {
            if (!selectedLeaseHistory) return null;
            const lease = selectedLeaseHistory;
            if (!lease.payment_history || lease.payment_history.length === 0) {
              return <Typography>No payments recorded yet.</Typography>;
            }
            
            // Group payments by month (ignoring deposit)
            const rentPayments = lease.payment_history.filter(p => !p.month.toLowerCase().includes('deposit'));
            const monthlyTotals = {};
            rentPayments.forEach(p => {
              if (!monthlyTotals[p.month]) monthlyTotals[p.month] = { paid: 0, entries: [] };
              monthlyTotals[p.month].paid += p.amount;
              monthlyTotals[p.month].entries.push(p);
            });

            const expectedRent = lease.rent_amount || 0;

            const depPayments = lease.payment_history.filter(p => p.month.toLowerCase().includes('deposit'));
            const depTotal = depPayments.reduce((sum, p) => sum + p.amount, 0);
            const expectedDep = lease.security_deposit || 0;
            const depDue = expectedDep - depTotal;

            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Security Deposit Section */}
                {depPayments.length > 0 && (
                  <Card variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Security Deposit</Typography>
                      {depDue > 0 ? (
                        <Chip label={`₹${depDue.toLocaleString()} Due`} color="warning" size="small" />
                      ) : depDue < 0 ? (
                        <Chip label={`₹${Math.abs(depDue).toLocaleString()} Overpaid`} color="info" size="small" />
                      ) : (
                        <Chip label="Fully Paid" color="success" size="small" />
                      )}
                    </Box>
                    {depPayments.map((p, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < depPayments.length-1 ? '1px dashed #e2e8f0' : 'none', py: 0.5 }}>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(p.date_paid * 1000).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>₹{p.amount.toLocaleString()}</Typography>
                      </Box>
                    ))}
                  </Card>
                )}

                {/* Monthly Rent Sections */}
                {Object.entries(monthlyTotals).map(([month, data]) => {
                  const due = expectedRent - data.paid;
                  return (
                    <Card key={month} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{month}</Typography>
                        {due > 0 ? (
                          <Chip label={`₹${due.toLocaleString()} Due`} color="error" size="small" />
                        ) : due < 0 ? (
                          <Chip label={`₹${Math.abs(due).toLocaleString()} Overpaid`} color="info" size="small" />
                        ) : (
                          <Chip label="Fully Paid" color="success" size="small" />
                        )}
                      </Box>
                      {data.entries.map((p, i) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < data.entries.length-1 ? '1px dashed #e2e8f0' : 'none', py: 0.5 }}>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(p.date_paid * 1000).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>₹{p.amount.toLocaleString()}</Typography>
                        </Box>
                      ))}
                      {data.entries.length > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #e2e8f0' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>Total Paid</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>₹{data.paid.toLocaleString()}</Typography>
                        </Box>
                      )}
                    </Card>
                  )
                })}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RentalView;
