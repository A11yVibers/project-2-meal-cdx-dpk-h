const KEYS = {
  userRecipes: 'meal-planner.user-recipes.v1',
  mealPlan: 'meal-planner.meal-plan.v1',
  checkedItems: 'meal-planner.shopping-checked.v1',
  pantryItems: 'meal-planner.pantry.v1',
  weekOffset: 'meal-planner.week-offset.v1',
}

const storageAvailable = typeof window !== 'undefined' && 'localStorage' in window

function read(key, fallback) {
  if (!storageAvailable) return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch (error) {
    console.warn(`Unable to read ${key}`, error)
    return fallback
  }
}

function write(key, value) {
  if (!storageAvailable) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`Unable to write ${key}`, error)
    return false
  }
}

export function loadUserRecipes() {
  return read(KEYS.userRecipes, [])
}

export function saveUserRecipes(recipes) {
  return write(KEYS.userRecipes, recipes)
}

export function loadMealPlan() {
  return read(KEYS.mealPlan, {})
}

export function saveMealPlan(plan) {
  return write(KEYS.mealPlan, plan)
}

export function loadCheckedItems() {
  return read(KEYS.checkedItems, {})
}

export function saveCheckedItems(items) {
  return write(KEYS.checkedItems, items)
}

export function loadPantryItems() {
  return read(KEYS.pantryItems, {})
}

export function savePantryItems(items) {
  return write(KEYS.pantryItems, items)
}

export function loadWeekOffset() {
  const value = read(KEYS.weekOffset, 0)
  return Number.isInteger(value) ? value : 0
}

export function saveWeekOffset(value) {
  return write(KEYS.weekOffset, value)
}
