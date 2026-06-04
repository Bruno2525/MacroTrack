const DAYS_KEY = 'macrotrack_days'
const GOALS_KEY = 'macrotrack_goals'

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
}

export function removeFood(dateStr, index) {
  const days = getAllDays()
  if (days[dateStr]) {
    days[dateStr] = days[dateStr].filter((_, i) => i !== index)
    localStorage.setItem(DAYS_KEY, JSON.stringify(days))
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
