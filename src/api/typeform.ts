const BASE = (import.meta as any).env?.VITE_TYPEFORM_MCP_URL || 'http://localhost:3004'

export interface TypeformForm {
  id: string
  title: string
  _links?: string
}

export interface TypeformField {
  id: string
  title: string
  type: string
  required: boolean
}

export interface TypeformAnswer {
  field_id: string
  type: string
  value: any
}

export interface TypeformResponse {
  response_id: string
  submitted_at: string
  answers: TypeformAnswer[]
}

export async function listTypeforms(): Promise<TypeformForm[]> {
  const res = await fetch(`${BASE}/typeform/forms`)
  if (!res.ok) throw new Error(`Failed to list forms: ${res.statusText}`)
  return res.json()
}

export async function getTypeformFields(form_id: string): Promise<TypeformField[]> {
  const res = await fetch(`${BASE}/typeform/forms/${form_id}/fields`)
  if (!res.ok) throw new Error(`Failed to get fields: ${res.statusText}`)
  return res.json()
}

export async function getTypeformResponses(
  form_id: string,
  page_size = 20
): Promise<TypeformResponse[]> {
  const res = await fetch(`${BASE}/typeform/forms/${form_id}/responses?page_size=${page_size}`)
  if (!res.ok) throw new Error(`Failed to get responses: ${res.statusText}`)
  return res.json()
}