import { useState, useEffect, useCallback } from 'react'
import { Calendar, ExternalLink, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { format, startOfDay, endOfDay, parseISO } from 'date-fns'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '1049857352139-u1ljka77riot8kom4teh0sq8q9ojj6bn.apps.googleusercontent.com'
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY ?? 'AIzaSyD2Po6PX4NGSPakVReAT_AKyXDw5jMJAQ4'
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

export default function CalendarWidget() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [signedIn, setSignedIn] = useState(false)
  const [gapiReady, setGapiReady] = useState(false)
  const [tokenClient, setTokenClient] = useState(null)

  const isConfigured = CLIENT_ID && API_KEY

  useEffect(() => {
    if (!isConfigured) return

    const loadGapi = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'] })
        setGapiReady(true)
      })
    }

    if (!window.gapi) {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = loadGapi
      document.body.appendChild(script)
    } else {
      loadGapi()
    }

    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => {
        const tc = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (resp) => {
            if (resp.error) { setError(resp.error); return }
            setSignedIn(true)
          },
        })
        setTokenClient(tc)
      }
      document.body.appendChild(script)
    }
  }, [isConfigured])

  const fetchEvents = useCallback(async () => {
    if (!gapiReady) return
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      const res = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay(today).toISOString(),
        timeMax: endOfDay(today).toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 10,
      })
      setEvents(res.result.items || [])
    } catch (err) {
      if (err.status === 401) { setSignedIn(false); setError('Session expired. Please sign in again.') }
      else setError(err.message || 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }, [gapiReady])

  useEffect(() => {
    if (signedIn && gapiReady) fetchEvents()
  }, [signedIn, gapiReady, fetchEvents])

  const signIn = () => tokenClient?.requestAccessToken()

  const formatEventTime = (event) => {
    if (event.start.date) return 'All day'
    const start = parseISO(event.start.dateTime)
    const end = parseISO(event.end.dateTime)
    return `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
  }

  const getEventColor = (event) => {
    const colorMap = { '1': 'bg-blue-500', '2': 'bg-green-500', '3': 'bg-purple-500', '4': 'bg-red-500', '5': 'bg-yellow-500', '6': 'bg-orange-500', '7': 'bg-cyan-500', '10': 'bg-green-400', '11': 'bg-red-400' }
    return colorMap[event.colorId] || 'bg-brand-500'
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <Calendar className="w-4 h-4 text-brand-400" />
        <span className="card-title">Today's Calendar</span>
        <span className="ml-auto text-xs text-gray-600">{format(new Date(), 'EEE d MMM')}</span>
        {signedIn && (
          <button onClick={fetchEvents} className="text-gray-600 hover:text-gray-400 transition-colors ml-1" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!isConfigured ? (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-300 font-medium">Google Calendar not connected</p>
              <p className="text-xs text-yellow-500/70 mt-1">Add <code className="bg-yellow-500/10 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> and <code className="bg-yellow-500/10 px-1 rounded">VITE_GOOGLE_API_KEY</code> to your environment to connect Google Calendar.</p>
            </div>
          </div>
        </div>
      ) : !signedIn ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-3">Connect Google Calendar to see today's events</p>
          <button onClick={signIn} className="btn-primary text-sm py-2 flex items-center gap-2 mx-auto">
            <Calendar className="w-4 h-4" />
            Connect Google Calendar
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gray-600 animate-spin" /></div>
      ) : error ? (
        <div className="text-center py-3">
          <p className="text-sm text-red-400 mb-2">{error}</p>
          <button onClick={signIn} className="btn-ghost text-xs py-1.5 px-3">Re-authorise</button>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm text-gray-500">No events today — your schedule is clear.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <div key={event.id} className="flex items-start gap-2.5 p-2.5 bg-surface-900 rounded-xl hover:bg-white/5 transition-colors group">
              <div className={`w-1.5 rounded-full mt-1.5 shrink-0 ${getEventColor(event)}`} style={{ height: '32px' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-medium truncate">{event.summary}</p>
                <p className="text-xs text-gray-500">{formatEventTime(event)}</p>
                {event.location && <p className="text-xs text-gray-600 truncate">{event.location}</p>}
              </div>
              {event.htmlLink && (
                <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
