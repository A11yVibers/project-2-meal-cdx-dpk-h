import { INGREDIENTS, SHOPPING_CATEGORIES, formatDecimal } from './data.js'

const categoryIndex = new Map(INGREDIENTS.map((entry, index) => [normalizeName(entry.name), entry.shoppingCategory]))

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function shoppingCategoryFor(ingredientName) {
  return categoryIndex.get(normalizeName(ingredientName)) || 'Other'
}

export function ingredientKey(name, unit) {
  return `${normalizeName(name)}|${normalizeName(unit)}`
}

function addQuantity(a, b) {
  const left = Number.parseFloat(a)
  const right = Number.parseFloat(b)
  if (!Number.isFinite(left)) return b
  if (!Number.isFinite(right)) return a
  return formatDecimal(left + right)
}

export function buildShoppingList(days, mealPlan, recipes) {
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]))
  const contributions = new Map()

  days.forEach((day) => {
    const assignments = mealPlan[day.key] || {}
    Object.values(assignments).forEach((recipeId) => {
      if (!recipeId) return
      const recipe = recipesById.get(recipeId)
      if (!recipe || recipe.options?.includeInShoppingList === false) return

      recipe.ingredients.forEach((ingredient) => {
        if (!ingredient.ingredientName) return
        const key = ingredientKey(ingredient.ingredientName, ingredient.unit)
        const current = contributions.get(key) || {
          key,
          name: ingredient.ingredientName,
          unit: ingredient.unit || '',
          quantity: '0',
          category: shoppingCategoryFor(ingredient.ingredientName),
          optional: ingredient.optional,
          count: 0,
        }

        current.quantity = addQuantity(current.quantity, ingredient.quantity)
        current.count += 1
        current.optional = ingredient.optional
        contributions.set(key, current)
      })
    })
  })

  const items = [...contributions.values()].map((item) => {
    const { name, unit, quantity } = item
    const unitLabel = unit && !['to taste'].includes(unit.toLowerCase()) ? ` ${unit}` : ''
    return {
      ...item,
      displayName: item.optional ? `${name} (optional)` : name,
      amount: quantity === '0' ? (unitLabel.trim() || 'to taste') : `${quantity}${unitLabel}`,
    }
  })

  const grouped = SHOPPING_CATEGORIES.map((category) => ({
    category,
    items: items
      .filter((item) => item.category === category)
      .sort((a, b) => a.displayName.localeCompare(b.displayName)),
  })).filter((group) => group.items.length > 0)

  return grouped
}

export function planStats(days, mealPlan) {
  let plannedSlots = 0
  let emptySlots = 0
  let plannedRecipes = new Set()

  days.forEach((day) => {
    const dayAssignments = mealPlan[day.key] || {}
    ;['Breakfast', 'Lunch', 'Dinner', 'Snack'].forEach((slot) => {
      const recipeId = dayAssignments[slot]
      if (recipeId) {
        plannedSlots += 1
        plannedRecipes.add(recipeId)
      } else {
        emptySlots += 1
      }
    })
  })

  return { plannedSlots, emptySlots, recipeCount: plannedRecipes.size }
}
