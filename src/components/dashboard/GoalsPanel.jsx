import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Target, Plus, Trash2, CheckCircle2, Circle, Loader2, Pencil, X, Check } from 'lucide-react'

const CATEGORIES = [
  { id: 'business', label: 'Business', color: 'text-brand-400', bg: 'bg-brand-500/10', ring: 'ring-brand-500/20' },
  { id: 'health', label: 'Health', color: 'text-green-400', bg: 'bg-green-500/10', ring: 'ring-green-500/20' },
  { id: 'wealth', label: 'Wealth', color: 'text-yellow-400', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/20' },
  { id: 'personal', label: 'Personal', color: 'text-purple-400', bg: 'bg-purple-500/10', ring: 'ring-purple-500/20' },
  { id: 'relationships', label: 'Relationships', color: 'text-pink-400', bg: 'bg-pink-500/10', ring: 'ring-pink-500/20' },
]

const DEFAULT_GOALS = [
  { title: 'Build a business generating £10k/month recurring revenue', category: 'business', completed: false },
  { title: 'Train 5 days per week consistently for 12 months', category: 'health', completed: false },
  { title: 'Stay alcohol-free for 90 days', category: 'health', completed: false },
  { title: 'Save and invest 30% of income monthly', category: 'wealth', completed: false },
  { title: 'Read 24 books this year', category: 'personal', completed: false },
  { title: 'Build a high-value network of 10 like-minded entrepreneurs', category: 'relationships', completed: false },
]

export default function GoalsPanel({ userId }) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [newGoal, setNewGoal] = useState('')
  const [newCategory, setNewCategory] = useState('business')
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (userId) loadGoals()
  }, [userId])

  const loadGoals = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      setGoals(data)
    } else {
      setGoals(DEFAULT_GOALS.map(g => ({ ...g, id: crypto.randomUUID(), user_id: userId, created_at: new Date().toISOString() })))
    }
    setLoading(false)
  }

  const addGoal = async () => {
    if (!newGoal.trim()) return
    setAdding(true)
    const goal = { title: newGoal.trim(), category: newCategory, completed: false, user_id: userId }
    const { data, error } = await supabase.from('goals').insert(goal).select().single()
    if (!error && data) setGoals(prev => [...prev, data])
    setNewGoal('')
    setShowAdd(false)
    setAdding(false)
  }

  const toggleGoal = async (goal) => {
    const updated = { ...goal, completed: !goal.completed }
    setGoals(prev => prev.map(g => g.id === goal.id ? updated : g))
    await supabase.from('goals').upsert(updated)
  }

  const deleteGoal = async (id) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    await supabase.from('goals').delete().eq('id', id)
  }

  const saveEdit = async (goal) => {
    if (!editText.trim()) return
    const updated = { ...goal, title: editText.trim() }
    setGoals(prev => prev.map(g => g.id === goal.id ? updated : g))
    await supabase.from('goals').upsert(updated)
    setEditingId(null)
  }

  const filtered = goals.filter(g => activeFilter === 'all' || g.category === activeFilter)
  const progress = goals.length ? Math.round((goals.filter(g => g.completed).length / goals.length) * 100) : 0

  const getCat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0]

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <Target className="w-4 h-4 text-brand-400" />
        <span className="card-title">5-Year Goals</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-600">{progress}% done</span>
          <button onClick={() => setShowAdd(v => !v)} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <Plus className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-900 rounded-full mb-4">
        <div className="h-1 bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`tag ${activeFilter === 'all' ? 'bg-white/10 text-gray-200' : 'bg-white/5 text-gray-500 hover:bg-white/10'} transition-colors`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.id)}
            className={`tag ${activeFilter === cat.id ? `${cat.bg} ${cat.color} ring-1 ${cat.ring}` : 'bg-white/5 text-gray-500 hover:bg-white/10'} transition-colors`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-surface-900 rounded-xl p-3 mb-3 space-y-2">
          <input
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addGoal()}
            placeholder="Add a new goal…"
            className="input-field text-sm py-2"
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="input-field text-sm py-2 flex-1"
            >
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={addGoal} className="btn-primary py-2 px-3 text-sm" disabled={adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gray-600 animate-spin" /></div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filtered.map(goal => {
            const cat = getCat(goal.category)
            return (
              <div key={goal.id} className={`group flex items-start gap-2.5 p-2.5 rounded-xl transition-all ${goal.completed ? 'opacity-50' : 'hover:bg-white/5'}`}>
                <button onClick={() => toggleGoal(goal)} className="mt-0.5 shrink-0">
                  {goal.completed
                    ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                    : <Circle className="w-4 h-4 text-gray-600 hover:text-gray-400 transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">
                  {editingId === goal.id ? (
                    <div className="flex gap-1.5">
                      <input
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(goal); if (e.key === 'Escape') setEditingId(null) }}
                        className="input-field text-sm py-1 flex-1"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(goal)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-400"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-sm leading-snug ${goal.completed ? 'line-through text-gray-600' : 'text-gray-200'}`}>{goal.title}</p>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingId(goal.id); setEditText(goal.title) }} className="text-gray-600 hover:text-gray-400"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => deleteGoal(goal.id)} className="text-gray-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )}
                  <span className={`tag ${cat.bg} ${cat.color} mt-1 text-[10px]`}>{cat.label}</span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-gray-600 py-4">No goals in this category yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
