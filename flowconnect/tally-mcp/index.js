#!/usr/bin/env node
/**
 * Tally MCP Server
 * Connects Claude to TallyPrime via XML API
 * 
 * To use with real Tally: set TALLY_URL=http://localhost:9000 in .env
 * Currently runs with mock data — swap MOCK_MODE=false when ready
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tallyRequest, isMockMode } from './tally-client.js';
import { parseLedgers, parseVouchers, parseBalanceSheet, parseProfitLoss } from './parser.js';
import {
  mockLedgers,
  mockVouchers,
  mockBalanceSheet,
  mockProfitLoss,
  mockCompanyInfo,
  mockTrialBalance,
} from './mock-data.js';

const server = new Server(
  { name: 'tally-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ─── Tool Definitions ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_company_info',
      description: 'Get current active company details from Tally (name, period, financial year)',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_ledgers',
      description: 'Get chart of accounts / list of all ledgers with their groups and balances',
      inputSchema: {
        type: 'object',
        properties: {
          group: { type: 'string', description: 'Filter by group name e.g. "Sundry Debtors", "Bank Accounts"' },
        },
      },
    },
    {
      name: 'get_vouchers',
      description: 'Get vouchers/transactions for a date range',
      inputSchema: {
        type: 'object',
        properties: {
          from_date: { type: 'string', description: 'Start date in YYYYMMDD format e.g. 20250401' },
          to_date:   { type: 'string', description: 'End date in YYYYMMDD format e.g. 20260331' },
          voucher_type: { type: 'string', description: 'Filter by type: Sales, Purchase, Payment, Receipt, Journal, Contra' },
        },
      },
    },
    {
      name: 'get_balance_sheet',
      description: 'Get Balance Sheet — assets, liabilities, and capital',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_profit_loss',
      description: 'Get Profit & Loss statement — income, expenses, and net profit',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_trial_balance',
      description: 'Get Trial Balance — all ledgers with debit/credit balances',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_outstanding',
      description: 'Get outstanding receivables (debtors) or payables (creditors)',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['debtors', 'creditors'],
            description: 'Whether to fetch outstanding receivables or payables',
          },
        },
        required: ['type'],
      },
    },
    {
      name: 'get_stock_summary',
      description: 'Get stock/inventory summary with quantities and values',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

// ─── Tool Handlers ────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_company_info':     return await getCompanyInfo();
      case 'get_ledgers':          return await getLedgers(args);
      case 'get_vouchers':         return await getVouchers(args);
      case 'get_balance_sheet':    return await getBalanceSheet();
      case 'get_profit_loss':      return await getProfitLoss();
      case 'get_trial_balance':    return await getTrialBalance();
      case 'get_outstanding':      return await getOutstanding(args);
      case 'get_stock_summary':    return await getStockSummary();
      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResult(`Error: ${err.message}`);
  }
});

// ─── Tool Implementations ─────────────────────────────────────────────────────

async function getCompanyInfo() {
  if (isMockMode()) {
    return successResult(mockCompanyInfo);
  }
  const xml = `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>List of Accounts</REPORTNAME>
      <STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`;
  const raw = await tallyRequest(xml);
  return successResult({ raw: raw.substring(0, 1000), mode: 'live' });
}

async function getLedgers({ group } = {}) {
  if (isMockMode()) {
    const data = group
      ? mockLedgers.filter(l => l.group.toLowerCase().includes(group.toLowerCase()))
      : mockLedgers;
    return successResult({ ledgers: data, count: data.length, mode: 'mock' });
  }
  const xml = `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>List of Accounts</REPORTNAME>
      <STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`;
  const raw = await tallyRequest(xml);
  const ledgers = parseLedgers(raw);
  const filtered = group ? ledgers.filter(l => l.group?.toLowerCase().includes(group.toLowerCase())) : ledgers;
  return successResult({ ledgers: filtered, count: filtered.length, mode: 'live' });
}

async function getVouchers({ from_date = '20250401', to_date = '20260331', voucher_type } = {}) {
  if (isMockMode()) {
    let data = mockVouchers;
    if (voucher_type) data = data.filter(v => v.type.toLowerCase() === voucher_type.toLowerCase());
    return successResult({ vouchers: data, count: data.length, from_date, to_date, mode: 'mock' });
  }
  const xml = `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Day Book</REPORTNAME>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        <SVFROMDATE>${from_date}</SVFROMDATE>
        <SVTODATE>${to_date}</SVTODATE>
      </STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`;
  const raw = await tallyRequest(xml);
  const vouchers = parseVouchers(raw);
  const filtered = voucher_type ? vouchers.filter(v => v.type?.toLowerCase() === voucher_type.toLowerCase()) : vouchers;
  return successResult({ vouchers: filtered, count: filtered.length, from_date, to_date, mode: 'live' });
}

async function getBalanceSheet() {
  if (isMockMode()) return successResult({ ...mockBalanceSheet, mode: 'mock' });
  const xml = `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Balance Sheet</REPORTNAME>
      <STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`;
  const raw = await tallyRequest(xml);
  return successResult({ ...parseBalanceSheet(raw), mode: 'live' });
}

async function getProfitLoss() {
  if (isMockMode()) return successResult({ ...mockProfitLoss, mode: 'mock' });
  const xml = `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Profit and Loss</REPORTNAME>
      <STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`;
  const raw = await tallyRequest(xml);
  return successResult({ ...parseProfitLoss(raw), mode: 'live' });
}

async function getTrialBalance() {
  if (isMockMode()) return successResult({ ledgers: mockTrialBalance, mode: 'mock' });
  const xml = `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Trial Balance</REPORTNAME>
      <STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`;
  const raw = await tallyRequest(xml);
  return successResult({ raw: raw.substring(0, 2000), mode: 'live' });
}

async function getOutstanding({ type } = {}) {
  if (isMockMode()) {
    const group = type === 'debtors' ? 'Sundry Debtors' : 'Sundry Creditors';
    const data = mockLedgers.filter(l => l.group === group);
    return successResult({ type, ledgers: data, count: data.length, mode: 'mock' });
  }
  const reportName = type === 'debtors' ? 'Outstandings Receivable' : 'Outstandings Payable';
  const xml = `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>${reportName}</REPORTNAME>
      <STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`;
  const raw = await tallyRequest(xml);
  return successResult({ raw: raw.substring(0, 2000), mode: 'live' });
}

async function getStockSummary() {
  if (isMockMode()) {
    return successResult({
      items: [
        { name: 'Item A', quantity: 100, unit: 'Nos', rate: 500, value: 50000 },
        { name: 'Item B', quantity: 50,  unit: 'Kg',  rate: 200, value: 10000 },
        { name: 'Item C', quantity: 200, unit: 'Nos', rate: 150, value: 30000 },
      ],
      total_value: 90000,
      mode: 'mock',
    });
  }
  const xml = `<ENVELOPE>
    <HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER>
    <BODY><EXPORTDATA><REQUESTDESC>
      <REPORTNAME>Stock Summary</REPORTNAME>
      <STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>
    </REQUESTDESC></EXPORTDATA></BODY>
  </ENVELOPE>`;
  const raw = await tallyRequest(xml);
  return successResult({ raw: raw.substring(0, 2000), mode: 'live' });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function successResult(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message) {
  return { content: [{ type: 'text', text: JSON.stringify({ error: message }) }], isError: true };
}

// ─── Start Server ─────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`Tally MCP server started (${isMockMode() ? 'MOCK' : 'LIVE'} mode)`);