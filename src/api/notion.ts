import { http } from './httpClient'

const NOTION_API_KEY = import.meta.env.VITE_NOTION_API_KEY
const BASE_URL = 'https://api.notion.com/v1'

async function notionRequest(
  method: string,
  endpoint: string,
  body?: object
) {
  const url = `${BASE_URL}/${endpoint}`
  const options: any = {
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2024-10-08', // Use latest Notion API version
    },
    skipAuth: true, // Notion has its own auth
  }

  if (method === 'GET') {
    return http.get(url, options)
  } else if (method === 'POST') {
    return http.post(url, body, options)
  } else if (method === 'PATCH') {
    return http.put(url, body, options)
  }
}

// Add this helper for catching auth errors
function handleNotionError(error: any) {
  if (error.status === 401) {
    // Token expired or invalid
    return {
      success: false,
      error: 'Notion authentication failed. Please reconnect your workspace.',
      code: 'AUTH_ERROR',
    }
  }
  if (error.status === 429) {
    // Rate limited
    return {
      success: false,
      error: 'Rate limited by Notion API. Please try again later.',
      code: 'RATE_LIMIT',
    }
  }
  return {
    success: false,
    error: error.message,
    code: 'UNKNOWN_ERROR',
  }
}

// Wrap all API calls with error handling
export async function queryDatabase(params: {
  database_id: string
  filter?: object
  sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>
  page_size?: number
  start_cursor?: string
}) {
  try {
    return notionRequest('POST', `databases/${params.database_id}/query`, {
      filter: params.filter,
      sorts: params.sorts,
      page_size: params.page_size || 10,
      start_cursor: params.start_cursor,
    })
  } catch (error: any) {
    return handleNotionError(error)
  }
}

// ─── Database Operations ──────────────────────────────────────────────────

export async function getDatabase(databaseId: string) {
  return notionRequest('GET', `databases/${databaseId}`)
}

// ─── Page Operations ──────────────────────────────────────────────────────

export async function getPage(pageId: string) {
  return notionRequest('GET', `pages/${pageId}`)
}

export async function createPage(params: {
  database_id: string
  properties: Record<string, any>
  children?: Array<any>
}) {
  return notionRequest('POST', 'pages', {
    parent: { database_id: params.database_id },
    properties: params.properties,
    children: params.children,
  })
}

export async function updatePage(params: {
  page_id: string
  properties: Record<string, any>
}) {
  return notionRequest('PATCH', `pages/${params.page_id}`, {
    properties: params.properties,
  })
}

// ─── Block Operations ────────────────────────────────────────────────────

export async function getPageBlocks(pageId: string) {
  return notionRequest('GET', `blocks/${pageId}/children`)
}

export async function appendBlocks(params: {
  page_id: string
  children: Array<any>
}) {
  return notionRequest('PATCH', `blocks/${params.page_id}/children`, {
    children: params.children,
  })
}

// ─── Search (Find pages/databases by title) ────────────────────────────

export async function searchNotion(query: string) {
  return notionRequest('POST', 'search', {
    query,
    page_size: 10,
    filter: { value: 'page', property: 'object' }, // Can also search for 'database'
  })
}