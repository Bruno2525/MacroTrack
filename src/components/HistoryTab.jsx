import { useState, useEffect } from 'react'
import { getAllDays, sumMacros, dateToStr } from '../storage'
import MonthlyChart from './MonthlyChart'

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(n % 1 === 0 ? 0 : 1) : n
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const todayStr = dateToStr(today)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = dateToStr(yesterday)

  if (dateStr === todayStr) return 'Hoje'
  if (dateStr === yesterdayStr) return 'Ontem'

  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function HistoryTab({ goals }) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('macrotrack:updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('macrotrack:updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const days = getAllDays()

  const today = new Date()
  const last7 = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    last7.push(dateToStr(d))
  }

  const entries = last7
    .filter(dateStr => days[dateStr] && days[dateStr].length > 0)
    .map(dateStr => ({ dateStr, totals: sumMacros(days[dateStr]) }))

  return (
    <>
      <div className="page-header">
        <span className="page-title">Histórico</span>
      </div>

      <MonthlyChart goals={goals} refreshKey={refreshKey} />

      <div className="history-section-title">Últimos 7 dias</div>

      {entries.length === 0 ? (
        <p className="empty-state">Nenhum dado nos últimos 7 dias</p>
      ) : (
        <div className="history-list">
          {entries.map(({ dateStr, totals }) => (
            <div key={dateStr} className="history-card">
              <div className="history-card-header">
                <span className="history-date">{formatDate(dateStr)}</span>
                <span className="history-cal">{totals.cal} kcal</span>
              </div>
              <div className="history-macros">
                <div className="history-macro">
                  P <span style={{ color: 'var(--color-prot)' }}>{fmt(totals.prot)}g</span>
                </div>
                <div className="history-macro">
                  C <span style={{ color: 'var(--color-carb)' }}>{fmt(totals.carb)}g</span>
                </div>
                <div className="history-macro">
                  G <span style={{ color: 'var(--color-fat)' }}>{fmt(totals.fat)}g</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
