// src/api/slack.ts

const BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8000'

export interface SlackMessagePayload {
  message: string
  emoji?: string
}

export interface SlackPaymentAlertPayload {
  amount: number
  customer_name: string
  plan?: string
  payment_id?: string
}

export interface SlackNotificationPayload {
  event_type: string
  details: string
  color?: string
}

export interface SlackBlockPayload {
  title: string
  body: string
  fields?: { title: string; value: string }[]
}

export interface SlackToolResult {
  success: boolean
  message: string
}

async function slackPost(tool: string, args: object): Promise<SlackToolResult> {
  const res = await fetch(`${BASE_URL}/slack/tool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, args }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Slack API error ${res.status}: ${text}`)
  }
  return res.json()
}

export const sendSlackMessage = (p: SlackMessagePayload) =>
  slackPost('send_message', p)

export const sendSlackPaymentAlert = (p: SlackPaymentAlertPayload) =>
  slackPost('send_payment_alert', p)

export const sendSlackNotification = (p: SlackNotificationPayload) =>
  slackPost('send_notification', p)

export const sendSlackBlock = (p: SlackBlockPayload) =>
  slackPost('send_block', p)