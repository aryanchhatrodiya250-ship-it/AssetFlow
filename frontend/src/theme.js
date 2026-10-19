import { createTheme } from '@mui/material/styles';

const baseTypography = {
  fontFamily: "'Poppins', 'Outfit', 'Inter', sans-serif",
  h1: { fontWeight: 800, fontFamily: "'Poppins', sans-serif" },
  h2: { fontWeight: 700, fontFamily: "'Poppins', sans-serif" },
  h3: { fontWeight: 700, fontFamily: "'Poppins', sans-serif" },
  h4: { fontWeight: 600, fontFamily: "'Poppins', sans-serif" },
  h5: { fontWeight: 600, fontFamily: "'Poppins', sans-serif" },
  h6: { fontWeight: 500, fontFamily: "'Poppins', sans-serif" },
  button: { textTransform: 'none', fontWeight: 600 },
};

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#C5A059', // Luxury Gold
      contrastText: '#081729',
    },
    secondary: {
      main: '#E2E8F0', // Soft grey
    },
    background: {
      default: '#081729', // Premium dark corporate navy
      paper: '#0F233C', // Darker navy cards
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
    },
    info: {
      main: '#38BDF8',
    },
    success: {
      main: '#10B981',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#EF4444',
    },
  },
  typography: baseTypography,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0F233C',
          border: '1px solid rgba(197, 160, 89, 0.15)',
          borderRadius: 12,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 24px',
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #C5A059 0%, #A37F3D 100%)',
          boxShadow: '0 4px 14px 0 rgba(197, 160, 89, 0.25)',
          color: '#081729',
          '&:hover': {
            background: 'linear-gradient(135deg, #A37F3D 0%, #C5A059 100%)',
          },
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0B2545', // Deep corporate Navy Blue
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#C5A059', // Elegant Gold
      contrastText: '#0B2545',
    },
    background: {
      default: '#F4F6F9', // Soft light gray
      paper: '#ffffff', // Clean white
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    info: {
      main: '#3A86FF',
    },
    success: {
      main: '#10B981',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#EF4444',
    },
  },
  typography: baseTypography,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid rgba(11, 37, 69, 0.08)',
          boxShadow: '0 4px 20px -2px rgba(11, 37, 69, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 24px',
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0B2545 0%, #134074 100%)',
          boxShadow: '0 4px 12px 0 rgba(11, 37, 69, 0.15)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #134074 0%, #0B2545 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #C5A059 0%, #A37F3D 100%)',
          boxShadow: '0 4px 12px 0 rgba(197, 160, 89, 0.15)',
          color: '#0B2545',
          '&:hover': {
            background: 'linear-gradient(135deg, #A37F3D 0%, #C5A059 100%)',
          },
        },
      },
    },
  },
});
