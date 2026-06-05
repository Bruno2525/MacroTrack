import { useState } from 'react'
import { saveGoals } from '../storage'
import ProfileForm from './ProfileForm'

const FIELDS = [
  { key: 'cal', label: 'Calorias', unit: 'kcal' },
  { key: 'prot', label: 'Proteína', unit: 'g', color: 'var(--color-prot)' },
  { key: 'carb', label: 'Carboidrato', unit: 'g', color: 'var(--color-carb)' },
  { key: 'fat', label: 'Gordura', unit: 'g', color: 'var(--color-fat)' },
]

export default function GoalsTab({ goals, onGoalsChange }) {
  const [draft, setDraft] = useState({ ...goals })
  const [saved, setSaved] = useState(false)

  function handleChange(key, val) {
    setDraft(prev => ({ ...prev, [key]: Number(val) || 0 }))
    setSaved(false)
  }

  function handleSave() {
    saveGoals(draft)
    onGoalsChange(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleProfileApply(newGoals) {
    setDraft(newGoals)
    saveGoals(newGoals)
    onGoalsChange(newGoals)
  }

  return (
    <>
      <div className="page-header">
        <span className="page-title">Metas diárias</span>
      </div>

      <ProfileForm onApply={handleProfileApply} />

      <div className="goals-card">
        <div className="goals-card-title">Configurar metas</div>
        {FIELDS.map(({ key, label, unit, color }) => (
          <div key={key} className="goal-field">
            <span className="goal-field-label" style={color ? { color } : {}}>
              {label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                className="goal-input"
                type="number"
                min={0}
                value={draft[key]}
                onChange={e => handleChange(key, e.target.value)}
              />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{unit}</span>
            </div>
          </div>
        ))}
        <button
          className={`save-goals-btn ${saved ? 'saved' : ''}`}
          onClick={handleSave}
        >
          {saved ? '✓ Salvo!' : 'Salvar metas'}
        </button>
      </div>
    </>
  )
}
