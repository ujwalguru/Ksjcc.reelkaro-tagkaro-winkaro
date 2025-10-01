import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

type Settings = { pc_count:number; ps5_count:number; car_count:number; vr_count:number }
type Pricing = { id:number; category:'PC'|'PS5'|'CAR'|'VR'; duration_minutes:number; price:number }

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({ pc_count:0, ps5_count:0, car_count:0, vr_count:0 })
  const [pricing, setPricing] = useState<Pricing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const s = await api.getSettings()
      const p = await api.listPricing()
      setSettings(s)
      setPricing(p)
      setLoading(false)
    })()
  }, [])

  const categories = useMemo(() => ['PC','PS5','CAR','VR'] as const, [])

  async function saveCounts() {
    setLoading(true)
    await api.saveSettings(settings)
    setLoading(false)
  }

  async function addPrice(category: Pricing['category']) {
    const duration = Number(prompt(`Add ${category} duration (minutes)`, '60'))
    const price = Number(prompt('Price (₹)', '100'))
    if (!duration || !price) return
    const id = await api.addPricing({ category, duration_minutes: duration, price })
    const list = await api.listPricing()
    setPricing(list)
  }

  async function updatePrice(entry: Pricing) {
    const duration = Number(prompt('Duration (minutes)', String(entry.duration_minutes)))
    const price = Number(prompt('Price (₹)', String(entry.price)))
    if (!duration || !price) return
    await api.updatePricing(entry.id, { category: entry.category, duration_minutes: duration, price })
    const list = await api.listPricing()
    setPricing(list)
  }

  async function deletePrice(id: number) {
    if (!confirm('Delete this price?')) return
    await api.deletePricing(id)
    setPricing(await api.listPricing())
  }

  if (loading) return <div>Loading…</div>

  return (
    <div className="grid gap-6">
      <div className="card">
        <h2 className="font-semibold mb-3">Counts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['pc_count','ps5_count','car_count','vr_count'] as const).map(key => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-sm capitalize">{key.replace('_count','')}</span>
              <input type="number" min={0} className="bg-slate-800 border border-slate-700 rounded px-2 py-2"
                value={settings[key]} onChange={e=> setSettings(s=> ({...s, [key]: Number(e.target.value)}))}/>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <button className="btn" onClick={saveCounts}>Save & Generate Seats</button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Pricing</h2>
        <div className="flex gap-2 mb-3">
          {categories.map(c => (
            <button key={c} className="btn-secondary" onClick={()=> addPrice(c)}>Add {c}</button>
          ))}
        </div>
        <div className="grid gap-2">
          {categories.map(c => (
            <div key={c} className="border border-slate-700 rounded p-3">
              <div className="font-medium mb-2">{c}</div>
              <div className="flex flex-wrap gap-2">
                {pricing.filter(p=> p.category===c).map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-slate-700/50 rounded px-3 py-2">
                    <span>{p.duration_minutes}m</span>
                    <span className="text-slate-400">₹{p.price}</span>
                    <button className="text-primary" onClick={()=> updatePrice(p)}>Edit</button>
                    <button className="text-red-400" onClick={()=> deletePrice(p.id)}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

