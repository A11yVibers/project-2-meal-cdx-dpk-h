import { APPROVED_IMAGES } from '../approved-images.js'
import { PLANNER_SLOTS } from '../lib/data.js'
import { formatWeekRange } from '../lib/dates.js'
import { planStats } from '../lib/shopping.js'
import { EmptyState, Pill } from './ui.jsx'
import Icon from './Icon.jsx'

const SLOT_ICONS = {
  Breakfast: 'coffee',
  Lunch: 'sun',
  Dinner: 'moon',
  Snack: 'sparkles',
}

const SLOT_ICON_PATHS = {
  coffee: (
    <>
      <path d="M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" />
      <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16M8 2c0 1-.5 2-.5 2M12 2c0 1-.5 2-.5 2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8Z" />,
  sparkles: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8ZM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9ZM5 4l.7 1.6L7 6.3l-1.3.7L5 8.6l-.7-1.6L3 6.3l1.3-.7Z" />,
}

function SlotIcon({ slot }) {
  return (
    <svg className="slot-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {SLOT_ICON_PATHS[SLOT_ICONS[slot]] || SLOT_ICON_PATHS.moon}
    </svg>
  )
}

export default function MealPlanner({
  days,
  weekOffset,
  mealPlan,
  recipes,
  onSelectSlot,
  onPreviousWeek,
  onNextWeek,
  onResetWeek,
  onCreateRecipe,
}) {
  const recipesById = new Map(recipes.map((recipe) => [recipe.id, recipe]))
  const stats = planStats(days, mealPlan)

  return (
    <div className="planner-page">
      <div className="planner-toolbar">
        <div>
          <h1>Weekly meal planner</h1>
          <p className="planner-week-range">{formatWeekRange(days)}</p>
        </div>
        <div className="planner-toolbar-actions">
          <button type="button" className="button button-ghost" onClick={onCreateRecipe}>
            <Icon name="plus" size={16} /> New recipe
          </button>
          <div className="week-nav">
            <button type="button" className="icon-button" onClick={onPreviousWeek} aria-label="Previous week">
              <Icon name="left" size={17} />
            </button>
            <button
              type="button"
              className="button button-ghost week-today"
              onClick={onResetWeek}
              disabled={weekOffset === 0}
            >
              This week
            </button>
            <button type="button" className="icon-button" onClick={onNextWeek} aria-label="Next week">
              <Icon name="right" size={17} />
            </button>
          </div>
        </div>
      </div>

      <div className="planner-summary">
        <div><strong>{stats.plannedSlots}</strong><span>planned slots</span></div>
        <div><strong>{stats.recipeCount}</strong><span>unique recipes</span></div>
        <div><strong>{stats.emptySlots}</strong><span>open slots</span></div>
        <Pill tone={weekOffset === 0 ? 'accent' : 'neutral'}>
          {weekOffset === 0 ? 'Current week' : weekOffset === 1 ? 'Next week' : `${weekOffset} weeks from now`}
        </Pill>
      </div>

      <div className="planner-grid">
        {days.map((day) => {
          const daySlots = mealPlan[day.key] || {}
          return (
            <section className={`day-column ${day.isToday ? 'is-today' : ''}`} key={day.key}>
              <header className="day-column-header">
                <span className="day-weekday">{day.weekday}</span>
                <span className="day-number">{day.date.getDate()}</span>
                <span className="day-month">{day.date.toLocaleDateString('en-US', { month: 'short' })}</span>
                {day.isToday ? <span className="today-badge">Today</span> : null}
              </header>

              <div className="day-slots">
                {PLANNER_SLOTS.map((slot) => {
                  const recipeId = daySlots[slot]
                  const recipe = recipeId ? recipesById.get(recipeId) : null

                  if (recipe) {
                    return (
                      <button
                        type="button"
                        key={slot}
                        className="slot-card slot-card-filled"
                        onClick={() => onSelectSlot(day.key, slot, recipeId)}
                      >
                        <span className="slot-label"><SlotIcon slot={slot} /> {slot}</span>
                        <span className="slot-recipe-title">{recipe.title}</span>
                        <span className="slot-recipe-meta">
                          {recipe.servings || '—'} servings
                          {recipe.options?.includeInShoppingList === false ? ' · not in list' : ''}
                        </span>
                        <span className="slot-edit-hint"><Icon name="menu" size={13} /> Replace / remove</span>
                      </button>
                    )
                  }

                  return (
                    <button
                      type="button"
                      key={slot}
                      className="slot-card slot-card-empty"
                      onClick={() => onSelectSlot(day.key, slot, null)}
                    >
                      <span className="slot-label"><SlotIcon slot={slot} /> {slot}</span>
                      <span className="slot-add"><Icon name="plus" size={15} /> Add recipe</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {stats.plannedSlots === 0 ? (
        <EmptyState
          icon="calendar"
          title="No meals planned for this week"
          action={<button type="button" className="button button-primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Choose a slot above</button>}
        />
      ) : null}
    </div>
  )
}
