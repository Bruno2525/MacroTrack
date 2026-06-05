import { useState } from 'react'
import { removeFood, dateToStr, getFavorites, addFavorite, removeFavorite } from '../storage'

const MEAL_ORDER = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Suplemento']

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(n % 1 === 0 ? 0 : 1) : n
}

function favKey(f) {
  return `${f.name}|${f.prot}|${f.carb}|${f.fat}|${f.cal}`
}

export default function MealList({ foods, currentDate, onRemoved }) {
  const [favorites, setFavorites] = useState(getFavorites)

  if (!foods.length) {
    return <p className="empty-state">Nenhum alimento registrado hoje</p>
  }

  const favKeys = new Set(favorites.map(favKey))

  const grouped = {}
  foods.forEach((f, i) => {
    const key = f.meal || 'Outros'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push({ ...f, _index: i })
  })

  function handleRemove(index) {
    removeFood(dateToStr(currentDate), index)
    onRemoved()
  }

  function handleFavToggle(food) {
    const key = favKey(food)
    if (favKeys.has(key)) {
      const fav = favorites.find(f => favKey(f) === key)
      if (fav) removeFavorite(fav.id)
    } else {
      addFavorite(food)
    }
    setFavorites(getFavorites())
  }

  const keys = MEAL_ORDER.filter(k => grouped[k]).concat(
    Object.keys(grouped).filter(k => !MEAL_ORDER.includes(k))
  )

  return (
    <div className="section">
      <div className="section-title">Refeições</div>
      {keys.map(mealName => (
        <div key={mealName} className="meal-group">
          <div className="meal-group-title">{mealName}</div>
          {grouped[mealName].map(food => {
            const isFav = favKeys.has(favKey(food))
            return (
              <div key={food._index} className="food-item">
                <div className="food-item-info">
                  <div className="food-item-name">{food.name}</div>
                  <div className="food-item-macros">
                    <span style={{ color: 'var(--color-prot)' }}>P {fmt(food.prot)}g</span>
                    <span style={{ color: 'var(--color-carb)' }}>C {fmt(food.carb)}g</span>
                    <span style={{ color: 'var(--color-fat)' }}>G {fmt(food.fat)}g</span>
                    <span>{food.cal} kcal</span>
                  </div>
                </div>
                <button
                  className={`fav-btn ${isFav ? 'active' : ''}`}
                  onClick={() => handleFavToggle(food)}
                  aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  {isFav ? '★' : '☆'}
                </button>
                <button
                  className="remove-btn"
                  onClick={() => handleRemove(food._index)}
                  aria-label="Remover"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
