import { useState } from 'react'
import { analyzeFood } from '../claudeApi'
import { addFood, dateToStr } from '../storage'

const MEALS = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Suplemento']

export default function AddFood({ currentDate, onAdded }) {
  const [input, setInput] = useState('')
  const [meal, setMeal] = useState('Almoço')
  const [status, setStatus] = useState({ type: 'idle', msg: '' })

  async function handleAnalyze() {
    const text = input.trim()
    if (!text) return

    setStatus({ type: 'loading', msg: 'Analisando...' })
    try {
      const food = await analyzeFood(text)
      food.meal = meal
      addFood(dateToStr(currentDate), food)
      setInput('')
      setStatus({ type: 'success', msg: '✓ Adicionado!' })
      onAdded()
      setTimeout(() => setStatus({ type: 'idle', msg: '' }), 2000)
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'Erro ao analisar' })
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAnalyze()
  }

  const isLoading = status.type === 'loading'

  return (
    <div className="section">
      <div className="section-title">Adicionar alimento</div>
      <div className="add-food-card">
        <div className="input-row">
          <input
            className="food-input"
            type="text"
            placeholder="Ex: frango grelhado 150g"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
        <select
          className="meal-select"
          value={meal}
          onChange={e => setMeal(e.target.value)}
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          {MEALS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button
          className={`analyze-btn ${status.type !== 'idle' ? status.type : ''}`}
          onClick={handleAnalyze}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? 'Analisando...' : 'Analisar com IA'}
        </button>
        {status.msg && (
          <p className={`status-msg ${status.type === 'error' ? 'error' : ''}`}>
            {status.msg}
          </p>
        )}
      </div>
    </div>
  )
}
