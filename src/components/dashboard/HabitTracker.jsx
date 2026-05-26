import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format, subDays } from 'date-fns'
import { Dumbbell, Wine, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

const HABITS = [
  {
    key: 'trained_gym',
    label: 'Trained at the gym',
    icon: Dumbbell,
    positive: true,
    yesColor: 'text-green-400',
    noColor: 'text-yellow-500',
    yesLabel: 'Yes — crushed it',
    noLabel: 'Missed it',
  },
  {
    key: 'drank_alcohol',
    label: 'Drank alcohol',
    icon: Wine,
    positive: false,
    yesColor: 'text-red-400',
    noColor: 'text-green-400',
    yesLabel: 'Yes',
    noLabel: 'No — clean',
  },
]

export default function HabitTracker({ userId }) {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const [data, setData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!userId) return
    loadYesterday()
  }, [userId])

  const loadYesterday = async () => {
    const { data: row } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('date', yesterday)
      .single()
    setData(row || { trained_gym: null, drank_alcohol: null, notes: '' })
    setLoaded(true)
  }

  const loadHistory = async () => {
    const { data: rows } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(14)
    setHistory(rows || [])
  }

  const save = async (field, value) => {
    setSaving(true)
    const updated = { ...data, [field]: value, user_id: userId, date: yesterday }
    setData(updated)
    const { error } = await supabase.from('habits').upsert(updated, { onConflict: 'user_id,date' })
    if (error) console.error(error)
    setSaving(false)
  }

  const toggleHistory = async () => {
    if (!showHistory) await loadHistory()
    setShowHistory(v => !v)
  }

  const streak = () => {
    let s = 0
    for (const row of history) {
      if (row.trained_gym) s++
      else break
    }
    return s
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <Dumbbell className="w-4 h-4 text-brand-400" />
        <span className="card-title">Yesterday's Habits</span>
        <span className="ml-auto text-xs text-gray-600">{format(subDays(new Date(), 1), 'EEE d MMM')}</span>
        {saving && <Loader2 className="w-3 h-3 text-gray-600 animate-spin ml-1" />}
      </div>

      {!loaded ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {HABITS.map(({ key, label, icon: Icon, positive, yesColor, noColor, yesLabel, noLabel }) => (
            <div key={key} className="bg-surface-900 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2.5">
                <Icon className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-300">{label}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => save(key, true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    data[key] === true
                      ? `bg-current/10 ${positive ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/30' : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30'}`
                      : 'bg-white/5 text-gray-500 hover:bg-white/10'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {yesLabel}
                </button>
                <button
                  onClick={() => save(key, false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    data[key] === false
                      ? `${!positive ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/30' : 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/30'}`
                      : 'bg-white/5 text-gray-500 hover:bg-white/10'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {noLabel}
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={toggleHistory}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1 py-1"
          >
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showHistory ? 'Hide' : 'Show'} last 14 days
          </button>

          {showHistory && history.length > 0 && (
            <div className="mt-1 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-600 border-b border-white/5">
                    <th className="text-left pb-1.5 font-medium">Date</th>
                    <th className="text-center pb-1.5 font-medium">Gym</th>
                    <th className="text-center pb-1.5 font-medium">Alcohol</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(row => (
                    <tr key={row.date} className="border-b border-white/5">
                      <td className="py-1.5 text-gray-500">{format(new Date(row.date + 'T00:00:00'), 'EEE d MMM')}</td>
                      <td className="py-1.5 text-center">
                        {row.trained_gym === true ? '✅' : row.trained_gym === false ? '❌' : '—'}
                      </td>
                      <td className="py-1.5 text-center">
                        {row.drank_alcohol === true ? '🍷' : row.drank_alcohol === false ? '✅' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {streak() > 1 && (
                <p className="text-xs text-orange-400 mt-2 text-center">🔥 {streak()}-day gym streak!</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
