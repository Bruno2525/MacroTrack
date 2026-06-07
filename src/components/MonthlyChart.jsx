import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { getAllDays, sumMacros } from '../storage'

const MACROS = [
  { key: 'cal',  label: 'Calorias', unit: 'kcal', color: '#1D9E75' },
  { key: 'prot', label: 'Proteína', unit: 'g',    color: '#E24B4A' },
  { key: 'carb', label: 'Carbo',    unit: 'g',    color: '#BA7517' },
  { key: 'fat',  label: 'Gordura',  unit: 'g',    color: '#185FA5' },
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

function monthLabel(year, month) {
  const name = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long' })
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function fmtVal(val, isCalories) {
  if (val === null || val === undefined) return '—'
  return isCalories ? Math.round(val) : +val.toFixed(1)
}

function ChartTooltip({ active, payload, label, activeFilters }) {
  if (!active || !payload || payload.length === 0) return null
  if (!payload.some(p => p.value !== null && p.value !== undefined)) return null

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-day">Dia {label}</div>
      {MACROS.filter(m => activeFilters.has(m.key)).map(macro => {
        const entry = payload.find(p => p.dataKey === macro.key)
        if (!entry || entry.value == null) return null
        return (
          <div key={macro.key} className="chart-tooltip-row" style={{ color: macro.color }}>
            {macro.label}: {fmtVal(entry.value, macro.key === 'cal')}{macro.unit}
          </div>
        )
      })}
    </div>
  )
}

export default function MonthlyChart({ goals }) {
  const now = new Date()
  const [year, setYear]               = useState(now.getFullYear())
  const [month, setMonth]             = useState(now.getMonth())
  const [activeFilters, setActiveFilters] = useState(new Set(['cal', 'prot', 'carb', 'fat']))
  const [selectedDay, setSelectedDay] = useState(null)

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()
  const numDays        = daysInMonth(year, month)
  const allDays        = getAllDays()

  const chartData       = []
  const activeDayTotals = []

  for (let d = 1; d <= numDays; d++) {
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(d)}`
    const foods   = allDays[dateStr]
    if (foods && foods.length > 0) {
      const totals = sumMacros(foods)
      chartData.push({ day: d, dateStr, ...totals })
      activeDayTotals.push(totals)
    } else {
      chartData.push({ day: d, dateStr, cal: null, prot: null, carb: null, fat: null })
    }
  }

  const avgs = activeDayTotals.length > 0
    ? {
        cal:  Math.round(activeDayTotals.reduce((s, d) => s + d.cal,  0) / activeDayTotals.length),
        prot: +(activeDayTotals.reduce((s, d) => s + d.prot, 0) / activeDayTotals.length).toFixed(1),
        carb: +(activeDayTotals.reduce((s, d) => s + d.carb, 0) / activeDayTotals.length).toFixed(1),
        fat:  +(activeDayTotals.reduce((s, d) => s + d.fat,  0) / activeDayTotals.length).toFixed(1),
      }
    : null

  function toggleFilter(key) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(key) && next.size > 1) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function prevMonth() {
    setSelectedDay(null)
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (isCurrentMonth) return
    setSelectedDay(null)
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function handleChartClick(data) {
    if (!data?.activePayload?.length) return
    const point = data.activePayload[0].payload
    setSelectedDay(point.cal !== null ? point : null)
  }

  const selectedDateLabel = selectedDay
    ? new Date(year, month, selectedDay.day)
        .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
        .replace(/^\w/, c => c.toUpperCase())
    : ''

  return (
    <div className="monthly-chart-section">

      {/* Summary cards */}
      {avgs ? (
        <div className="monthly-summary-cards">
          {MACROS.map(macro => (
            <div key={macro.key} className="monthly-summary-card">
              <div className="monthly-summary-label" style={{ color: macro.color }}>
                {macro.label}
              </div>
              <div className="monthly-summary-value">
                {avgs[macro.key]}
                <span className="monthly-summary-unit">{macro.unit}</span>
              </div>
              <div className="monthly-summary-sub">média/dia</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="monthly-empty">Sem dados em {monthLabel(year, month)}</div>
      )}

      {/* Filter buttons */}
      <div className="chart-filters">
        {MACROS.map(macro => (
          <button
            key={macro.key}
            className={`chart-filter-btn ${activeFilters.has(macro.key) ? 'active' : ''}`}
            onClick={() => toggleFilter(macro.key)}
            style={activeFilters.has(macro.key)
              ? { background: macro.color, borderColor: macro.color, color: '#fff' }
              : {}}
          >
            {macro.label}
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="month-nav">
        <button className="day-nav-btn" onClick={prevMonth}>←</button>
        <span className="day-label">{monthLabel(year, month)}</span>
        <button className="day-nav-btn" onClick={nextMonth} disabled={isCurrentMonth}>→</button>
      </div>

      {/* Chart */}
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
            onClick={handleChartClick}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
            <XAxis
              dataKey="day"
              tick={{ fill: '#888', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#2e2e2e' }}
              interval={4}
            />
            <YAxis
              tick={{ fill: '#888', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              content={(props) => <ChartTooltip {...props} activeFilters={activeFilters} />}
            />

            {goals && MACROS.map(macro =>
              activeFilters.has(macro.key) ? (
                <ReferenceLine
                  key={`ref-${macro.key}`}
                  y={goals[macro.key]}
                  stroke={macro.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.45}
                />
              ) : null
            )}

            {MACROS.map(macro =>
              activeFilters.has(macro.key) ? (
                <Line
                  key={macro.key}
                  type="monotone"
                  dataKey={macro.key}
                  stroke={macro.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: macro.color, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Selected day detail card */}
      {selectedDay && (
        <div className="day-detail-card">
          <div className="day-detail-header">
            <span className="day-detail-date">{selectedDateLabel}</span>
            <button className="day-detail-close" onClick={() => setSelectedDay(null)}>✕</button>
          </div>
          <div className="day-detail-macros">
            {MACROS.map(macro => (
              <div key={macro.key} className="day-detail-item">
                <span style={{ color: macro.color }}>{macro.label}</span>
                <strong>{fmtVal(selectedDay[macro.key], macro.key === 'cal')}{macro.unit}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
