import { useEffect, useMemo, useRef, useState } from 'react'
import { api, formatCurrencyINR } from '../lib/api'

type Seat = { id:number; name:string; category:'PC'|'PS5'|'CAR'|'VR'; visible:1|0 }
type Pricing = { id:number; category:'PC'|'PS5'|'CAR'|'VR'; duration_minutes:number; price:number }
type Session = { id:number; seat_id:number; seat_name:string; status:string; start_time:number; end_time:number; price_paid:number; customer_name?:string }

export default function Seats() {
  const [seats, setSeats] = useState<Seat[]>([])
  const [pricing, setPricing] = useState<Pricing[]>([])
  const [active, setActive] = useState<Session[]>([])
  const [now, setNow] = useState(Date.now())
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    ;(async () => {
      const [s, p] = await Promise.all([api.listSeats(), api.listPricing()])
      setSeats(s)
      setPricing(p)
      refreshActive()
    })()
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    const p = setInterval(refreshActive, 5_000)
    return () => { clearInterval(t); clearInterval(p) }
  }, [])

  async function refreshActive() {
    const list = await api.listActiveSessions()
    setActive(list)
  }

  function seatStatus(seat: Seat): { status: string; timeLeft?: number } {
    const s = active.find(a => a.seat_name === seat.name)
    if (!s) return { status: 'Available' }
    const tl = s.end_time - now
    if (tl <= 0 && s.status !== 'EXPIRED') {
      // expire server-side and play sound
      api.expireSession(s.id).then(refreshActive)
      audioRef.current?.play().catch(()=>{})
      alert(`${seat.name} session ended`)
      return { status: 'Expired' }
    }
    return { status: s.status === 'UPCOMING' ? 'Upcoming' : 'Running', timeLeft: tl }
  }

  function formatTL(ms?: number) {
    if (!ms || ms < 0) return '00:00'
    const total = Math.floor(ms/1000)
    const m = Math.floor(total/60)
    const s = total%60
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  async function start(seat: Seat) {
    const duration = Number(prompt(`Start ${seat.name} for how many minutes?`, '60'))
    if (!duration) return
    const slot = bestPrice(seat.category, duration)
    const price = slot?.price ?? 0
    const customer_name = prompt('Customer name (optional)', '') || ''
    await api.startSession({ seat_name: seat.name, duration_minutes: duration, price, customer_name, is_walk_in: true })
    refreshActive()
  }

  async function extend(session: Session) {
    const add = Number(prompt('Extend by minutes', '30'))
    if (!add) return
    const slot = bestPrice(seatById(session.seat_id)!.category, add)
    const add_price = slot?.price ?? 0
    await api.extendSession({ session_id: session.id, add_minutes: add, add_price })
    refreshActive()
  }

  async function end(session: Session) {
    await api.endSession(session.id)
    refreshActive()
  }

  function bestPrice(category: Seat['category'], duration: number) {
    const list = pricing.filter(p=> p.category===category).sort((a,b)=> a.duration_minutes-b.duration_minutes)
    let chosen = list[0]
    for (const p of list) if (p.duration_minutes <= duration) chosen = p
    return chosen
  }

  function seatById(id: number) {
    return seats.find(s=> s.id===id)
  }

  return (
    <div className="grid gap-4">
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {seats.filter(s=> s.visible===1).map(seat => {
          const st = seatStatus(seat)
          const running = active.find(a=> a.seat_name===seat.name && a.status==='RUNNING')
          return (
            <div key={seat.id} className="card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{seat.name}</div>
                <div className={
                  st.status==='Available' ? 'text-emerald-400' :
                  st.status==='Running' ? 'text-yellow-300' :
                  st.status==='Upcoming' ? 'text-sky-300' : 'text-red-400'
                }>{st.status}</div>
              </div>
              {st.timeLeft!=null && (
                <div className="text-2xl font-mono">{formatTL(st.timeLeft)}</div>
              )}
              <div className="flex gap-2 mt-2">
                {st.status==='Available' && (
                  <button className="btn" onClick={()=> start(seat)}>Start</button>
                )}
                {running && (
                  <>
                    <button className="btn-secondary" onClick={()=> extend(running)}>Extend</button>
                    <button className="btn" onClick={()=> end(running)}>End</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

