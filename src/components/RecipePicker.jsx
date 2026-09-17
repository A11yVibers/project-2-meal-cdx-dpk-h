import { useMemo, useState } from 'react'
import { PLACEHOLDER_IMAGE, getMealTypeName, formatMinutes } from '../data.js'

export default function RecipePicker({ recipes, onClose, onSelect, slotLabel }) {
  const [query, setQuery] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [plannedTime, setPlannedTime] = useState('18:00')

  const filteredRecipes = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return recipes
    return recipes.filter((recipe) =>
      [recipe.title, recipe.shortDescription].join(' ').toLowerCase().includes(normalized),
    )
  }, [query, recipes])

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId)

  function handleAssign() {
    if (!selectedRecipe) return
    onSelect(selectedRecipe.id, plannedTime)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal recipe-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a recipe"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Recipe picker</p>
            <h2>Choose a recipe{slotLabel ? ` for ${slotLabel}` : ''}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        <div className="picker-toolbar">
          <label className="search-field">
            <span>Search recipes</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or description"
              autoFocus
            />
          </label>
          <label className="picker-time">
            <span>Planned time</span>
            <input type="time" value={plannedTime} onChange={(event) => setPlannedTime(event.target.value)} />
          </label>
        </div>

        <div className="picker-list">
          {filteredRecipes.length ? (
            filteredRecipes.map((recipe) => (
              <button
                className={selectedRecipeId === recipe.id ? 'picker-recipe selected' : 'picker-recipe'}
                type="button"
                key={recipe.id}
                onClick={() => setSelectedRecipeId(recipe.id)}
              >
                <img
                  src={recipe.coverImageUrl || PLACEHOLDER_IMAGE}
                  alt=""
                  onError={(event) => {
                    if (event.currentTarget.src !== PLACEHOLDER_IMAGE) event.currentTarget.src = PLACEHOLDER_IMAGE
                  }}
                />
                <span className="picker-recipe__info">
                  <strong>{recipe.title}</strong>
                  <small>
                    {getMealTypeName(recipe.mealTypeId)} · {recipe.servings} servings · {formatMinutes(recipe.totalTimeMinutes)}
                  </small>
                </span>
                <span className="picker-recipe__check">{selectedRecipeId === recipe.id ? '✓' : ''}</span>
              </button>
            ))
          ) : (
            <div className="empty-state compact">
              <p>No recipes match this search.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="button" disabled={!selectedRecipe} onClick={handleAssign}>
            Assign recipe
          </button>
        </div>
      </div>
    </div>
  )
}
