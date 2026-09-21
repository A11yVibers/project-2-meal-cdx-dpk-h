export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromISODate(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfWeek(date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function addDays(date, amount) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

export function weekDates(anchor) {
  const start = startOfWeek(anchor)
  return WEEKDAY_ORDER.map((_, index) => addDays(start, index))
}

export function formatLongDate(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(date)
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

export function formatWeekRange(anchor) {
  const dates = weekDates(anchor)
  return `${formatShortDate(dates[0])} – ${formatShortDate(dates[6])}, ${dates[0].getFullYear()}`
}

export function formatMinutes(total) {
  const minutes = Number(total) || 0
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`
}

export function recipeCover(recipe, placeholder) {
  return recipe?.coverImageUrl?.trim() || placeholder
}

export function normalizeKey(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function recipeMealSlot(recipe) {
  const map = {
    MT01: 'Breakfast',
    MT02: 'Lunch',
    MT03: 'Dinner',
    MT04: 'Snack',
    MT05: 'Dinner',
    MT06: 'Dinner',
  }
  return map[recipe?.mealTypeId] || 'Dinner'
}
