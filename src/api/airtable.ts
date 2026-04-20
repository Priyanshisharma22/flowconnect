import { http } from './httpClient'

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID
const TABLE_NAME = import.meta.env.VITE_AIRTABLE_TABLE_NAME || 'Payments'
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`

async function airtableRequest(method: string, endpoint: string, body?: object) {
  const url = `${BASE_URL}/${endpoint}`
  const options: any = {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
    skipAuth: true, // Airtable has its own auth, don't add our Bearer token
  }
  
  if (method === 'GET') {
    return http.get(url, options)
  } else if (method === 'POST') {
    return http.post(url, body, options)
  } else if (method === 'PATCH') {
    return http.put(url, body, options)
  }
}

export async function addPayment(params: {
  customer_name: string
  amount: number
  email?: string
  plan?: string
  payment_id?: string
  status?: string
  phone?: string
}) {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  const data = await airtableRequest('POST', encodeURIComponent(TABLE_NAME), {
    records: [{
      fields: {
        'Customer Name': params.customer_name,
        Amount: params.amount,
        Status: params.status || 'Success',
        'Created At': now,
        ...(params.email     && { Email: params.email }),
        ...(params.plan      && { Plan: params.plan }),
        ...(params.payment_id && { 'Payment ID': params.payment_id }),
        ...(params.phone     && { Phone: params.phone }),
      },
    }],
  })
  return {
    success: true,
    record_id: data.records[0].id,
    record: data.records[0].fields,
  }
}

export async function getPayments(params?: {
  max_records?: number
  filter_status?: string
}) {
  let endpoint = `${encodeURIComponent(TABLE_NAME)}?maxRecords=${params?.max_records || 10}&sort[0][field]=Created At&sort[0][direction]=desc`
  if (params?.filter_status) {
    endpoint += `&filterByFormula=${encodeURIComponent(`{Status}="${params.filter_status}"`)}`
  }
  const data = await airtableRequest('GET', endpoint)
  return {
    success: true,
    total: data.records.length,
    records: data.records.map((r: any) => ({ id: r.id, ...r.fields })),
  }
}

export async function addRecord(table_name: string, fields: Record<string, any>) {
  const data = await airtableRequest('POST', encodeURIComponent(table_name), {
    records: [{ fields }],
  })
  return {
    success: true,
    record_id: data.records[0].id,
    record: data.records[0].fields,
  }
}

export async function getRecords(table_name: string, max_records = 10) {
  const data = await airtableRequest(
    'GET',
    `${encodeURIComponent(table_name)}?maxRecords=${max_records}`
  )
  return {
    success: true,
    records: data.records.map((r: any) => ({ id: r.id, ...r.fields })),
  }
}

export async function updateRecord(
  table_name: string,
  record_id: string,
  fields: Record<string, any>
) {
  const data = await airtableRequest(
    'PATCH',
    `${encodeURIComponent(table_name)}/${record_id}`,
    { fields }
  )
  return { success: true, record_id: data.id, record: data.fields }
}

export async function searchRecords(
  table_name: string,
  field_name: string,
  search_value: string
) {
  const formula = encodeURIComponent(`SEARCH("${search_value}",{${field_name}})`)
  const data = await airtableRequest(
    'GET',
    `${encodeURIComponent(table_name)}?filterByFormula=${formula}`
  )
  return {
    success: true,
    total: data.records.length,
    records: data.records.map((r: any) => ({ id: r.id, ...r.fields })),
  }
}