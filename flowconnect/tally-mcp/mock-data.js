/**
 * Mock data for ABC Traders (mirrors a real TallyPrime company)
 * Replace with live Tally data by setting MOCK_MODE=false in .env
 */

export const mockCompanyInfo = {
  name:           'ABC Traders',
  financial_year: '2025-2026',
  from_date:      '2025-04-01',
  to_date:        '2026-03-31',
  currency:       'INR',
  mode:           'mock',
};

export const mockLedgers = [
  // Bank Accounts
  { name: 'HDFC Bank',          group: 'Bank Accounts',    closing_balance:  245000, opening_balance:  100000 },
  { name: 'SBI Current A/c',    group: 'Bank Accounts',    closing_balance:   82000, opening_balance:   50000 },
  // Cash
  { name: 'Cash',               group: 'Cash-in-Hand',     closing_balance:   15000, opening_balance:   20000 },
  // Debtors
  { name: 'Raj Enterprises',    group: 'Sundry Debtors',   closing_balance:   75000, opening_balance:       0 },
  { name: 'Kumar & Co',         group: 'Sundry Debtors',   closing_balance:   42000, opening_balance:       0 },
  { name: 'Sharma Traders',     group: 'Sundry Debtors',   closing_balance:   18500, opening_balance:       0 },
  // Creditors
  { name: 'Mehta Suppliers',    group: 'Sundry Creditors', closing_balance:  -55000, opening_balance:       0 },
  { name: 'Global Imports',     group: 'Sundry Creditors', closing_balance:  -32000, opening_balance:       0 },
  // Income
  { name: 'Sales',              group: 'Sales Accounts',   closing_balance: -520000, opening_balance:       0 },
  { name: 'Service Income',     group: 'Sales Accounts',   closing_balance:  -85000, opening_balance:       0 },
  // Expenses
  { name: 'Purchase',           group: 'Purchase Accounts',closing_balance:  310000, opening_balance:       0 },
  { name: 'Salary',             group: 'Indirect Expenses',closing_balance:   96000, opening_balance:       0 },
  { name: 'Rent',               group: 'Indirect Expenses',closing_balance:   60000, opening_balance:       0 },
  { name: 'Electricity',        group: 'Indirect Expenses',closing_balance:   12000, opening_balance:       0 },
  { name: 'Office Expenses',    group: 'Indirect Expenses',closing_balance:    8500, opening_balance:       0 },
  // Capital
  { name: 'Capital Account',    group: 'Capital Account',  closing_balance: -200000, opening_balance: -200000 },
  { name: 'Drawings',           group: 'Capital Account',  closing_balance:   24000, opening_balance:       0 },
  // Loans
  { name: 'Bank Loan - HDFC',   group: 'Loans (Liability)',closing_balance:  -80000, opening_balance: -100000 },
  // Fixed Assets
  { name: 'Furniture',          group: 'Fixed Assets',     closing_balance:   45000, opening_balance:   50000 },
  { name: 'Computer Equipment', group: 'Fixed Assets',     closing_balance:   36000, opening_balance:   40000 },
];

export const mockVouchers = [
  { date: '2025-04-01', type: 'Receipt',  number: 'RCP-001', party: 'Raj Enterprises',  narration: 'Payment received against invoice',  amount:  50000 },
  { date: '2025-04-03', type: 'Sales',    number: 'SAL-001', party: 'Kumar & Co',        narration: 'Sale of goods',                      amount:  42000 },
  { date: '2025-04-05', type: 'Purchase', number: 'PUR-001', party: 'Mehta Suppliers',   narration: 'Purchase of raw materials',          amount:  35000 },
  { date: '2025-04-07', type: 'Payment',  number: 'PAY-001', party: 'Mehta Suppliers',   narration: 'Advance payment to supplier',        amount:  20000 },
  { date: '2025-04-10', type: 'Sales',    number: 'SAL-002', party: 'Sharma Traders',    narration: 'Sale of goods - April batch',        amount:  18500 },
  { date: '2025-04-12', type: 'Payment',  number: 'PAY-002', party: 'Salary',            narration: 'Staff salary for April',             amount:  32000 },
  { date: '2025-04-15', type: 'Purchase', number: 'PUR-002', party: 'Global Imports',    narration: 'Import of goods',                    amount:  32000 },
  { date: '2025-04-20', type: 'Receipt',  number: 'RCP-002', party: 'Kumar & Co',        narration: 'Partial payment received',           amount:  25000 },
  { date: '2025-04-25', type: 'Payment',  number: 'PAY-003', party: 'Rent',              narration: 'Office rent April',                  amount:   5000 },
  { date: '2025-04-30', type: 'Journal',  number: 'JRN-001', party: '',                  narration: 'Depreciation entry for April',       amount:   1500 },
  { date: '2025-05-01', type: 'Sales',    number: 'SAL-003', party: 'Raj Enterprises',   narration: 'Sale of goods - May',                amount:  75000 },
  { date: '2025-05-05', type: 'Purchase', number: 'PUR-003', party: 'Mehta Suppliers',   narration: 'Monthly purchase',                   amount:  55000 },
  { date: '2025-05-10', type: 'Receipt',  number: 'RCP-003', party: 'Sharma Traders',    narration: 'Full payment received',              amount:  18500 },
  { date: '2025-05-15', type: 'Payment',  number: 'PAY-004', party: 'Salary',            narration: 'Staff salary for May',               amount:  32000 },
  { date: '2025-05-31', type: 'Contra',   number: 'CON-001', party: 'Cash',              narration: 'Cash deposited to bank',             amount:  10000 },
];

export const mockBalanceSheet = {
  as_of_date: '2026-03-31',
  liabilities: {
    capital_and_reserves: [
      { name: 'Capital Account', amount: 200000 },
      { name: 'Net Profit',      amount: 118500 },
      { name: 'Drawings',        amount: -24000 },
    ],
    loans: [
      { name: 'Bank Loan - HDFC', amount: 80000 },
    ],
    current_liabilities: [
      { name: 'Sundry Creditors', amount: 87000 },
    ],
    total: 461500,
  },
  assets: {
    fixed_assets: [
      { name: 'Furniture',          amount: 45000 },
      { name: 'Computer Equipment', amount: 36000 },
    ],
    current_assets: [
      { name: 'Bank Accounts',   amount: 327000 },
      { name: 'Cash-in-Hand',    amount:  15000 },
      { name: 'Sundry Debtors',  amount: 135500 },
      { name: 'Stock-in-Hand',   amount: -97000 },
    ],
    total: 461500,
  },
};

export const mockProfitLoss = {
  period: '2025-04-01 to 2026-03-31',
  income: [
    { name: 'Sales',          amount: 520000 },
    { name: 'Service Income', amount:  85000 },
  ],
  total_income: 605000,
  expenses: [
    { name: 'Purchase',        amount: 310000 },
    { name: 'Salary',          amount:  96000 },
    { name: 'Rent',            amount:  60000 },
    { name: 'Electricity',     amount:  12000 },
    { name: 'Office Expenses', amount:   8500 },
  ],
  total_expenses: 486500,
  net_profit: 118500,
};

export const mockTrialBalance = mockLedgers.map(l => ({
  name:   l.name,
  group:  l.group,
  debit:  l.closing_balance > 0 ? l.closing_balance : 0,
  credit: l.closing_balance < 0 ? Math.abs(l.closing_balance) : 0,
}));