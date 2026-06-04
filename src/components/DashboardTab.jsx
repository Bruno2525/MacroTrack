import { useState, useEffect, useCallback } from 'react'
import MacroCard from './MacroCard'
import ProgressBar from './ProgressBar'
import AddFood from './AddFood'
import MealList from './MealList'
import { getDayFoods, sumMacros, dateToStr } from '../storage'

function formatDateLabel(date) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = dateToStr(today)
  const yesterdayStr = dateToStr(yesterday)
  const dateStr = dateToStr(date)

  if (dateStr === todayStr) return 'Hoje'
  if (dateStr === yesterdayStr) return 'Ontem'

  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function DashboardTab({ goals }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [foods, setFoods] = useState([])

  const loadFoods = useCallback(() => {
    setFoods(getDayFoods(dateToStr(currentDate)))
  }, [currentDate])

  useEffect(() => {
    loadFoods()
  }, [loadFoods])

  const totals = sumMacros(foods)

  function goBack() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 1)
    setCurrentDate(d)
  }

  function goForward() {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 1)
    setCurrentDate(d)
  }

  const isToday = dateToStr(currentDate) === dateToStr(new Date())

  return (
    <>
      <div className="page-header">
        <span className="page-title">MacroTrack</span>
      </div>

      <div className="day-nav">
        <button className="day-nav-btn" onClick={goBack}>‹</button>
        <span className="day-label">{formatDateLabel(currentDate)}</span>
        <button className="day-nav-btn" onClick={goForward} disabled={isToday}>›</button>
      </div>

      <div className="macro-cards">
        <MacroCard
          label="Proteína"
          value={totals.prot}
          goal={goals.prot}
          color="var(--color-prot)"
        />
        <MacroCard
          label="Carbo"
          value={totals.carb}
          goal={goals.carb}
          color="var(--color-carb)"
        />
        <MacroCard
          label="Gordura"
          value={totals.fat}
          goal={goals.fat}
          color="var(--color-fat)"
        />
      </div>

      <div className="progress-section">
        <div className="progress-row">
          <div className="progress-row-header">
            <span className="progress-label">Calorias</span>
            <span className="progress-pct">
              {totals.cal} / {goals.cal} kcal
            </span>
          </div>
          <ProgressBar value={totals.cal} goal={goals.cal} color="var(--color-accent)" />
        </div>
        <div className="progress-row">
          <div className="progress-row-header">
            <span className="progress-label" style={{ color: 'var(--color-prot)' }}>Proteína</span>
            <span className="progress-pct">{Math.round((totals.prot / goals.prot) * 100)}%</span>
          </div>
          <ProgressBar value={totals.prot} goal={goals.prot} color="var(--color-prot)" />
        </div>
        <div className="progress-row">
          <div className="progress-row-header">
            <span className="progress-label" style={{ color: 'var(--color-carb)' }}>Carboidrato</span>
            <span className="progress-pct">{Math.round((totals.carb / goals.carb) * 100)}%</span>
          </div>
          <ProgressBar value={totals.carb} goal={goals.carb} color="var(--color-carb)" />
        </div>
        <div className="progress-row">
          <div className="progress-row-header">
            <span className="progress-label" style={{ color: 'var(--color-fat)' }}>Gordura</span>
            <span className="progress-pct">{Math.round((totals.fat / goals.fat) * 100)}%</span>
          </div>
          <ProgressBar value={totals.fat} goal={goals.fat} color="var(--color-fat)" />
        </div>
      </div>

      <AddFood currentDate={currentDate} onAdded={loadFoods} />
      <MealList foods={foods} currentDate={currentDate} onRemoved={loadFoods} />
    </>
  )
}
