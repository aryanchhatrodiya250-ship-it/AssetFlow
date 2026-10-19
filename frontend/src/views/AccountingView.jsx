import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddIcon from '@mui/icons-material/Add';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { api } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function AccountingView({ user, showToast, themeMode }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);

  // Invoices & Receipts State
  const [openInvoice, setOpenInvoice] = useState(false);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState([]);

  const [invoiceForm, setInvoiceForm] = useState({
    amount: '',
    gst_rate_pct: 18,
    billed_to_name: '',
    billed_to_address: '',
    billed_to_gstin: '',
    item_description: 'Management & Advisory Services'
  });

  const [receiptForm, setReceiptForm] = useState({
    amount: '',
    received_from: '',
    purpose: 'Portfolio Management Fee Payment',
    payment_mode: 'Bank Transfer'
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'Miscellaneous',
    amount: '',
    spent_date: new Date().toISOString().slice(0,10),
    description: ''
  });

  const isNonEmpty = (value, maxLength = 250) => {
    const text = String(value ?? '').trim();
    return text.length > 0 && text.length <= maxLength;
  };

  const isPositiveNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.accounting.statements(user.id);
      setStats(res);
      
      // Load generated documents from local storage if any
      const savedDocs = JSON.parse(localStorage.getItem(`generated_reports_${user.id}`) || '[]');
      setGeneratedDocs(savedDocs);
    } catch (err) {
      console.error(err);
      showToast('Error loading financial statements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleGenerateInvoice = async () => {
    if (!isNonEmpty(invoiceForm.billed_to_name, 150)) {
      showToast('Billed-to name is required and must be under 150 characters', 'warning');
      return;
    }
    if (!isNonEmpty(invoiceForm.billed_to_address, 250)) {
      showToast('Billed-to address is required and must be under 250 characters', 'warning');
      return;
    }
    if (!isNonEmpty(invoiceForm.item_description, 200)) {
      showToast('Invoice item description is required and must be under 200 characters', 'warning');
      return;
    }
    if (!isPositiveNumber(invoiceForm.amount)) {
      showToast('Invoice amount must be greater than 0', 'warning');
      return;
    }
    if (invoiceForm.gst_rate_pct === '' || Number(invoiceForm.gst_rate_pct) < 0 || Number(invoiceForm.gst_rate_pct) > 100) {
      showToast('GST rate must be between 0 and 100', 'warning');
      return;
    }
    try {
      const payload = {
        ...invoiceForm,
        amount: parseFloat(invoiceForm.amount),
        gst_rate_pct: parseFloat(invoiceForm.gst_rate_pct)
      };
      await api.accounting.addIncome({
        client_id: user.id,
        category: 'Consultancy Income',
        amount: payload.amount,
        received_date: Date.now() / 1000,
        tax_classification: 'Other Source Income',
        description: `GST Invoice generated: ${payload.item_description}`
      });
      
      // Call mock generation API endpoint
      const invoiceData = await axiosClientPostMock(payload, 'Invoice');
      const updatedDocs = [invoiceData, ...generatedDocs];
      setGeneratedDocs(updatedDocs);
      localStorage.setItem(`generated_reports_${user.id}`, JSON.stringify(updatedDocs));

      showToast('GST Invoice generated & income logged!', 'success');
      setOpenInvoice(false);
      setInvoiceForm({ amount: '', gst_rate_pct: 18, billed_to_name: '', billed_to_address: '', billed_to_gstin: '', item_description: 'Management & Advisory Services' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || err.response?.data?.detail || 'Error generating invoice', 'error');
    }
  };

  const handleGenerateReceipt = async () => {
    if (!isNonEmpty(receiptForm.received_from, 150)) {
      showToast('Received-from name is required and must be under 150 characters', 'warning');
      return;
    }
    if (!isNonEmpty(receiptForm.purpose, 200)) {
      showToast('Receipt purpose is required and must be under 200 characters', 'warning');
      return;
    }
    if (!isPositiveNumber(receiptForm.amount)) {
      showToast('Receipt amount must be greater than 0', 'warning');
      return;
    }
    try {
      const payload = {
        ...receiptForm,
        amount: parseFloat(receiptForm.amount)
      };
      
      const receiptData = await axiosClientPostMock(payload, 'Receipt');
      const updatedDocs = [receiptData, ...generatedDocs];
      setGeneratedDocs(updatedDocs);
      localStorage.setItem(`generated_reports_${user.id}`, JSON.stringify(updatedDocs));

      showToast('GST Payment Receipt generated successfully', 'success');
      setOpenReceipt(false);
      setReceiptForm({ amount: '', received_from: '', purpose: 'Portfolio Management Fee Payment', payment_mode: 'Bank Transfer' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || err.response?.data?.detail || 'Error generating receipt', 'error');
    }
  };

  const handleRecordExpense = async () => {
    if (!isPositiveNumber(expenseForm.amount)) {
      showToast('Expense amount must be greater than 0', 'warning');
      return;
    }
    if (!isNonEmpty(expenseForm.description, 250)) {
      showToast('Expense description is required and must be under 250 characters', 'warning');
      return;
    }
    if (!expenseForm.spent_date) {
      showToast('Expense date is required', 'warning');
      return;
    }
    
    try {
      const payload = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        spent_date: new Date(expenseForm.spent_date).getTime() / 1000,
        client_id: user.id
      };
      
      await api.accounting.addExpense(payload);

      showToast('Expense recorded successfully', 'success');
      setOpenExpense(false);
      setExpenseForm({ category: 'Miscellaneous', amount: '', spent_date: new Date().toISOString().slice(0,10), description: '' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || err.response?.data?.detail || 'Error recording expense', 'error');
    }
  };

  // Local helper since we can't run terminal commands, we build mock document structures locally for robust download display
  const axiosClientPostMock = async (data, type) => {
    const refNum = type === 'Invoice' ? `AF-${Date.now()}` : `REC-${Date.now()}`;
    return {
      type,
      reference_number: refNum,
      created_at: Date.now() / 1000,
      details: {
        amount: data.amount,
        name: type === 'Invoice' ? data.billed_to_name : data.received_from,
        purpose: type === 'Invoice' ? data.item_description : data.purpose,
        download_url: `http://localhost:8000/api/accounting/${type.toLowerCase()}/download/${refNum}`
      }
    };
  };

  const triggerMockDownload = (doc) => {
    // Dynamically load jsPDF CDN if not already loaded
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        generatePDF(doc);
      };
      document.body.appendChild(script);
      showToast('Loading PDF generation engine...', 'info');
    } else {
      generatePDF(doc);
    }
  };

  const generatePDF = (doc) => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    // Set colors & fonts
    pdf.setFillColor(11, 37, 69); // Dark blue primary
    pdf.rect(0, 0, 210, 40, 'F');
    
    // Header
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('AssetFlow Wealth Management', 15, 25);
    
    pdf.setTextColor(197, 160, 89); // Gold secondary
    pdf.setFontSize(10);
    pdf.text('PRIVATE WEALTH & ASSET MANAGEMENT', 15, 33);
    
    // Invoice details body
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(16);
    pdf.text(`${doc.type.toUpperCase()}`, 15, 60);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Reference No: ${doc.reference_number}`, 15, 70);
    pdf.text(`Date: ${new Date(doc.created_at * 1000).toLocaleString()}`, 15, 76);
    pdf.text(`Billed To / Remitter: ${doc.details.name}`, 15, 82);
    pdf.text(`Status: Paid / Verified`, 15, 88);
    
    // Table Header
    pdf.setFillColor(248, 249, 250);
    pdf.rect(15, 100, 180, 10, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description', 18, 106);
    pdf.text('Amount (INR)', 160, 106);
    
    // Table row
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${doc.details.purpose}`, 18, 120);
    pdf.text(`INR ${doc.details.amount.toLocaleString()}`, 160, 120);
    
    // Divider
    pdf.setDrawColor(220, 220, 220);
    pdf.line(15, 128, 195, 128);
    
    // Total
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total:', 130, 138);
    pdf.text(`INR ${doc.details.amount.toLocaleString()}`, 160, 138);
    
    // Footer
    pdf.setTextColor(120, 120, 120);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.text('This is a computer generated mock document for transactional validation.', 15, 270);
    pdf.text('Thank you for choosing AssetFlow.', 15, 276);
    
    pdf.save(`${doc.reference_number}.pdf`);
    showToast('Mock document downloaded successfully as PDF!', 'success');
  };

  if (loading || !stats) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  // Cash Flow Chart Configuration
  const lineChartData = {
    labels: stats.cash_flow.map(cf => cf.label),
    datasets: [
      {
        label: 'Inflow (INR)',
        data: stats.cash_flow.map(cf => cf.inflow),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Outflow (INR)',
        data: stats.cash_flow.map(cf => cf.outflow),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: themeMode === 'dark' ? '#94a3b8' : '#475569' } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: themeMode === 'dark' ? '#94a3b8' : '#475569' } },
      y: { ticks: { color: themeMode === 'dark' ? '#94a3b8' : '#475569' } }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Accounting Desk</Typography>
          <Typography variant="body2" color="textSecondary">Dynamic statements, Cash Flow tracking, and tax invoice registers</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" color="error" startIcon={<ShoppingCartIcon />} onClick={() => setOpenExpense(true)}>
            Record Expense
          </Button>
          <Button variant="outlined" startIcon={<RequestQuoteIcon />} onClick={() => setOpenInvoice(true)}>
            Raise Invoice
          </Button>
          <Button variant="contained" startIcon={<ReceiptLongIcon />} onClick={() => setOpenReceipt(true)}>
            Issue Receipt
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <ArrowUpwardIcon />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Total Income</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{stats.p_and_l.total_income.toLocaleString()}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              <ArrowDownwardIcon />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Total Expenses</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{stats.p_and_l.total_expenses.toLocaleString()}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              <AssessmentIcon />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Net Profit / Surplus</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: stats.p_and_l.net_profit >= 0 ? '#10b981' : '#ef4444' }}>
                ₹{stats.p_and_l.net_profit.toLocaleString()}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} color="primary" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Profit & Loss Statement" sx={{ fontWeight: 600 }} />
        <Tab label="Balance Sheet" sx={{ fontWeight: 600 }} />
        <Tab label="Chronological Ledger" sx={{ fontWeight: 600 }} />
        <Tab label="Tax Documents Vault" sx={{ fontWeight: 600 }} />
      </Tabs>

      {/* Tab 0: Profit & Loss Statement */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Cash Flow timeline</Typography>
              <Box sx={{ height: 300 }}>
                <Line data={lineChartData} options={chartOptions} />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Income Categories</Typography>
              <TableContainer component={Box}>
                <Table size="small">
                  <TableBody>
                    {Object.entries(stats.p_and_l.incomes_by_category).map(([cat, val]) => (
                      <TableRow key={cat}>
                        <TableCell sx={{ pl: 0, fontWeight: 500 }}>{cat}</TableCell>
                        <TableCell align="right" sx={{ pr: 0, fontWeight: 600, color: '#10b981' }}>₹{val.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {Object.keys(stats.p_and_l.incomes_by_category).length === 0 && (
                      <TableRow><TableCell align="center">No active credits logged</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" sx={{ fontWeight: 700, mt: 4, mb: 2 }}>Expense Categories</Typography>
              <TableContainer component={Box}>
                <Table size="small">
                  <TableBody>
                    {Object.entries(stats.p_and_l.expenses_by_category).map(([cat, val]) => (
                      <TableRow key={cat}>
                        <TableCell sx={{ pl: 0, fontWeight: 500 }}>{cat}</TableCell>
                        <TableCell align="right" sx={{ pr: 0, fontWeight: 600, color: '#ef4444' }}>₹{val.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {Object.keys(stats.p_and_l.expenses_by_category).length === 0 && (
                      <TableRow><TableCell align="center">No active debits logged</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Balance Sheet */}
      {activeTab === 1 && (
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Statements of Assets & Liabilities</Typography>
          </Box>
          <Grid container spacing={3}>
            {/* Assets */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'primary.main' }}>
                Assets (Fixed & Liquid)
              </Typography>
              <TableContainer component={Paper} sx={{ p: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Asset Class</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Valuation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Fixed Assets Portfolio</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{stats.balance_sheet.assets.fixed_assets_portfolio.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Liquid Cash & Bank Balances</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{stats.balance_sheet.assets.liquid_cash_bank.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: 'rgba(16,185,129,0.05)' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Total Assets</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#10b981' }}>₹{stats.balance_sheet.assets.total_assets.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Liabilities & Equity */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: '#ef4444' }}>
                Liabilities & Net Worth
              </Typography>
              <TableContainer component={Paper} sx={{ p: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Liability Class / Capital</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Valuation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Outstanding Loans & EMI Debt</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{stats.balance_sheet.liabilities.estimated_loans_outstanding.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow sx={{ borderBottom: '2px solid divider' }}>
                      <TableCell>Net Capital Equity (Net Worth)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>₹{stats.balance_sheet.equity.net_worth.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: 'rgba(99,102,241,0.05)' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Total Liabilities & Equity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#6366f1' }}>
                        ₹{(stats.balance_sheet.liabilities.total_liabilities + stats.balance_sheet.equity.net_worth).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Tab 2: Chronological Ledger */}
      {activeTab === 2 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Ledger Accounts (Recent Transactions)</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Transaction Details</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.ledger.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.date * 1000).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.category}</Typography>
                      <Typography variant="caption" color="textSecondary">{item.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <span style={{ color: item.amount >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {item.type}
                      </span>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: item.amount >= 0 ? '#10b981' : '#ef4444' }}>
                      {item.amount >= 0 ? '+' : ''}₹{item.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {stats.ledger.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center">No chronological transaction history logged</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 3: Tax Documents Vault */}
      {activeTab === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Generated GST Invoices & Receipts Register</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Document Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Billed To / Remitter</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {generatedDocs.map((doc) => (
                  <TableRow key={doc.reference_number}>
                    <TableCell sx={{ fontWeight: 600 }}>{doc.reference_number}</TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>{doc.details.name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: doc.type === 'Invoice' ? 'primary.main' : '#10b981' }}>
                      ₹{doc.details.amount.toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<FileDownloadIcon />} 
                        onClick={() => triggerMockDownload(doc)}
                      >
                        Mock Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {generatedDocs.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No invoices or receipts raised in this session</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Invoice Generation Dialog */}
      <Dialog open={openInvoice} onClose={() => setOpenInvoice(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Raise GST Tax Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Billed To (Name)"
              fullWidth
              size="small"
              value={invoiceForm.billed_to_name}
              onChange={e => setInvoiceForm(prev => ({ ...prev, billed_to_name: e.target.value }))}
            />
            <TextField
              label="Billed To (Address)"
              fullWidth
              size="small"
              value={invoiceForm.billed_to_address}
              onChange={e => setInvoiceForm(prev => ({ ...prev, billed_to_address: e.target.value }))}
            />
            <TextField
              label="Billed To (GSTIN)"
              fullWidth
              size="small"
              value={invoiceForm.billed_to_gstin}
              onChange={e => setInvoiceForm(prev => ({ ...prev, billed_to_gstin: e.target.value }))}
            />
            <TextField
              label="Service Description"
              fullWidth
              size="small"
              value={invoiceForm.item_description}
              onChange={e => setInvoiceForm(prev => ({ ...prev, item_description: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Subtotal (INR)"
                  type="number"
                  fullWidth
                  size="small"
                  value={invoiceForm.amount}
                  onChange={e => setInvoiceForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>GST Rate (%)</InputLabel>
                  <Select
                    value={invoiceForm.gst_rate_pct}
                    label="GST Rate (%)"
                    onChange={e => setInvoiceForm(prev => ({ ...prev, gst_rate_pct: e.target.value }))}
                  >
                    <MenuItem value={5}>5%</MenuItem>
                    <MenuItem value={12}>12%</MenuItem>
                    <MenuItem value={18}>18%</MenuItem>
                    <MenuItem value={28}>28%</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInvoice(false)}>Cancel</Button>
          <Button onClick={handleGenerateInvoice} variant="contained">Generate</Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Generation Dialog */}
      <Dialog open={openReceipt} onClose={() => setOpenReceipt(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Issue Payment Receipt</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Received From (Client Name)"
              fullWidth
              size="small"
              value={receiptForm.received_from}
              onChange={e => setReceiptForm(prev => ({ ...prev, received_from: e.target.value }))}
            />
            <TextField
              label="Purpose / Fee Details"
              fullWidth
              size="small"
              value={receiptForm.purpose}
              onChange={e => setReceiptForm(prev => ({ ...prev, purpose: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Amount (INR)"
                  type="number"
                  fullWidth
                  size="small"
                  value={receiptForm.amount}
                  onChange={e => setReceiptForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mode of Payment</InputLabel>
                  <Select
                    value={receiptForm.payment_mode}
                    label="Mode of Payment"
                    onChange={e => setReceiptForm(prev => ({ ...prev, payment_mode: e.target.value }))}
                  >
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="UPI Transfer">UPI Transfer</MenuItem>
                    <MenuItem value="Credit Card">Credit Card</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReceipt(false)}>Cancel</Button>
          <Button onClick={handleGenerateReceipt} variant="contained">Issue</Button>
        </DialogActions>
      </Dialog>

      {/* Record Expense Dialog */}
      <Dialog open={openExpense} onClose={() => setOpenExpense(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Record Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Expense Category</InputLabel>
              <Select
                value={expenseForm.category}
                label="Expense Category"
                onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="Maintenance & Repairs">Maintenance & Repairs</MenuItem>
                <MenuItem value="Property Tax">Property Tax</MenuItem>
                <MenuItem value="Insurance Premium">Insurance Premium</MenuItem>
                <MenuItem value="Loan EMI">Loan EMI</MenuItem>
                <MenuItem value="Electricity Bills">Electricity Bills</MenuItem>
                <MenuItem value="Water Bills">Water Bills</MenuItem>
                <MenuItem value="Legal Expenses">Legal Expenses</MenuItem>
                <MenuItem value="Brokerage & Commission">Brokerage & Commission</MenuItem>
                <MenuItem value="Travel Expenses">Travel Expenses</MenuItem>
                <MenuItem value="Salary & Wages">Salary & Wages</MenuItem>
                <MenuItem value="Miscellaneous">Miscellaneous</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Expense Description"
              fullWidth
              size="small"
              value={expenseForm.description}
              onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Amount (INR)"
                  type="number"
                  fullWidth
                  size="small"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Spent Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={expenseForm.spent_date}
                  onChange={e => setExpenseForm(prev => ({ ...prev, spent_date: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpense(false)}>Cancel</Button>
          <Button onClick={handleRecordExpense} variant="contained" color="error">Record Expense</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AccountingView;
