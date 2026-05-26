import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { MessageSquare, Lightbulb, Brain, Trash2, Loader2, ChevronDown, ChevronUp, Send, Tag } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const CATEGORIES = {
  business_idea: { label: 'Business Idea', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/20' },
  thought: { label: 'Thought', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', ring: 'ring-purple-500/20' },
}

export default function NotesInbox({ userId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [newNote, setNewNote] = useState('')
  const [newCategory, setNewCategory] = useState('thought')
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    if (userId) loadNotes()
  }, [userId])

  const loadNotes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotes(data || [])
    setLoading(false)
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    setAdding(true)
    const note = { content: newNote.trim(), category: newCategory, user_id: userId, source: 'web' }
    const { data, error } = await supabase.from('notes').insert(note).select().single()
    if (!error && data) setNotes(prev => [data, ...prev])
    setNewNote('')
    setAdding(false)
  }

  const deleteNote = async (id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = activeTab === 'all' ? notes : notes.filter(n => n.category === activeTab)
  const businessCount = notes.filter(n => n.category === 'business_idea').length
  const thoughtCount = notes.filter(n => n.category === 'thought').length

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <MessageSquare className="w-4 h-4 text-brand-400" />
        <span className="card-title">Notes Inbox</span>
        <span className="ml-auto text-xs text-gray-600">{notes.length} notes</span>
      </div>

      {/* Telegram setup hint */}
      <div className="bg-surface-900 rounded-xl p-2.5 mb-3 flex items-start gap-2">
        <div className="w-5 h-5 rounded bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="w-3 h-3 text-brand-400" />
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium">Telegram connected</p>
          <p className="text-xs text-gray-600">Send messages to your bot. Use <code className="bg-white/5 px-1 rounded">#idea</code> for business ideas, <code className="bg-white/5 px-1 rounded">#thought</code> for anything else.</p>
        </div>
      </div>

      {/* Quick add */}
      <div className="bg-surface-900 rounded-xl p-2.5 mb-3">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addNote() }}
          placeholder="Capture a thought or idea…"
          rows={2}
          className="input-field text-sm resize-none mb-2 py-2"
        />
        <div className="flex gap-2">
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="input-field text-sm py-1.5 flex-1"
          >
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button onClick={addNote} disabled={adding || !newNote.trim()} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1.5">
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {[
          { key: 'all', label: `All (${notes.length})` },
          { key: 'business_idea', label: `💡 Ideas (${businessCount})` },
          { key: 'thought', label: `🧠 Thoughts (${thoughtCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${activeTab === tab.key ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-gray-600 animate-spin" /></div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filtered.map(note => {
            const cat = CATEGORIES[note.category] || CATEGORIES.thought
            const Icon = cat.icon
            const isLong = note.content.length > 120
            const isExpanded = expanded.has(note.id)
            return (
              <div key={note.id} className="group bg-surface-900 rounded-xl p-3 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-lg ${cat.bg} flex items-center justify-center shrink-0 mt-0.5 ring-1 ${cat.ring}`}>
                    <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-gray-300 leading-relaxed ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                      {note.content}
                    </p>
                    {isLong && (
                      <button onClick={() => toggleExpand(note.id)} className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-0.5 mt-0.5 transition-colors">
                        {isExpanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
                      </button>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`tag ${cat.bg} ${cat.color} ring-1 ${cat.ring} text-[10px]`}>{cat.label}</span>
                      {note.source === 'telegram' && <span className="tag bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 text-[10px]">Telegram</span>}
                      <span className="text-xs text-gray-700 ml-auto">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">💭</p>
              <p className="text-sm text-gray-600">No notes yet. Capture your first idea!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
