import { useState } from 'react'
import { MEAL_SLOTS, recipeMealSlot, toISODate } from '../utils.js'

const SLOT_DEFAULT_TIMES = {
  Breakfast: '08:00',
  Lunch: '12:30',
  Dinner: '18:00',
  Snack: '15:30',
}

export default function AddToPlanModal({ recipe, onClose, onConfirm }) {
  const [date, setDate] = useState(toISODate(new Date()))
  const [slot, setSlot] = useState(recipeMealSlot(recipe))
  const [time, setTime] = useState(SLOT_DEFAULT_TIMES[recipeMealSlot(recipe)] || '18:00')

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="modal modal--add-plan" role="dialog" aria-modal="true" aria-label="Add to meal plan">
        <div className="modal__header">
          <div>
            <span className="modal__eyebrow">Add to meal plan</span>
            <h2>{recipe.title}</h2>
          </div>
          <button className="modal__close" type="button" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="add-plan-fields">
          <label className="field">
            <span className="field__label">Meal slot</span>
            <select value={slot} onChange={(event) => { setSlot(event.target.value); setTime(SLOT_DEFAULT_TIMES[event.target.value] || time) }}>
              {MEAL_SLOTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Serving time</span>
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
        </div>
        <div className="modal__footer">
          <button className="button button--ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="button button--primary" type="button" onClick={() => onConfirm({ date, slot, time })}>Add to planner</button>
        </div>
      </div>
    </div>
  )
}
