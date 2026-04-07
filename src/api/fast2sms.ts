const API_KEY = import.meta.env.VITE_FAST2SMS_API_KEY

export async function sendSMS(params: {
  numbers: string        // '9876543210' or '9876543210,9123456789'
  message: string
  sender_id?: string
}) {
  const cleaned = params.numbers.replace(/\s/g, '')

  const body = new URLSearchParams({
    route: 'q',
    numbers: cleaned,
    message: params.message,
    flash: '0',
  })
  if (params.sender_id) body.set('sender_id', params.sender_id)

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      'cache-control': 'no-cache',
    },
    body: body.toString(),
  })

  const data = await res.json()
  if (!data.return) throw new Error(`Fast2SMS error: ${JSON.stringify(data)}`)

  const count = cleaned.split(',').length
  return {
    success: true,
    request_id: data.request_id,
    message: `SMS sent to ${cleaned}`,
    numbers_count: count,
    estimated_cost: `Rs.${(count * 0.15).toFixed(2)}`,
  }
}

export async function checkBalance() {
  const res = await fetch('https://www.fast2sms.com/dev/wallet', {
    method: 'GET',
    headers: {
      authorization: API_KEY,
      'cache-control': 'no-cache',
    },
  })

  const data = await res.json()
  if (!data.return) throw new Error(`Fast2SMS wallet error: ${JSON.stringify(data)}`)

  return {
    success: true,
    wallet_balance: `Rs.${data.wallet}`,
    sms_remaining: Math.floor(data.wallet / 0.15),
    message: `Rs.${data.wallet} remaining (~${Math.floor(data.wallet / 0.15)} SMS)`,
  }
}