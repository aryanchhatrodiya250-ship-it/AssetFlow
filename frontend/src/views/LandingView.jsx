import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Container, Card, IconButton, Divider } from '@mui/material';

// Material Icons for Mega Menu & Navigation
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessIcon from '@mui/icons-material/Business';
import PieChartIcon from '@mui/icons-material/PieChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function LandingView({ onNavigateToLogin, user, onOpenDrawer }) {
  const [lang, setLang] = useState('EN');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [menuClickOpen, setMenuClickOpen] = useState(false);

  const handleNavigateToTab = (tabId) => {
    localStorage.setItem('target_tab', tabId);
    setMegaMenuOpen(false);
    setMenuClickOpen(false);
    if (user) {
      window.location.hash = '#/workspace';
    } else {
      onNavigateToLogin();
    }
  };

  // Staggered Portfolio Card items
  const portfolioCases = [
    {
      title: 'Retail/Shopping Mall',
      image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
      height: 350
    },
    {
      title: 'Real Estate / Business Centre',
      image: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=600&q=80',
      height: 400
    },
    {
      title: 'Universal Logistics Services',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
      height: 350
    },
    {
      title: 'Hospitality',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      height: 400
    },
    {
      title: 'Financial Services',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
      height: 350
    },
    {
      title: 'Education',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
      height: 400
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', margin: 0, padding: 0, backgroundColor: '#ffffff', color: '#1E293B', scrollBehavior: 'smooth' }}>

      {/* 1. Transparent Header Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: { xs: 2, md: 4 },
          px: { xs: 3, md: 8 }
        }}
      >
        {/* Brand Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 11L12 20L21 11L12 2Z" stroke="#C5A059" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 13.5L12 9.5L16 13.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 6V15" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Box sx={{ color: '#ffffff' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1, fontFamily: "'Poppins', sans-serif" }}>AssetFlow</Typography>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontSize: '0.65rem' }}>Wealth Management</Typography>
          </Box>
        </Box>

        {/* Menu Items (Desktop Only) */}
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 4 }}>
          <Box
            component="a"
            href="#/about"
            sx={{
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              opacity: 0.9,
              '&:hover': { opacity: 1 }
            }}
          >
            About
          </Box>

          {/* Mega Menu Wrapper */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', height: '100%' }}
          >
            <Box
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              sx={{
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.95rem',
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': { opacity: 1 }
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
                  mt: 0.5,
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
                            onClick={() => { setMegaMenuOpen(false); handleNavigateToTab(item.id); }}
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

                  {/* Right Column (Featured insight) */}
                  <Grid item xs={12} md={3} sx={{ backgroundColor: '#F8F9FA', p: 2, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', display: 'block', mb: 1, letterSpacing: '0.5px', fontSize: '0.68rem' }}>
                      Market Insight
                    </Typography>
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B2545', mb: 0.5, lineHeight: 1.2 }}>
                        Global Bond Yields Rise
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1.3, display: 'block', mb: 1.5 }}>
                        How fixed income adjustments are impacting high-net-worth real estate valuations this quarter.
                      </Typography>
                      <Typography component="a" href="#/news" target="_blank" variant="caption" sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>Read Report &rarr;</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>

          {['News', 'Career', 'Contact'].map((item) => (
            <Box
              key={item}
              component="a"
              href={`#/${item.toLowerCase()}`}
              sx={{
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                opacity: 0.9,
                '&:hover': { opacity: 1 }
              }}
            >
              {item}
            </Box>
          ))}
        </Box>

        {/* Profile Action Widget */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {user && (
            <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
              {user.username}
            </Typography>
          )}
          <IconButton
            onClick={user ? onOpenDrawer : onNavigateToLogin}
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

      {/* 2. Hero Section (Skyscrapers with Tinted Overlay) */}
      <Box
        sx={{
          height: '100vh',
          background: 'linear-gradient(rgba(11, 37, 69, 0.75), rgba(11, 37, 69, 0.85)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1500&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          px: { xs: 3, md: 8 }
        }}
      >
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Box sx={{ maxWidth: '750px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography
              variant="h1"
              sx={{
                color: '#ffffff',
                fontSize: { xs: '2.5rem', sm: '4rem', md: '5rem' },
                fontWeight: 700,
                lineHeight: 1.1,
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              AssetFlow Wealth Management
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 300,
                lineHeight: 1.6,
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              Welcome to AssetFlow Wealth Management - a trusted partner in fostering economic growth, managing premium property portfolios, and strengthening business ties.
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={user ? () => { localStorage.setItem('target_tab', 'profile'); window.location.hash = '#/workspace'; } : onNavigateToLogin}
                sx={{
                  backgroundColor: '#0F233C',
                  color: '#ffffff',
                  borderRadius: '6px',
                  px: 4,
                  py: 1.7,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  '&:hover': { backgroundColor: '#163155' }
                }}
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 3. About Section (UzOman Style) */}
      <Container id="about" maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, px: { xs: 3, md: 8 } }}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3A86FF' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1px' }}>
                About AssetFlow
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 700, color: '#3A86FF', mb: 1, textTransform: 'uppercase', fontSize: '0.8rem' }}>
              Core Values:
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, fontSize: '0.95rem' }}>
              Excellence, Integrity, Teamwork,<br />
              Innovation, Dedication.
            </Typography>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography
              variant="h3"
              sx={{
                color: '#0B2545',
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '1.75rem', sm: '2.5rem' },
                lineHeight: 1.2,
                fontFamily: "'Poppins', sans-serif"
              }}
            >
              We Build the Future Through Innovation and Strategic Investments
            </Typography>

            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, lineHeight: 1.8, fontSize: '1.05rem', fontWeight: 300 }}>
              Established in 2014 as a premier partnership to strengthen asset values and drive premium real estate ventures, AssetFlow manages over ₹2,470 million in properties and assets. Committed to premium standards, transparency, and top-tier governance, we operate as a full-service family office for wealth creation.
            </Typography>

            <Box
              component="a"
              href="#about"
              sx={{
                color: '#0B2545',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                fontSize: '0.95rem',
                borderBottom: '1px solid #0B2545',
                pb: 0.5,
                '&:hover': { gap: 1.5, transition: 'all 0.2s' }
              }}
            >
              Discover more about us &rarr;
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                width: '100%',
                height: { xs: 200, sm: 400 },
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.05)'
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
                alt="Corporate Office Landscape"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* 4. Portfolio Snapshot Section (Masonry Staggered Grid) */}
      <Box id="investment-portfolio" sx={{ backgroundColor: '#F8F9FA', py: { xs: 8, md: 12 }, px: { xs: 3, md: 8 } }}>
        <Container maxWidth="lg" sx={{ px: 0 }}>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3A86FF' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Portfolio Snapshot
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ alignItems: 'end', mb: 6 }}>
            <Grid item xs={12} md={8}>
              <Typography
                variant="h3"
                sx={{
                  color: '#0B2545',
                  fontWeight: 700,
                  fontSize: { xs: '1.75rem', sm: '2.5rem' },
                  lineHeight: 1.2,
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                Diverse portfolio, strong finances,<br />
                reinvesting dividends for growth.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button
                variant="contained"
                onClick={user ? () => { localStorage.setItem('target_tab', 'assets'); window.location.hash = '#/workspace'; } : onNavigateToLogin}
                sx={{
                  backgroundColor: '#0F233C',
                  color: '#ffffff',
                  borderRadius: '6px',
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#163155' }
                }}
              >
                {user ? 'View Asset Ledger' : 'Explore our cases'} &rarr;
              </Button>
            </Grid>
          </Grid>

          {/* Staggered Grid Container */}
          <Grid container spacing={3}>
            {portfolioCases.map((c, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card
                  sx={{
                    height: c.height,
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    '&:hover img': { transform: 'scale(1.05)', transition: 'all 0.5s' }
                  }}
                >
                  <img
                    src={c.image}
                    alt={c.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.5))',
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        fontFamily: "'Poppins', sans-serif"
                      }}
                    >
                      {c.title}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer Section */}
      <Box sx={{ backgroundColor: '#0B2545', color: '#ffffff', pt: 8, pb: 4, px: { xs: 3, md: 8 }, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {/* Logo and Tagline Column */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3 11L12 20L21 11L12 2Z" stroke="#C5A059" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 13.5L12 9.5L16 13.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 6V15" stroke="#C5A059" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, fontFamily: "'Poppins', sans-serif" }}>AssetFlow</Typography>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontSize: '0.6rem' }}>Wealth Management</Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 3, maxWidth: '280px', fontSize: '0.85rem' }}>
                Premium wealth, real estate, and portfolio management solutions tailored for modern advisory workflows.
              </Typography>
            </Grid>

            {/* Links Columns */}
            <Grid item xs={6} sm={4} md={2.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5, textTransform: 'uppercase', letterSpacing: '1px', color: '#C5A059', fontSize: '0.75rem' }}>
                Company
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box component="a" href="#/about" sx={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.8, '&:hover': { opacity: 1, color: '#C5A059' } }}>About Us</Box>
                <Box component="a" href="#/news" sx={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.8, '&:hover': { opacity: 1, color: '#C5A059' } }}>Latest News</Box>
                <Box component="a" href="#/career" sx={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.8, '&:hover': { opacity: 1, color: '#C5A059' } }}>Careers</Box>
                <Box component="a" href="#/contact" sx={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.8, '&:hover': { opacity: 1, color: '#C5A059' } }}>Contact</Box>
              </Box>
            </Grid>

            <Grid item xs={6} sm={4} md={2.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5, textTransform: 'uppercase', letterSpacing: '1px', color: '#C5A059', fontSize: '0.75rem' }}>
                Resources
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box component="span" sx={{ color: '#ffffff', fontSize: '0.85rem', opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Help Center</Box>
                <Box component="span" sx={{ color: '#ffffff', fontSize: '0.85rem', opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Market Insights</Box>
                <Box component="span" sx={{ color: '#ffffff', fontSize: '0.85rem', opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Advisory Docs</Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5, textTransform: 'uppercase', letterSpacing: '1px', color: '#C5A059', fontSize: '0.75rem' }}>
                Contact Support
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontSize: '0.85rem' }}>
                Toll Free support:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontFamily: "'Poppins', sans-serif", mb: 0.5, fontSize: '1.05rem' }}>
                1800 41 99099
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>
                Mon - Sun, 9AM - 11PM IST
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              &copy; {new Date().getFullYear()} AssetFlow Wealth Management. All rights reserved. Registered with SEBI.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Privacy Policy</Box>
              <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Terms of Service</Box>
              <Box component="span" sx={{ fontSize: '0.75rem', opacity: 0.6, cursor: 'pointer', '&:hover': { opacity: 1 } }}>Disclosures</Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingView;
