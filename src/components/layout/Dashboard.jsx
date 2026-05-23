import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Clock from '../dashboard/Clock'
import HabitTracker from '../dashboard/HabitTracker'
import GoalsPanel from '../dashboard/GoalsPanel'
import CalendarWidget from '../dashboard/CalendarWidget'
import JournalPrompt from '../dashboard/JournalPrompt'
import NotesInbox from '../dashboard/NotesInbox'
import DailyFocus from '../dashboard/DailyFocus'
import { LogOut, Zap, LayoutGrid, Target, BookOpen, MessageSquare } from 'lucide-react'

const VIEWS = [
  { id: 'home', label: 'Dashboard', icon: LayoutGrid },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
]

export default function Dashboard({ user }) {
  const [view, setView] = useState('home')
  const [signingOut, setSigningOut] = useState(false)

  const signOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-surface-950/90 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-sm text-white hidden sm:block">Personal OS</span>
          </div>

          <nav className="flex items-center gap-0.5 ml-4">
            {VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm transition-all ${
                  view === id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-600 hidden md:block truncate max-w-[140px]">{user.email}</span>
            <button
              onClick={signOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 text-xs transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {view === 'home' && <HomeView user={user} />}
        {view === 'goals' && <GoalsPanel userId={user.id} />}
        {view === 'journal' && <JournalPrompt userId={user.id} />}
        {view === 'notes' && <NotesInbox userId={user.id} />}
      </main>
    </div>
  )
}

function HomeView({ user }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Clock — full width */}
      <div className="md:col-span-2 xl:col-span-3">
        <Clock />
      </div>

      {/* Focus of the day */}
      <div className="md:col-span-2 xl:col-span-1">
        <DailyFocus userId={user.id} />
      </div>

      {/* Habits */}
      <div>
        <HabitTracker userId={user.id} />
      </div>

      {/* Calendar */}
      <div>
        <CalendarWidget />
      </div>

      {/* Goals — spans 2 cols on XL */}
      <div className="xl:col-span-2">
        <GoalsPanel userId={user.id} />
      </div>

      {/* Journal prompt */}
      <div>
        <JournalPrompt userId={user.id} />
      </div>

      {/* Notes inbox — full width */}
      <div className="md:col-span-2 xl:col-span-3">
        <NotesInbox userId={user.id} />
      </div>
    </div>
  )
}
