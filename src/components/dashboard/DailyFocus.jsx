import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Crosshair, Loader2, Check, Pencil } from 'lucide-react'
import { format } from 'date-fns'

const SUGGESTED_FOCUSES = [
  'Deep work block: 3 uninterrupted hours on my #1 priority',
  'No distractions before 12pm',
  'One meaningful client conversation today',
  'Move my body — gym session non-negotiable',
  'Read 30 pages',
  'Work on the business, not just in it',
  'Follow up on one open opportunity',
  'Spend focused time on revenue-generating activities only',
]

export default function DailyFocus({ userId }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [focus, setFocus] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) loadFocus()
  }, [userId])

  const loadFocus = async () => {
    const { data } = await supabase
      .from('daily_focus')
      .select('focus')
      .eq('user_id', userId)
      .eq('date', today)
      .single()
    setFocus(data?.focus || '')
    setLoading(false)
  }

  const save = async (text) => {
    setSaving(true)
    await supabase.from('daily_focus').upsert({ user_id: userId, date: today, focus: text }, { onConflict: 'user_id,date' })
    setFocus(text)
    setEditing(false)
    setSaving(false)
  }

  const randomSuggestion = () => {
    const s = SUGGESTED_FOCUSES[Math.floor(Math.random() * SUGGESTED_FOCUSES.length)]
    setDraft(s)
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <Crosshair className="w-4 h-4 text-brand-400" />
        <span className="card-title">Today's Focus</span>
        {!loading && !editing && focus && (
          <button onClick={() => { setDraft(focus); setEditing(true) }} className="ml-auto text-gray-600 hover:text-gray-400 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 text-gray-600 animate-spin" /></div>
      ) : editing || !focus ? (
        <div className="space-y-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save(draft)}
            placeholder="What's the ONE thing that matters today?"
            className="input-field text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => save(draft)} disabled={saving || !draft.trim()} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Set focus
            </button>
            <button onClick={randomSuggestion} className="btn-ghost text-sm py-1.5 px-3 text-xs">
              Suggest one
            </button>
            {focus && <button onClick={() => setEditing(false)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors ml-auto">Cancel</button>}
          </div>
        </div>
      ) : (
        <div
          onClick={() => { setDraft(focus); setEditing(true) }}
          className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-3 cursor-pointer hover:border-brand-500/20 transition-all"
        >
          <p className="text-sm text-brand-300 font-medium leading-relaxed">"{focus}"</p>
          <p className="text-xs text-gray-600 mt-1">Tap to change</p>
        </div>
      )}
    </div>
  )
}
