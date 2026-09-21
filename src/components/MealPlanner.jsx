import { useMemo, useState } from 'react'
import { PLACEHOLDER_IMAGE } from '../data.js'
import { MEAL_SLOTS, WEEKDAY_ORDER, weekDates, addDays, toISODate, formatLongDate, formatWeekRange, recipeCover } from '../utils.js'

const SLOT_DEFAULT_TIMES = {
  Breakfast: '08:00',
  Lunch: '12:30',
  Dinner: '18:00',
  Snack: '15:30',
}

function RecipePickerModal({ recipes, initialRecipeId, initialTime, onClose, onConfirm }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(initialRecipeId || '')
  const [time, setTime] = useState(initialTime || '')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const sorted = [...recipes].sort((a, b) => {
      const aSuggest = a.includeInMealSuggestions ? 0 : 1
      const bSuggest = b.includeInMealSuggestions ? 0 : 1
      if (aSuggest !== bSuggest) return aSuggest - bSuggest
      return a.title.localeCompare(b.title)
    })
    if (!term) return sorted
    return sorted.filter((recipe) => {
      return recipe.title.toLowerCase().includes(term) || (recipe.shortDescription || '').toLowerCase().includes(term)
    })
  }, [recipes, query])

  const selected = recipes.find((recipe) => recipe.id === selectedId)

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="modal modal--picker" role="dialog" aria-modal="true" aria-label="Choose a recipe">
        <div className="modal__header">
          <div>
            <span className="modal__eyebrow">Choose a recipe</span>
            <h2>Add to this meal slot</h2>
          </div>
          <button className="modal__close" type="button" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <label className="picker-search">
          <span className="sr-only">Search recipes</span>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes…" />
        </label>
        <div className="picker-list">
          {filtered.length === 0 && <p className="muted">No recipes match your search.</p>}
          {filtered.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              className={`picker-item ${selectedId === recipe.id ? 'picker-item--selected' : ''}`}
              onClick={() => setSelectedId(recipe.id)}
            >
              <img src={recipeCover(recipe, PLACEHOLDER_IMAGE)} alt="" />
              <span>
                <strong>{recipe.title}</strong>
                <small>{recipe.totalTimeMinutes} min · {recipe.servings} servings{recipe.includeInMealSuggestions ? ' · suggested' : ''}</small>
              </span>
              {selectedId === recipe.id && <b className="picker-item__check">✓</b>}
            </button>
          ))}
        </div>
        <div className="modal__footer">
          <label className="picker-time">
            <span>Serving time</span>
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
          <button className="button button--primary" type="button" disabled={!selected} onClick={() => onConfirm(selected.id, time)}>
            Add to planner
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MealPlanner({ recipes, plan, onAssign, onRemove, onOpenRecipe }) {
  const [anchor, setAnchor] = useState(() => new Date())
  const [picker, setPicker] = useState(null)
  const dates = weekDates(anchor)

  const openPicker = (date, slot, assigned) => {
    setPicker({
      date: toISODate(date),
      slot,
      initialRecipeId: assigned?.recipeId || '',
      initialTime: assigned?.time || SLOT_DEFAULT_TIMES[slot],
    })
  }

  const confirmPicker = (recipeId, time) => {
    if (!picker) return
    onAssign(picker.date, picker.slot, recipeId, time)
    setPicker(null)
  }

  return (
    <div className="planner page">
      <div className="page-heading">
        <div>
          <h1>Weekly meal planner</h1>
          <p className="page-heading__subtitle">{formatWeekRange(anchor)}</p>
        </div>
        <div className="week-nav">
          <button className="button button--ghost" type="button" onClick={() => setAnchor((current) => addDays(current, -7))}>← Previous</button>
          <button className="button button--ghost" type="button" onClick={() => setAnchor(new Date())}>This week</button>
          <button className="button button--ghost" type="button" onClick={() => setAnchor((current) => addDays(current, 7))}>Next →</button>
        </div>
      </div>

      <div className="planner-scroll">
        <div className="planner-board">
        <div className="planner-board__corner">Meal</div>
        {dates.map((date, index) => (
          <div className={`planner-board__day ${date.toDateString() === new Date().toDateString() ? 'planner-board__day--today' : ''}`} key={index}>
            <strong>{WEEKDAY_ORDER[index]}</strong>
            <span>{formatLongDate(date)}</span>
          </div>
        ))}

        {MEAL_SLOTS.map((slot) => (
          <div className="planner-board__row" key={slot}>
            <div className="planner-board__slot-label">{slot}</div>
            {dates.map((date) => {
              const dateKey = toISODate(date)
              const assigned = plan[dateKey]?.[slot]
              const recipe = assigned ? recipes.find((item) => item.id === assigned.recipeId) : null
              return (
                <div className="planner-cell" key={dateKey}>
                  {recipe ? (
                    <div className="planned-recipe" style={{ '--planned-accent': recipe.accentColor || '#D97757' }}>
                      <button className="planned-recipe__main" type="button" onClick={() => onOpenRecipe(recipe)}>
                        <img src={recipeCover(recipe, PLACEHOLDER_IMAGE)} alt="" />
                        <span className="planned-recipe__info">
                          <strong>{recipe.title}</strong>
                          {assigned.time && <small>⏱ {assigned.time}</small>}
                        </span>
                      </button>
                      <div className="planned-recipe__actions">
                        <button type="button" onClick={() => openPicker(date, slot, assigned)}>Replace</button>
                        <button type="button" className="planned-recipe__remove" onClick={() => onRemove(dateKey, slot)}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button className="empty-slot" type="button" onClick={() => openPicker(date, slot, null)}>
                      <span className="empty-slot__plus">+</span>
                      <span>Add recipe</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        </div>
      </div>

      <p className="planner-note">Assignments are saved in your browser and feed the shopping list automatically.</p>

      {picker && (
        <RecipePickerModal
          recipes={recipes}
          initialRecipeId={picker.initialRecipeId}
          initialTime={picker.initialTime}
          onClose={() => setPicker(null)}
          onConfirm={confirmPicker}
        />
      )}
    </div>
  )
}
