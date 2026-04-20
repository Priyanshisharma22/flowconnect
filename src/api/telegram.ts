// src/api/telegram.ts
// Calls your backend which proxies to the Telegram MCP server

import { http } from './httpClient'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function telegramCall<T>(tool: string, args: Record<string, any>): Promise<T> {
  return http.post(`${API_BASE}/telegram/${tool}`, args)
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TelegramBotInfo {
  success: boolean
  id: number
  name: string
  username: string
  message: string
}

export interface TelegramUpdate {
  chat_id: number | null
  chat_type: string | null
  chat_title: string | null
  from: string | null
  text: string | null
}

export interface TelegramUpdatesResult {
  success: boolean
  updates_count: number
  chats: TelegramUpdate[]
  message: string
}

export interface TelegramSendResult {
  success: boolean
  message_id: number
  chat_id: number
  message: string
}

export interface TelegramPaymentAlertResult {
  success: boolean
  message_id: number
  message: string
}

// ── API calls ──────────────────────────────────────────────────────────────────

export const getBotInfo = () =>
  telegramCall<TelegramBotInfo>('get_bot_info', {})

export const getUpdates = () =>
  telegramCall<TelegramUpdatesResult>('get_updates', {})

export const sendTelegramMessage = (chat_id: string, message: string, parse_mode?: string) =>
  telegramCall<TelegramSendResult>('send_message', { chat_id, message, parse_mode })

export const sendTelegramPaymentAlert = (
  chat_id: string,
  amount: number,
  customer_name: string,
  plan?: string,
  payment_id?: string,
) =>
  telegramCall<TelegramPaymentAlertResult>('send_payment_alert', {
    chat_id, amount, customer_name, plan, payment_id,
  })