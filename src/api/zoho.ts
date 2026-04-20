// src/api/zoho.ts

import { http } from './httpClient'

const ZOHO_MCP_URL = import.meta.env.VITE_ZOHO_MCP_URL || 'http://localhost:3001'

async function zohoCall(tool: string, args: Record<string, any>) {
  return http.post(`${ZOHO_MCP_URL}/zoho/${tool}`, args)
}

export const createZohoLead = (args: {
  first_name?: string; last_name: string; email: string;
  phone?: string; company?: string; lead_source?: string;
  amount?: number; description?: string;
}) => zohoCall('create_lead', args)

export const createZohoContact = (args: {
  first_name?: string; last_name: string; email: string;
  phone?: string; account_name?: string; description?: string;
}) => zohoCall('create_contact', args)

export const createZohoDeal = (args: {
  deal_name: string; amount?: number; stage: string;
  contact_name?: string; account_name?: string;
  closing_date?: string; description?: string;
}) => zohoCall('create_deal', args)

export const createZohoTask = (args: {
  subject: string; due_date?: string; status?: string;
  priority?: string; description?: string;
}) => zohoCall('create_task', args)

export const searchZohoLeads = (args: { email?: string; name?: string }) =>
  zohoCall('search_leads', args)

export const updateZohoLead = (args: { lead_id: string; fields: Record<string, any> }) =>
  zohoCall('update_lead', args)

export const getZohoLeads = (per_page = 10) =>
  zohoCall('get_leads', { per_page })