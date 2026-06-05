import { useState } from 'react'
import { getProfile, saveProfile } from '../storage'
import { explainGoals } from '../claudeApi'

const ACTIVITY_LEVELS = [
  { value: 'sedentario', label: 'Sedentário', desc: 'pouco ou nenhum exercício', factor: 1.2 },
  { value: 'leve', label: 'Levemente ativo', desc: '1-3x por semana', factor: 1.375 },
  { value: 'moderado', label: 'Moderadamente ativo', desc: '3-5x por semana', factor: 1.55 },
  { value: 'muito', label: 'Muito ativo', desc: '6-7x por semana', factor: 1.725 },
]

const GOAL_OPTIONS = [
  { value: 'perder', label: 'Perder peso', adjustment: -500 },
  { value: 'manter', label: 'Manter peso', adjustment: 0 },
  { value: 'ganhar', label: 'Ganhar massa muscular', adjustment: 300 },
]

const DEFAULT_PROFILE = {
  peso: '', altura: '', idade: '',
  sexo: 'masculino', atividade: 'moderado', objetivo: 'manter',
}

export default function ProfileForm({ onApply }) {
  const [profile, setProfile] = useState(() => getProfile() || DEFAULT_PROFILE)
  const [result, setResult] = useState(null)
  const [aiText, setAiText] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [applied, setApplied] = useState(false)

  function set(key, val) {
    setProfile(prev => ({ ...prev, [key]: val }))
    setResult(null)
    setApplied(false)
    setAiText('')
  }

  function calculate() {
    const p = Number(profile.peso)
    const h = Number(profile.altura)
    const a = Number(profile.idade)
    if (!p || !h || !a) return

    const tmb = profile.sexo === 'masculino'
      ? (10 * p) + (6.25 * h) - (5 * a) + 5
      : (10 * p) + (6.25 * h) - (5 * a) - 161

    const actLevel = ACTIVITY_LEVELS.find(x => x.value === profile.atividade)
    const goalOpt = GOAL_OPTIONS.find(x => x.value === profile.objetivo)

    const tdee = tmb * actLevel.factor
    const calorias = Math.round(tdee + goalOpt.adjustment)
    const proteina = Math.round(p * 2)
    const gordura = Math.round((calorias * 0.25) / 9)
    const carbo = Math.round((calorias - proteina * 4 - gordura * 9) / 4)

    const r = { calorias, proteina, carbo, gordura }
    setResult(r)
    setApplied(false)
    saveProfile(profile)

    setLoadingAi(true)
    setAiText('')
    explainGoals({
      peso: p, altura: h, idade: a,
      sexo: profile.sexo === 'masculino' ? 'masculino' : 'feminino',
      atividade: `${actLevel.label} (${actLevel.desc})`,
      objetivo: goalOpt.label,
      calorias, proteina, carbo, gordura,
    })
      .then(text => setAiText(text))
      .catch(() => setAiText(''))
      .finally(() => setLoadingAi(false))
  }

  function apply() {
    if (!result) return
    onApply({ cal: result.calorias, prot: result.proteina, carb: result.carbo, fat: result.gordura })
    setApplied(true)
  }

  const canCalc = profile.peso && profile.altura && profile.idade

  return (
    <div className="goals-card">
      <div className="goals-card-title">Calcular metas automaticamente</div>

      <div className="profile-grid">
        <div className="profile-field">
          <label className="profile-label">Peso (kg)</label>
          <input
            className="goal-input"
            style={{ width: '100%' }}
            type="number"
            min={1}
            placeholder="70"
            value={profile.peso}
            onChange={e => set('peso', e.target.value)}
          />
        </div>
        <div className="profile-field">
          <label className="profile-label">Altura (cm)</label>
          <input
            className="goal-input"
            style={{ width: '100%' }}
            type="number"
            min={1}
            placeholder="170"
            value={profile.altura}
            onChange={e => set('altura', e.target.value)}
          />
        </div>
        <div className="profile-field">
          <label className="profile-label">Idade (anos)</label>
          <input
            className="goal-input"
            style={{ width: '100%' }}
            type="number"
            min={1}
            placeholder="30"
            value={profile.idade}
            onChange={e => set('idade', e.target.value)}
          />
        </div>
        <div className="profile-field">
          <label className="profile-label">Sexo</label>
          <select
            className="meal-select"
            style={{ width: '100%', minWidth: 0 }}
            value={profile.sexo}
            onChange={e => set('sexo', e.target.value)}
          >
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select>
        </div>
      </div>

      <div className="profile-field-full">
        <label className="profile-label">Nível de atividade</label>
        <select
          className="meal-select"
          style={{ width: '100%' }}
          value={profile.atividade}
          onChange={e => set('atividade', e.target.value)}
        >
          {ACTIVITY_LEVELS.map(l => (
            <option key={l.value} value={l.value}>{l.label} ({l.desc})</option>
          ))}
        </select>
      </div>

      <div className="profile-field-full">
        <label className="profile-label">Objetivo</label>
        <select
          className="meal-select"
          style={{ width: '100%' }}
          value={profile.objetivo}
          onChange={e => set('objetivo', e.target.value)}
        >
          {GOAL_OPTIONS.map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      <button
        className="save-goals-btn"
        disabled={!canCalc}
        onClick={calculate}
      >
        Calcular e aplicar metas
      </button>

      {result && (
        <div className="calc-result">
          <div className="calc-result-grid">
            <div className="calc-result-item">
              <div className="calc-result-value">{result.calorias}</div>
              <div className="calc-result-label">kcal</div>
            </div>
            <div className="calc-result-item">
              <div className="calc-result-value" style={{ color: 'var(--color-prot)' }}>{result.proteina}g</div>
              <div className="calc-result-label">Proteína</div>
            </div>
            <div className="calc-result-item">
              <div className="calc-result-value" style={{ color: 'var(--color-carb)' }}>{result.carbo}g</div>
              <div className="calc-result-label">Carbo</div>
            </div>
            <div className="calc-result-item">
              <div className="calc-result-value" style={{ color: 'var(--color-fat)' }}>{result.gordura}g</div>
              <div className="calc-result-label">Gordura</div>
            </div>
          </div>

          {(loadingAi || aiText) && (
            <div className="ai-explanation">
              {loadingAi
                ? <div className="ai-loading">✦ IA analisando seu perfil...</div>
                : <p>{aiText}</p>
              }
            </div>
          )}

          <button
            className={`save-goals-btn ${applied ? 'saved' : ''}`}
            onClick={apply}
          >
            {applied ? '✓ Metas aplicadas!' : 'Confirmar e usar estas metas'}
          </button>
        </div>
      )}
    </div>
  )
}
