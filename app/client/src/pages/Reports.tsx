import { useEffect, useState } from 'react'
import { api, formatCurrencyINR } from '../lib/api'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

type Row = { day:string; revenue:number; sessions:number }

export default function Reports() {
  const [period, setPeriod] = useState<'daily'|'weekly'|'monthly'>('daily')
  const [rows, setRows] = useState<Row[]>([] as any)

  useEffect(()=> { load() }, [period])

  async function load() {
    const r = await api.reports(period)
    setRows(r.rows)
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `report-${period}.xlsx`)
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.text(`Revenue Report (${period})`, 14, 16)
    let y = 28
    doc.setFontSize(10)
    rows.forEach(r => {
      doc.text(`${r.day}  |  Sessions: ${r.sessions}  |  Revenue: ${r.revenue}`, 14, y)
      y += 6
    })
    doc.save(`report-${period}.pdf`)
  }

  return (
    <div className="grid gap-4">
      <div className="card flex items-center gap-2">
        <span>Period:</span>
        <select className="bg-slate-800 border border-slate-700 rounded px-2 py-2" value={period} onChange={e=> setPeriod(e.target.value as any)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <div className="flex-1" />
        <button className="btn-secondary" onClick={exportExcel}>Export Excel</button>
        <button className="btn" onClick={exportPDF}>Export PDF</button>
      </div>

      <div className="card">
        <div className="grid grid-cols-3 gap-2 text-sm text-slate-300 mb-2">
          <div>Date</div><div>Sessions</div><div>Revenue</div>
        </div>
        <div className="grid gap-2">
          {rows.map(r => (
            <div key={r.day} className="grid grid-cols-3 gap-2">
              <div>{r.day}</div>
              <div>{r.sessions}</div>
              <div>{formatCurrencyINR(r.revenue)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

