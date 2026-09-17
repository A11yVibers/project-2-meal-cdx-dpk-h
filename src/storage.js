const STORAGE_KEYS = {
  recipes: 'meal-planner.user-recipes.v1',
  plan: 'meal-planner.week-plan.v1',
  shopping: 'meal-planner.shopping-list.v1',
  weekOffset: 'meal-planner.week-offset.v1',
}

export function readJson(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return fallback
    return JSON.parse(stored)
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private contexts; app state still works in memory.
  }
}

export { STORAGE_KEYS }
