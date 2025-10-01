import { useEffect, useMemo, useRef, useState } from 'react'
import { api, formatCurrencyINR } from '../lib/api'

type Session = { id:number; seat_id:number; seat_name:string; status:string; start_time:number; end_time:number; price_paid:number; customer_name?:string; is_walk_in:1|0 }

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [tab, setTab] = useState<'walkin'|'upcoming'>('walkin')
  const [now, setNow] = useState(Date.now())
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    refresh()
    const t = setInterval(()=> setNow(Date.now()), 1000)
    const p = setInterval(refresh, 5_000)
    return () => { clearInterval(t); clearInterval(p) }
  }, [])

  async function refresh() {
    const list = await api.listActiveSessions()
    // auto-transition UPCOMING to RUNNING
    const now = Date.now()
    for (const s of list) {
      if (s.status==='UPCOMING' && s.start_time <= now) {
        // mark as RUNNING by extending 0 (hack to trigger update) or treat client-side
        // For simplicity, treat client-side label
      }
      if (s.status!=='EXPIRED' && s.end_time <= now) {
        await api.expireSession(s.id)
        audioRef.current?.play().catch(()=>{})
        alert(`${s.seat_name} session ended`)
      }
    }
    setSessions(await api.listActiveSessions())
  }

  const walkins = useMemo(()=> sessions.filter(s=> s.is_walk_in===1).sort((a,b)=> a.start_time-b.start_time), [sessions])
  const upcoming = useMemo(()=> sessions.filter(s=> s.is_walk_in===0 || s.status==='UPCOMING').sort((a,b)=> a.start_time-b.start_time), [sessions])

  function timeLeft(s: Session) {
    return Math.max(0, s.end_time - now)
  }

  function fmt(ms: number) {
    const total = Math.floor(ms/1000)
    const m = Math.floor(total/60)
    const s = total%60
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  return (
    <div className="grid gap-4">
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto" />
      <div className="flex gap-2">
        <button className={tab==='walkin'? 'btn' : 'btn-secondary'} onClick={()=> setTab('walkin')}>Walk-in</button>
        <button className={tab==='upcoming'? 'btn' : 'btn-secondary'} onClick={()=> setTab('upcoming')}>Upcoming</button>
      </div>
      {tab==='walkin' ? (
        <div className="card">
          <div className="grid grid-cols-6 gap-2 text-sm text-slate-300 mb-2">
            <div>Seat</div><div>Customer</div><div>Start</div><div>End</div><div>Time Left</div><div>Price</div>
          </div>
          <div className="grid gap-2">
            {walkins.map(s => (
              <div key={s.id} className="grid grid-cols-6 gap-2 items-center">
                <div>{s.seat_name}</div>
                <div>{s.customer_name||'-'}</div>
                <div>{new Date(s.start_time).toLocaleTimeString()}</div>
                <div>{new Date(s.end_time).toLocaleTimeString()}</div>
                <div className="font-mono">{fmt(timeLeft(s))}</div>
                <div>{formatCurrencyINR(s.price_paid)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="grid grid-cols-6 gap-2 text-sm text-slate-300 mb-2">
            <div>Seat</div><div>Customer</div><div>Booking</div><div>Duration</div><div>Price</div><div>Status</div>
          </div>
          <div className="grid gap-2">
            {upcoming.map(s => (
              <div key={s.id} className="grid grid-cols-6 gap-2 items-center">
                <div>{s.seat_name}</div>
                <div>{s.customer_name||'-'}</div>
                <div>{new Date(s.start_time).toLocaleString()}</div>
                <div>{Math.round((s.end_time - s.start_time)/60000)} mins</div>
                <div>{formatCurrencyINR(s.price_paid)}</div>
                <div>{s.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

