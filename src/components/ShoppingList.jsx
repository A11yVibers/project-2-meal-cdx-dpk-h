import { useMemo } from 'react'
import {
  SHOPPING_CATEGORIES,
  displayQuantity,
  lookupIngredientByName,
  normalizeIngredient
} from '../data.js'

function numberFromQuantity(value) {
  const parsed = Number(value)
  if (Number.isFinite(parsed)) return parsed
  const parts = String(value || '').split('-')
  if (parts.length === 2) {
    const first = Number(parts[0])
    if (Number.isFinite(first)) return first
  }
  const fraction = String(value || '').trim().split(' ')[0]
  const parsedFraction = Number(fraction)
  return Number.isFinite(parsedFraction) ? parsedFraction : null
}

function quantityForDisplay(item) {
  const amount = item.totalQuantity
  const unit = item.unit
  if (amount !== null && amount % 1 !== 0 && Number.isFinite(amount)) {
    return `${Number(amount.toFixed(2))} ${unit || ''}`.trim()
  }
  return [amount === null ? item.rawSources.join(' + ') : amount, unit].filter(Boolean).join(' ').trim()
}

export default function ShoppingList({ recipes, settingsByRecipe, mealPlan, shoppingState, onChange }) {
  const items = useMemo(() => {
    const counts = {}
    Object.values(mealPlan || {}).forEach((slots) => {
      Object.values(slots || {}).forEach((assignment) => {
        if (!assignment?.recipeId) return
        counts[assignment.recipeId] = (counts[assignment.recipeId] || 0) + 1
      })
    })

    const grouped = new Map()
    Object.entries(counts).forEach(([recipeId, plannedCount]) => {
      const recipe = recipes.find((item) => item.id === recipeId)
      if (!recipe) return
      const options = { ...recipe.options, ...(settingsByRecipe[recipeId] || {}) }
      if (options.includeInShoppingList === false) return
      const displayRecipe = { ...recipe, options }

      recipe.ingredientSections.forEach((section) => {
        section.ingredients.forEach((ingredient) => {
          const matched = lookupIngredientByName(ingredient.name) || {}
          const category = matched.shopping_category || ingredient.shoppingCategory || 'Other'
          const normalizedName = normalizeIngredient(ingredient.name)
          const unit = ingredient.unit || ''
          const key = `${normalizedName}||${unit}`
          const existing = grouped.get(key)
          const numeric = numberFromQuantity(ingredient.quantity)

          if (!existing) {
            grouped.set(key, {
              key,
              name: matched.ingredient_name || ingredient.name,
              category,
              unit,
              optional: Boolean(ingredient.optional),
              totalQuantity: numeric === null ? null : numeric * plannedCount,
              rawSources: [`${plannedCount > 1 ? `${plannedCount} × ` : ''}${displayQuantity(displayRecipe, ingredient) || ingredient.quantity || ''}`],
              count: plannedCount
            })
          } else {
            existing.count += plannedCount
            if (numeric !== null && existing.totalQuantity !== null) {
              existing.totalQuantity += numeric * plannedCount
            } else {
              existing.totalQuantity = null
            }
            existing.rawSources.push(`${plannedCount > 1 ? `${plannedCount} × ` : ''}${displayQuantity(displayRecipe, ingredient) || ingredient.quantity || ''}`)
            if (Boolean(ingredient.optional)) existing.optional = true
          }
        })
      })
    })

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      displayQuantity: quantityForDisplay(item)
    })).sort((a, b) => a.name.localeCompare(b.name))
  }, [mealPlan, recipes, settingsByRecipe])

  const groupedByCategory = useMemo(() => {
    const order = [...SHOPPING_CATEGORIES, 'Other']
    return order.map((category) => ({
      category,
      items: items.filter((item) => item.category === category)
    })).filter((group) => group.items.length > 0)
  }, [items])

  const visibleItems = items.filter((item) => {
    if (!shoppingState.hidePantry) return true
    return !shoppingState.pantry[item.key] && !shoppingState.editedItems[item.key]?.pantry
  })

  const updateChecked = (key, checked) => {
    onChange({
      ...shoppingState,
      checked: { ...shoppingState.checked, [key]: checked }
    })
  }

  const updatePantry = (key, pantry) => {
    onChange({
      ...shoppingState,
      pantry: { ...shoppingState.pantry, [key]: pantry }
    })
  }

  const updateHidePantry = (hidePantry) => {
    onChange({ ...shoppingState, hidePantry })
  }

  const totalItems = items.length
  const doneItems = items.filter((item) => shoppingState.checked[item.key]).length
  const hiddenPantryCount = items.filter((item) => shoppingState.pantry[item.key]).length

  return (
    <div className="shopping-list">
      <div className="page-header-row">
        <div>
          <h1>Shopping list</h1>
          <p className="page-subtitle">Generated from recipes currently scheduled in the meal plan.</p>
        </div>
        <div className="shopping-progress">
          <span><strong>{doneItems}</strong> of <strong>{totalItems}</strong> checked</span>
          <label className="inline-checkbox">
            <input
              type="checkbox"
              checked={shoppingState.hidePantry}
              onChange={(event) => updateHidePantry(event.target.checked)}
            />
            <span>Exclude pantry items{hiddenPantryCount ? ` (${hiddenPantryCount})` : ''}</span>
          </label>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="empty-state-card">
          <h2>Your list is empty</h2>
          <p>Add recipes to the weekly meal planner and the ingredients will show up here automatically.</p>
        </div>
      ) : (
        <div className="shopping-sections">
          {groupedByCategory.map((group) => {
            const categoryItems = group.items.filter((item) => visibleItems.includes(item))
            if (!categoryItems.length) return null
            return (
              <section className="shopping-section" key={group.category}>
                <h2>{group.category}</h2>
                <ul className="shopping-section-list">
                  {categoryItems.map((item) => {
                    const checked = Boolean(shoppingState.checked[item.key])
                    const pantry = Boolean(shoppingState.pantry[item.key]) || Boolean(shoppingState.editedItems[item.key]?.pantry)
                    return (
                      <li key={item.key} className={`shopping-item${checked ? ' checked' : ''}${pantry ? ' pantry' : ''}`}>
                        <label className="shopping-item-main">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => updateChecked(item.key, event.target.checked)}
                          />
                          <span className="custom-check" aria-hidden="true">✓</span>
                          <span className="shopping-item-name">
                            {item.name}
                            {item.optional && <small className="optional-tag">optional</small>}
                          </span>
                          <span className="shopping-item-quantity">{item.displayQuantity || 'to taste'}</span>
                        </label>
                        <button
                          className={`pantry-button${pantry ? ' active' : ''}`}
                          type="button"
                          title={pantry ? 'Remove from pantry' : 'Mark as already in pantry'}
                          onClick={() => updatePantry(item.key, !pantry)}
                        >
                          {pantry ? '✓ Pantry' : 'In pantry?'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
