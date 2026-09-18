import { useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import {
  MEAL_TYPES,
  dateKey,
  formatDateLabel,
  startOfWeek,
  weekDates,
  PLACEHOLDER_IMAGE
} from '../data.js'

const SLOTS = MEAL_TYPES.slice(0, 4)

function CompactRecipe({ recipe, timeLabel }) {
  return (
    <div className="planner-recipe">
      <img src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt="" />
      <div>
        <strong>{recipe.title}</strong>
        {timeLabel && <small>{timeLabel}</small>}
      </div>
    </div>
  )
}

export default function Planner({ recipes, mealPlan, onAssign, onRemove, onOpenRecipe }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [picker, setPicker] = useState(null)

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date())
    base.setDate(base.getDate() + weekOffset * 7)
    return base
  }, [weekOffset])

  const days = useMemo(() => weekDates(weekStart), [weekStart])

  const openPicker = (date, mealTypeId) => setPicker({ date: dateKey(date), mealTypeId, mealTypeName: SLOTS.find((item) => item.meal_type_id === mealTypeId)?.meal_type_name })
  const closePicker = () => setPicker(null)

  const assign = (recipe) => {
    if (!picker) return
    onAssign(picker.date, picker.mealTypeId, recipe.id, '')
    closePicker()
  }

  return (
    <div className="planner">
      <div className="planner-toolbar">
        <div>
          <h1>Weekly meal planner</h1>
          <p className="page-subtitle">Week of {formatDateLabel(days[0])} – {formatDateLabel(days[6])}</p>
        </div>
        <div className="planner-nav">
          <button className="secondary-button" type="button" onClick={() => setWeekOffset((value) => value - 1)}>← Previous</button>
          <button className="secondary-button" type="button" onClick={() => setWeekOffset(0)}>This week</button>
          <button className="secondary-button" type="button" onClick={() => setWeekOffset((value) => value + 1)}>Next →</button>
        </div>
      </div>

      <div className="planner-grid">
        {days.map((date) => {
          const key = dateKey(date)
          const todayKey = dateKey(new Date())
          return (
            <section className="planner-day" key={key}>
              <header className={`planner-day-header${key === todayKey ? ' today' : ''}`}>
                <strong>{date.toLocaleDateString([], { weekday: 'long' })}</strong>
                <span>{formatDateLabel(date)}</span>
              </header>
              <div className="planner-slots">
                {SLOTS.map((slot) => {
                  const assignment = mealPlan[key]?.[slot.meal_type_id]
                  const recipe = assignment ? recipes.find((item) => item.id === assignment.recipeId) : null
                  return (
                    <div className="planner-slot" key={slot.meal_type_id}>
                      <div className="slot-label">{slot.meal_type_name}</div>
                      {recipe ? (
                        <div className="slot-planned">
                          <CompactRecipe recipe={recipe} timeLabel={assignment.time} />
                          <div className="slot-actions">
                            <button type="button" onClick={() => onOpenRecipe(recipe.id)}>View</button>
                            <button type="button" onClick={() => openPicker(date, slot.meal_type_id)}>Replace</button>
                            <button type="button" className="danger-text" onClick={() => onRemove(key, slot.meal_type_id)}>Remove</button>
                          </div>
                        </div>
                      ) : (
                        <button className="slot-empty" type="button" onClick={() => openPicker(date, slot.meal_type_id)}>+ Add recipe</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {picker && (
        <Modal title={`Choose a recipe for ${picker.mealTypeName}`} onClose={closePicker} wide>
          <RecipePicker recipes={recipes} onChoose={assign} />
        </Modal>
      )}
    </div>
  )
}

function RecipePicker({ recipes, onChoose }) {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const filtered = recipes.filter((recipe) => {
    if (!normalized) return true
    return recipe.title.toLowerCase().includes(normalized)
      || (recipe.shortDescription || '').toLowerCase().includes(normalized)
  })

  return (
    <div className="recipe-picker">
      <input className="text-input search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes…" autoFocus />
      <div className="picker-list">
        {filtered.length ? filtered.map((recipe) => (
          <button className="picker-recipe" type="button" key={recipe.id} onClick={() => onChoose(recipe)}>
            <img src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt="" />
            <span>
              <strong>{recipe.title}</strong>
              <small>{recipe.shortDescription || `${recipe.servings} servings`}</small>
            </span>
            <span className="picker-add">Add</span>
          </button>
        )) : <p className="empty-state">No matching recipes.</p>}
      </div>
    </div>
  )
}
