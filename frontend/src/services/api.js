import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('assetflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle expired or invalid tokens (401 Unauthorized)
axiosClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('assetflow_token');
    localStorage.removeItem('assetflow_user');
    window.location.hash = '#/login';
    window.location.reload();
  }
  return Promise.reject(error);
});


// Seed data generators for MockDB fallback
const seedMockDB = () => {
  const users = [
    { id: 'usr_1', username: 'admin', email: 'admin@assetflow.com', role: 'Super Admin' },
    { id: 'usr_2', username: 'john_manager', email: 'john@assetflow.com', role: 'Asset Manager' },
    { id: 'usr_3', username: 'wealth_advisor', email: 'advisor@assetflow.com', role: 'Investment Advisor' },
    { id: 'usr_4', username: 'client_ananya', email: 'ananya@gmail.com', role: 'Client' },
    { id: 'usr_5', username: 'accountant_ravi', email: 'ravi@assetflow.com', role: 'Accountant' }
  ];

  const clientProfile = {
    user_id: 'usr_4',
    email: 'ananya@gmail.com',
    username: 'client_ananya',
    personal_details: {
      first_name: 'Ananya',
      last_name: 'Sharma',
      phone: '+91 98765 43210',
      address: 'Skyview Towers, Gachibowli, Hyderabad, TS, 500032',
      date_of_birth: '1992-08-24'
    },
    kyc: {
      pan: 'ABCDE1234F',
      aadhar: '9876 5432 1098',
      passport: 'Z8765432',
      status: 'Verified',
      verified_at: Date.now() / 1000 - 86400 * 30,
      verifier_id: 'usr_1'
    },
    bank_accounts: [
      { bank_name: 'HDFC Bank Ltd.', account_number: '5010029384756', ifsc_code: 'HDFC0000021', account_type: 'Savings', balance: 1245000 },
      { bank_name: 'ICICI Bank Ltd.', account_number: '000401928374', ifsc_code: 'ICIC0000004', account_type: 'Savings', balance: 650000 }
    ],
    nominee: { name: 'Karan Sharma', relationship: 'Spouse', allocation_pct: 100 },
    family_members: [
      { name: 'Karan Sharma', relationship: 'Spouse', age: 34 },
      { name: 'Aarav Sharma', relationship: 'Son', age: 4 }
    ],
    occupation: 'Senior Engineering Manager',
    income: {
      annual_range: '₹35L - ₹50L',
      monthly_salary: 320000,
      rental_income: 65000,
      dividend_income: 12000,
      interest_income: 8000,
      business_income: 0
    },
    risk_profile: 'Moderate',
    investment_goals: ['Retirement Fund', "Child's Higher Education", 'Real Estate Expansion'],
    tax_information: { tax_slab: '30% New Regime', tax_id: 'IT-992039B' },
    profile_completion_pct: 95
  };

  const assets = [
    {
      id: 'ast_1',
      owner_id: 'usr_4',
      name: 'Premium Commercial Office Space',
      category: 'Real Estate',
      subcategory: 'Commercial Office',
      purchase_date: '2024-01-15',
      purchase_price: 15000000,
      current_value: 17500000,
      address: 'Unit 401, Cyber Towers, Hitec City, Hyderabad',
      latitude: 17.4504,
      longitude: 78.3809,
      images: ['https://images.unsplash.com/photo-1497366216548-37526070297c'],
      documents: ['https://s3.aws.com/sale_deed.pdf'],
      tax_details: 'Property Tax: ₹45,000/annum',
      maintenance_cost: 320000,
      insurance: 'ICICI Lombard Property Secure',
      status: 'Active',
      manager_id: 'usr_2',
      remarks: 'Currently leased out to tech startup at 7% capitalization rate.',
      income_generated: 1625000,
      roi: 16.67,
      growth_pct: 16.67,
      depreciation: 0,
      tags: ['Commercial', 'High Yield', 'Hyderabad'],
      favorites: ['usr_4'],
      valuation_history: [
        { timestamp: Date.now() / 1000 - 86400 * 365, value: 15000000 },
        { timestamp: Date.now() / 1000 - 86400 * 180, value: 16000000 },
        { timestamp: Date.now() / 1000, value: 17500000 }
      ]
    },
    {
      id: 'ast_2',
      owner_id: 'usr_4',
      name: 'Nifty 50 Equity Portfolio',
      category: 'Stocks',
      subcategory: 'Large Cap Index',
      purchase_date: '2022-06-10',
      purchase_price: 3500000,
      current_value: 4950000,
      address: 'Zerodha Demat Account',
      images: [],
      documents: [],
      tax_details: 'Short Term Capital Gains (15%), Long Term Capital Gains (10% over 1L)',
      maintenance_cost: 0,
      insurance: '',
      status: 'Active',
      manager_id: 'usr_3',
      remarks: 'Direct equity holdings across top 50 blue chip Indian corporations.',
      income_generated: 145000,
      roi: 41.43,
      growth_pct: 41.43,
      depreciation: 0,
      tags: ['Equity', 'Liquid', 'Bluechip'],
      favorites: [],
      valuation_history: [
        { timestamp: Date.now() / 1000 - 86400 * 365, value: 3800000 },
        { timestamp: Date.now() / 1000 - 86400 * 180, value: 4200000 },
        { timestamp: Date.now() / 1000, value: 4950000 }
      ]
    },
    {
      id: 'ast_3',
      owner_id: 'usr_4',
      name: 'Ethereum (ETH) Holding',
      category: 'Crypto',
      subcategory: 'Altcoin L1',
      purchase_date: '2021-11-20',
      purchase_price: 1200000,
      current_value: 950000,
      address: 'Ledger Cold Wallet',
      images: [],
      documents: [],
      tax_details: 'Flat 30% on virtual digital asset gains',
      maintenance_cost: 0,
      status: 'Active',
      manager_id: 'usr_3',
      remarks: 'Long term position in smart contract blockchain layer.',
      income_generated: 48000, // Staking yield
      roi: -20.83,
      growth_pct: -20.83,
      tags: ['Crypto', 'High Risk', 'Web3'],
      favorites: [],
      valuation_history: [
        { timestamp: Date.now() / 1000 - 86400 * 365, value: 800000 },
        { timestamp: Date.now() / 1000 - 86400 * 180, value: 1100000 },
        { timestamp: Date.now() / 1000, value: 950000 }
      ]
    },
    {
      id: 'ast_4',
      owner_id: 'usr_4',
      name: 'Gold sovereign coins',
      category: 'Gold & Precious Metals',
      subcategory: 'Physical Gold',
      purchase_date: '2023-10-24',
      purchase_price: 800000,
      current_value: 1150000,
      address: 'HDFC Safe Deposit Locker 14',
      images: [],
      documents: [],
      tax_details: 'Indexation benefit on LTCG',
      status: 'Active',
      remarks: 'Physical gold stored securely for wealth preservation.',
      income_generated: 0,
      roi: 43.75,
      growth_pct: 43.75,
      tags: ['Safe Haven', 'Inflation Hedge'],
      favorites: [],
      valuation_history: [
        { timestamp: Date.now() / 1000 - 86400 * 180, value: 950000 },
        { timestamp: Date.now() / 1000, value: 1150000 }
      ]
    }
  ];

  const leases = [
    {
      id: 'lse_1',
      property_id: 'ast_1',
      property_name: 'Premium Commercial Office Space',
      property_address: 'Unit 401, Cyber Towers, Hitec City, Hyderabad',
      tenant_name: 'InnoTech Solutions Pvt Ltd',
      tenant_email: 'finance@innotech.com',
      tenant_phone: '+91 80099 22001',
      rent_amount: 65000,
      rent_due_day: 5,
      lease_start: '2024-03-01',
      lease_end: '2027-02-28',
      security_deposit: 390000,
      status: 'Active',
      payment_history: [
        { payment_id: 'pay_1', amount: 65000, month: 'May 2026', date_paid: Date.now() / 1000 - 86400 * 50, status: 'Paid' },
        { payment_id: 'pay_2', amount: 65000, month: 'June 2026', date_paid: Date.now() / 1000 - 86400 * 20, status: 'Paid' },
        { payment_id: 'pay_3', amount: 65000, month: 'July 2026', date_paid: Date.now() / 1000 - 86400 * 1, status: 'Paid' }
      ],
      maintenance_requests: [
        { request_id: 'req_1', issue: 'HVAC Aircon servicing', cost: 18000, status: 'Resolved', date_created: Date.now() / 1000 - 86400 * 40 },
        { request_id: 'req_2', issue: 'Network switch faulty port fixing', cost: 0, status: 'Resolved', date_created: Date.now() / 1000 - 86400 * 10 }
      ]
    }
  ];

  const crmLeads = [
    { id: 'ld_1', name: 'Vikram Reddy', email: 'vikram@reddyholdings.in', phone: '+91 99000 11223', status: 'Proposal', assigned_to: 'usr_2', notes: 'Interested in buying commercial warehouses near airport.', follow_up_date: Date.now() / 1000 + 86400 * 2, created_at: Date.now() / 1000 - 86400 * 10 },
    { id: 'ld_2', name: 'Dr. Shruti Kapoor', email: 'shruti.k@apollo.org', phone: '+91 98888 77766', status: 'Prospect', assigned_to: 'usr_2', notes: 'Wants an advisor to review her ₹10Cr mutual fund portfolio.', follow_up_date: Date.now() / 1000 + 86400 * 5, created_at: Date.now() / 1000 - 86400 * 4 },
    { id: 'ld_3', name: 'Mehta Developers LLC', email: 'info@mehtabuilders.com', phone: '+91 22 2938 1029', status: 'Won', assigned_to: 'usr_2', notes: 'Closed deal for structuring land parcel investment trust.', follow_up_date: Date.now() / 1000 + 86400 * 20, created_at: Date.now() / 1000 - 86400 * 60 }
  ];

  const tasks = [
    { id: 'tsk_1', title: 'KYC Document Audit: Ananya', description: 'Cross reference uploaded Passport and PAN database matching.', category: 'KYC Verification', assigned_to: 'usr_5', client_id: 'usr_4', due_date: Date.now() / 1000 + 86400 * 1, status: 'Pending', created_at: Date.now() / 1000 },
    { id: 'tsk_2', title: 'Property Fire Insurance Renewal', description: 'Asset ast_1 Cyber Towers insurance expires next week. Contact ICICI.', category: 'Renewal', assigned_to: 'usr_2', client_id: 'usr_4', due_date: Date.now() / 1000 + 86400 * 6, status: 'Pending', created_at: Date.now() / 1000 },
    { id: 'tsk_3', title: 'Asset Valuation Advisory', description: 'Periodic review of direct equity portfolio under volatile market.', category: 'Client Meeting', assigned_to: 'usr_3', client_id: 'usr_4', due_date: Date.now() / 1000 - 86400 * 2, status: 'Completed', created_at: Date.now() / 1000 - 86400 * 5 }
  ];

  const goals = [
    { id: 'gl_1', client_id: 'usr_4', name: 'Retirement Wealth Fund', category: 'Retirement', target_amount: 50000000, current_amount: 24750000, target_date: '2042-12-31', monthly_investment: 120000, progress_pct: 49.5 },
    { id: 'gl_2', client_id: 'usr_4', name: 'Aarav Ivy League College Fund', category: 'Child Education', target_amount: 20000000, current_amount: 4950000, target_date: '2040-06-30', monthly_investment: 50000, progress_pct: 24.75 }
  ];

  const documents = [
    { id: 'doc_1', client_id: 'usr_4', file_name: 'PAN_Verification.pdf', file_url: '#', category: 'PAN', upload_date: Date.now() / 1000 - 86400 * 30, expiry_date: null, status: 'Verified', ocr_text: 'PAN CARD. GOVT OF INDIA. NO: ABCDE1234F. NAME: ANANYA SHARMA.', uploaded_by: 'usr_4' },
    { id: 'doc_2', client_id: 'usr_4', file_name: 'Office_Sale_Deed.pdf', file_url: '#', category: 'Sale Deed', upload_date: Date.now() / 1000 - 86400 * 120, expiry_date: null, status: 'Verified', ocr_text: 'REGISTRY SALE DEED. Plot 401 Cyber Towers. Gachibowli Area.', uploaded_by: 'usr_2' },
    { id: 'doc_3', client_id: 'usr_4', file_name: 'Cyber_Towers_Lease_Agreement.pdf', file_url: '#', category: 'Lease Agreement', upload_date: Date.now() / 1000 - 86400 * 50, expiry_date: Date.now() / 1000 + 86400 * 200, status: 'Verified', ocr_text: 'LEASE DEED. Cyber Towers 401. Tenant InnoTech Solutions. Rental 65000/month.', uploaded_by: 'usr_2' }
  ];

  const transactions = [
    { id: 'tx_1', client_id: 'usr_4', type: 'Rent Collected', amount: 65000, asset_id: 'ast_1', description: 'Rent collected: Premium Commercial Office Space - July 2026', timestamp: Date.now() / 1000 - 86400 * 1, status: 'Completed' },
    { id: 'tx_2', client_id: 'usr_4', type: 'Rent Collected', amount: 65000, asset_id: 'ast_1', description: 'Rent collected: Premium Commercial Office Space - June 2026', timestamp: Date.now() / 1000 - 86400 * 20, status: 'Completed' },
    { id: 'tx_3', client_id: 'usr_4', type: 'Maintenance Paid', amount: 18000, asset_id: 'ast_1', description: 'Paid maintenance for Premium Commercial Office Space: HVAC Aircon servicing', timestamp: Date.now() / 1000 - 86400 * 40, status: 'Completed' },
    { id: 'tx_4', client_id: 'usr_4', type: 'Buy Asset', amount: 800000, asset_id: 'ast_4', description: 'Acquired Gold sovereign coins', timestamp: Date.now() / 1000 - 86400 * 90, status: 'Completed' }
  ];

  const income = [
    { id: 'inc_1', client_id: 'usr_4', category: 'Rental Income', amount: 65000, received_date: Date.now() / 1000 - 86400 * 1, tax_classification: 'House Property Income', description: 'Rent payment from InnoTech Solutions for Cyber Towers (July 2026)' },
    { id: 'inc_2', client_id: 'usr_4', category: 'Rental Income', amount: 65000, received_date: Date.now() / 1000 - 86400 * 20, tax_classification: 'House Property Income', description: 'Rent payment from InnoTech Solutions for Cyber Towers (June 2026)' },
    { id: 'inc_3', client_id: 'usr_4', category: 'Rental Income', amount: 65000, received_date: Date.now() / 1000 - 86400 * 50, tax_classification: 'House Property Income', description: 'Rent payment from InnoTech Solutions for Cyber Towers (May 2026)' },
    { id: 'inc_4', client_id: 'usr_4', category: 'Dividends', amount: 12000, received_date: Date.now() / 1000 - 86400 * 8, tax_classification: 'Dividend Income', description: 'Direct equity stock holdings dividend receipt' },
    { id: 'inc_5', client_id: 'usr_4', category: 'Interest', amount: 8000, received_date: Date.now() / 1000 - 86400 * 15, tax_classification: 'Other Source Income', description: 'Fixed deposit quarterly bank interest payout' }
  ];

  const expenses = [
    { id: 'exp_1', client_id: 'usr_4', asset_id: 'ast_1', category: 'Maintenance & Repairs', amount: 18000, spent_date: Date.now() / 1000 - 86400 * 40, description: 'Maintenance expense for Cyber Towers: HVAC Aircon servicing' },
    { id: 'exp_2', client_id: 'usr_4', asset_id: '', category: 'Property Tax', amount: 45000, spent_date: Date.now() / 1000 - 86400 * 60, description: 'Annual property tax payment for Gachibowli Cyber Towers unit' },
    { id: 'exp_3', client_id: 'usr_4', asset_id: '', category: 'Loan EMI', amount: 85000, spent_date: Date.now() / 1000 - 86400 * 5, description: 'Home loan monthly EMI repayment' },
    { id: 'exp_4', client_id: 'usr_4', asset_id: 'ast_1', category: 'Electricity Bills', amount: 12400, spent_date: Date.now() / 1000 - 86400 * 10, description: 'Utility bills Cyber Towers unit office' }
  ];

  const meetings = [
    { id: 'mt_1', title: 'Initial Portfolio Risk Strategy Review', client_id: 'usr_4', host_id: 'usr_3', date_time: Date.now() / 1000 + 86400 * 1, duration: 45, notes: 'Align asset allocation vectors with target retirement dates.', type: 'Call' },
    { id: 'mt_2', title: 'Commercial Lease Agreement Signing', client_id: 'usr_4', host_id: 'usr_2', date_time: Date.now() / 1000 - 86400 * 50, duration: 60, notes: 'Walkthrough and sign Cyber Towers lease deed with InnoTech Solutions.', type: 'In-Person' }
  ];

  const audit_logs = [
    { user_id: 'usr_4', username: 'client_ananya', role: 'Client', action: 'POST /api/auth/login', method: 'POST', path: '/api/auth/login', status_code: 200, ip_address: '192.168.1.102', user_agent: 'Chrome/OS Windows', duration_sec: 0.12, timestamp: Date.now() / 1000 },
    { user_id: 'usr_2', username: 'john_manager', role: 'Asset Manager', action: 'POST /api/rental/payments/record', method: 'POST', path: '/api/rental/payments/record', status_code: 201, ip_address: '10.2.14.88', user_agent: 'Firefox/Mac OS', duration_sec: 0.23, timestamp: Date.now() / 1000 - 86400 * 1 }
  ];

  localStorage.setItem('mf_users', JSON.stringify(users));
  localStorage.setItem('mf_client_profile', JSON.stringify(clientProfile));
  localStorage.setItem('mf_assets', JSON.stringify(assets));
  localStorage.setItem('mf_leases', JSON.stringify(leases));
  localStorage.setItem('mf_crm_leads', JSON.stringify(crmLeads));
  localStorage.setItem('mf_tasks', JSON.stringify(tasks));
  localStorage.setItem('mf_goals', JSON.stringify(goals));
  localStorage.setItem('mf_documents', JSON.stringify(documents));
  localStorage.setItem('mf_transactions', JSON.stringify(transactions));
  localStorage.setItem('mf_income', JSON.stringify(income));
  localStorage.setItem('mf_expenses', JSON.stringify(expenses));
  localStorage.setItem('mf_meetings', JSON.stringify(meetings));
  localStorage.setItem('mf_audit_logs', JSON.stringify(audit_logs));
};

if (!localStorage.getItem('mf_users')) {
  seedMockDB();
}

// Client-side localstorage DB engine fallback
const MockDB = {
  getCollection: (name) => JSON.parse(localStorage.getItem(`mf_${name}`) || '[]'),
  saveCollection: (name, data) => localStorage.setItem(`mf_${name}`, JSON.stringify(data)),
  
  auth: {
    login: (email, password) => {
      const users = MockDB.getCollection('users');
      // If we seek standard log, match any seeded user by email
      const user = users.find(u => u.email === email);
      if (user) {
        return {
          token: 'mock-jwt-token-string-' + user.id,
          user: { id: user.id, username: user.username, email: user.email, role: user.role }
        };
      }
      // Create new client if matches signup pattern
      return null;
    },
    register: (username, email, role, phone) => {
      const users = MockDB.getCollection('users');
      const id = 'usr_' + Date.now();
      const newUser = { id, username, email, role, phone };
      users.push(newUser);
      MockDB.saveCollection('users', users);
      
      if (role === 'Client') {
        const clientProfile = {
          user_id: id, email, username,
          personal_details: { first_name: username, last_name: '', phone: phone || '', address: '', date_of_birth: '' },
          kyc: { pan: '', aadhar: '', passport: '', status: 'Pending', verified_at: null },
          bank_accounts: [],
          nominee: { name: '', relationship: '', allocation_pct: 100 },
          family_members: [], occupation: '',
          income: { annual_range: '', monthly_salary: 0, rental_income: 0, dividend_income: 0, interest_income: 0, business_income: 0 },
          risk_profile: 'Moderate', investment_goals: [], tax_information: { tax_slab: '', tax_id: '' },
          profile_completion_pct: 15
        };
        localStorage.setItem('mf_client_profile', JSON.stringify(clientProfile));
      }
      
      return {
        token: 'mock-jwt-token-string-' + id,
        user: { id, username, email, role }
      };
    }
  },
  
  client: {
    get: (clientId) => {
      const profile = JSON.parse(localStorage.getItem('mf_client_profile'));
      if (profile && profile.user_id === clientId) return profile;
      // Default blank fallback
      return { user_id: clientId, personal_details: { first_name: 'Client', last_name: '' }, kyc: { status: 'Pending' }, bank_accounts: [], risk_profile: 'Moderate', profile_completion_pct: 20 };
    },
    save: (profile) => {
      localStorage.setItem('mf_client_profile', JSON.stringify(profile));
      return profile;
    },
    list: () => {
      const profile = JSON.parse(localStorage.getItem('mf_client_profile'));
      return { results: [profile] };
    }
  },

  assets: {
    list: () => MockDB.getCollection('assets'),
    get: (id) => MockDB.getCollection('assets').find(a => a.id === id),
    create: (asset) => {
      const assets = MockDB.getCollection('assets');
      asset.id = 'ast_' + Date.now();
      asset.favorites = [];
      asset.valuation_history = [{ timestamp: Date.now() / 1000, value: asset.current_value }];
      asset.roi = asset.purchase_price > 0 ? parseFloat((((asset.current_value - asset.purchase_price) / asset.purchase_price) * 100).toFixed(2)) : 0;
      asset.growth_pct = asset.roi;
      assets.push(asset);
      MockDB.saveCollection('assets', assets);
      
      // Register transaction
      const txns = MockDB.getCollection('transactions');
      txns.push({ id: 'tx_' + Date.now(), client_id: asset.owner_id, type: 'Buy Asset', amount: asset.purchase_price, asset_id: asset.id, description: `Acquired ${asset.name}`, timestamp: Date.now() / 1000, status: 'Completed' });
      MockDB.saveCollection('transactions', txns);
      
      return asset;
    },
    update: (id, updated) => {
      const assets = MockDB.getCollection('assets');
      const idx = assets.findIndex(a => a.id === id);
      if (idx !== -1) {
        const old = assets[idx];
        const updatedAsset = { ...old, ...updated };
        if (Math.abs(updatedAsset.current_value - old.current_value) > 0.01) {
          updatedAsset.valuation_history.push({ timestamp: Date.now() / 1000, value: updatedAsset.current_value });
          updatedAsset.roi = updatedAsset.purchase_price > 0 ? parseFloat((((updatedAsset.current_value - updatedAsset.purchase_price) / updatedAsset.purchase_price) * 100).toFixed(2)) : 0;
          updatedAsset.growth_pct = updatedAsset.roi;
        }
        assets[idx] = updatedAsset;
        MockDB.saveCollection('assets', assets);
        return updatedAsset;
      }
      return null;
    },
    delete: (id) => {
      const assets = MockDB.getCollection('assets');
      const filtered = assets.filter(a => a.id !== id);
      MockDB.saveCollection('assets', filtered);
    }
  },

  rental: {
    list: () => MockDB.getCollection('leases'),
    create: (lease) => {
      const leases = MockDB.getCollection('leases');
      lease.id = 'lse_' + Date.now();
      lease.payment_history = [];
      lease.maintenance_requests = [];
      leases.push(lease);
      MockDB.saveCollection('leases', leases);
      return lease;
    },
    recordPayment: (leaseId, amount, month) => {
      const leases = MockDB.getCollection('leases');
      const idx = leases.findIndex(l => l.id === leaseId);
      if (idx !== -1) {
        const lease = leases[idx];
        const pay = { payment_id: 'pay_' + Date.now(), amount: parseFloat(amount), month, date_paid: Date.now() / 1000, status: 'Paid' };
        lease.payment_history.push(pay);
        leases[idx] = lease;
        MockDB.saveCollection('leases', leases);

        // Record income
        const inc = MockDB.getCollection('income');
        inc.push({ id: 'inc_' + Date.now(), client_id: 'usr_4', category: 'Rental Income', amount: parseFloat(amount), received_date: Date.now() / 1000, tax_classification: 'House Property Income', description: `Rent payment for ${lease.property_name} (${month})` });
        MockDB.saveCollection('income', inc);

        // Record transaction
        const txns = MockDB.getCollection('transactions');
        txns.push({ id: 'tx_' + Date.now(), client_id: 'usr_4', type: 'Rent Collected', amount: parseFloat(amount), asset_id: lease.property_id, description: `Rent collected: ${lease.property_name} - ${month}`, timestamp: Date.now() / 1000, status: 'Completed' });
        MockDB.saveCollection('transactions', txns);
        
        // Update asset income
        const assets = MockDB.getCollection('assets');
        const aIdx = assets.findIndex(a => a.id === lease.property_id);
        if (aIdx !== -1) {
          assets[aIdx].income_generated = (assets[aIdx].income_generated || 0) + parseFloat(amount);
          MockDB.saveCollection('assets', assets);
        }

        return pay;
      }
    },
    recordMaintenance: (leaseId, issue, cost) => {
      const leases = MockDB.getCollection('leases');
      const idx = leases.findIndex(l => l.id === leaseId);
      if (idx !== -1) {
        const lease = leases[idx];
        const req = { request_id: 'req_' + Date.now(), issue, cost: parseFloat(cost), status: 'Resolved', date_created: Date.now() / 1000 };
        lease.maintenance_requests.push(req);
        leases[idx] = lease;
        MockDB.saveCollection('leases', leases);

        if (parseFloat(cost) > 0) {
          // Record expense
          const exp = MockDB.getCollection('expenses');
          exp.push({ id: 'exp_' + Date.now(), client_id: 'usr_4', asset_id: lease.property_id, category: 'Maintenance & Repairs', amount: parseFloat(cost), spent_date: Date.now() / 1000, description: `Maintenance for ${lease.property_name}: ${issue}` });
          MockDB.saveCollection('expenses', exp);

          // Record transaction
          const txns = MockDB.getCollection('transactions');
          txns.push({ id: 'tx_' + Date.now(), client_id: 'usr_4', type: 'Maintenance Paid', amount: parseFloat(cost), asset_id: lease.property_id, description: `Paid maintenance for ${lease.property_name}: ${issue}`, timestamp: Date.now() / 1000, status: 'Completed' });
          MockDB.saveCollection('transactions', txns);
          
          // Update asset costs
          const assets = MockDB.getCollection('assets');
          const aIdx = assets.findIndex(a => a.id === lease.property_id);
          if (aIdx !== -1) {
            assets[aIdx].maintenance_cost = (assets[aIdx].maintenance_cost || 0) + parseFloat(cost);
            MockDB.saveCollection('assets', assets);
          }
        }
        return req;
      }
    }
  },

  accounting: {
    income: () => MockDB.getCollection('income'),
    addIncome: (item) => {
      const inc = MockDB.getCollection('income');
      item.id = 'inc_' + Date.now();
      inc.push(item);
      MockDB.saveCollection('income', inc);

      const txns = MockDB.getCollection('transactions');
      txns.push({ id: 'tx_' + Date.now(), client_id: item.client_id, type: 'Income Received', amount: item.amount, description: `Recorded ${item.category}: ${item.description}`, timestamp: Date.now() / 1000, status: 'Completed' });
      MockDB.saveCollection('transactions', txns);

      return item;
    },
    expenses: () => MockDB.getCollection('expenses'),
    addExpense: (item) => {
      const exp = MockDB.getCollection('expenses');
      item.id = 'exp_' + Date.now();
      exp.push(item);
      MockDB.saveCollection('expenses', exp);

      const txns = MockDB.getCollection('transactions');
      txns.push({ id: 'tx_' + Date.now(), client_id: item.client_id, type: 'Expense Spent', amount: item.amount, description: `Recorded ${item.category}: ${item.description}`, timestamp: Date.now() / 1000, status: 'Completed' });
      MockDB.saveCollection('transactions', txns);

      return item;
    },
    statements: () => {
      const incomes = MockDB.getCollection('income');
      const expenses = MockDB.getCollection('expenses');
      const assets = MockDB.getCollection('assets');
      
      const total_income = incomes.reduce((s, i) => s + i.amount, 0);
      const total_expenses = expenses.reduce((s, i) => s + i.amount, 0);
      
      const ledger = [
        ...incomes.map(i => ({ id: i.id, date: i.received_date, type: 'Credit (Inflow)', category: i.category, amount: i.amount, description: i.description })),
        ...expenses.map(e => ({ id: e.id, date: e.spent_date, type: 'Debit (Outflow)', category: e.category, amount: -e.amount, description: e.description }))
      ].sort((a,b) => b.date - a.date);

      const bank_accounts = JSON.parse(localStorage.getItem('mf_client_profile'))?.bank_accounts || [];
      const bank_balances = bank_accounts.reduce((s, b) => s + b.balance, 0);
      const total_assets_value = assets.reduce((s, a) => s + a.current_value, 0);

      const p_and_l = {
        total_income,
        total_expenses,
        net_profit: total_income - total_expenses,
        incomes_by_category: incomes.reduce((acc, c) => ({ ...acc, [c.category]: (acc[c.category] || 0) + c.amount }), {}),
        expenses_by_category: expenses.reduce((acc, c) => ({ ...acc, [c.category]: (acc[c.category] || 0) + c.amount }), {})
      };

      const balance_sheet = {
        assets: { fixed_assets_portfolio: total_assets_value, liquid_cash_bank: bank_balances, total_assets: total_assets_value + bank_balances },
        liabilities: { estimated_loans_outstanding: 1020000, total_liabilities: 1020000 },
        equity: { net_worth: total_assets_value + bank_balances - 1020000 }
      };

      // 12 Months Cash Flow timeline mockup
      const months = ['Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'June 2026', 'July 2026'];
      const cash_flow = months.map((m, idx) => {
        const multiplier = (idx + 4) * 12000;
        return { label: m, inflow: 130000 + multiplier, outflow: 60000 + multiplier * 0.4, net: 70000 + multiplier * 0.6 };
      });

      return { p_and_l, ledger, balance_sheet, cash_flow };
    }
  },

  goals: {
    list: () => MockDB.getCollection('goals'),
    create: (goal) => {
      const goals = MockDB.getCollection('goals');
      goal.id = 'gl_' + Date.now();
      goal.progress_pct = goal.target_amount > 0 ? parseFloat(((goal.current_amount / goal.target_amount) * 100).toFixed(2)) : 0;
      goals.push(goal);
      MockDB.saveCollection('goals', goals);
      return goal;
    },
    update: (id, updated) => {
      const goals = MockDB.getCollection('goals');
      const idx = goals.findIndex(g => g.id === id);
      if (idx !== -1) {
        const goal = { ...goals[idx], ...updated };
        goal.progress_pct = goal.target_amount > 0 ? parseFloat(((goal.current_amount / goal.target_amount) * 100).toFixed(2)) : 0;
        goals[idx] = goal;
        MockDB.saveCollection('goals', goals);
        return goal;
      }
    },
    delete: (id) => {
      const goals = MockDB.getCollection('goals');
      MockDB.saveCollection('goals', goals.filter(g => g.id !== id));
    }
  },

  crm: {
    leads: () => MockDB.getCollection('crm_leads'),
    createLead: (lead) => {
      const leads = MockDB.getCollection('crm_leads');
      lead.id = 'ld_' + Date.now();
      lead.created_at = Date.now() / 1000;
      leads.push(lead);
      MockDB.saveCollection('crm_leads', leads);
      return lead;
    },
    meetings: () => MockDB.getCollection('meetings'),
    createMeeting: (mtg) => {
      const meetings = MockDB.getCollection('meetings');
      mtg.id = 'mt_' + Date.now();
      mtg.created_at = Date.now() / 1000;
      meetings.push(mtg);
      MockDB.saveCollection('meetings', meetings);
      
      const tasks = MockDB.getCollection('tasks');
      tasks.push({
        id: 'tsk_' + Date.now(),
        title: `Meeting: ${mtg.title}`,
        description: `CRM meeting schedule: ${mtg.notes}`,
        category: 'Client Meeting',
        assigned_to: mtg.host_id,
        client_id: mtg.client_id,
        due_date: mtg.date_time,
        status: 'Pending',
        created_at: Date.now() / 1000
      });
      MockDB.saveCollection('tasks', tasks);
      return mtg;
    }
  },

  tasks: {
    list: () => MockDB.getCollection('tasks'),
    create: (task) => {
      const tasks = MockDB.getCollection('tasks');
      task.id = 'tsk_' + Date.now();
      task.created_at = Date.now() / 1000;
      tasks.push(task);
      MockDB.saveCollection('tasks', tasks);
      return task;
    },
    update: (id, statusVal) => {
      const tasks = MockDB.getCollection('tasks');
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasks[idx].status = statusVal;
        MockDB.saveCollection('tasks', tasks);
        return tasks[idx];
      }
    }
  },

  documents: {
    list: () => MockDB.getCollection('documents'),
    create: (doc) => {
      const docs = MockDB.getCollection('documents');
      doc.id = 'doc_' + Date.now();
      doc.upload_date = Date.now() / 1000;
      doc.status = 'Verified';
      doc.ocr_text = `MOCK OCR EXTRACTED TEXT: Document category ${doc.category}. File name: ${doc.file_name}. Verified content indices set.`;
      docs.push(doc);
      MockDB.saveCollection('documents', docs);

      if (doc.expiry_date) {
        const tasks = MockDB.getCollection('tasks');
        tasks.push({
          id: 'tsk_' + Date.now(),
          title: `Document Expiry Reminder: ${doc.file_name}`,
          description: `The uploaded ${doc.category} document is expiring. Please arrange renewal paperwork.`,
          category: 'Renewal',
          assigned_to: 'usr_4',
          client_id: doc.client_id,
          due_date: parseFloat(doc.expiry_date) - 86400 * 7,
          status: 'Pending',
          created_at: Date.now() / 1000
        });
        MockDB.saveCollection('tasks', tasks);
      }
      return doc;
    },
    delete: (id) => {
      const docs = MockDB.getCollection('documents');
      MockDB.saveCollection('documents', docs.filter(d => d.id !== id));
    }
  },

  transactions: {
    list: () => MockDB.getCollection('transactions')
  }
};

// Global network error wrapper to fallback to client mock engine
const wrapApiCall = async (apiFunc, mockFunc) => {
  try {
    const res = await apiFunc();
    return res.data;
  } catch (err) {
    if (!err.response || err.response.status === 403 || err.response.status === 401 || err.response.status === 404 || err.response.status >= 500) {
      console.warn(`Backend API returned ${err.response ? err.response.status : 'offline'}. Falling back to local MockDB engine.`);
      return mockFunc();
    }
    throw err;
  }
};

export const api = {
  auth: {
    login: async (credentials) => {
      const res = await wrapApiCall(
        () => axiosClient.post('/auth/login', credentials),
        () => {
          const mockRes = MockDB.auth.login(credentials.email, credentials.password);
          if (!mockRes) throw new Error('Invalid mock credentials');
          return mockRes;
        }
      );
      if (res && res.token) {
        localStorage.setItem('assetflow_token', res.token);
        localStorage.setItem('assetflow_user', JSON.stringify(res.user));
      }
      return res;
    },
    signup: async (user) => {
      const res = await wrapApiCall(
        () => axiosClient.post('/auth/register', user),
        () => {
          return MockDB.auth.register(user.username, user.email, user.role, user.phone);
        }
      );
      if (res && res.token) {
        localStorage.setItem('assetflow_token', res.token);
        localStorage.setItem('assetflow_user', JSON.stringify(res.user));
      }
      return res;
    },
    logout: () => {
      localStorage.removeItem('assetflow_token');
      localStorage.removeItem('assetflow_user');
      return Promise.resolve();
    },
    getCurrentUser: () => {
      const user = localStorage.getItem('assetflow_user');
      return user ? JSON.parse(user) : null;
    }
  },
  
  client: {
    getProfile: (clientId) => wrapApiCall(
      () => axiosClient.get(`/clients/profile?client_id=${clientId}`),
      () => MockDB.client.get(clientId)
    ),
    updateProfile: (profile) => wrapApiCall(
      () => axiosClient.put('/clients/profile', profile),
      () => MockDB.client.save(profile)
    ),
    list: () => wrapApiCall(
      () => axiosClient.get('/clients/list'),
      () => MockDB.client.list()
    )
  },

  clients: {
    profile: (clientId) => wrapApiCall(
      () => axiosClient.get(`/clients/profile?client_id=${clientId}`),
      () => MockDB.client.get(clientId)
    ),
    list: () => wrapApiCall(
      () => axiosClient.get('/clients/list'),
      () => MockDB.client.list()
    )
  },

  assets: {
    list: (params = {}) => wrapApiCall(
      () => axiosClient.get('/assets/', { params }),
      () => {
        let list = MockDB.assets.list();
        if (params.client_id) list = list.filter(a => a.owner_id === params.client_id);
        if (params.category) list = list.filter(a => a.category === params.category);
        if (params.status) list = list.filter(a => a.status === params.status);
        if (params.search) {
          const s = params.search.toLowerCase();
          list = list.filter(a => a.name.toLowerCase().includes(s) || a.subcategory.toLowerCase().includes(s));
        }
        return { results: list, total: list.length };
      }
    ),
    get: (id) => wrapApiCall(
      () => axiosClient.get(`/assets/${id}`),
      () => MockDB.assets.get(id)
    ),
    create: (asset) => wrapApiCall(
      () => axiosClient.post('/assets/', asset),
      () => MockDB.assets.create(asset)
    ),
    update: (id, asset) => wrapApiCall(
      () => axiosClient.put(`/assets/${id}`, asset),
      () => MockDB.assets.update(id, asset)
    ),
    delete: (id) => wrapApiCall(
      () => axiosClient.delete(`/assets/${id}`),
      () => MockDB.assets.delete(id)
    )
  },

  rental: {
    list: (params = {}) => wrapApiCall(
      () => axiosClient.get('/rental/leases', { params }),
      () => {
        let list = MockDB.rental.list();
        if (params.client_id) {
          const propIds = MockDB.assets.list().filter(a => a.owner_id === params.client_id && a.category === 'Real Estate').map(a => a.id);
          list = list.filter(l => propIds.includes(l.property_id));
        }
        return { results: list };
      }
    ),
    createLease: (lease) => wrapApiCall(
      () => axiosClient.post('/rental/leases', lease),
      () => MockDB.rental.create(lease)
    ),
    recordPayment: (payment) => wrapApiCall(
      () => axiosClient.post('/rental/payments/record', payment),
      () => MockDB.rental.recordPayment(payment.lease_id, payment.amount, payment.month)
    ),
    recordMaintenance: (req) => wrapApiCall(
      () => axiosClient.post('/rental/maintenance/record', req),
      () => MockDB.rental.recordMaintenance(req.lease_id, req.issue, req.cost)
    ),
    analytics: (params = {}) => wrapApiCall(
      () => axiosClient.get('/rental/analytics', { params }),
      () => {
        let leases = MockDB.rental.list();
        let assets = MockDB.assets.list().filter(a => a.category === 'Real Estate');
        if (params.client_id) {
          assets = assets.filter(a => a.owner_id === params.client_id);
          const propIds = assets.map(a => a.id);
          leases = leases.filter(l => propIds.includes(l.property_id));
        }
        const activeLeases = leases.filter(l => l.status === 'Active').length;
        const totalRent = leases.reduce((s, l) => s + l.payment_history.reduce((sp, p) => sp + p.amount, 0), 0);
        const totalMaint = leases.reduce((s, l) => s + l.maintenance_requests.reduce((sm, m) => sm + m.cost, 0), 0);
        return {
          total_properties: assets.length,
          active_leases: activeLeases,
          occupancy_rate: assets.length > 0 ? parseFloat(((activeLeases / assets.length) * 100).toFixed(2)) : 0,
          total_rent_collected: totalRent,
          total_maintenance_spent: totalMaint,
          net_cash_flow: totalRent - totalMaint
        };
      }
    )
  },

  accounting: {
    statements: (clientId) => wrapApiCall(
      () => axiosClient.get(`/accounting/statements?client_id=${clientId}`),
      () => MockDB.accounting.statements()
    ),
    addIncome: (item) => wrapApiCall(
      () => axiosClient.post('/accounting/income', item),
      () => MockDB.accounting.addIncome(item)
    ),
    addExpense: (item) => wrapApiCall(
      () => axiosClient.post('/accounting/expenses', item),
      () => MockDB.accounting.addExpense(item)
    )
  },

  goals: {
    list: (clientId) => wrapApiCall(
      () => axiosClient.get(`/investments/goals?client_id=${clientId}`),
      () => MockDB.goals.list()
    ),
    create: (goal) => wrapApiCall(
      () => axiosClient.post('/investments/goals', goal),
      () => MockDB.goals.create(goal)
    ),
    update: (id, goal) => wrapApiCall(
      () => axiosClient.put(`/investments/goals/${id}`, goal),
      () => MockDB.goals.update(id, goal)
    ),
    delete: (id) => wrapApiCall(
      () => axiosClient.delete(`/investments/goals/${id}`),
      () => MockDB.goals.delete(id)
    )
  },

  crm: {
    leads: () => wrapApiCall(
      () => axiosClient.get('/crm/leads'),
      () => MockDB.crm.leads()
    ),
    createLead: (lead) => wrapApiCall(
      () => axiosClient.post('/crm/leads', lead),
      () => MockDB.crm.createLead(lead)
    ),
    meetings: () => wrapApiCall(
      () => axiosClient.get('/crm/meetings'),
      () => MockDB.crm.meetings()
    ),
    createMeeting: (mtg) => wrapApiCall(
      () => axiosClient.post('/crm/meetings', mtg),
      () => MockDB.crm.createMeeting(mtg)
    ),
    updateMeeting: (id, mtg) => wrapApiCall(
      () => axiosClient.put(`/crm/meetings/${id}`, mtg),
      () => {
        const meetings = MockDB.getCollection('meetings');
        const idx = meetings.findIndex(m => m.id === id);
        if (idx !== -1) {
          meetings[idx] = { ...meetings[idx], ...mtg };
          MockDB.saveCollection('meetings', meetings);
        }
        return meetings[idx];
      }
    ),
    deleteMeeting: (id) => wrapApiCall(
      () => axiosClient.delete(`/crm/meetings/${id}`),
      () => {
        const meetings = MockDB.getCollection('meetings');
        const updated = meetings.filter(m => m.id !== id);
        MockDB.saveCollection('meetings', updated);
        return { message: 'Meeting cancelled' };
      }
    )
  },

  tasks: {
    list: () => wrapApiCall(
      () => axiosClient.get('/crm/tasks'),
      () => MockDB.tasks.list()
    ),
    create: (task) => wrapApiCall(
      () => axiosClient.post('/crm/tasks', task),
      () => MockDB.tasks.create(task)
    ),
    updateStatus: (id, statusVal) => wrapApiCall(
      () => axiosClient.put(`/crm/tasks/${id}`, { status: statusVal }),
      () => MockDB.tasks.update(id, statusVal)
    )
  },

  documents: {
    list: (params = {}) => wrapApiCall(
      () => axiosClient.get('/documents/', { params }),
      () => {
        let list = MockDB.documents.list();
        if (params.client_id) {
          list = list.filter(d => d.client_id === params.client_id);
        }
        return list;
      }
    ),
    create: (doc) => wrapApiCall(
      () => axiosClient.post('/documents/', doc),
      () => MockDB.documents.create(doc)
    ),
    delete: (id) => wrapApiCall(
      () => axiosClient.delete(`/documents/${id}`),
      () => MockDB.documents.delete(id)
    )
  },

  ai: {
    search: (queryText) => wrapApiCall(
      () => axiosClient.post('/ai/search', { query: queryText }),
      () => {
        const assets = MockDB.assets.list();
        const q = queryText.toLowerCase();
        let cat = '';
        if (q.includes('real estate') || q.includes('rental') || q.includes('properties')) cat = 'Real Estate';
        else if (q.includes('stock')) cat = 'Stocks';
        else if (q.includes('crypto')) cat = 'Crypto';
        else if (q.includes('gold')) cat = 'Gold & Precious Metals';

        let list = cat ? assets.filter(a => a.category === cat) : assets;
        
        // Filter income if above specified number
        const numbers = queryText.match(/\d+/);
        if (numbers) {
          const val = parseInt(numbers[0]);
          if (q.includes('above') || q.includes('greater') || q.includes('more')) {
            list = list.filter(a => (a.income_generated || 0) > val || a.current_value > val);
          } else if (q.includes('below') || q.includes('less') || q.includes('under')) {
            list = list.filter(a => (a.income_generated || 0) < val || a.current_value < val);
          }
        }
        return { parsed_query: `Category: ${cat}`, original_query: queryText, results_count: list.length, results: list };
      }
    ),
    predictions: (clientId) => wrapApiCall(
      () => axiosClient.get(`/ai/predictions?client_id=${clientId}`),
      () => {
        const assets = MockDB.assets.list();
        const total = assets.reduce((s,a) => s + a.current_value, 0);
        const re = assets.filter(a => a.category === 'Real Estate').map(p => ({
          property_id: p.id,
          name: p.name,
          current_value: p.current_value,
          predicted_yield_pct: p.purchase_price > 0 ? parseFloat(((p.income_generated / p.purchase_price) * 100).toFixed(2)) : 5.4,
          predicted_value_3_years: Math.round(p.current_value * 1.19),
          predicted_value_5_years: Math.round(p.current_value * 1.34)
        }));
        
        return {
          portfolio_health_score: 88,
          portfolio_health_status: 'Excellent',
          property_predictions: re,
          predicted_monthly_income_6_months: 335000,
          predicted_monthly_expense_6_months: 41000,
          predicted_net_savings_6_months: 294000,
          market_trend_summary: 'Global market indexes indicate bullish consolidation. Real Estate yields remain highly lucrative across major commercial tech hubs.',
          recommendation_engine: {
            risk_profile: 'Moderate',
            recommended_assets: [
              { name: 'Nifty 50 Index Mutual Fund', category: 'Mutual Funds', reason: 'Consistent compound growth with lower expense ratios.' },
              { name: 'Sovereign Gold Bonds (SGB)', category: 'Bonds', reason: 'Tax-free capital gains and 2.5% yield hedge.' },
              { name: 'Premium Warehousing Property', category: 'Real Estate', reason: 'Industrial warehousing lease rates growing at 8% CAGR.' }
            ]
          }
        };
      }
    )
  },

  transactions: {
    list: () => wrapApiCall(
      () => axiosClient.get('/accounting/statements'), // use ledger fallback
      () => MockDB.transactions.list()
    )
  }
};
