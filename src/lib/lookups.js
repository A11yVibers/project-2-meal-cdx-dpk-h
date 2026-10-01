import { LOOKUPS, INGREDIENTS } from './data.js'

export function cuisineName(id) {
  const match = LOOKUPS.cuisines.find((item) => item.id === id)
  return match ? match.name : 'Other'
}

export function mealTypeName(id) {
  const match = LOOKUPS.mealTypes.find((item) => item.id === id)
  return match ? match.name : 'Other'
}

export function dietaryNames(ids) {
  const byId = new Map(LOOKUPS.dietaryTags.map((item) => [item.id, item.name]))
  return ids.map((id) => byId.get(id) || id).filter(Boolean)
}

export function categoryNames(ids) {
  const byId = new Map(LOOKUPS.categories.map((item) => [item.id, item.name]))
  return ids.map((id) => byId.get(id) || id).filter(Boolean)
}

export function ingredientName(nameOrId) {
  const direct = INGREDIENTS.find((item) => item.name === nameOrId)
  if (direct) return direct.name
  const byId = INGREDIENTS.find((item) => item.id === nameOrId)
  return byId ? byId.name : nameOrId
}

export function minuteLabel(minutes) {
  const total = Number(minutes) || 0
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const remainder = total % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

export function spiceLabel(level) {
  const value = Number(level) || 0
  if (value <= 0) return 'Mild'
  if (value === 1) return 'Gentle'
  if (value === 2) return 'Medium'
  if (value === 3) return 'Spicy'
  if (value === 4) return 'Hot'
  return 'Very spicy'
}
