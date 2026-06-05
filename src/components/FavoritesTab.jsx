import { useState } from 'react'
import {
  getFavorites, removeFavorite, addFood,
  getPlates, savePlate, deletePlate,
  getDayFoods, dateToStr, sumMacros,
} from '../storage'

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(n % 1 === 0 ? 0 : 1) : n
}

export default function FavoritesTab() {
  const today = dateToStr(new Date())
  const [favorites, setFavorites] = useState(getFavorites)
  const [plates, setPlates] = useState(getPlates)
  const [savingPlate, setSavingPlate] = useState(false)
  const [plateName, setPlateName] = useState('')
  const [plateError, setPlateError] = useState('')
  const [toast, setToast] = useState('')

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function handleRemoveFavorite(id) {
    removeFavorite(id)
    setFavorites(getFavorites())
  }

  function handleAddToToday(fav) {
    addFood(today, { name: fav.name, prot: fav.prot, carb: fav.carb, fat: fav.fat, cal: fav.cal, meal: fav.meal })
    showToast(`${fav.name} adicionado ao dia!`)
  }

  function handleSavePlate() {
    const name = plateName.trim()
    if (!name) return
    const foods = getDayFoods(today)
    if (!foods.length) {
      setPlateError('Adicione alimentos ao dia atual primeiro.')
      return
    }
    savePlate(name, foods)
    setPlates(getPlates())
    setPlateName('')
    setSavingPlate(false)
    setPlateError('')
    showToast(`Prato "${name}" salvo!`)
  }

  function handleApplyPlate(plate) {
    plate.items.forEach(item => addFood(today, item))
    showToast(`Prato "${plate.name}" aplicado ao dia!`)
  }

  function handleDeletePlate(id) {
    deletePlate(id)
    setPlates(getPlates())
  }

  return (
    <>
      <div className="page-header">
        <span className="page-title">Salvos</span>
      </div>

      {toast && <div className="saved-toast">{toast}</div>}

      {/* Favorites */}
      <div className="goals-card">
        <div className="goals-card-title">Favoritos</div>
        {favorites.length === 0 ? (
          <p className="empty-state" style={{ padding: '8px 0' }}>
            Marque alimentos com ★ na aba Hoje para salvá-los aqui.
          </p>
        ) : (
          favorites.map(fav => (
            <div key={fav.id} className="saved-item">
              <div className="saved-item-info">
                <div className="food-item-name">{fav.name}</div>
                <div className="food-item-macros">
                  <span style={{ color: 'var(--color-prot)' }}>P {fmt(fav.prot)}g</span>
                  <span style={{ color: 'var(--color-carb)' }}>C {fmt(fav.carb)}g</span>
                  <span style={{ color: 'var(--color-fat)' }}>G {fmt(fav.fat)}g</span>
                  <span>{fav.cal} kcal</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{fav.meal}</div>
              </div>
              <div className="saved-item-actions">
                <button
                  className="saved-action-btn add"
                  onClick={() => handleAddToToday(fav)}
                  title="Adicionar ao dia atual"
                >
                  +
                </button>
                <button
                  className="saved-action-btn remove"
                  onClick={() => handleRemoveFavorite(fav.id)}
                  title="Remover dos favoritos"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Standard Plates */}
      <div className="goals-card">
        <div className="goals-card-title">Pratos Padrão</div>

        {savingPlate ? (
          <div className="plate-name-input-row">
            <input
              className="goal-input"
              style={{ flex: 1, width: 'auto', textAlign: 'left' }}
              type="text"
              placeholder="Nome do prato..."
              value={plateName}
              onChange={e => { setPlateName(e.target.value); setPlateError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSavePlate()}
              autoFocus
            />
            <button
              className="save-goals-btn"
              style={{ marginTop: 0, width: 'auto', padding: '8px 14px', fontSize: 13 }}
              onClick={handleSavePlate}
            >
              Salvar
            </button>
            <button className="remove-btn" onClick={() => { setSavingPlate(false); setPlateError('') }}>×</button>
          </div>
        ) : (
          <button className="save-goals-btn" onClick={() => setSavingPlate(true)}>
            Salvar prato atual como padrão
          </button>
        )}

        {plateError && <p className="status-msg error" style={{ marginTop: 8 }}>{plateError}</p>}

        {plates.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {plates.map(plate => {
              const totals = sumMacros(plate.items)
              return (
                <div key={plate.id} className="saved-plate">
                  <div className="saved-plate-header">
                    <div className="saved-plate-name">{plate.name}</div>
                    <button className="remove-btn" onClick={() => handleDeletePlate(plate.id)} title="Excluir prato">×</button>
                  </div>
                  <div className="food-item-macros" style={{ marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-prot)' }}>P {fmt(totals.prot)}g</span>
                    <span style={{ color: 'var(--color-carb)' }}>C {fmt(totals.carb)}g</span>
                    <span style={{ color: 'var(--color-fat)' }}>G {fmt(totals.fat)}g</span>
                    <span>{Math.round(totals.cal)} kcal</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    {plate.items.length} item{plate.items.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    className="save-goals-btn"
                    style={{ marginTop: 0, padding: '8px 14px', fontSize: 13 }}
                    onClick={() => handleApplyPlate(plate)}
                  >
                    Aplicar prato hoje
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {plates.length === 0 && !savingPlate && (
          <p className="empty-state" style={{ padding: '8px 0' }}>Nenhum prato salvo ainda.</p>
        )}
      </div>
    </>
  )
}
