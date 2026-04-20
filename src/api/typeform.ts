import { http } from './httpClient'

const BASE = import.meta.env.VITE_TYPEFORM_MCP_URL || 'http://localhost:3004'

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
  return http.get(`${BASE}/typeform/forms`, { skipAuth: true })
}

export async function getTypeformFields(form_id: string): Promise<TypeformField[]> {
  return http.get(`${BASE}/typeform/forms/${form_id}/fields`, { skipAuth: true })
}

export async function getTypeformResponses(
  form_id: string,
  page_size = 20
): Promise<TypeformResponse[]> {
  return http.get(`${BASE}/typeform/forms/${form_id}/responses?page_size=${page_size}`, { skipAuth: true })
}