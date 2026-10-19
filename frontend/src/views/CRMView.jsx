import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Tabs, Tab, TextField, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, CircularProgress, Checkbox } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { api } from '../services/api';

function CRMView({ user, showToast, themeMode }) {
  const isClient = user.role === 'Client';
  const [activeTab, setActiveTab] = useState(0);
  const [leads, setLeads] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState(null);

  // Dialog States
  const [openLead, setOpenLead] = useState(false);
  const [openMtg, setOpenMtg] = useState(false);
  const [openReschedule, setOpenReschedule] = useState(false);
  const [rescheduleMtg, setRescheduleMtg] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date_time: '', notes: '' });
  const [openCancel, setOpenCancel] = useState(false);
  const [cancelMtgId, setCancelMtgId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form States
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', status: 'Prospect', notes: '' });
  const [mtgForm, setMtgForm] = useState({ title: '', client_id: user.id || 'usr_4', date_time: '2026-07-25T11:00', duration: 30, notes: '', type: 'Call' });

  const isNonEmpty = (value, maxLength = 250) => {
    const text = String(value ?? '').trim();
    return text.length > 0 && text.length <= maxLength;
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
  const isValidPhone = (value) => /^\d{10}$/.test(String(value ?? '').trim());
  const isValidDateTime = (value) => value && !Number.isNaN(new Date(value).getTime());

  const fetchData = async () => {
    setLoading(true);
    let leadsRes = [];
    if (!isClient) {
      try {
        leadsRes = await api.crm.leads();
      } catch (e) {
        console.warn("Leads fetch notice", e);
      }
    }
    
    let mtgRes = [];
    try {
      mtgRes = await api.crm.meetings();
    } catch (e) {
      console.warn("Meetings fetch notice", e);
    }

    let tasksRes = [];
    try {
      tasksRes = await api.tasks.list();
    } catch (e) {
      console.warn("Tasks fetch notice", e);
    }

    if (isClient) {
      try {
        const profile = await api.clients.profile(user.id);
        setClientProfile(profile);
      } catch (e) {
        console.warn("Profile fetch notice", e);
      }
    }

    const loadedLeads = Array.isArray(leadsRes) ? leadsRes : (leadsRes?.results || []);
    const loadedMtgs = Array.isArray(mtgRes) ? mtgRes : (mtgRes?.results || []);
    const loadedTasks = Array.isArray(tasksRes) ? tasksRes : (tasksRes?.results || []);

    setLeads(loadedLeads);
    setMeetings(loadedMtgs);
    setTasks(loadedTasks);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLead = async () => {
    if (!isNonEmpty(leadForm.name, 150)) {
      showToast('Lead name is required and must be under 150 characters', 'warning');
      return;
    }
    if (!isValidEmail(leadForm.email)) {
      showToast('Please enter a valid email address', 'warning');
      return;
    }
    if (leadForm.phone && !isValidPhone(leadForm.phone)) {
      showToast('Phone number must be exactly 10 digits', 'warning');
      return;
    }
    try {
      await api.crm.createLead(leadForm);
      showToast('Lead profile created', 'success');
      setOpenLead(false);
      fetchData();
    } catch (err) {
      showToast('Error creating lead', 'error');
    }
  };

  const handleCreateMeeting = async () => {
    if (!isNonEmpty(mtgForm.title, 150)) {
      showToast('Consultation title is required and must be under 150 characters', 'warning');
      return;
    }
    if (mtgForm.duration && (Number(mtgForm.duration) < 1 || Number(mtgForm.duration) > 480)) {
      showToast('Duration must be between 1 and 480 minutes', 'warning');
      return;
    }
    if (mtgForm.date_time && !isValidDateTime(mtgForm.date_time)) {
      showToast('Please enter a valid meeting date and time', 'warning');
      return;
    }
    if (mtgForm.date_time) {
      const selectedDate = new Date(mtgForm.date_time);
      if (selectedDate < new Date()) {
        showToast('Meeting cannot be scheduled in the past', 'warning');
        return;
      }
    }
    try {
      const parsedDate = mtgForm.date_time ? new Date(mtgForm.date_time).getTime() / 1000 : (Date.now() / 1000 + 86400);
      const payload = {
        id: 'mtg_' + Date.now(),
        title: mtgForm.title,
        type: mtgForm.type || 'Call',
        duration: mtgForm.duration || 30,
        notes: mtgForm.notes || 'Private wealth advisory session',
        client_id: user.id,
        date_time: isNaN(parsedDate) ? (Date.now() / 1000 + 86400) : parsedDate
      };
      await api.crm.createMeeting(payload);
      showToast('Advisory call requested! A confirmation email has been sent.', 'success');
      setOpenMtg(false);
      setMtgForm({ title: '', client_id: user.id, date_time: '2026-07-26T11:00', duration: 30, notes: '', type: 'Call' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReschedule = (mtg) => {
    setRescheduleMtg(mtg);
    const dateObj = mtg.date_time ? new Date(mtg.date_time * 1000) : new Date();
    const isoString = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setRescheduleForm({ date_time: isoString, notes: mtg.notes || '' });
    setOpenReschedule(true);
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleMtg || !rescheduleForm.date_time) {
      showToast('Please select a new date and time', 'warning');
      return;
    }
    if (!isValidDateTime(rescheduleForm.date_time)) {
      showToast('Please select a valid date and time', 'warning');
      return;
    }
    const selectedDate = new Date(rescheduleForm.date_time);
    if (selectedDate < new Date()) {
      showToast('Meeting cannot be rescheduled to the past', 'warning');
      return;
    }
    try {
      const newTimestamp = new Date(rescheduleForm.date_time).getTime() / 1000;
      await api.crm.updateMeeting(rescheduleMtg.id, {
        date_time: newTimestamp,
        notes: rescheduleForm.notes
      });
      showToast('Meeting rescheduled successfully!', 'success');
      setOpenReschedule(false);
      setRescheduleMtg(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Error rescheduling meeting', 'error');
    }
  };

  const handleOpenCancelDialog = (id) => {
    setCancelMtgId(id);
    setCancelReason('');
    setOpenCancel(true);
  };

  const handleConfirmCancelMeeting = async () => {
    if (!cancelMtgId) return;
    if (cancelReason && !isNonEmpty(cancelReason, 250)) {
      showToast('Cancellation reason must be valid text', 'warning');
      return;
    }
    try {
      await api.crm.deleteMeeting(cancelMtgId, { reason: cancelReason });
      showToast('Consultation cancelled successfully', 'info');
      setOpenCancel(false);
      setCancelMtgId(null);
      setCancelReason('');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Error cancelling meeting', 'error');
    }
  };

  const handleUpdateTask = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      const localTasks = JSON.parse(localStorage.getItem('mf_tasks') || '[]');
      const idx = localTasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        localTasks[idx].status = nextStatus;
        localStorage.setItem('mf_tasks', JSON.stringify(localTasks));
        showToast(`Task status changed to ${nextStatus}`, 'success');
        fetchData();
      }
    } catch (e) {
      showToast('Error modifying task status', 'error');
    }
  };

  const moveLeadPipeline = (leadId, currentStatus) => {
    const statuses = ['Prospect', 'Contacted', 'Proposal', 'Won', 'Lost'];
    const idx = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(idx + 1) % statuses.length];
    
    const localLeads = JSON.parse(localStorage.getItem('mf_crm_leads') || '[]');
    const leadIdx = localLeads.findIndex(l => l.id === leadId);
    if (leadIdx !== -1) {
      localLeads[leadIdx].status = nextStatus;
      localStorage.setItem('mf_crm_leads', JSON.stringify(localLeads));
      showToast(`Lead moved to: ${nextStatus}`, 'info');
      fetchData();
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
            {isClient ? 'Advisory Desk & Relationship Manager' : 'CRM & Planner'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isClient ? 'Connect with your dedicated wealth advisor, book 1-on-1 consultations, and track portfolio action items.' : 'Manage client prospects pipeline, schedule calls, and resolve regulatory tasks'}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          {!isClient && <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenLead(true)}>Add Lead</Button>}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenMtg(true)}>
            {isClient ? 'Book Advisory Call' : 'Schedule Meeting'}
          </Button>
        </Box>
      </Box>

      {/* Dedicated Relationship Manager Card for Clients */}
      {isClient && (
        <Card sx={{ p: 4, background: 'linear-gradient(135deg, #0B2545 0%, #134074 100%)', color: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(11, 37, 69, 0.15)' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="caption" sx={{ color: '#C5A059', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                YOUR DEDICATED PRIVATE WEALTH ADVISOR
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, fontFamily: "'Poppins', sans-serif" }}>
                {clientProfile?.assigned_advisor?.name || "Assigning Advisor..."}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mb: 2 }}>
                AssetFlow Dedicated Wealth Advisor
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>📞 <b>{clientProfile?.assigned_advisor?.phone || "+91 99000 12345"}</b></Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>✉️ <b>{clientProfile?.assigned_advisor?.email || "advisor@assetflow.com"}</b></Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>📍 <b>Wealth Operations Desk</b></Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={() => setOpenMtg(true)} 
                sx={{ fontWeight: 700, px: 3, py: 1.2, textTransform: 'none', borderRadius: '8px' }}
              >
                Schedule Consultation
              </Button>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Tabs Menu */}
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} color="primary" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {!isClient && <Tab label="Leads Pipeline" sx={{ fontWeight: 600 }} />}
        <Tab label={isClient ? "Scheduled Advisory Consultations" : "Interactions & Meetings"} sx={{ fontWeight: 600 }} />
        <Tab label={isClient ? "My Action Items & Checklist" : "Tasks & Reminders Checklist"} sx={{ fontWeight: 600 }} />
      </Tabs>

      {/* Tab Panel 1: Kanban Board (Staff Only) */}
      {!isClient && activeTab === 0 && (
        <Grid container spacing={2}>
          {['Prospect', 'Contacted', 'Proposal', 'Won'].map((stage) => {
            const stageLeads = leads.filter(l => l.status === stage);
            return (
              <Grid item xs={12} sm={6} md={3} key={stage}>
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: themeMode === 'dark' ? '#112240' : '#f1f5f9', minHeight: '300px' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', color: stage === 'Won' ? 'success.main' : 'text.primary' }}>
                    {stage} ({stageLeads.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {stageLeads.map(l => (
                      <Card 
                        key={l.id} 
                        onClick={() => moveLeadPipeline(l.id, l.status)}
                        sx={{ 
                          p: 1.5,
                          cursor: 'pointer',
                          backgroundColor: themeMode === 'dark' ? '#081729' : '#ffffff',
                          borderLeft: `3px solid ${stage === 'Won' ? '#10b981' : (stage === 'Proposal' ? '#e5c158' : '#38bdf8')}`,
                          '&:hover': { transform: 'scale(1.02)' }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{l.name}</Typography>
                        <Typography variant="caption" color="textSecondary" display="block">{l.email}</Typography>
                        <Typography variant="caption" color="textSecondary" display="block">{l.phone}</Typography>
                        {l.notes && (
                          <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
                            "{l.notes.substring(0, 40)}..."
                          </Typography>
                        )}
                        <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
                          Click to move stage
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Tab Panel 2: Meetings list */}
      {((!isClient && activeTab === 1) || (isClient && activeTab === 0)) && (
        <Card sx={{ p: 2 }}>
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Meeting Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Scheduled Date</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Summaries & Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">No consultations logged.</TableCell></TableRow>
                ) : (
                  meetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{m.title}</TableCell>
                      <TableCell><Chip label={m.type} size="small" variant="outlined" color="primary" /></TableCell>
                      <TableCell>{new Date(m.date_time * 1000).toLocaleString()}</TableCell>
                      <TableCell>{m.duration} mins</TableCell>
                      <TableCell sx={{ fontStyle: 'italic' }}>{m.notes || '-'}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button size="small" variant="outlined" color="primary" onClick={() => handleOpenReschedule(m)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                            Reschedule
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleOpenCancelDialog(m.id)} sx={{ textTransform: 'none', fontWeight: 600 }}>
                            Cancel
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab Panel 3: Tasks Checklists */}
      {((!isClient && activeTab === 2) || (isClient && activeTab === 1)) && (
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Tasks Checklist</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {tasks.length === 0 ? (
              <Typography variant="body2" color="textSecondary" align="center">All cleared!</Typography>
            ) : (
              tasks.map((t) => (
                <Box 
                  key={t.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 1.5, 
                    borderRadius: 2,
                    backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    borderLeft: `4px solid ${t.status === 'Completed' ? '#10b981' : '#e5c158'}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Checkbox
                      icon={<RadioButtonUncheckedIcon />}
                      checkedIcon={<CheckCircleIcon color="success" />}
                      checked={t.status === 'Completed'}
                      onChange={() => handleUpdateTask(t.id, t.status)}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, textDecoration: t.status === 'Completed' ? 'line-through' : 'none', color: t.status === 'Completed' ? 'text.secondary' : 'text.primary' }}>
                        {t.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">{t.description}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip label={t.category} size="small" variant="outlined" />
                    <Typography variant="caption" color="textSecondary">
                      Due: {new Date(t.due_date * 1000).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Card>
      )}

      {/* Dialog Add Lead */}
      <Dialog open={openLead} onClose={() => setOpenLead(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Add Wealth Client Lead</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Prospect Name" 
              fullWidth 
              size="small"
              value={leadForm.name} 
              onChange={e => setLeadForm(prev => ({ ...prev, name: e.target.value }))} 
            />
            <TextField 
              label="Email Address" 
              fullWidth 
              size="small"
              value={leadForm.email} 
              onChange={e => setLeadForm(prev => ({ ...prev, email: e.target.value }))} 
            />
            <TextField 
              label="Phone Number" 
              fullWidth 
              size="small"
              value={leadForm.phone} 
              onChange={e => setLeadForm(prev => ({ ...prev, phone: e.target.value }))} 
            />
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={leadForm.status}
                label="Status"
                onChange={e => setLeadForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="Prospect">Prospect</MenuItem>
                <MenuItem value="Contacted">Contacted</MenuItem>
                <MenuItem value="Proposal">Proposal</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Interaction Notes" 
              fullWidth 
              size="small"
              multiline
              rows={2}
              value={leadForm.notes} 
              onChange={e => setLeadForm(prev => ({ ...prev, notes: e.target.value }))} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLead(false)}>Cancel</Button>
          <Button onClick={handleCreateLead} variant="contained">Create Lead</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Add Meeting */}
      <Dialog open={openMtg} onClose={() => setOpenMtg(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Schedule Client Meeting</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Meeting Topic / Subject" 
              fullWidth 
              size="small"
              value={mtgForm.title} 
              onChange={e => setMtgForm(prev => ({ ...prev, title: e.target.value }))} 
            />
            <FormControl fullWidth size="small">
              <InputLabel>Meeting Medium</InputLabel>
              <Select
                value={mtgForm.type}
                label="Meeting Medium"
                onChange={e => setMtgForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="Call">Phone Call</MenuItem>
                <MenuItem value="Email">Email Followup</MenuItem>
                <MenuItem value="In-Person">In-Person Meeting</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                value={(mtgForm.date_time || '').split('T')[0] || ''}
                onChange={e => {
                  const newDate = e.target.value;
                  const newTime = (mtgForm.date_time || '').split('T')[1]?.substring(0, 5) || '09:00';
                  setMtgForm(prev => ({ ...prev, date_time: `${newDate}T${newTime}` }));
                }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Time</InputLabel>
                <Select
                  value={((mtgForm.date_time || '').split('T')[1] || '').substring(0, 5) || '09:00'}
                  label="Time"
                  onChange={e => {
                    const newDate = (mtgForm.date_time || '').split('T')[0] || new Date().toISOString().slice(0, 10);
                    const newTime = e.target.value;
                    setMtgForm(prev => ({ ...prev, date_time: `${newDate}T${newTime}` }));
                  }}
                >
                  {(() => {
                    const slots = [];
                    const isToday = ((mtgForm.date_time || '').split('T')[0] || '') === new Date().toISOString().slice(0, 10);
                    const now = new Date();
                    for (let h = 9; h <= 17; h++) {
                      for (let m = 0; m < 60; m += 30) {
                        if (isToday && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()))) continue;
                        const hrStr = h.toString().padStart(2, '0');
                        const mnStr = m.toString().padStart(2, '0');
                        slots.push(<MenuItem key={`${hrStr}:${mnStr}`} value={`${hrStr}:${mnStr}`}>{`${h === 12 ? 12 : h % 12}:${mnStr} ${h >= 12 ? 'PM' : 'AM'}`}</MenuItem>);
                      }
                    }
                    return slots.length ? slots : <MenuItem value="09:00" disabled>No slots available today</MenuItem>;
                  })()}
                </Select>
              </FormControl>
            </Box>
            <TextField 
              label="Expected Duration (Minutes)" 
              type="number"
              fullWidth 
              size="small"
              inputProps={{ min: 1 }}
              value={mtgForm.duration} 
              onChange={e => setMtgForm(prev => ({ ...prev, duration: e.target.value }))} 
            />
            <TextField 
              label="Advisory Notes" 
              fullWidth 
              size="small"
              multiline
              rows={2}
              value={mtgForm.notes} 
              onChange={e => setMtgForm(prev => ({ ...prev, notes: e.target.value }))} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMtg(false)}>Cancel</Button>
          <Button onClick={handleCreateMeeting} variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Consultation Dialog */}
      <Dialog open={openReschedule} onClose={() => setOpenReschedule(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reschedule Advisory Consultation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Selecting a new time slot for: <b>{rescheduleMtg?.title}</b>
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="New Date"
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                value={(rescheduleForm.date_time || '').split('T')[0] || ''}
                onChange={e => {
                  const newDate = e.target.value;
                  const newTime = (rescheduleForm.date_time || '').split('T')[1]?.substring(0, 5) || '09:00';
                  setRescheduleForm(prev => ({ ...prev, date_time: `${newDate}T${newTime}` }));
                }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>New Time</InputLabel>
                <Select
                  value={((rescheduleForm.date_time || '').split('T')[1] || '').substring(0, 5) || '09:00'}
                  label="New Time"
                  onChange={e => {
                    const newDate = (rescheduleForm.date_time || '').split('T')[0] || new Date().toISOString().slice(0, 10);
                    const newTime = e.target.value;
                    setRescheduleForm(prev => ({ ...prev, date_time: `${newDate}T${newTime}` }));
                  }}
                >
                  {(() => {
                    const slots = [];
                    const isToday = ((rescheduleForm.date_time || '').split('T')[0] || '') === new Date().toISOString().slice(0, 10);
                    const now = new Date();
                    for (let h = 9; h <= 17; h++) {
                      for (let m = 0; m < 60; m += 30) {
                        if (isToday && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()))) continue;
                        const hrStr = h.toString().padStart(2, '0');
                        const mnStr = m.toString().padStart(2, '0');
                        slots.push(<MenuItem key={`${hrStr}:${mnStr}`} value={`${hrStr}:${mnStr}`}>{`${h === 12 ? 12 : h % 12}:${mnStr} ${h >= 12 ? 'PM' : 'AM'}`}</MenuItem>);
                      }
                    }
                    return slots.length ? slots : <MenuItem value="09:00" disabled>No slots available today</MenuItem>;
                  })()}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Updated Advisory Notes / Reason for Reschedule"
              type="text"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={rescheduleForm.notes}
              onChange={(e) => setRescheduleForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenReschedule(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmReschedule} color="primary">
            Confirm Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={openCancel} onClose={() => setOpenCancel(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Cancel Advisory Consultation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Are you sure you want to cancel this meeting? This action cannot be undone.
            </Typography>
            <TextField
              label="Reason for cancellation"
              type="text"
              fullWidth
              size="small"
              multiline
              rows={3}
              placeholder="e.g. Schedule conflict, client request"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCancel(false)}>No, Keep Meeting</Button>
          <Button variant="contained" onClick={handleConfirmCancelMeeting} color="error">
            Yes, Cancel Meeting
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CRMView;
