# Personal OS — Setup Guide

## Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Database & Auth**: Supabase
- **Hosting**: Netlify
- **Telegram Bot**: Netlify Function (webhook)
- **Calendar**: Google Calendar API (optional)

---

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New project
2. Once created, go to **SQL Editor** and paste the entire contents of `supabase-schema.sql` → Run
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon / public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, only used in Netlify Functions)

---

## 2. Netlify Setup

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → Import from Git
3. Build settings are auto-detected from `netlify.toml`
4. Go to **Site Settings → Environment Variables** and add:

```
VITE_SUPABASE_URL          = https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY     = eyJhb...
SUPABASE_SERVICE_ROLE_KEY  = eyJhb...  (secret — never expose client-side)
TELEGRAM_BOT_TOKEN         = 123456789:ABCdef...
TELEGRAM_WEBHOOK_SECRET    = (any random string you choose — used to verify bot calls)
```

---

## 3. Telegram Bot Setup

### Create the bot
1. Open Telegram → search `@BotFather`
2. Send `/newbot` and follow prompts → copy the **HTTP API token**
3. Set `TELEGRAM_BOT_TOKEN` in Netlify env vars

### Register the webhook
After deploying to Netlify, run this once (replace values):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://YOUR-NETLIFY-SITE.netlify.app/.netlify/functions/telegram-webhook",
    "secret_token": "YOUR_WEBHOOK_SECRET"
  }'
```

### Link your Telegram account
1. Message your bot `/start` — it will show your **Telegram User ID**
2. In the app dashboard, go to Settings and enter that ID
3. Now every message you send to the bot is saved as a note

### Tagging notes
- `#idea` or starting with `idea:` → saved as **Business Idea**
- Everything else → saved as **Thought**

---

## 4. Google Calendar (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Calendar API**
3. Create **OAuth 2.0 credentials** (Web application type)
   - Authorised JavaScript origins: your Netlify URL
4. Create an **API Key** (restrict to Calendar API)
5. Add to Netlify env vars:
   ```
   VITE_GOOGLE_CLIENT_ID  = xxxx.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY    = AIza...
   ```

---

## 5. Local Development

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.example .env.local

# Start dev server
npm run dev
```

---

## Dashboard Features

| Widget | Description |
|--------|-------------|
| **Clock** | Live time + date, contextual greeting |
| **Today's Focus** | Set your single most important task for the day |
| **Habit Tracker** | Log yesterday's gym session & alcohol — with 14-day history + streak counter |
| **Calendar** | Today's Google Calendar events |
| **5-Year Goals** | Categorised goal list (Business, Health, Wealth, Personal, Relationships) with progress tracking |
| **Daily Journal** | Daily prompt + free-write, saved per day with history |
| **Notes Inbox** | Capture thoughts & business ideas — from the web or via Telegram |

---

## Telegram Bot Commands
- `/start` — intro + shows your Telegram User ID for linking
- `/help` — usage guide
- Any text → saved as note (use `#idea` to tag as business idea)
