import { PLANNER_MEAL_TYPES, PLACEHOLDER_IMAGE, formatMinutes } from '../data.js'
import { getCurrentWeekLabel, getWeekDays, toDateKey } from '../dates.js'

function SlotRecipeImage({ recipe }) {
  return (
    <img
      src={recipe.coverImageUrl || PLACEHOLDER_IMAGE}
      alt=""
      onError={(event) => {
        if (event.currentTarget.src !== PLACEHOLDER_IMAGE) event.currentTarget.src = PLACEHOLDER_IMAGE
      }}
    />
  )
}

function PlannedSlot({ slot, recipe, onOpen, onReplace, onRemove }) {
  if (!recipe) {
    return (
      <button className="planner-slot empty" type="button" onClick={() => slot.onSelect()}>
        <span className="plus">+</span>
        <span>Add recipe</span>
      </button>
    )
  }

  return (
    <div className="planner-slot filled">
      <div className="planner-slot__top">
        <SlotRecipeImage recipe={recipe} />
        <div>
          <button className="planner-recipe-title" type="button" onClick={onOpen}>
            {recipe.title}
          </button>
          <small>
            {recipe.servings} servings · {formatMinutes(recipe.totalTimeMinutes)}
          </small>
          {slot.plannedTime ? <small>⏱ {slot.plannedTime}</small> : null}
        </div>
      </div>
      <div className="planner-slot__actions">
        <button type="button" onClick={onOpen}>View</button>
        <button type="button" onClick={onReplace}>Replace</button>
        <button type="button" onClick={onRemove}>Remove</button>
      </div>
    </div>
  )
}

export default function WeeklyPlanner({ weekOffset, onWeekOffsetChange, plan, recipesById, onSelectSlot, onOpenRecipe, onRemoveSlot, onReplaceSlot }) {
  const weekDays = getWeekDays(weekOffset)

  return (
    <section className="planner">
      <div className="section-heading planner-heading">
        <div>
          <p className="eyebrow">Seven-day schedule</p>
          <h2>Weekly Meal Planner</h2>
          <p>Assign recipes to breakfast, lunch, dinner, and snack slots.</p>
        </div>
        <div className="week-nav">
          <button className="secondary-button" type="button" onClick={() => onWeekOffsetChange(weekOffset - 1)}>
            ← Previous
          </button>
          <div className="week-nav__label">
            <strong>{getCurrentWeekLabel(weekOffset)}</strong>
            {weekOffset === 0 ? <span>Current week</span> : <span>Offset week</span>}
          </div>
          <button className="secondary-button" type="button" onClick={() => onWeekOffsetChange(weekOffset + 1)}>
            Next →
          </button>
        </div>
      </div>

      <div className="planner-calendar">
        <div className="planner-row planner-row--header">
          <div className="planner-row__label">Meal</div>
          {weekDays.map((day) => (
            <div className={day.dateKey === toDateKey(new Date()) ? 'planner-day is-today' : 'planner-day'} key={day.dateKey}>
              <strong>{day.label}</strong>
              <span>{day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          ))}
        </div>
        {PLANNER_MEAL_TYPES.map((mealType) => (
          <div className="planner-row" key={mealType.meal_type_id}>
            <div className="planner-row__label">{mealType.meal_type_name}</div>
            {weekDays.map((day) => {
              const key = `${day.dateKey}::${mealType.meal_type_id}`
              const slot = plan[key] || {}
              const recipe = recipesById[slot.recipeId]
              return (
                <div className="planner-cell" key={day.dateKey}>
                  <PlannedSlot
                    slot={{
                      plannedTime: slot.plannedTime || '',
                      onSelect: () => onSelectSlot(day.dateKey, mealType.meal_type_id, false),
                    }}
                    recipe={recipe}
                    onOpen={() => onOpenRecipe(slot.recipeId)}
                    onReplace={() => onReplaceSlot(day.dateKey, mealType.meal_type_id)}
                    onRemove={() => onRemoveSlot(day.dateKey, mealType.meal_type_id)}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
