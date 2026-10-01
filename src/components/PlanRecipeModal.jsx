import { useEffect, useState } from 'react'
import { PLANNER_SLOTS } from '../lib/data.js'
import { toDateKey } from '../lib/dates.js'
import Icon from './Icon.jsx'

function slotForRecipe(recipe) {
  const mealTypes = {
    MT01: 'Breakfast',
    MT02: 'Lunch',
    MT03: 'Dinner',
    MT04: 'Snack',
  }
  return mealTypes[recipe.mealTypeId] || 'Dinner'
}

export default function PlanRecipeModal({ open, recipe, onClose, onSave }) {
  const [dateKey, setDateKey] = useState(toDateKey(new Date()))
  const [time, setTime] = useState('18:00')
  const [slot, setSlot] = useState('Dinner')

  useEffect(() => {
    if (!open || !recipe) return
    setDateKey(toDateKey(new Date()))
    setSlot(slotForRecipe(recipe))
  }, [open, recipe])

  if (!open || !recipe) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal plan-recipe-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-recipe-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">Add to weekly plan</p>
            <h2 id="plan-recipe-title">{recipe.title}</h2>
          </div>
          <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="plan-modal-fields">
          <label className="field">
            <span>Date</span>
            <input type="date" value={dateKey} onChange={(event) => setDateKey(event.target.value)} />
          </label>
          <label className="field">
            <span>Meal slot</span>
            <select value={slot} onChange={(event) => setSlot(event.target.value)}>
              {PLANNER_SLOTS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Serving time</span>
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
        </div>

        <footer className="modal-footer">
          <span />
          <button type="button" className="button button-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="button button-primary" onClick={() => onSave(dateKey, slot, time)}>
            <Icon name="calendar" size={16} /> Add to plan
          </button>
        </footer>
      </div>
    </div>
  )
}
