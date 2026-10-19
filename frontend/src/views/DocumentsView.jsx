import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, TextField, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, CircularProgress, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import { api } from '../services/api';

function DocumentsView({ user, showToast, themeMode }) {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Dialog State
  const [openUpload, setOpenUpload] = useState(false);
  const [newDoc, setNewDoc] = useState({ file_name: '', category: 'PAN', expiry_date: '', client_id: user.id });

  const isNonEmpty = (value, maxLength = 250) => {
    const text = String(value ?? '').trim();
    return text.length > 0 && text.length <= maxLength;
  };

  const isValidDate = (value) => {
    if (!value) return true;
    return !Number.isNaN(new Date(value).getTime());
  };

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.documents.list({ client_id: user.id });
      let list = res;
      if (category) list = list.filter(d => d.category === category);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(d => d.file_name.toLowerCase().includes(s) || d.ocr_text.toLowerCase().includes(s));
      }
      setDocs(list);
    } catch (err) {
      console.error(err);
      showToast('Error listing documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNewDoc(prev => ({ ...prev, client_id: user.id }));
    fetchDocs();
  }, [search, category, user.id]);

  const handleUpload = async () => {
    if (!isNonEmpty(newDoc.file_name, 150)) {
      showToast('Document file name is required and must be under 150 characters', 'warning');
      return;
    }
    if (!isValidDate(newDoc.expiry_date)) {
      showToast('Expiry date must be valid', 'warning');
      return;
    }
    if (/[\\/]/.test(String(newDoc.file_name))) {
      showToast('File name cannot contain path separators', 'warning');
      return;
    }
    try {
      const payload = {
        ...newDoc,
        expiry_date: newDoc.expiry_date ? new Date(newDoc.expiry_date).getTime() / 1000 : null
      };
      await api.documents.create(payload);
      showToast('Document uploaded and parsed by OCR engine', 'success');
      setOpenUpload(false);
      fetchDocs();
    } catch (err) {
      showToast('Error saving document', 'error');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this document?')) {
      try {
        await api.documents.delete(id);
        showToast('Document removed', 'success');
        if (selectedDoc?.id === id) setSelectedDoc(null);
        fetchDocs();
      } catch (err) {
        showToast('Error deleting document', 'error');
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Documents Desk</Typography>
          <Typography variant="body2" color="textSecondary">Upload deeds, KYC cards, lease deeds, and invoke automated OCR parser</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenUpload(true)} sx={{ ml: 'auto' }}>
          Upload Document
        </Button>
      </Box>

      {/* Filter and Search */}
      <Card sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search document names or parsed text index..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Document Type</InputLabel>
              <Select
                value={category}
                label="Document Type"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="">All Documents</MenuItem>
                <MenuItem value="PAN">PAN Card</MenuItem>
                <MenuItem value="Aadhar">Aadhaar Card</MenuItem>
                <MenuItem value="Sale Deed">Sale Deed</MenuItem>
                <MenuItem value="Lease Agreement">Lease Agreement</MenuItem>
                <MenuItem value="Insurance">Insurance Policy</MenuItem>
                <MenuItem value="Tax Receipt">Tax Receipt</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Main Grid split with OCR previewer */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedDoc ? 7 : 12}>
          <Card sx={{ p: 2 }}>
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none', border: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Expiry Alert</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                  ) : docs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>No documents found.</TableCell></TableRow>
                  ) : (
                    docs.map((doc) => {
                      const expiringSoon = doc.expiry_date && (doc.expiry_date < (Date.now() / 1000 + 86400 * 30));
                      return (
                        <TableRow 
                          key={doc.id} 
                          onClick={() => setSelectedDoc(doc)}
                          sx={{ 
                            cursor: 'pointer',
                            backgroundColor: selectedDoc?.id === doc.id ? 'rgba(100, 255, 218, 0.05)' : 'transparent',
                            '&:hover': { backgroundColor: 'rgba(100, 255, 218, 0.02)' }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>{doc.file_name}</TableCell>
                          <TableCell><Chip label={doc.category} size="small" variant="outlined" color="primary" /></TableCell>
                          <TableCell>
                            {doc.expiry_date ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: expiringSoon ? 'error.main' : 'text.secondary' }}>
                                {expiringSoon && <WarningIcon fontSize="inherit" />}
                                <Typography variant="body2" fontSize="inherit">
                                  {new Date(doc.expiry_date * 1000).toLocaleDateString()}
                                </Typography>
                              </Box>
                            ) : '-'}
                          </TableCell>
                          <TableCell><Chip label={doc.status} size="small" color="success" /></TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => setSelectedDoc(doc)}><VisibilityIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={(e) => handleDelete(doc.id, e)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* OCR Sidebar Preview */}
        {selectedDoc && (
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3, position: 'sticky', top: 24 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>AI OCR Extractor</Typography>
                <Button size="small" onClick={() => setSelectedDoc(null)}>Close</Button>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                The parser scanned this file and indexed the following keywords into full-text search:
              </Typography>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: themeMode === 'dark' ? '#081729' : '#f8fafc', 
                  borderRadius: 2,
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: '0.85rem',
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: '120px'
                }}
              >
                {selectedDoc.ocr_text}
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={openUpload} onClose={() => setOpenUpload(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Upload & Scan File</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Document Display Name (e.g. PAN_Card_Ananya.pdf)" 
              fullWidth 
              size="small"
              value={newDoc.file_name} 
              onChange={e => setNewDoc(prev => ({ ...prev, file_name: e.target.value }))} 
            />
            <FormControl fullWidth size="small">
              <InputLabel>Document Type</InputLabel>
              <Select
                value={newDoc.category}
                label="Document Type"
                onChange={e => setNewDoc(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="PAN">PAN Card</MenuItem>
                <MenuItem value="Aadhar">Aadhaar Card</MenuItem>
                <MenuItem value="Sale Deed">Sale Deed</MenuItem>
                <MenuItem value="Lease Agreement">Lease Agreement</MenuItem>
                <MenuItem value="Insurance">Insurance Policy</MenuItem>
                <MenuItem value="Tax Receipt">Tax Receipt</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Document Expiry Date (if applicable)" 
              type="date"
              fullWidth 
              size="small"
              InputLabelProps={{ shrink: true }}
              value={newDoc.expiry_date} 
              onChange={e => setNewDoc(prev => ({ ...prev, expiry_date: e.target.value }))} 
            />
            <Box sx={{ border: '2px dashed rgba(100,255,218,0.2)', p: 3, borderRadius: 2, textAlign: 'center', cursor: 'pointer' }}>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>Simulate drag & drop file upload</Typography>
              <Typography variant="caption" color="textSecondary">Upload limit: 25MB (PDF, PNG, JPG)</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained">Upload & Analyze</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DocumentsView;
