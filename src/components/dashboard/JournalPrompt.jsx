import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BookOpen, Shuffle, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'

const PROMPTS = [
  "What's one thing you can do today that your future self will thank you for?",
  "What would you do if you knew you couldn't fail?",
  "What's draining your energy right now, and what would it feel like to eliminate it?",
  "Describe the version of yourself you're becoming. What does a day in their life look like?",
  "What's one limiting belief that's held you back? How can you reframe it?",
  "What are you most proud of from the past week? What contributed to that?",
  "If your business/career was exactly where you wanted it in 5 years, what did you do differently starting today?",
  "What's one conversation you've been avoiding that needs to happen?",
  "What does your ideal morning routine look like? How close are you to it?",
  "Who are the top 5 people in your life? Are they helping you grow?",
  "What's one area where you're playing small? What would 'playing big' look like?",
  "What would you do with an extra £1,000 this month? What about an extra £10,000?",
  "What's working in your life right now? Double down on that.",
  "Where are you being disciplined? Where are you making excuses?",
  "What habit, if built this year, would change everything?",
]

export default function JournalPrompt({ userId }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [prompt, setPrompt] = useState('')
  const [entry, setEntry] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existing, setExisting] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('journal-prompt')
    setPrompt(stored || PROMPTS[new Date().getDay() % PROMPTS.length])
    if (userId) loadToday()
  }, [userId])

  const loadToday = async () => {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()
    if (data) {
      setExisting(data)
      setEntry(data.content)
      setPrompt(data.prompt_used || PROMPTS[0])
    }
  }

  const shufflePrompt = () => {
    const next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]
    setPrompt(next)
    sessionStorage.setItem('journal-prompt', next)
  }

  const save = async () => {
    if (!entry.trim() || !userId) return
    setSaving(true)
    const record = { user_id: userId, date: today, content: entry.trim(), prompt_used: prompt }
    const { error } = await supabase.from('journal_entries').upsert(record, { onConflict: 'user_id,date' })
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  const loadHistory = async () => {
    const { data } = await supabase
      .from('journal_entries')
      .select('date, content, prompt_used')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7)
    setHistory(data || [])
  }

  const toggleHistory = async () => {
    if (!showHistory) await loadHistory()
    setShowHistory(v => !v)
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <BookOpen className="w-4 h-4 text-brand-400" />
        <span className="card-title">Daily Journal</span>
        <span className="ml-auto text-xs text-gray-600">{format(new Date(), 'EEE d MMM')}</span>
      </div>

      {/* Prompt */}
      <div className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-3 mb-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-300 italic leading-relaxed flex-1">"{prompt}"</p>
          <button onClick={shufflePrompt} className="text-gray-600 hover:text-brand-400 transition-colors shrink-0 mt-0.5" title="New prompt">
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Entry area */}
      <div className="relative">
        <textarea
          value={entry}
          onChange={e => setEntry(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Write freely… this is just for you."
          rows={expanded ? 6 : 3}
          className="input-field resize-none text-sm leading-relaxed transition-all duration-300"
        />
        {entry && (
          <span className="absolute bottom-3 right-3 text-xs text-gray-700">{entry.length} chars</span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={save}
          disabled={saving || !entry.trim()}
          className="btn-primary py-2 px-3 text-sm flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Saved!' : 'Save entry'}
        </button>
        {existing && <span className="text-xs text-green-500/70">Entry saved for today</span>}
        <button onClick={toggleHistory} className="ml-auto text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors">
          {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          History
        </button>
      </div>

      {showHistory && (
        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
          {history.map(e => (
            <div key={e.date} className="bg-surface-900 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">{format(new Date(e.date + 'T00:00:00'), 'EEE d MMM yyyy')}</p>
              {e.prompt_used && <p className="text-xs text-gray-600 italic mb-1.5">"{e.prompt_used}"</p>}
              <p className="text-xs text-gray-400 line-clamp-3">{e.content}</p>
            </div>
          ))}
          {history.length === 0 && <p className="text-center text-xs text-gray-600 py-2">No previous entries.</p>}
        </div>
      )}
    </div>
  )
}
