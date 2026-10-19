import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, Button, Avatar, Chip, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, List, ListItem, ListItemText, ListItemAvatar } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SupermonIcon from '@mui/icons-material/SupervisorAccount';

import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { api } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

function DashboardView({ user, showToast, themeMode }) {
  const isClient = user.role === 'Client';
  
  // States
  const [stats, setStats] = useState(null);
  const [assetsList, setAssetsList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (isClient) {
          const profile = await api.client.getProfile(user.id);
          const assetsRes = await api.assets.list();
          const statements = await api.accounting.statements(user.id);
          const tasksRes = await api.tasks.list();
          const aiRes = await api.ai.predictions(user.id);

          setStats({
            profile,
            assets: assetsRes.results,
            statements,
            tasks: tasksRes,
            ai: aiRes
          });
        } else {
          // Admin/Staff fetching
          const assetsRes = await api.assets.list();
          const tasksRes = await api.tasks.list();
          
          // Get audit logs fallback
          let logs = [];
          try {
            const logsRes = await axios.get('http://localhost:8000/api/auth/history');
            logs = logsRes.data;
          } catch(e) {
            logs = JSON.parse(localStorage.getItem('mf_audit_logs') || '[]');
          }

          setStats({
            assets: assetsRes.results,
            tasks: tasksRes,
            auditLogs: logs
          });
        }
      } catch (err) {
        console.error("Dashboard fetching error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user.role]);

  if (loading || !stats) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', height: '80vh' }}>
        <Typography variant="h6" align="center" color="textSecondary">Assembling Wealth Dashboard...</Typography>
        <LinearProgress color="primary" sx={{ width: '300px', mx: 'auto', borderRadius: 4 }} />
      </Box>
    );
  }

  // Graph Data Configurations
  const primaryColor = themeMode === 'dark' ? '#C5A059' : '#0B2545';
  const secondaryColor = themeMode === 'dark' ? '#E2E8F0' : '#C5A059';

  const lineChartData = {
    labels: ['Q3 25', 'Q4 25', 'Q1 26', 'Q2 26', 'Current'],
    datasets: [{
      label: isClient ? 'Net Worth (INR)' : 'AUM growth (INR)',
      data: isClient 
        ? [21500000, 22200000, 23000000, 23800000, 24550000]
        : [142000000, 165000000, 192000000, 218000000, 247000000],
      borderColor: primaryColor,
      backgroundColor: primaryColor + '11',
      fill: true,
      tension: 0.4
    }]
  };

  const doughnutData = {
    labels: ['Real Estate', 'Stocks', 'Crypto', 'Gold'],
    datasets: [{
      data: isClient 
        ? [17500000, 4950000, 950000, 1150000]
        : [145000000, 68000000, 14000000, 20000000],
      backgroundColor: [
        '#0B2545', // Navy
        '#38bdf8', // Blue
        '#ef4444', // Red
        '#C5A059'  // Gold
      ],
      borderWidth: 0
    }]
  };

  const barChartData = {
    labels: stats.statements?.cash_flow ? stats.statements.cash_flow.map(c => c.label.split(' ')[0]).slice(-6) : ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Inflows',
        data: stats.statements?.cash_flow ? stats.statements.cash_flow.map(c => c.inflow).slice(-6) : [135000, 142000, 158000, 172000, 185000, 192000],
        backgroundColor: '#10b981',
        borderRadius: 4
      },
      {
        label: 'Outflows',
        data: stats.statements?.cash_flow ? stats.statements.cash_flow.map(c => c.outflow).slice(-6) : [68000, 72000, 84000, 90000, 95000, 98000],
        backgroundColor: '#ef4444',
        borderRadius: 4
      }
    ]
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header Info */}
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: themeMode === 'dark' ? '#fff' : '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
            {isClient ? `Welcome back, ${stats.profile.personal_details.first_name || 'Client'}!` : `${user.role} Workspace`}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isClient ? 'Wealth Intelligence Dashboard' : 'Operational Wealth Control Panel'}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Chip label={`FY 2026-27`} color="primary" variant="outlined" />
          <Chip 
            label={isClient ? `Risk Profile: ${stats.profile.risk_profile}` : `Role: ${user.role}`} 
            color="secondary" 
            sx={{ fontWeight: 600 }} 
          />
        </Box>
      </Box>

      {/* Grid of Cards */}
      {isClient ? (
        // Client Metrics Grid
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: primaryColor + '22', color: primaryColor }}><AccountBalanceWalletIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary">Net Worth</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>₹2.45 Cr</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#10b98122', color: '#10b981' }}><TrendingUpIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary">Absolute Returns</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>+20.8%</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: secondaryColor + '22', color: secondaryColor }}><BusinessIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary">Monthly Inflow</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>₹4.05 L</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: `4px solid ${primaryColor}` }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="caption" color="textSecondary">Portfolio Health</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.ai.portfolio_health_score}/100</Typography>
                    <Chip label={stats.ai.portfolio_health_status} size="small" color="success" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // Admin Metrics Grid
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: primaryColor + '22', color: primaryColor }}><AccountBalanceWalletIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary">Assets Under Management</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>₹24.70 Cr</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: secondaryColor + '22', color: secondaryColor }}><SupermonIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary">Active Clients</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>184 Clients</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#10b98122', color: '#10b981' }}><TrendingUpIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary">Monthly Revenue</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>₹12.45 L</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: `4px solid ${secondaryColor}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#ef444422', color: '#ef4444' }}><WarningAmberIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="textSecondary">Outstanding Tasks</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ef4444' }}>8 Pending</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Graphs Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '400px', p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {isClient ? 'Wealth Timeline' : 'Assets Under Management Growth'}
            </Typography>
            <Box sx={{ height: '320px' }}>
              <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '400px', p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Asset Allocation</Typography>
            <Box sx={{ height: '260px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3 - Operations & Task Planners */}
      <Grid container spacing={3}>
        {isClient ? (
          // Inflows/Outflows & Upcoming Events
          <>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Cash Inflows vs Outflows</Typography>
                <Box sx={{ height: '300px' }}>
                  <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 2, minHeight: '360px' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Compliance & Alerts</Typography>
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#10b98122', color: '#10b981' }}><VerifiedUserIcon /></Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="KYC Verified" 
                      secondary="Your PAN & Aadhaar details were successfully verified by audit." 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#e5c15822', color: '#e5c158' }}><CalendarMonthIcon /></Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary="Rental Collection Scheduled" 
                      secondary="Tenant InnoTech rent due on 5th of next month (₹65,000)." 
                    />
                  </ListItem>
                  {stats.profile.profile_completion_pct < 100 && (
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#ef444422', color: '#ef4444' }}><ErrorOutlineIcon /></Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary="Profile Incomplete" 
                        secondary={`Your profile is ${stats.profile.profile_completion_pct}% complete. Add passport details.`} 
                      />
                    </ListItem>
                  )}
                </List>
              </Card>
            </Grid>
          </>
        ) : (
          // Audit Log stream & Tasks Manager for Admin
          <>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Regulatory Audit Monitor</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300, backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>IP Address</TableCell>
                        <TableCell>Timestamp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.auditLogs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontWeight: 600 }}>{log.username}</TableCell>
                          <TableCell><Chip label={log.action} size="small" variant="outlined" color="primary" /></TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{log.ip_address}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(log.timestamp * 1000).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Action Items Queue</Typography>
                <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableBody>
                      {stats.tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.title}</Typography>
                            <Typography variant="caption" color="textSecondary">{task.category}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={task.status} 
                              size="small" 
                              color={task.status === 'Completed' ? 'success' : 'warning'} 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

export default DashboardView;
