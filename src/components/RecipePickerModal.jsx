import { useEffect, useMemo, useRef, useState } from 'react'
import { APPROVED_IMAGES } from '../approved-images.js'
import { cuisineName, mealTypeName, minuteLabel } from '../lib/lookups.js'
import Icon from './Icon.jsx'

function RecipePickerResult({ recipe, onClick, selected }) {
  return (
    <button
      type="button"
      className={`picker-recipe-row ${selected ? 'is-selected' : ''}`}
      onClick={() => onClick(recipe.id)}
    >
      <img
        src={recipe.coverImageUrl || APPROVED_IMAGES.placeholder}
        alt=""
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = APPROVED_IMAGES.placeholder
        }}
      />
      <span className="picker-recipe-copy">
        <strong>{recipe.title}</strong>
        <small>{cuisineName(recipe.cuisineId)} · {mealTypeName(recipe.mealTypeId)} · {minuteLabel(recipe.totalTimeMinutes)}</small>
      </span>
      {selected ? <Icon name="check" size={18} /> : <Icon name="right" size={17} />}
    </button>
  )
}

export default function RecipePickerModal({
  open,
  onClose,
  recipes,
  currentRecipeId,
  dateLabel,
  slot,
  mealPlan,
  onAssign,
  onRemove,
}) {
  const [query, setQuery] = useState('')
  const [suggestionsOnly, setSuggestionsOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(currentRecipeId)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSuggestionsOnly(false)
    setSelectedId(currentRecipeId)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open, currentRecipeId])

  if (!open) return null

  const filtered = recipes.filter((recipe) => {
    if (suggestionsOnly && recipe.includeInMealSuggestions === false) return false
    if (!query.trim()) return true
    const haystack = `${recipe.title} ${recipe.shortDescription} ${cuisineName(recipe.cuisineId)} ${mealTypeName(recipe.mealTypeId)}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const currentRecipe = recipes.find((recipe) => recipe.id === currentRecipeId)

  function handleAssign() {
    if (selectedId) onAssign(selectedId)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal recipe-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">{dateLabel} · {slot}</p>
            <h2 id="picker-title">{currentRecipeId ? 'Replace this recipe' : 'Choose a recipe'}</h2>
          </div>
          <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </header>

        {currentRecipe ? (
          <div className="picker-current">
            <img
              src={currentRecipe.coverImageUrl || APPROVED_IMAGES.placeholder}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = APPROVED_IMAGES.placeholder
              }}
            />
            <div>
              <span>Currently planned</span>
              <strong>{currentRecipe.title}</strong>
            </div>
            <button type="button" className="button button-danger" onClick={onRemove}>
              <Icon name="x" size={15} /> Remove
            </button>
          </div>
        ) : null}

        <div className="picker-controls">
          <label className="search-field">
            <Icon name="search" size={17} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search recipes"
            />
          </label>
          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={suggestionsOnly}
              onChange={(event) => setSuggestionsOnly(event.target.checked)}
            />
            <span>Suggestions only</span>
          </label>
        </div>

        <div className="picker-results">
          {filtered.length ? (
            filtered.map((recipe) => (
              <RecipePickerResult
                key={recipe.id}
                recipe={recipe}
                selected={recipe.id === selectedId}
                onClick={setSelectedId}
              />
            ))
          ) : (
            <p className="picker-empty">No recipes match this search.</p>
          )}
        </div>

        <footer className="modal-footer">
          {filtered.length ? <span>{filtered.length} recipe{filtered.length === 1 ? '' : 's'}</span> : <span />}
          <button type="button" className="button button-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="button button-primary" onClick={handleAssign} disabled={!selectedId}>
            <Icon name="check" size={16} /> {currentRecipeId ? 'Replace in plan' : 'Add to plan'}
          </button>
        </footer>
      </div>
    </div>
  )
}
