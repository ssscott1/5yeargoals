import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hours = now.getHours()
  const greeting =
    hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="card text-center py-6 animate-fade-in">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1">{greeting}</p>
      <div className="font-mono text-5xl font-light text-white tracking-tight">
        {format(now, 'HH:mm')}
        <span className="text-brand-500 animate-pulse">:</span>
        <span className="text-3xl text-gray-500">{format(now, 'ss')}</span>
      </div>
      <p className="text-gray-400 text-sm mt-2">{format(now, 'EEEE, MMMM do yyyy')}</p>
    </div>
  )
}
