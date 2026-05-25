import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL ?? 'https://mxjxmwgndrhatzvjjsdq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

// Detect category from message text
function detectCategory(text) {
  const lower = text.toLowerCase()
  if (lower.includes('#idea') || lower.startsWith('idea:') || lower.startsWith('business:')) {
    return 'business_idea'
  }
  return 'thought'
}

// Strip category hashtags from message
function cleanText(text) {
  return text.replace(/#idea|#thought|#business/gi, '').trim()
}

async function sendTelegramMessage(chatId, text) {
  if (!BOT_TOKEN) {
    console.error('[telegram-webhook] TELEGRAM_BOT_TOKEN is not set in environment variables')
    return
  }
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  // Validate webhook secret
  const secret = event.headers['x-telegram-bot-api-secret-token']
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: 'Bad request' }
  }

  const message = body?.message
  if (!message?.text || !message?.from) {
    return { statusCode: 200, body: 'OK' }
  }

  const telegramUserId = String(message.from.id)
  const chatId = message.chat.id
  const rawText = message.text

  // Handle /start command
  if (rawText === '/start') {
    await sendTelegramMessage(chatId,
      '👋 <b>Personal OS Bot</b>\n\n' +
      'Send me any thought or idea and I\'ll save it.\n\n' +
      '• Use <code>#idea</code> to tag as a Business Idea\n' +
      '• Everything else goes into Thoughts\n\n' +
      'Examples:\n' +
      '  <i>#idea Build a SaaS for X</i>\n' +
      '  <i>Just had a thought about pricing strategy...</i>'
    )
    return { statusCode: 200, body: 'OK' }
  }

  // Handle /help command
  if (rawText === '/help') {
    await sendTelegramMessage(chatId,
      '📋 <b>Commands</b>\n\n' +
      '/start — Introduction\n' +
      '/help — This message\n\n' +
      '<b>Tagging</b>\n' +
      '#idea — Save as Business Idea\n' +
      '#thought — Save as Thought (default)\n\n' +
      'Any untagged message is saved as a Thought.'
    )
    return { statusCode: 200, body: 'OK' }
  }

  // Look up user by telegram_user_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('telegram_user_id', telegramUserId)
    .single()

  if (profileError || !profile) {
    await sendTelegramMessage(chatId,
      '⚠️ Your Telegram is not linked to a Personal OS account.\n\n' +
      'Open your dashboard, go to Settings, and enter your Telegram User ID: <code>' + telegramUserId + '</code>'
    )
    return { statusCode: 200, body: 'OK' }
  }

  const category = detectCategory(rawText)
  const content = cleanText(rawText)

  if (!content) {
    return { statusCode: 200, body: 'OK' }
  }

  const { error } = await supabase.from('notes').insert({
    user_id: profile.id,
    content,
    category,
    source: 'telegram',
  })

  if (error) {
    console.error('Supabase insert error:', error)
    await sendTelegramMessage(chatId, '❌ Failed to save note. Please try again.')
    return { statusCode: 200, body: 'OK' }
  }

  const emoji = category === 'business_idea' ? '💡' : '🧠'
  const label = category === 'business_idea' ? 'Business Idea' : 'Thought'
  await sendTelegramMessage(chatId, `${emoji} Saved as <b>${label}</b>:\n<i>${content}</i>`)

  return { statusCode: 200, body: 'OK' }
}
