import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, Button, TextField, Select, MenuItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, CircularProgress, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';

function AssetsView({ user, showToast, themeMode }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Dialog State
  const [openAdd, setOpenAdd] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '', category: 'Stocks', subcategory: '', purchase_date: '2026-07-24',
    purchase_price: '', current_value: '', address: '',
    remarks: '', tags: '', owner_id: user.id
  });

  const [openEdit, setOpenEdit] = useState(false);
  const [editingAsset, setEditingAsset] = useState({
    name: '', category: 'Stocks', subcategory: '', purchase_date: '',
    purchase_price: '', current_value: '', address: '',
    remarks: '', tags: '', owner_id: user.id
  });

  const [newValuationVal, setNewValuationVal] = useState('');

  const isNonEmpty = (value, maxLength = 250) => {
    const text = String(value ?? '').trim();
    return text.length > 0 && text.length <= maxLength;
  };

  const isPositiveNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0;
  };

  const isNonNegativeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0;
  };

  const isValidDate = (value) => {
    if (!value) return false;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  };

  const validateAssetPayload = (asset) => {
    const errors = [];
    if (!isNonEmpty(asset.name, 150)) errors.push('Asset name is required and must be under 150 characters');
    if (!isNonEmpty(asset.category, 50)) errors.push('Asset category is required');
    if (!isValidDate(asset.purchase_date)) errors.push('Purchase date must be valid');
    if (!isPositiveNumber(asset.purchase_price)) errors.push('Purchase price must be greater than 0');
    if (!isPositiveNumber(asset.current_value)) errors.push('Current value must be greater than 0');
    if (asset.address && !isNonEmpty(asset.address, 250)) errors.push('Address cannot be blank');
    if (asset.remarks && String(asset.remarks).length > 500) errors.push('Remarks must be 500 characters or less');
    if (asset.tags && String(asset.tags).length > 500) errors.push('Tags are too long');

    if (asset.category === 'Real Estate' && asset.area_sqft !== undefined && asset.area_sqft !== '' && !isPositiveNumber(asset.area_sqft)) {
      errors.push('Property area must be greater than 0');
    }
    if (asset.category === 'Stocks') {
      if (asset.quantity !== undefined && asset.quantity !== '' && !isPositiveNumber(asset.quantity)) errors.push('Number of shares must be greater than 0');
      if (asset.ticker && !isNonEmpty(asset.ticker, 20)) errors.push('Ticker symbol is required');
    }
    if (asset.category === 'Mutual Funds' && asset.units !== undefined && asset.units !== '' && !isPositiveNumber(asset.units)) {
      errors.push('Units held must be greater than 0');
    }
    if (asset.category === 'Crypto' && asset.crypto_quantity !== undefined && asset.crypto_quantity !== '' && !isPositiveNumber(asset.crypto_quantity)) {
      errors.push('Crypto quantity must be greater than 0');
    }
    if (asset.category === 'Gold & Precious Metals' && asset.gold_weight !== undefined && asset.gold_weight !== '' && !isPositiveNumber(asset.gold_weight)) {
      errors.push('Gold weight must be greater than 0');
    }
    if (asset.category === 'Businesses') {
      if (asset.business_share !== undefined && asset.business_share !== '' && !isNonNegativeNumber(asset.business_share)) errors.push('Ownership share must be 0 or greater');
      if (asset.business_share !== undefined && asset.business_share !== '' && Number(asset.business_share) > 100) errors.push('Ownership share must be 100 or less');
      if (asset.monthly_profit !== undefined && asset.monthly_profit !== '' && !isNonNegativeNumber(asset.monthly_profit)) errors.push('Monthly profit must be 0 or greater');
    }

    return errors;
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.assets.list({ search, category, client_id: user.id });
      setAssets(res.results);
    } catch (err) {
      console.error(err);
      showToast('Error loading asset list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNewAsset(prev => ({ ...prev, owner_id: user.id }));
    fetchAssets();
  }, [search, category, user.id]);

  const handleCreate = async () => {
    const validationErrors = validateAssetPayload(newAsset);
    if (validationErrors.length > 0) {
      showToast(validationErrors[0], 'warning');
      return;
    }
    
    try {
      const payload = {
        ...newAsset,
        purchase_price: parseFloat(newAsset.purchase_price),
        current_value: parseFloat(newAsset.current_value),
        tags: newAsset.tags ? newAsset.tags.split(',').map(t => t.trim()) : []
      };
      
      await api.assets.create(payload);
      showToast('Asset registered successfully', 'success');
      setOpenAdd(false);
      fetchAssets();
    } catch (err) {
      showToast('Error registering asset', 'error');
    }
  };

  const handleFavoriteToggle = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.assets.update(id, { favorites: [user.id] }); // toggle
      showToast('Asset bookmarks updated', 'info');
      fetchAssets();
    } catch (err) {
      // Mock client side toggle if server is offline
      const localAssets = JSON.parse(localStorage.getItem('mf_assets') || '[]');
      const idx = localAssets.findIndex(a => a.id === id);
      if (idx !== -1) {
        const favs = localAssets[idx].favorites || [];
        if (favs.includes(user.id)) {
          localAssets[idx].favorites = favs.filter(f => f !== user.id);
        } else {
          localAssets[idx].favorites.push(user.id);
        }
        localStorage.setItem('mf_assets', JSON.stringify(localAssets));
        showToast('Asset bookmarks updated (mock)', 'info');
        fetchAssets();
      }
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await api.assets.delete(id);
        showToast('Asset removed successfully', 'success');
        if (selectedAsset?.id === id) setSelectedAsset(null);
        fetchAssets();
      } catch (err) {
        showToast('Error removing asset', 'error');
      }
    }
  };

  const handleEditClick = (asset, e) => {
    e.stopPropagation();
    setEditingAsset({
      ...asset,
      purchase_price: asset.purchase_price ? String(asset.purchase_price) : '',
      current_value: asset.current_value ? String(asset.current_value) : '',
      tags: asset.tags ? asset.tags.join(', ') : ''
    });
    setOpenEdit(true);
  };

  const handleSaveEdit = async () => {
    const validationErrors = validateAssetPayload(editingAsset);
    if (validationErrors.length > 0) {
      showToast(validationErrors[0], 'warning');
      return;
    }
    try {
      const payload = {
        ...editingAsset,
        purchase_price: parseFloat(editingAsset.purchase_price),
        current_value: parseFloat(editingAsset.current_value),
        tags: editingAsset.tags ? editingAsset.tags.split(',').map(t => t.trim()) : []
      };
      await api.assets.update(editingAsset.id, payload);
      showToast('Asset updated successfully', 'success');
      setOpenEdit(false);
      if (selectedAsset?.id === editingAsset.id) {
        setSelectedAsset(payload);
      }
      fetchAssets();
    } catch (err) {
      showToast('Error updating asset', 'error');
    }
  };

  const handleAddValuationPoint = async () => {
    if (!newValuationVal) {
      showToast('Please enter a valuation amount', 'warning');
      return;
    }
    const valAmount = parseFloat(newValuationVal);
    if (!Number.isFinite(valAmount) || valAmount <= 0) {
      showToast('Please enter a valid number', 'warning');
      return;
    }

    try {
      const updatedHistory = [
        ...(selectedAsset.valuation_history || []),
        { timestamp: Date.now() / 1000, value: valAmount }
      ];
      const res = await api.assets.update(selectedAsset.id, {
        valuation_history: updatedHistory,
        current_value: valAmount
      });
      showToast('New valuation point logged successfully', 'success');
      setSelectedAsset(res);
      setNewValuationVal('');
      fetchAssets();
    } catch (err) {
      // Mock client fallback if network fails
      const updatedAsset = {
        ...selectedAsset,
        current_value: valAmount,
        valuation_history: [
          ...(selectedAsset.valuation_history || []),
          { timestamp: Date.now() / 1000, value: valAmount }
        ]
      };
      setSelectedAsset(updatedAsset);
      // Also update assets list
      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? updatedAsset : a));
      showToast('New valuation point logged successfully (local)', 'success');
      setNewValuationVal('');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Top Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Asset Ledger</Typography>
          <Typography variant="body2" color="textSecondary">Manage properties, stocks, gold, and other wealth holdings</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setOpenAdd(true)}
          sx={{ ml: 'auto' }}
        >
          Add New Asset
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Card sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search assets by name, subcategory, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Category Filter</InputLabel>
              <Select
                value={category}
                label="Category Filter"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Real Estate">Real Estate</MenuItem>
                <MenuItem value="Stocks">Stocks</MenuItem>
                <MenuItem value="Mutual Funds">Mutual Funds</MenuItem>
                <MenuItem value="Crypto">Crypto</MenuItem>
                <MenuItem value="Gold & Precious Metals">Gold & Precious Metals</MenuItem>
                <MenuItem value="Businesses">Businesses</MenuItem>
                <MenuItem value="Collectibles">Collectibles</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Grid Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedAsset ? 7 : 12}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
          ) : assets.length === 0 ? (
            <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 6 }}>No assets matching query found.</Typography>
          ) : (
            <Grid container spacing={3}>
              {assets.map((asset) => {
                const fav = asset.favorites?.includes(user.id);
                return (
                  <Grid item xs={12} sm={selectedAsset ? 12 : 6} key={asset.id}>
                    <Card 
                      onClick={() => setSelectedAsset(asset)}
                      sx={{ 
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: selectedAsset?.id === asset.id ? 'primary.main' : 'divider',
                        boxShadow: selectedAsset?.id === asset.id ? '0 0 0 2px rgba(11, 37, 69, 0.1)' : 'none',
                        '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.2s' }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <Box>
                            <Chip label={asset.category} size="small" color="primary" sx={{ mb: 1, fontWeight: 600 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{asset.name}</Typography>
                            <Typography variant="body2" color="textSecondary">{asset.subcategory}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={(e) => handleFavoriteToggle(asset.id, e)}>
                              {fav ? <StarIcon color="secondary" /> : <StarBorderIcon />}
                            </IconButton>
                            <IconButton size="small" color="primary" onClick={(e) => handleEditClick(asset, e)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={(e) => handleDelete(asset.id, e)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <Grid container sx={{ mt: 2 }} spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">Current Value</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>₹{asset.current_value.toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">Net ROI</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: asset.roi >= 0 ? '#10b981' : '#ef4444' }}>
                              {asset.roi >= 0 ? '+' : ''}{asset.roi}%
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>

        {/* Selected Asset Details Panel Drawer */}
        {selectedAsset && (
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3, position: 'sticky', top: 24 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Asset Details</Typography>
                <Button size="small" onClick={() => setSelectedAsset(null)}>Close</Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Asset Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedAsset.name}</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Purchase Price</Typography>
                    <Typography variant="body1">₹{selectedAsset.purchase_price.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Purchase Date</Typography>
                    <Typography variant="body1">{selectedAsset.purchase_date}</Typography>
                  </Grid>
                </Grid>

                {selectedAsset.address && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">Geographic Location</Typography>
                    <Typography variant="body2">{selectedAsset.address}</Typography>
                  </Box>
                )}

                {/* Real Estate Custom Fields */}
                {selectedAsset.category === 'Real Estate' && selectedAsset.area_sqft && (
                  <Grid container spacing={2}>
                    {selectedAsset.area_sqft && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Property Area</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.area_sqft} sq ft</Typography>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* Stocks Custom Fields */}
                {selectedAsset.category === 'Stocks' && (selectedAsset.ticker || selectedAsset.quantity) && (
                  <Grid container spacing={2}>
                    {selectedAsset.ticker && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Ticker Symbol</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.ticker}</Typography>
                      </Grid>
                    )}
                    {selectedAsset.quantity && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Number of Shares</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.quantity}</Typography>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* Mutual Funds Custom Fields */}
                {selectedAsset.category === 'Mutual Funds' && (selectedAsset.fund_house || selectedAsset.units) && (
                  <Grid container spacing={2}>
                    {selectedAsset.fund_house && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Fund House Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.fund_house}</Typography>
                      </Grid>
                    )}
                    {selectedAsset.units && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Units Held</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.units}</Typography>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* Crypto Custom Fields */}
                {selectedAsset.category === 'Crypto' && (selectedAsset.crypto_symbol || selectedAsset.crypto_quantity) && (
                  <Grid container spacing={2}>
                    {selectedAsset.crypto_symbol && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Token Name / Symbol</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.crypto_symbol}</Typography>
                      </Grid>
                    )}
                    {selectedAsset.crypto_quantity && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Quantity Held</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.crypto_quantity}</Typography>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* Gold & Precious Metals Custom Fields */}
                {selectedAsset.category === 'Gold & Precious Metals' && (selectedAsset.gold_weight || selectedAsset.gold_purity) && (
                  <Grid container spacing={2}>
                    {selectedAsset.gold_weight && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Weight (grams)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.gold_weight} g</Typography>
                      </Grid>
                    )}
                    {selectedAsset.gold_purity && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Purity</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.gold_purity}</Typography>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* Businesses Custom Fields */}
                {selectedAsset.category === 'Businesses' && (selectedAsset.business_share || selectedAsset.monthly_profit) && (
                  <Grid container spacing={2}>
                    {selectedAsset.business_share && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Ownership Share</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.business_share}%</Typography>
                      </Grid>
                    )}
                    {selectedAsset.monthly_profit && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Monthly Profits</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{parseFloat(selectedAsset.monthly_profit).toLocaleString()}</Typography>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* Collectibles Custom Fields */}
                {selectedAsset.category === 'Collectibles' && (selectedAsset.collectible_condition || selectedAsset.collectible_rarity) && (
                  <Grid container spacing={2}>
                    {selectedAsset.collectible_condition && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Condition</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.collectible_condition}</Typography>
                      </Grid>
                    )}
                    {selectedAsset.collectible_rarity && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Rarity</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedAsset.collectible_rarity}</Typography>
                      </Grid>
                    )}
                  </Grid>
                )}

                {selectedAsset.remarks && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">Manager Remarks</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{selectedAsset.remarks}"</Typography>
                  </Box>
                )}

              </Box>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog Add Asset */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Register New Holding</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Asset Name (e.g. Cyber Towers Plot)" 
              fullWidth 
              size="small"
              value={newAsset.name} 
              onChange={e => setNewAsset(prev => ({ ...prev, name: e.target.value }))} 
            />
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={newAsset.category}
                label="Category"
                onChange={e => setNewAsset(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="Real Estate">Real Estate</MenuItem>
                <MenuItem value="Stocks">Stocks</MenuItem>
                <MenuItem value="Mutual Funds">Mutual Funds</MenuItem>
                <MenuItem value="Crypto">Crypto</MenuItem>
                <MenuItem value="Gold & Precious Metals">Gold & Precious Metals</MenuItem>
                <MenuItem value="Businesses">Businesses</MenuItem>
                <MenuItem value="Collectibles">Collectibles</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Subcategory (e.g. Physical Coins, Large Cap Index)" 
              fullWidth 
              size="small"
              value={newAsset.subcategory} 
              onChange={e => setNewAsset(prev => ({ ...prev, subcategory: e.target.value }))} 
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="Purchase Price (INR)" 
                  type="number" 
                  fullWidth 
                  size="small"
                  value={newAsset.purchase_price} 
                  onChange={e => setNewAsset(prev => ({ ...prev, purchase_price: e.target.value }))} 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Current Market Value (INR)" 
                  type="number" 
                  fullWidth 
                  size="small"
                  value={newAsset.current_value} 
                  onChange={e => setNewAsset(prev => ({ ...prev, current_value: e.target.value }))} 
                />
              </Grid>
            </Grid>
            <TextField 
              label="Acquisition Date" 
              type="date" 
              fullWidth 
              size="small"
              InputLabelProps={{ shrink: true }}
              value={newAsset.purchase_date} 
              onChange={e => setNewAsset(prev => ({ ...prev, purchase_date: e.target.value }))} 
            />
            {/* Real Estate Custom Fields */}
            {newAsset.category === 'Real Estate' && (
              <>
                <TextField 
                  label="Geographic Address / Location" 
                  fullWidth 
                  size="small"
                  value={newAsset.address || ''} 
                  onChange={e => setNewAsset(prev => ({ ...prev, address: e.target.value }))} 
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField 
                      label="Property Area (Sq Ft)" 
                      type="number" 
                      fullWidth 
                      size="small"
                      value={newAsset.area_sqft || ''} 
                      onChange={e => setNewAsset(prev => ({ ...prev, area_sqft: e.target.value }))} 
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {/* Stocks Custom Fields */}
            {newAsset.category === 'Stocks' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Ticker Symbol (e.g. INFY, AAPL)" 
                    fullWidth 
                    size="small"
                    value={newAsset.ticker || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, ticker: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Number of Shares" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={newAsset.quantity || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, quantity: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Mutual Funds Custom Fields */}
            {newAsset.category === 'Mutual Funds' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Fund House Name (e.g. SBI, HDFC)" 
                    fullWidth 
                    size="small"
                    value={newAsset.fund_house || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, fund_house: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Units Held" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={newAsset.units || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, units: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Crypto Custom Fields */}
            {newAsset.category === 'Crypto' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Token Name / Symbol (e.g. BTC, ETH)" 
                    fullWidth 
                    size="small"
                    value={newAsset.crypto_symbol || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, crypto_symbol: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Quantity Held" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={newAsset.crypto_quantity || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, crypto_quantity: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Gold & Precious Metals Custom Fields */}
            {newAsset.category === 'Gold & Precious Metals' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Weight (grams)" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={newAsset.gold_weight || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, gold_weight: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Purity (e.g. 24K, 22K)" 
                    fullWidth 
                    size="small"
                    value={newAsset.gold_purity || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, gold_purity: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Businesses Custom Fields */}
            {newAsset.category === 'Businesses' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Ownership Share (%)" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={newAsset.business_share || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, business_share: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Monthly Profits (INR)" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={newAsset.monthly_profit || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, monthly_profit: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Collectibles Custom Fields */}
            {newAsset.category === 'Collectibles' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Condition (e.g. Mint, Fair)" 
                    fullWidth 
                    size="small"
                    value={newAsset.collectible_condition || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, collectible_condition: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Rarity (e.g. Rare, Vintage)" 
                    fullWidth 
                    size="small"
                    value={newAsset.collectible_rarity || ''} 
                    onChange={e => setNewAsset(prev => ({ ...prev, collectible_rarity: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}
            <TextField 
              label="Remarks / Advisory Notes" 
              fullWidth 
              size="small"
              multiline 
              rows={2}
              value={newAsset.remarks} 
              onChange={e => setNewAsset(prev => ({ ...prev, remarks: e.target.value }))} 
            />
            <TextField 
              label="Tags (comma-separated, e.g. liquid, low-risk)" 
              fullWidth 
              size="small"
              value={newAsset.tags} 
              onChange={e => setNewAsset(prev => ({ ...prev, tags: e.target.value }))} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Register Holding</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Edit Asset */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Modify Asset Details</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField 
              label="Asset Name (e.g. Cyber Towers Plot)" 
              fullWidth 
              size="small"
              value={editingAsset.name} 
              onChange={e => setEditingAsset(prev => ({ ...prev, name: e.target.value }))} 
            />
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={editingAsset.category}
                label="Category"
                onChange={e => setEditingAsset(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="Real Estate">Real Estate</MenuItem>
                <MenuItem value="Stocks">Stocks</MenuItem>
                <MenuItem value="Mutual Funds">Mutual Funds</MenuItem>
                <MenuItem value="Crypto">Crypto</MenuItem>
                <MenuItem value="Gold & Precious Metals">Gold & Precious Metals</MenuItem>
                <MenuItem value="Businesses">Businesses</MenuItem>
                <MenuItem value="Collectibles">Collectibles</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Subcategory (e.g. Physical Coins, Large Cap Index)" 
              fullWidth 
              size="small"
              value={editingAsset.subcategory} 
              onChange={e => setEditingAsset(prev => ({ ...prev, subcategory: e.target.value }))} 
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="Purchase Price (INR)" 
                  type="number" 
                  fullWidth 
                  size="small"
                  value={editingAsset.purchase_price} 
                  onChange={e => setEditingAsset(prev => ({ ...prev, purchase_price: e.target.value }))} 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Current Market Value (INR)" 
                  type="number" 
                  fullWidth 
                  size="small"
                  value={editingAsset.current_value} 
                  onChange={e => setEditingAsset(prev => ({ ...prev, current_value: e.target.value }))} 
                />
              </Grid>
            </Grid>
            <TextField 
              label="Acquisition Date" 
              type="date" 
              fullWidth 
              size="small"
              InputLabelProps={{ shrink: true }}
              value={editingAsset.purchase_date} 
              onChange={e => setEditingAsset(prev => ({ ...prev, purchase_date: e.target.value }))} 
            />
            {/* Real Estate Custom Fields */}
            {editingAsset.category === 'Real Estate' && (
              <>
                <TextField 
                  label="Geographic Address / Location" 
                  fullWidth 
                  size="small"
                  value={editingAsset.address || ''} 
                  onChange={e => setEditingAsset(prev => ({ ...prev, address: e.target.value }))} 
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField 
                      label="Property Area (Sq Ft)" 
                      type="number" 
                      fullWidth 
                      size="small"
                      value={editingAsset.area_sqft || ''} 
                      onChange={e => setEditingAsset(prev => ({ ...prev, area_sqft: e.target.value }))} 
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {/* Stocks Custom Fields */}
            {editingAsset.category === 'Stocks' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Ticker Symbol (e.g. INFY, AAPL)" 
                    fullWidth 
                    size="small"
                    value={editingAsset.ticker || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, ticker: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Number of Shares" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={editingAsset.quantity || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, quantity: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Mutual Funds Custom Fields */}
            {editingAsset.category === 'Mutual Funds' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Fund House Name (e.g. SBI, HDFC)" 
                    fullWidth 
                    size="small"
                    value={editingAsset.fund_house || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, fund_house: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Units Held" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={editingAsset.units || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, units: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Crypto Custom Fields */}
            {editingAsset.category === 'Crypto' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Token Name / Symbol (e.g. BTC, ETH)" 
                    fullWidth 
                    size="small"
                    value={editingAsset.crypto_symbol || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, crypto_symbol: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Quantity Held" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={editingAsset.crypto_quantity || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, crypto_quantity: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Gold & Precious Metals Custom Fields */}
            {editingAsset.category === 'Gold & Precious Metals' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Weight (grams)" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={editingAsset.gold_weight || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, gold_weight: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Purity (e.g. 24K, 22K)" 
                    fullWidth 
                    size="small"
                    value={editingAsset.gold_purity || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, gold_purity: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Businesses Custom Fields */}
            {editingAsset.category === 'Businesses' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Ownership Share (%)" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={editingAsset.business_share || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, business_share: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Monthly Profits (INR)" 
                    type="number" 
                    fullWidth 
                    size="small"
                    value={editingAsset.monthly_profit || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, monthly_profit: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}

            {/* Collectibles Custom Fields */}
            {editingAsset.category === 'Collectibles' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    label="Condition (e.g. Mint, Fair)" 
                    fullWidth 
                    size="small"
                    value={editingAsset.collectible_condition || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, collectible_condition: e.target.value }))} 
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    label="Rarity (e.g. Rare, Vintage)" 
                    fullWidth 
                    size="small"
                    value={editingAsset.collectible_rarity || ''} 
                    onChange={e => setEditingAsset(prev => ({ ...prev, collectible_rarity: e.target.value }))} 
                  />
                </Grid>
              </Grid>
            )}
            <TextField 
              label="Remarks / Advisory Notes" 
              fullWidth 
              size="small"
              multiline 
              rows={2}
              value={editingAsset.remarks} 
              onChange={e => setEditingAsset(prev => ({ ...prev, remarks: e.target.value }))} 
            />
            <TextField 
              label="Tags (comma-separated, e.g. liquid, low-risk)" 
              fullWidth 
              size="small"
              value={editingAsset.tags} 
              onChange={e => setEditingAsset(prev => ({ ...prev, tags: e.target.value }))} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AssetsView;
