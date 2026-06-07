const DAYS_KEY = 'macrotrack_days'
const GOALS_KEY = 'macrotrack_goals'
const FAVORITES_KEY = 'macrotrack_favorites'
const PLATES_KEY = 'macrotrack_plates'
const PROFILE_KEY = 'macrotrack_profile'

export const DEFAULT_GOALS = { cal: 2000, prot: 150, carb: 250, fat: 70 }

export function getGoals() {
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    return raw ? { ...DEFAULT_GOALS, ...JSON.parse(raw) } : { ...DEFAULT_GOALS }
  } catch {
    return { ...DEFAULT_GOALS }
  }
}

export function saveGoals(goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

export function getDayFoods(dateStr) {
  try {
    const raw = localStorage.getItem(DAYS_KEY)
    const days = raw ? JSON.parse(raw) : {}
    return days[dateStr] || []
  } catch {
    return []
  }
}

export function addFood(dateStr, food) {
  const days = getAllDays()
  days[dateStr] = [...(days[dateStr] || []), food]
  localStorage.setItem(DAYS_KEY, JSON.stringify(days))
  window.dispatchEvent(new CustomEvent('macrotrack:updated'))
}

export function removeFood(dateStr, index) {
  const days = getAllDays()
  if (days[dateStr]) {
    days[dateStr] = days[dateStr].filter((_, i) => i !== index)
    localStorage.setItem(DAYS_KEY, JSON.stringify(days))
    window.dispatchEvent(new CustomEvent('macrotrack:updated'))
  }
}

export function getAllDays() {
  try {
    const raw = localStorage.getItem(DAYS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function addFavorite(food) {
  const favorites = getFavorites()
  const id = Date.now().toString() + Math.random().toString(36).slice(2)
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([
    ...favorites,
    { id, name: food.name, prot: food.prot, carb: food.carb, fat: food.fat, cal: food.cal, meal: food.meal },
  ]))
}

export function removeFavorite(id) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(getFavorites().filter(f => f.id !== id)))
}

export function getPlates() {
  try {
    const raw = localStorage.getItem(PLATES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function savePlate(name, items) {
  const plates = getPlates()
  const newPlate = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    name,
    createdAt: new Date().toISOString(),
    items: items.map(({ name, prot, carb, fat, cal, meal }) => ({ name, prot, carb, fat, cal, meal })),
  }
  localStorage.setItem(PLATES_KEY, JSON.stringify([...plates, newPlate]))
}

export function deletePlate(id) {
  localStorage.setItem(PLATES_KEY, JSON.stringify(getPlates().filter(p => p.id !== id)))
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function dateToStr(date) {
  return date.toISOString().slice(0, 10)
}

export function sumMacros(foods) {
  return foods.reduce(
    (acc, f) => ({
      prot: acc.prot + (f.prot || 0),
      carb: acc.carb + (f.carb || 0),
      fat: acc.fat + (f.fat || 0),
      cal: acc.cal + (f.cal || 0),
    }),
    { prot: 0, carb: 0, fat: 0, cal: 0 },
  )
}
