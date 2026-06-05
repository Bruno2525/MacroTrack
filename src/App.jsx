import { useState } from 'react'
import './App.css'
import DashboardTab from './components/DashboardTab'
import HistoryTab from './components/HistoryTab'
import GoalsTab from './components/GoalsTab'
import FavoritesTab from './components/FavoritesTab'
import { getGoals } from './storage'

function IconToday() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function IconGoals() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function IconSaved() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

const TABS = [
  { id: 'hoje', label: 'Hoje', Icon: IconToday },
  { id: 'historico', label: 'Histórico', Icon: IconHistory },
  { id: 'metas', label: 'Metas', Icon: IconGoals },
  { id: 'salvos', label: 'Salvos', Icon: IconSaved },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('hoje')
  const [goals, setGoals] = useState(getGoals)

  return (
    <div className="app">
      <div className="main-content">
        {activeTab === 'hoje' && <DashboardTab goals={goals} />}
        {activeTab === 'historico' && <HistoryTab goals={goals} />}
        {activeTab === 'metas' && <GoalsTab goals={goals} onGoalsChange={setGoals} />}
        {activeTab === 'salvos' && <FavoritesTab />}
      </div>

      <nav className="tab-bar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
