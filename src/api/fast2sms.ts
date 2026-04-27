import { http } from './httpClient'

export async function sendSMS(params: {
  numbers: string        // '9876543210' or '9876543210,9123456789'
  message: string
  sender_id?: string
}) {
  const response = await http.post('/api/sms', {
    numbers: params.numbers,
    message: params.message,
    sender_id: params.sender_id,
  }, { skipAuth: true })

  return response
}

export async function checkBalance() {
  const response = await http.get('/api/sms/balance', { skipAuth: true })
  return response
}