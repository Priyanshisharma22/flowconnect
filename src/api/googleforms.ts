import { apiCall } from './client'

// ── Google Forms MCP API Client ───────────────────────────────────────────────
// These functions call your backend which proxies to the MCP server

export async function getFormResponses(formId: string, limit = 20) {
    return apiCall('/mcp/googleforms/get_form_responses', {
        method: 'POST',
        body: JSON.stringify({ form_id: formId, limit }),
    })
}

export async function getLatestResponse(formId: string) {
    return apiCall('/mcp/googleforms/get_latest_response', {
        method: 'POST',
        body: JSON.stringify({ form_id: formId }),
    })
}

export async function processFormSubmission(params: {
    name: string
    email: string
    phone: string
    form_response: string
    spreadsheet_id?: string
    sheet_name?: string
    create_zoho?: boolean
}) {
    return apiCall('/mcp/googleforms/process_form_submission', {
        method: 'POST',
        body: JSON.stringify(params),
    })
}

export async function syncResponsesToSheets(params: {
    form_id: string
    spreadsheet_id: string
    sheet_name?: string
}) {
    return apiCall('/mcp/googleforms/sync_responses_to_sheets', {
        method: 'POST',
        body: JSON.stringify(params),
    })
}