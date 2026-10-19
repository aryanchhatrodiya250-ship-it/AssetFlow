import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, useMediaQuery, Alert, Snackbar, Typography, LinearProgress, Button, Container, Drawer, Divider, IconButton, Grid, Dialog, DialogContent } from '@mui/material';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { darkTheme, lightTheme } from './theme';
import { api } from './services/api';

// Icons
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessIcon from '@mui/icons-material/Business';
import PieChartIcon from '@mui/icons-material/PieChart';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SupermonIcon from '@mui/icons-material/SupervisorAccount';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import PersonIcon from '@mui/icons-material/Person';

// Custom components (defined inside to compile easily as a standalone project bundle)
import AssetsView from './views/AssetsView';
import RentalView from './views/RentalView';
import AccountingView from './views/AccountingView';
import CRMView from './views/CRMView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import SignupView from './views/SignupView';
import LandingView from './views/LandingView';
import ClientHomeView from './views/ClientHomeView';
import ProfileView from './views/ProfileView';
import NewsView from './views/NewsView';
import AboutView from './views/AboutView';
import CareerView from './views/CareerView';
import ContactView from './views/ContactView';

import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

function App() {
  const [currentThemeMode, setCurrentThemeMode] = useState('light');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(localStorage.getItem('current_tab') || 'assets');
  const [initializing, setInitializing] = useState(true);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [menuClickOpen, setMenuClickOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState('login');
  
  const [assignedClients, setAssignedClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // Toast notifications state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const showToast = (message, severity = 'info') => {
    setToast({ open: true, message, severity });
  };

  useEffect(() => {
    localStorage.setItem('current_tab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    const user = api.auth.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setInitializing(false);
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      if (currentUser && currentUser.role !== 'Client') {
        try {
          const res = await api.clients.list();
          const clientsList = res.results || res || [];
          setAssignedClients(clientsList);
          if (clientsList.length > 0) {
            const first = clientsList[0];
            setSelectedClient({
              id: first.user_id,
              username: first.username || first.personal_details?.first_name || 'Client',
              email: first.email || '',
              role: 'Client'
            });
          } else {
            setSelectedClient(null);
          }
        } catch (e) {
          console.error("Error fetching advisor clients", e);
        }
      } else {
        setSelectedClient(null);
        setAssignedClients([]);
      }
    };
    fetchClients();
  }, [currentUser]);

  // Handle target tab redirection on navigation or login
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('/workspace')) {
        const targetTab = localStorage.getItem('target_tab');
        if (targetTab) {
          setCurrentTab(targetTab);
          localStorage.removeItem('target_tab');
        }
      } else if (window.location.hash.includes('/login')) {
        window.location.hash = '#/';
        setAuthModalType('login');
        setAuthModalOpen(true);
      } else if (window.location.hash.includes('/signup')) {
        window.location.hash = '#/';
        setAuthModalType('signup');
        setAuthModalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    const targetTab = localStorage.getItem('target_tab');
    if (targetTab) {
      setCurrentTab(targetTab);
      localStorage.removeItem('target_tab');
    } else {
      setCurrentTab('assets');
    }
    setAuthModalOpen(false);
    showToast(`Welcome back, ${user.username}!`, 'success');
  };

  const handleLogout = () => {
    api.auth.logout();
    setCurrentUser(null);
    showToast('Logged out successfully', 'info');
    window.location.hash = '#/';
  };

  const toggleTheme = () => {
    setCurrentThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };



  const selectedTheme = currentThemeMode === 'dark' ? darkTheme : lightTheme;

  if (initializing) {
    return (
      <ThemeProvider theme={selectedTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: selectedTheme.palette.background.default }}>
          <Box sx={{ width: '300px', textAlign: 'center' }}>
            <Typography variant="h6" align="center" gutterBottom color="textSecondary" sx={{ fontWeight: 600 }}>Assembling Wealth Dashboard...</Typography>
            <LinearProgress color="primary" sx={{ borderRadius: 4, height: 6 }} />
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={selectedTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', backgroundColor: selectedTheme.palette.background.default, width: '100%', overflowX: 'hidden' }}>
          <Routes>
            {/* Public Home Page Route */}
            <Route path="/" element={<LandingView onNavigateToLogin={() => { setAuthModalType('login'); setAuthModalOpen(true); }} user={currentUser} onOpenDrawer={() => setUserDrawerOpen(true)} />} />
            
            {/* Additional Public Pages */}
            <Route path="/news" element={<NewsView themeMode={currentThemeMode} toggleTheme={toggleTheme} user={currentUser} onNavigateToLogin={() => { setAuthModalType('login'); setAuthModalOpen(true); }} />} />
            <Route path="/about" element={<AboutView themeMode={currentThemeMode} toggleTheme={toggleTheme} user={currentUser} onNavigateToLogin={() => { setAuthModalType('login'); setAuthModalOpen(true); }} />} />
            <Route path="/career" element={<CareerView themeMode={currentThemeMode} toggleTheme={toggleTheme} user={currentUser} onNavigateToLogin={() => { setAuthModalType('login'); setAuthModalOpen(true); }} />} />
            <Route path="/contact" element={<ContactView themeMode={currentThemeMode} toggleTheme={toggleTheme} user={currentUser} onNavigateToLogin={() => { setAuthModalType('login'); setAuthModalOpen(true); }} />} />

            {/* Authenticating Routes */}
            <Route path="/login" element={
              currentUser ? <Navigate to="/workspace" replace /> : (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <Box onClick={toggleTheme} sx={{ cursor: 'pointer', color: currentThemeMode === 'dark' ? '#C5A059' : '#0B2545', display: 'flex', gap: 1, alignItems: 'center' }}>
                      {currentThemeMode === 'dark' ? <WbSunnyIcon /> : <BedtimeIcon />}
                    </Box>
                  </Box>
                  <LoginView onLogin={handleLogin} themeMode={currentThemeMode} />
                </Box>
              )
            } />
            <Route path="/signup" element={
              currentUser ? <Navigate to="/workspace" replace /> : (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <Box onClick={toggleTheme} sx={{ cursor: 'pointer', color: currentThemeMode === 'dark' ? '#C5A059' : '#0B2545', display: 'flex', gap: 1, alignItems: 'center' }}>
                      {currentThemeMode === 'dark' ? <WbSunnyIcon /> : <BedtimeIcon />}
                    </Box>
                  </Box>
                  <SignupView onSignup={handleLogin} themeMode={currentThemeMode} />
                </Box>
              )
            } />

            <Route path="/workspace" element={
              !currentUser ? <Navigate to="/" replace /> : (
                /* UNIFIED WEBSITE LAYOUT FOR ALL ROLES */
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', backgroundColor: selectedTheme.palette.background.default }}>
                    {/* Top Website Header */}
                    <Box 
                      sx={{ 
                        position: 'relative',
                        backgroundColor: '#0B2545', 
                        color: '#ffffff', 
                        px: { xs: 2, md: 6 }, 
                        py: 2, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                        zIndex: 10
                      }}
                    >
                      {/* Brand Logo & Back to Home trigger */}
                      <Box 
                        onClick={() => window.location.hash = '#/'} 
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L3 11L12 20L21 11L12 2Z" stroke="#C5A059" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 13.5L12 9.5L16 13.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 6V15" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: '1.1rem', fontFamily: "'Poppins', sans-serif" }}>AssetFlow</Typography>
                          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8, fontSize: '0.55rem', display: 'block' }}>Wealth Portal</Typography>
                        </Box>
                      </Box>

                      {/* Top Navigation Links */}
                      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
                        <Box 
                          onClick={() => window.location.hash = '#/#about'}
                          sx={{ 
                            color: '#ffffff', 
                            cursor: 'pointer',
                            textDecoration: 'none', 
                            fontWeight: 600, 
                            fontSize: '0.85rem',
                            opacity: 0.9,
                            '&:hover': { opacity: 1, color: '#C5A059' } 
                          }}
                        >
                          About
                        </Box>

                        {/* Mega Menu Wrapper */}
                        <Box 
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          {/* Mega Menu Trigger Nav link */}
                          <Box 
                            onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                            sx={{ 
                              cursor: 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              '&:hover': { opacity: 1, color: '#C5A059' } 
                            }}
                          >
                            Investment portfolio <KeyboardArrowDownIcon sx={{ fontSize: '1.15rem', transform: megaMenuOpen ? 'rotate(180deg)' : 'none', transition: 'all 0.2s' }} />
                          </Box>

                          {/* Mega Menu Dropdown Container */}
                          {megaMenuOpen && (
                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                top: '100%', 
                                left: '50%', 
                                transform: 'translateX(-50%)',
                                width: '800px',
                                maxWidth: '95vw',
                                backgroundColor: '#ffffff', 
                                boxShadow: '0 12px 35px rgba(11, 37, 69, 0.12)', 
                                zIndex: 100, 
                                borderRadius: '12px',
                                border: '1px solid rgba(11, 37, 69, 0.08)',
                                display: 'flex',
                                overflow: 'hidden',
                                mt: 1.2,
                                animation: 'fadeIn 0.2s ease-out'
                              }}
                            >
                              <Grid container sx={{ minHeight: 'auto' }}>
                                {/* Left Column (Advisory categories) */}
                                <Grid item xs={12} md={3} sx={{ backgroundColor: '#F8F9FA', p: 2, display: 'flex', flexDirection: 'column', gap: 1.2, borderRight: '1px solid #E2E8F0' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2545', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.68rem' }}>
                                    Asset Management
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    Fractional Real Estate
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', cursor: 'pointer', fontSize: '0.8rem', '&:hover': { color: 'primary.main' } }}>
                                    Corporate Yield Funds
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', cursor: 'pointer', fontSize: '0.8rem', '&:hover': { color: 'primary.main' } }}>
                                    Tax Planning Advisory
                                  </Typography>
                                  <Box sx={{ mt: 'auto', pt: 1 }}>
                                    <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.6rem', opacity: 0.8 }}>contact us toll free on</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0B2545', fontFamily: "'Poppins', sans-serif", fontSize: '0.85rem' }}>1800 41 99099</Typography>
                                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem', opacity: 0.8 }}>(9AM - 11PM IST)</Typography>
                                  </Box>
                                </Grid>

                                {/* Middle Column (Application Modules matching screenshot) */}
                                <Grid item xs={12} md={6} sx={{ p: 2 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 1.5, letterSpacing: '0.5px', fontSize: '0.68rem' }}>
                                    Navigate Direct Modules
                                  </Typography>
                                  
                                  <Grid container spacing={1}>
                                    {[
                                      { id: 'assets', label: 'Asset Ledger', icon: <AccountBalanceWalletIcon sx={{ color: '#0B2545', fontSize: '1.1rem' }} /> },
                                      { id: 'rental', label: 'Rental Tracker', icon: <BusinessIcon sx={{ color: '#0B2545', fontSize: '1.1rem' }} /> },
                                      { id: 'accounting', label: 'Accounting Desk', icon: <AccountBalanceIcon sx={{ color: '#0B2545', fontSize: '1.1rem' }} /> },
                                      { id: 'crm', label: 'CRM & Planner', icon: <ContactPhoneIcon sx={{ color: '#0B2545', fontSize: '1.1rem' }} /> }
                                    ].map((item) => (
                                      <Grid item xs={6} key={item.id}>
                                        <Box 
                                          onClick={() => { setCurrentTab(item.id); setMegaMenuOpen(false); }}
                                          sx={{ 
                                            p: 0.8, 
                                            borderRadius: '6px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 1.2, 
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { 
                                              backgroundColor: 'rgba(11, 37, 69, 0.05)',
                                              transform: 'translateX(3px)'
                                            } 
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            {item.icon}
                                          </Box>
                                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0B2545', fontSize: '0.8rem' }}>
                                            {item.label}
                                          </Typography>
                                        </Box>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </Grid>

                                {/* Right Column (Introducing Insights highlighted card) */}
                                <Grid item xs={12} md={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                                  <Box 
                                    sx={{ 
                                      backgroundColor: 'rgba(11, 37, 69, 0.03)', 
                                      p: 1.5, 
                                      borderRadius: '8px', 
                                      border: '1px solid rgba(11, 37, 69, 0.08)',
                                      display: 'flex', 
                                      flexDirection: 'column', 
                                      gap: 1,
                                      width: '100%'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0B2545', fontSize: '0.65rem' }}>
                                        INTRODUCING
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#C5A059', border: '1px solid', px: 0.8, borderRadius: '3px', fontSize: '0.55rem' }}>
                                        Insights
                                      </Typography>
                                    </Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B2545', fontSize: '0.8rem', lineHeight: 1.2 }}>
                                      Understand Local property yields ↗
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                                      {[
                                        'Understand yields',
                                        'Read resident reviews',
                                        'Check price trends',
                                        'Tools, utilities'
                                      ].map((text, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                          <CheckCircleIcon sx={{ fontSize: '0.75rem', color: '#10b981' }} />
                                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>{text}</Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        </Box>

                        {['News', 'Career', 'Contact'].map((item) => (
                          <Box 
                            key={item} 
                            onClick={() => window.location.hash = `#/#${item.toLowerCase()}`}
                            sx={{ 
                              color: '#ffffff', 
                              cursor: 'pointer',
                              textDecoration: 'none', 
                              fontWeight: 600, 
                              fontSize: '0.85rem',
                              opacity: 0.9,
                              '&:hover': { opacity: 1, color: '#C5A059' } 
                            }}
                          >
                            {item}
                          </Box>
                        ))}
                      </Box>

                      {/* Right Action (Profile Drawer Trigger) */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {currentUser.role !== 'Client' && assignedClients.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'rgba(255,255,255,0.08)', px: 1.5, py: 0.8, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', mr: 1 }}>
                            <Typography variant="caption" sx={{ color: '#C5A059', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>Active Client:</Typography>
                            <select
                              value={selectedClient ? selectedClient.id : ''}
                              onChange={(e) => {
                                const targetId = e.target.value;
                                const client = assignedClients.find(c => c.user_id === targetId);
                                if (client) {
                                  setSelectedClient({
                                    id: client.user_id,
                                    username: client.username || client.personal_details?.first_name || 'Client',
                                    email: client.email || '',
                                    role: 'Client'
                                  });
                                  showToast(`Switched client workspace to: ${client.username || client.personal_details?.first_name}`, 'success');
                                }
                              }}
                              style={{
                                backgroundColor: 'transparent',
                                color: '#ffffff',
                                border: 'none',
                                outline: 'none',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                fontFamily: "'Poppins', sans-serif",
                                cursor: 'pointer'
                              }}
                            >
                              {assignedClients.map((c) => (
                                <option key={c.user_id} value={c.user_id} style={{ color: '#0B2545' }}>
                                  {c.username || `${c.personal_details?.first_name} ${c.personal_details?.last_name}`}
                                </option>
                              ))}
                            </select>
                          </Box>
                        )}
                        <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600, color: '#C5A059' }}>
                          {currentUser.username}
                        </Typography>
                        <IconButton 
                          onClick={() => setUserDrawerOpen(true)}
                          sx={{ 
                            color: '#ffffff', 
                            p: 0.5,
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.08)' }
                          }}
                        >
                          <AccountCircleIcon sx={{ fontSize: '2.2rem' }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Mobile Navigation Row (Visible only on small screens) */}
                    <Box 
                      sx={{ 
                        display: { xs: 'flex', md: 'none' }, 
                        backgroundColor: '#0F233C', 
                        overflowX: 'auto', 
                        whiteSpace: 'nowrap',
                        p: 1.5, 
                        gap: 2.5,
                        '&::-webkit-scrollbar': { display: 'none' } 
                      }}
                    >
                      {[
                        { id: 'assets', label: 'Asset Ledger' },
                        { id: 'rental', label: 'Rental Tracker' },
                        { id: 'accounting', label: 'Accounting Desk' },
                        { id: 'crm', label: 'CRM & Planner' }
                      ].map((item) => (
                        <Box
                          key={item.id}
                          onClick={() => setCurrentTab(item.id)}
                          sx={{
                            display: 'inline-block',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            color: currentTab === item.id ? '#C5A059' : '#ffffff',
                            pb: 0.5,
                            borderBottom: currentTab === item.id ? '2px solid #C5A059' : 'none'
                          }}
                        >
                          {item.label}
                        </Box>
                      ))}
                    </Box>

                    {/* Centered Main Page Content */}
                    <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                      <Container maxWidth="lg" sx={{ py: 6, minHeight: '80vh' }}>
                        {currentTab === 'home' && <ClientHomeView user={currentUser} showToast={showToast} themeMode={currentThemeMode} onTabChange={setCurrentTab} />}
                        {currentTab === 'profile' && <ProfileView user={selectedClient || currentUser} showToast={showToast} themeMode={currentThemeMode} />}
                        {currentTab === 'assets' && <AssetsView user={selectedClient || currentUser} showToast={showToast} themeMode={currentThemeMode} />}
                        {currentTab === 'rental' && <RentalView user={selectedClient || currentUser} showToast={showToast} themeMode={currentThemeMode} />}
                        {currentTab === 'accounting' && <AccountingView user={selectedClient || currentUser} showToast={showToast} themeMode={currentThemeMode} />}
                        {currentTab === 'crm' && <CRMView user={selectedClient || currentUser} showToast={showToast} themeMode={currentThemeMode} />}
                        {currentTab === 'settings' && <SettingsView user={selectedClient || currentUser} showToast={showToast} themeMode={currentThemeMode} />}
                      </Container>
                    </Box>

                    {/* Public Footer */}
                    <Box sx={{ backgroundColor: '#0B2545', color: '#ffffff', py: 5, px: { xs: 3, md: 6 }, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <Container maxWidth="lg" sx={{ px: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>AssetFlow Wealth Management</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>&copy; 2026 AssetFlow Inc. All rights reserved.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 4 }}>
                          <Typography variant="caption" sx={{ cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 } }}>Privacy Policy</Typography>
                          <Typography variant="caption" sx={{ cursor: 'pointer', opacity: 0.8, '&:hover': { opacity: 1 } }}>Terms of Service</Typography>
                        </Box>
                      </Container>
                    </Box>
                  </Box>
                )
              } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {/* Login and Signup Modal Overlay */}
    <Dialog 
      open={authModalOpen} 
      onClose={() => setAuthModalOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: 1 }}>
        {authModalType === 'login' ? (
          <LoginView 
            onLogin={handleLogin} 
            themeMode={currentThemeMode} 
            onToggleAuthType={() => setAuthModalType('signup')} 
          />
        ) : (
          <SignupView 
            onSignup={handleLogin} 
            themeMode={currentThemeMode} 
            onToggleAuthType={() => setAuthModalType('login')} 
          />
        )}
      </DialogContent>
    </Dialog>
  </Box>
</Router>

      {/* Right-Side Carousel Drawer Navigation for Profile Options */}
      <Drawer anchor="right" open={userDrawerOpen} onClose={() => setUserDrawerOpen(false)}>
        <Box sx={{ width: 280, p: 3, display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Poppins', sans-serif" }}>
          {/* Profile Header details */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <AccountCircleIcon sx={{ fontSize: '3rem', color: '#0B2545' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0B2545' }}>{currentUser?.username || 'Client Portal'}</Typography>
              <Typography variant="caption" color="textSecondary">{currentUser?.role || 'Guest Mode'}</Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {/* Nav List options matching screenshot */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              { id: 'profile', label: 'My Profile', icon: <PersonIcon /> },
              { id: 'assets', label: 'Asset Ledger', icon: <AccountBalanceWalletIcon /> },
              { id: 'rental', label: 'Rental Tracker', icon: <BusinessIcon /> },
              { id: 'accounting', label: 'Accounting Desk', icon: <AccountBalanceIcon /> },
              { id: 'crm', label: 'CRM & Planner', icon: <ContactPhoneIcon /> }
            ].map((item) => (
              <Box
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setUserDrawerOpen(false);
                  window.location.hash = '#/workspace';
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: currentTab === item.id ? 'primary.main' : 'text.secondary',
                  backgroundColor: currentTab === item.id ? 'rgba(11, 37, 69, 0.05)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(11, 37, 69, 0.03)',
                    color: 'primary.main'
                  }
                }}
              >
                {item.icon}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>


          {/* Logout red-colored option at last */}
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Box
              onClick={() => {
                setUserDrawerOpen(false);
                handleLogout();
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#ef4444',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.08)'
                }
              }}
            >
              <LogoutIcon />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Log Out</Typography>
            </Box>
          </Box>
        </Box>
      </Drawer>


      {/* Snackbar notification toaster */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} sx={{ width: '100%', borderRadius: '8px', fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
