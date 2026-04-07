const WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL

async function sendWebhook(payload: object) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord webhook error: ${res.status} - ${text}`)
  }
  return { success: true }
}

export async function sendMessage(message: string, username?: string) {
  await sendWebhook({
    content: message,
    username: username || 'FlowConnect',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png',
  })
  return { success: true, message: 'Message sent to Discord successfully' }
}

export async function sendPaymentAlert(params: {
  amount: number
  customer_name: string
  plan?: string
  payment_id?: string
}) {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  await sendWebhook({
    username: 'FlowConnect Payments',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png',
    embeds: [{
      title: '💰 New Payment Received!',
      color: 5763719,
      fields: [
        { name: '👤 Customer', value: params.customer_name, inline: true },
        { name: '💵 Amount',   value: `₹${params.amount}`,  inline: true },
        ...(params.plan       ? [{ name: '📦 Plan',       value: params.plan,                    inline: true  }] : []),
        ...(params.payment_id ? [{ name: '🔖 Payment ID', value: `\`${params.payment_id}\``,    inline: false }] : []),
        { name: '⏰ Time', value: now, inline: false },
      ],
      footer: { text: 'FlowConnect Payment System' },
      timestamp: new Date().toISOString(),
    }],
  })
  return { success: true, message: `Payment alert sent for ₹${params.amount}` }
}

export async function sendEmbed(params: {
  title: string
  description: string
  color?: number
  fields?: { name: string; value: string; inline?: boolean }[]
}) {
  await sendWebhook({
    username: 'FlowConnect',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png',
    embeds: [{
      title: params.title,
      description: params.description,
      color: params.color || 3447003,
      fields: params.fields || [],
      timestamp: new Date().toISOString(),
      footer: { text: 'FlowConnect' },
    }],
  })
  return { success: true, message: 'Embed sent to Discord' }
}

export async function sendNotification(event_type: string, details: string) {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  await sendWebhook({
    username: 'FlowConnect Alerts',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/2936/2936886.png',
    embeds: [{
      title: `🔔 ${event_type}`,
      description: details,
      color: 3447003,
      fields: [{ name: '⏰ Time', value: now, inline: false }],
      timestamp: new Date().toISOString(),
      footer: { text: 'FlowConnect Notification System' },
    }],
  })
  return { success: true, message: `Notification sent: ${event_type}` }
}