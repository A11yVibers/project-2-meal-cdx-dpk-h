import { getIngredientCategory } from './data.js'

export function shoppingItemKey(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function roundQuantity(value) {
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

export function buildShoppingGroups(plan, recipesById) {
  const groups = {}

  Object.values(plan || {}).forEach((slot) => {
    const recipe = recipesById[slot?.recipeId]
    if (!recipe || recipe.includeInShoppingList === false) return

    recipe.ingredients?.forEach((section) => {
      section.ingredients?.forEach((ingredient) => {
        const name = String(ingredient.name || '').trim()
        if (!name) return

        const key = shoppingItemKey(name)
        const category = getIngredientCategory(name)
        const quantity = String(ingredient.quantity || '').trim()
        const unit = String(ingredient.unit || '').trim()
        const parsedQuantity = Number.parseFloat(quantity)
        const isNumeric = quantity !== '' && Number.isFinite(parsedQuantity) && unit !== ''

        groups[category] ||= []
        let item = groups[category].find((candidate) => candidate.key === key)

        if (!item) {
          item = {
            key,
            name,
            category,
            amountsByUnit: {},
            extraQuantities: [],
            recipeUsages: [],
            occurrences: 0,
            optionalOccurrences: 0,
          }
          groups[category].push(item)
        }

        item.occurrences += 1
        if (ingredient.optional) item.optionalOccurrences += 1

        if (isNumeric) {
          const unitKey = unit.toLowerCase()
          const amount = item.amountsByUnit[unitKey] || { sum: 0, unit }
          amount.sum += parsedQuantity
          amount.unit = unit
          item.amountsByUnit[unitKey] = amount
        } else {
          const text = quantity && unit ? `${quantity} ${unit}` : quantity || unit || 'to taste'
          const existingExtra = item.extraQuantities.find((entry) => entry.text === text)
          if (existingExtra) existingExtra.count += 1
          else item.extraQuantities.push({ text, count: 1 })
        }

        const existingRecipe = item.recipeUsages.find((usage) => usage.recipeId === recipe.id)
        if (existingRecipe) {
          existingRecipe.count += 1
        } else {
          item.recipeUsages.push({ recipeId: recipe.id, title: recipe.title, count: 1 })
        }
      })
    })
  })

  return Object.fromEntries(
    Object.entries(groups).map(([category, items]) => [
      category,
      items
        .map((item) => {
          const quantityParts = [
            ...Object.entries(item.amountsByUnit).map(([, amount]) => `${roundQuantity(amount.sum)} ${amount.unit}`),
            ...item.extraQuantities.map((entry) =>
              entry.count > 1 ? `${entry.count} × ${entry.text}` : entry.text,
            ),
          ]

          return {
            key: item.key,
            name: item.name,
            quantityText: quantityParts.join(' + '),
            optional: item.optionalOccurrences > 0 && item.optionalOccurrences === item.occurrences,
            recipeTitles: item.recipeUsages.map((usage) =>
              usage.count > 1 ? `${usage.title} ×${usage.count}` : usage.title,
            ),
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    ]),
  )
}
