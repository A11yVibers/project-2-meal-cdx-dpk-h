import { useMemo } from 'react'
import { SHOPPING_CATEGORY_ORDER, findIngredientByName } from '../data.js'
import { normalizeKey } from '../utils.js'

function isNumeric(value) {
  return value !== '' && value != null && Number.isFinite(Number(value))
}

function formatQuantity(value) {
  if (value === '' || value == null) return ''
  const number = Number(value)
  if (Number.isInteger(number)) return String(number)
  return String(number)
}

function buildShoppingLines(recipes, plan) {
  const aggregates = new Map()

  for (const [dateKey, slots] of Object.entries(plan || {})) {
    for (const [slot, assignment] of Object.entries(slots || {})) {
      if (!assignment?.recipeId) continue
      const recipe = recipes.find((item) => item.id === assignment.recipeId)
      if (!recipe || recipe.includeInShoppingList === false) continue

      for (const ingredient of recipe.ingredients || []) {
        const name = String(ingredient.name || '').trim()
        if (!name) continue
        const unit = String(ingredient.unit || '').trim()
        const optional = Boolean(ingredient.optional)
        const category = findIngredientByName(name)?.category || 'Grains & pantry'
        const key = `${normalizeKey(name)}|${normalizeKey(unit)}|${optional ? 'optional' : 'required'}`
        const existing = aggregates.get(key)

        if (existing) {
          if (!existing.recipeIds.includes(recipe.id)) existing.recipeIds.push(recipe.id)
          if (!existing.recipeTitles.includes(recipe.title)) existing.recipeTitles.push(recipe.title)
          if (isNumeric(ingredient.quantity) && isNumeric(existing.numericQuantity)) {
            existing.numericQuantity += Number(ingredient.quantity)
          } else if (ingredient.quantity && !existing.numericQuantity) {
            existing.rawQuantities.push(ingredient.quantity)
          } else if (!isNumeric(existing.numericQuantity) && ingredient.quantity) {
            existing.rawQuantities.push(ingredient.quantity)
          }
        } else {
          aggregates.set(key, {
            id: key,
            name,
            unit,
            optional,
            category,
            recipeIds: [recipe.id],
            recipeTitles: [recipe.title],
            numericQuantity: isNumeric(ingredient.quantity) ? Number(ingredient.quantity) : null,
            rawQuantities: ingredient.quantity && !isNumeric(ingredient.quantity) ? [String(ingredient.quantity)] : [],
          })
        }
      }
    }
  }

  return Array.from(aggregates.values()).map((item) => {
    let quantity = ''
    if (item.numericQuantity != null) quantity = formatQuantity(item.numericQuantity)
    else if (item.rawQuantities.length) quantity = item.rawQuantities.join(' + ')
    return {
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantity,
      optional: item.optional,
      category: item.category,
      recipeTitles: [...new Set(item.recipeTitles)],
      recipeIds: [...new Set(item.recipeIds)],
    }
  })
}

export default function ShoppingList({
  recipes,
  plan,
  pantryKeys,
  checkedKeys,
  hidePantry,
  onTogglePantry,
  onToggleChecked,
  onToggleHidePantry,
  onClearChecked,
  onOpenRecipe,
}) {
  const lines = useMemo(() => buildShoppingLines(recipes, plan), [recipes, plan])

  const categories = [...new Set([...SHOPPING_CATEGORY_ORDER, ...lines.map((line) => line.category)])]
  const visibleLines = hidePantry ? lines.filter((line) => !pantryKeys.includes(line.id)) : lines
  const checkedCount = lines.filter((line) => checkedKeys.includes(line.id)).length
  const pantryCount = lines.filter((line) => pantryKeys.includes(line.id)).length

  return (
    <div className="shopping page">
      <div className="page-heading">
        <div>
          <h1>Shopping list</h1>
          <p className="page-heading__subtitle">Generated automatically from recipes in your meal plan.</p>
        </div>
        <div className="shopping-actions">
          <label className="toggle-row toggle-row--compact">
            <span className="toggle"><span className="toggle__knob" /></span>
            <input type="checkbox" checked={hidePantry} onChange={(event) => onToggleHidePantry(event.target.checked)} />
            <span>Hide pantry items</span>
          </label>
          <button className="button button--ghost" type="button" onClick={onClearChecked} disabled={checkedCount === 0}>Clear checked</button>
        </div>
      </div>

      <div className="shopping-summary">
        <span>{visibleLines.length} items</span>
        <span>{checkedCount} checked</span>
        <span>{pantryCount} in pantry</span>
      </div>

      {lines.length === 0 ? (
        <div className="empty-state">
          <h2>Your list is empty</h2>
          <p>Add recipes to the weekly meal planner and their ingredients will appear here automatically.</p>
        </div>
      ) : (
        <div className="shopping-grid">
          {categories.map((category) => {
            const categoryLines = visibleLines.filter((line) => line.category === category)
            if (categoryLines.length === 0) return null
            const anyChecked = categoryLines.some((line) => checkedKeys.includes(line.id))
            return (
              <section className="shopping-category" key={category}>
                <h2>{category}</h2>
                <ul>
                  {categoryLines.map((line) => {
                    const checked = checkedKeys.includes(line.id)
                    const inPantry = pantryKeys.includes(line.id)
                    return (
                      <li key={line.id} className={`shopping-item ${checked ? 'shopping-item--checked' : ''}`}>
                        <label className="shopping-item__check">
                          <input type="checkbox" checked={checked} onChange={() => onToggleChecked(line.id)} />
                          <span className="custom-check" />
                        </label>
                        <div className="shopping-item__body">
                          <div className="shopping-item__name">
                            <span>{line.quantity && <strong>{line.quantity} </strong>}{line.unit && <span>{line.unit} </span>}{line.name}</span>
                            {line.optional && <span className="optional-badge">optional</span>}
                          </div>
                          <div className="shopping-item__sources">
                            {line.recipeIds.map((recipeId) => {
                              const recipe = recipes.find((item) => item.id === recipeId)
                              if (!recipe) return null
                              return (
                                <button type="button" key={recipeId} onClick={() => onOpenRecipe(recipe)}>
                                  {recipe.title}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`pantry-button ${inPantry ? 'pantry-button--active' : ''}`}
                          onClick={() => onTogglePantry(line.id)}
                          title={inPantry ? 'Remove from pantry' : 'Mark as already in pantry'}
                        >
                          {inPantry ? 'In pantry ✓' : 'In pantry'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {anyChecked && <p className="category-progress">Some items in this category are checked.</p>}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
