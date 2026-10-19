import React from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Divider, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function CareerView({ themeMode, toggleTheme, user, onNavigateToLogin }) {
  const jobs = [
    {
      title: 'Wealth Management Consultant',
      department: 'Private Advisory',
      location: 'Hyderabad, India',
      description: 'Acquire and manage high-net-worth individual client relationships, advising on assets allocation strategies.'
    },
    {
      title: 'Senior Portfolio Analyst',
      department: 'Investment Research',
      location: 'Remote (India)',
      description: 'Perform due diligence, market returns analysis, and risk metrics reports on fractional real estate assets.'
    },
    {
      title: 'Senior Frontend React Engineer',
      department: 'Engineering',
      location: 'Hyderabad, India / Hybrid',
      description: 'Develop rich visual dashboards, interactive data charts, and robust client portals for wealth platforms.'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', color: '#1E293B' }}>
      {/* Header */}
      <Box sx={{ backgroundColor: '#0B2545', color: '#ffffff', px: { xs: 3, md: 8 }, py: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => window.location.hash = '#/'}>
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => window.location.hash = '#/'} sx={{ color: '#ffffff', textTransform: 'none', border: '1px solid rgba(255,255,255,0.2)' }} variant="outlined">
          Back to Home
        </Button>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontFamily: "'Outfit', sans-serif", color: '#0B2545' }}>
            Careers at AssetFlow
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, mb: 6, maxWidth: '800px', lineHeight: 1.6 }}>
            Join our fast-growing engineering, wealth advisory, and investment research departments. Build state-of-the-art fintech spaces.
          </Typography>

          <Grid container spacing={4} sx={{ mb: 8 }}>
            {jobs.map((job, idx) => (
              <Grid item xs={12} key={idx}>
                <Card sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: 'none', p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ maxWidth: '650px' }}>
                    <Typography variant="caption" sx={{ color: '#C5A059', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {job.department} &bull; {job.location}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 1, mb: 1.5, color: '#0B2545' }}>
                      {job.title}
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                      {job.description}
                    </Typography>
                  </Box>
                  <Button variant="contained" size="large" onClick={() => alert('Applications can be sent directly to careers@assetflow.com. Thank you!')}>
                    Apply Now
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer Section */}
      <Box sx={{ backgroundColor: '#0B2545', color: '#ffffff', pt: 8, pb: 4, px: { xs: 3, md: 8 }, borderTop: '1px solid rgba(255,255,255,0.08)', mt: 'auto' }}>
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Grid container spacing={4} sx={{ mb: 6 }}>
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
            <Grid item xs={6} sm={4} md={2.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5, textTransform: 'uppercase', letterSpacing: '1px', color: '#C5A059', fontSize: '0.75rem' }}>Company</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box component="a" href="#/about" sx={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.8 }}>About Us</Box>
                <Box component="a" href="#/news" sx={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.8 }}>Latest News</Box>
                <Box component="a" href="#/career" sx={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.8 }}>Careers</Box>
                <Box component="a" href="#/contact" sx={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.8 }}>Contact</Box>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5, textTransform: 'uppercase', letterSpacing: '1px', color: '#C5A059', fontSize: '0.75rem' }}>Resources</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box component="span" sx={{ color: '#ffffff', fontSize: '0.85rem', opacity: 0.8 }}>Help Center</Box>
                <Box component="span" sx={{ color: '#ffffff', fontSize: '0.85rem', opacity: 0.8 }}>Market Insights</Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2.5, textTransform: 'uppercase', letterSpacing: '1px', color: '#C5A059', fontSize: '0.75rem' }}>Contact Support</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontSize: '0.85rem' }}>Toll Free support:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontFamily: "'Poppins', sans-serif", mb: 0.5, fontSize: '1.05rem' }}>1800 41 99099</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>&copy; {new Date().getFullYear()} AssetFlow Wealth Management. All rights reserved.</Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default CareerView;
