import { useEffect, useMemo, useState } from 'react'
import {
  APPROVED_COVER_OPTIONS,
  CUISINES,
  DIETARY_TAGS,
  INGREDIENTS,
  MEAL_TYPES,
  PLANNER_MEAL_TYPES,
  RECIPE_CATEGORIES,
  UNITS,
  createEmptyRecipe,
} from '../data.js'
import { getWeekDays } from '../dates.js'

let tempId = 0
function nextTempId(prefix) {
  tempId += 1
  return `${prefix}-${Date.now()}-${tempId}`
}

function createIngredient() {
  return {
    id: nextTempId('ingredient'),
    name: '',
    quantity: '',
    unit: '',
    notes: '',
    optional: false,
  }
}

function createSection(name = 'Main') {
  return { id: nextTempId('section'), name, ingredients: [createIngredient()] }
}

function createStep() {
  return { id: nextTempId('step'), instruction: '', timerMinutes: '' }
}

function SpiceControl({ value, onChange }) {
  const labels = ['Mild', 'Mild-medium', 'Medium', 'Spicy', 'Very spicy']
  return (
    <div className="range-control">
      <div className="range-control__top">
        <span className="field-label">Spice level</span>
        <strong>{labels[value] || 'Mild'}</strong>
      </div>
      <input
        type="range"
        min="0"
        max="4"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="range-control__marks" aria-hidden="true">
        <span>Mild</span>
        <span>Very spicy</span>
      </div>
    </div>
  )
}

function ToggleRow({ checked, onChange, label, description }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="toggle-ui" aria-hidden="true" />
    </label>
  )
}

function ChoicePill({ active, children, onClick }) {
  return (
    <button className={active ? 'choice-pill active' : 'choice-pill'} type="button" onClick={onClick}>
      {children}
    </button>
  )
}

export default function RecipeForm({ onSubmit, onCancel }) {
  const initialWeek = 0
  const initialWeekDays = getWeekDays(initialWeek)
  const [recipe, setRecipe] = useState(() => ({
    ...createEmptyRecipe(),
    ingredients: [createSection()],
    steps: [createStep()],
  }))
  const [mealPlanWeekOffset, setMealPlanWeekOffset] = useState(initialWeek)
  const [plannedDateKey, setPlannedDateKey] = useState(initialWeekDays[0].dateKey)
  const [plannedMealTypeId, setPlannedMealTypeId] = useState(PLANNER_MEAL_TYPES[0].meal_type_id)
  const [plannedTime, setPlannedTime] = useState('18:00')
  const [addToMealPlan, setAddToMealPlan] = useState(false)
  const [formError, setFormError] = useState('')

  const weekDays = getWeekDays(mealPlanWeekOffset)
  const totalTime = (Number(recipe.prepTimeMinutes) || 0) + (Number(recipe.cookTimeMinutes) || 0)
  const ingredientSuggestions = useMemo(() => INGREDIENTS.map((item) => item.ingredient_name), [])

  useEffect(() => {
    setPlannedDateKey(getWeekDays(mealPlanWeekOffset)[0].dateKey)
  }, [mealPlanWeekOffset])

  function updateRecipe(patch) {
    setRecipe((current) => ({ ...current, ...patch }))
  }

  function toggleArrayValue(field, value) {
    setRecipe((current) => {
      const values = current[field] || []
      const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
      return { ...current, [field]: next }
    })
  }

  function updateSection(sectionId, patch) {
    setRecipe((current) => ({
      ...current,
      ingredients: current.ingredients.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    }))
  }

  function updateIngredient(sectionId, ingredientId, patch) {
    setRecipe((current) => ({
      ...current,
      ingredients: current.ingredients.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              ingredients: section.ingredients.map((ingredient) =>
                ingredient.id === ingredientId ? { ...ingredient, ...patch } : ingredient,
              ),
            }
          : section,
      ),
    }))
  }

  function moveIngredient(sectionId, ingredientId, direction) {
    setRecipe((current) => ({
      ...current,
      ingredients: current.ingredients.map((section) => {
        if (section.id !== sectionId) return section
        const index = section.ingredients.findIndex((ingredient) => ingredient.id === ingredientId)
        const targetIndex = index + direction
        if (index < 0 || targetIndex < 0 || targetIndex >= section.ingredients.length) return section
        const ingredients = [...section.ingredients]
        const [moved] = ingredients.splice(index, 1)
        ingredients.splice(targetIndex, 0, moved)
        return { ...section, ingredients }
      }),
    }))
  }

  function updateStep(stepId, patch) {
    setRecipe((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    }))
  }

  function moveStep(stepId, direction) {
    setRecipe((current) => {
      const index = current.steps.findIndex((step) => step.id === stepId)
      const targetIndex = index + direction
      if (index < 0 || targetIndex < 0 || targetIndex >= current.steps.length) return current
      const steps = [...current.steps]
      const [moved] = steps.splice(index, 1)
      steps.splice(targetIndex, 0, moved)
      return { ...current, steps }
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const title = recipe.title.trim()
    if (!title) {
      setFormError('Recipe title is required.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const newRecipe = {
      ...createEmptyRecipe(),
      id: `user-${Date.now()}`,
      title,
      shortDescription: recipe.shortDescription.trim(),
      sourceName: recipe.sourceName.trim(),
      sourceUrl: recipe.sourceUrl.trim(),
      servings: Math.max(1, Number(recipe.servings) || 1),
      prepTimeMinutes: Math.max(0, Number(recipe.prepTimeMinutes) || 0),
      cookTimeMinutes: Math.max(0, Number(recipe.cookTimeMinutes) || 0),
      totalTimeMinutes,
      cuisineId: recipe.cuisineId,
      mealTypeId: recipe.mealTypeId,
      dietaryTagIds: recipe.dietaryTagIds,
      categoryIds: recipe.categoryIds,
      difficulty: Math.max(1, Math.min(5, Number(recipe.difficulty) || 2)),
      spiceLevel: Math.max(0, Math.min(4, Number(recipe.spiceLevel) || 0)),
      accentColor: recipe.accentColor || '#7A9E7E',
      coverImageUrl: recipe.coverImageUrl.trim(),
      includeInMealSuggestions: recipe.includeInMealSuggestions,
      includeInShoppingList: recipe.includeInShoppingList,
      showNutrition: recipe.showNutrition,
      allowSubstitutions: recipe.allowSubstitutions,
      measurementSystem: recipe.measurementSystem,
      ingredients: recipe.ingredients
        .map((section) => ({
          id: section.id,
          name: section.name.trim() || 'Main',
          ingredients: section.ingredients
            .filter((ingredient) => ingredient.name.trim())
            .map((ingredient) => ({
              id: ingredient.id,
              name: ingredient.name.trim(),
              quantity: ingredient.quantity.trim(),
              unit: ingredient.unit,
              notes: ingredient.notes.trim(),
              optional: ingredient.optional,
            })),
        }))
        .filter((section) => section.ingredients.length > 0),
      steps: recipe.steps
        .filter((step) => step.instruction.trim())
        .map((step) => ({
          id: step.id,
          instruction: step.instruction.trim(),
          timerMinutes: Math.max(0, Number(step.timerMinutes) || 0),
        })),
    }

    onSubmit(newRecipe, {
      addToMealPlan,
      weekOffset: Number(mealPlanWeekOffset),
      plannedDateKey,
      plannedMealTypeId,
      plannedTime,
    })
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <button className="back-button" type="button" onClick={onCancel}>
          ← Cancel
        </button>
        <div>
          <p className="eyebrow">New recipe</p>
          <h1>Add a Recipe</h1>
          <p>Use the seed lookup data for ingredients, units, cuisines, and categories.</p>
        </div>
      </div>

      {formError ? <div className="form-error">{formError}</div> : null}

      <section className="form-section">
        <h2>Recipe details</h2>
        <div className="form-grid">
          <label className="field span-2">
            <span className="field-label">Recipe title *</span>
            <input
              type="text"
              value={recipe.title}
              onChange={(event) => updateRecipe({ title: event.target.value })}
              placeholder="e.g. Lemon Herb Chicken Bowls"
            />
          </label>
          <label className="field span-2">
            <span className="field-label">Source link</span>
            <input
              type="url"
              value={recipe.sourceUrl}
              onChange={(event) => updateRecipe({ sourceUrl: event.target.value })}
              placeholder="https://example.com/recipe"
            />
          </label>
          <label className="field">
            <span className="field-label">Source name</span>
            <input
              type="text"
              value={recipe.sourceName}
              onChange={(event) => updateRecipe({ sourceName: event.target.value })}
              placeholder="e.g. Family cookbook"
            />
          </label>
          <label className="field">
            <span className="field-label">Cuisine</span>
            <select
              value={recipe.cuisineId}
              onChange={(event) => updateRecipe({ cuisineId: event.target.value })}
            >
              <option value="">Select cuisine</option>
              {CUISINES.map((cuisine) => (
                <option key={cuisine.cuisine_id} value={cuisine.cuisine_id}>
                  {cuisine.cuisine_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Primary meal type</span>
            <select
              value={recipe.mealTypeId}
              onChange={(event) => updateRecipe({ mealTypeId: event.target.value })}
            >
              <option value="">Select meal type</option>
              {MEAL_TYPES.map((type) => (
                <option key={type.meal_type_id} value={type.meal_type_id}>
                  {type.meal_type_name}
                </option>
              ))}
            </select>
          </label>
          <div className="field span-2">
            <span className="field-label">Dietary suitability</span>
            <div className="checkbox-grid">
              {DIETARY_TAGS.map((tag) => (
                <label className="check-card" key={tag.dietary_tag_id}>
                  <input
                    type="checkbox"
                    checked={recipe.dietaryTagIds.includes(tag.dietary_tag_id)}
                    onChange={() => toggleArrayValue('dietaryTagIds', tag.dietary_tag_id)}
                  />
                  <span>{tag.dietary_tag_name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="field span-2">
            <span className="field-label">Recipe categories</span>
            <div className="checkbox-grid">
              {RECIPE_CATEGORIES.map((category) => (
                <label className="check-card" key={category.category_id}>
                  <input
                    type="checkbox"
                    checked={recipe.categoryIds.includes(category.category_id)}
                    onChange={() => toggleArrayValue('categoryIds', category.category_id)}
                  />
                  <span>{category.category_name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Timing and yield</h2>
        <div className="form-grid form-grid--numbers">
          <label className="field">
            <span className="field-label">Servings</span>
            <div className="number-stepper">
              <button type="button" onClick={() => updateRecipe({ servings: Math.max(1, recipe.servings - 1) })}>−</button>
              <input
                type="number"
                min="1"
                value={recipe.servings}
                onChange={(event) => updateRecipe({ servings: Number(event.target.value) })}
              />
              <button type="button" onClick={() => updateRecipe({ servings: recipe.servings + 1 })}>+</button>
            </div>
          </label>
          <label className="field">
            <span className="field-label">Prep time (minutes)</span>
            <input
              type="number"
              min="0"
              value={recipe.prepTimeMinutes}
              onChange={(event) => updateRecipe({ prepTimeMinutes: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span className="field-label">Cook time (minutes)</span>
            <input
              type="number"
              min="0"
              value={recipe.cookTimeMinutes}
              onChange={(event) => updateRecipe({ cookTimeMinutes: Number(event.target.value) })}
            />
          </label>
          <div className="field">
            <span className="field-label">Total time</span>
            <input type="text" value={`${totalTime} min`} readOnly />
          </div>
          <div className="field span-2">
            <SpiceControl
              value={recipe.spiceLevel}
              onChange={(value) => updateRecipe({ spiceLevel: value })}
            />
          </div>
          <label className="field span-2">
            <span className="field-label">Difficulty (1–5)</span>
            <input
              type="range"
              min="1"
              max="5"
              value={recipe.difficulty}
              onChange={(event) => updateRecipe({ difficulty: Number(event.target.value) })}
            />
            <small>{recipe.difficulty} / 5</small>
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Image and appearance</h2>
        <div className="form-grid">
          <div className="field span-2">
            <span className="field-label">Cover image</span>
            <div className="approved-image-grid">
              {APPROVED_COVER_OPTIONS.map((option) => (
                <button
                  className={recipe.coverImageUrl === option.value ? 'image-choice active' : 'image-choice'}
                  type="button"
                  key={option.value}
                  onClick={() => updateRecipe({ coverImageUrl: option.value })}
                >
                  <img src={option.value} alt="" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <small>Choose from approved project image URLs. File uploads and external image URLs are disabled by the project image policy.</small>
          </div>
          <label className="field">
            <span className="field-label">Recipe card accent color</span>
            <div className="color-control">
              <input
                type="color"
                value={recipe.accentColor}
                onChange={(event) => updateRecipe({ accentColor: event.target.value })}
              />
              <input
                type="text"
                value={recipe.accentColor}
                onChange={(event) => updateRecipe({ accentColor: event.target.value })}
              />
            </div>
          </label>
        </div>
      </section>

      <section className="form-section">
        <h2>Ingredients</h2>
        <p className="section-help">Group ingredients into sections such as Main, Sauce, or Garnish.</p>
        {recipe.ingredients.map((section, sectionIndex) => (
          <div className="ingredient-builder-section" key={section.id}>
            <div className="ingredient-section-header">
              <label className="field section-name-field">
                <span className="field-label">Section name</span>
                <input
                  type="text"
                  value={section.name}
                  onChange={(event) => updateSection(section.id, { name: event.target.value })}
                />
              </label>
              {recipe.ingredients.length > 1 && (
                <button
                  className="icon-button danger"
                  type="button"
                  title="Remove section"
                  onClick={() =>
                    setRecipe((current) => ({
                      ...current,
                      ingredients: current.ingredients.filter((item) => item.id !== section.id),
                    }))
                  }
                >
                  Remove section
                </button>
              )}
            </div>
            <datalist id="ingredient-suggestions">
              {ingredientSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <div className="ingredient-list">
              {section.ingredients.map((ingredient, ingredientIndex) => (
                <div className="ingredient-row" key={ingredient.id}>
                  <div className="ingredient-row__main">
                    <label className="field ingredient-name-field">
                      <span className="field-label">Ingredient</span>
                      <input
                        type="text"
                        list="ingredient-suggestions"
                        value={ingredient.name}
                        onChange={(event) => updateIngredient(section.id, ingredient.id, { name: event.target.value })}
                        placeholder="Search or type ingredient"
                      />
                    </label>
                    <label className="field quantity-field">
                      <span className="field-label">Quantity</span>
                      <input
                        type="text"
                        value={ingredient.quantity}
                        onChange={(event) => updateIngredient(section.id, ingredient.id, { quantity: event.target.value })}
                        placeholder="1.5"
                      />
                    </label>
                    <label className="field unit-field">
                      <span className="field-label">Unit</span>
                      <select
                        value={ingredient.unit}
                        onChange={(event) => updateIngredient(section.id, ingredient.id, { unit: event.target.value })}
                      >
                        <option value="">Unit</option>
                        {UNITS.map((unit) => (
                          <option key={unit.unit_id} value={unit.unit_name}>
                            {unit.unit_name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field notes-field">
                      <span className="field-label">Notes</span>
                      <input
                        type="text"
                        value={ingredient.notes}
                        onChange={(event) => updateIngredient(section.id, ingredient.id, { notes: event.target.value })}
                        placeholder="chopped, divided, etc."
                      />
                    </label>
                  </div>
                  <div className="ingredient-row__controls">
                    <label className="check-card compact">
                      <input
                        type="checkbox"
                        checked={ingredient.optional}
                        onChange={(event) =>
                          updateIngredient(section.id, ingredient.id, { optional: event.target.checked })
                        }
                      />
                      <span>Optional</span>
                    </label>
                    <div className="reorder-buttons">
                      <button
                        type="button"
                        className="icon-button"
                        disabled={ingredientIndex === 0}
                        onClick={() => moveIngredient(section.id, ingredient.id, -1)}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        disabled={ingredientIndex === section.ingredients.length - 1}
                        onClick={() => moveIngredient(section.id, ingredient.id, 1)}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() =>
                        updateSection(section.id, {
                          ingredients: section.ingredients.filter((item) => item.id !== ingredient.id),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="secondary-button small"
              type="button"
              onClick={() =>
                updateSection(section.id, { ingredients: [...section.ingredients, createIngredient()] })
              }
            >
              + Add ingredient
            </button>
          </div>
        ))}
        <button
          className="secondary-button"
          type="button"
          onClick={() =>
            setRecipe((current) => ({
              ...current,
              ingredients: [...current.ingredients, createSection('Section')],
            }))
          }
        >
          + Add ingredient section
        </button>
      </section>

      <section className="form-section">
        <h2>Method</h2>
        <div className="steps-builder">
          {recipe.steps.map((step, index) => (
            <div className="step-builder-row" key={step.id}>
              <span className="step-builder-number">{index + 1}</span>
              <label className="field step-instruction-field">
                <span className="field-label">Instruction</span>
                <textarea
                  rows="2"
                  value={step.instruction}
                  onChange={(event) => updateStep(step.id, { instruction: event.target.value })}
                  placeholder="Describe this cooking step"
                />
              </label>
              <label className="field timer-field">
                <span className="field-label">Timer (min)</span>
                <input
                  type="number"
                  min="0"
                  value={step.timerMinutes}
                  onChange={(event) => updateStep(step.id, { timerMinutes: event.target.value })}
                  placeholder="0"
                />
              </label>
              <div className="reorder-buttons">
                <button
                  type="button"
                  className="icon-button"
                  disabled={index === 0}
                  onClick={() => moveStep(step.id, -1)}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-button"
                  disabled={index === recipe.steps.length - 1}
                  onClick={() => moveStep(step.id, 1)}
                  title="Move down"
                >
                  ↓
                </button>
              </div>
              <button
                className="icon-button danger"
                type="button"
                onClick={() =>
                  setRecipe((current) => ({
                    ...current,
                    steps: current.steps.filter((item) => item.id !== step.id),
                  }))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => setRecipe((current) => ({ ...current, steps: [...current.steps, createStep()] }))}
        >
          + Add step
        </button>
      </section>

      <section className="form-section">
        <h2>Meal-planning options</h2>
        <div className="form-grid">
          <div className="field span-2">
            <ToggleRow
              checked={recipe.includeInMealSuggestions}
              onChange={(value) => updateRecipe({ includeInMealSuggestions: value })}
              label="Make available in meal-plan suggestions"
              description="This recipe will appear when you assign meals in the weekly planner."
            />
          </div>
          <div className="field span-2">
            <ToggleRow
              checked={addToMealPlan}
              onChange={setAddToMealPlan}
              label="Immediately add to the meal plan"
              description="Place this recipe into the selected week, date, and serving time."
            />
          </div>
          {addToMealPlan && (
            <div className="planning-options form-grid span-2">
              <label className="field">
                <span className="field-label">Meal-planning week</span>
                <select
                  value={mealPlanWeekOffset}
                  onChange={(event) => setMealPlanWeekOffset(Number(event.target.value))}
                >
                  <option value={-2}>2 weeks ago</option>
                  <option value={-1}>Last week</option>
                  <option value={0}>This week</option>
                  <option value={1}>Next week</option>
                  <option value={2}>In 2 weeks</option>
                </select>
              </label>
              <label className="field">
                <span className="field-label">Planned cooking date</span>
                <select value={plannedDateKey} onChange={(event) => setPlannedDateKey(event.target.value)}>
                  {weekDays.map((day) => (
                    <option key={day.dateKey} value={day.dateKey}>
                      {day.label} · {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Planned serving time</span>
                <select
                  value={plannedMealTypeId}
                  onChange={(event) => setPlannedMealTypeId(event.target.value)}
                >
                  {PLANNER_MEAL_TYPES.map((type) => (
                    <option key={type.meal_type_id} value={type.meal_type_id}>
                      {type.meal_type_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Specific time</span>
                <input type="time" value={plannedTime} onChange={(event) => setPlannedTime(event.target.value)} />
              </label>
            </div>
          )}
        </div>
      </section>

      <section className="form-section">
        <h2>Recipe options menu</h2>
        <div className="option-menu">
          <ToggleRow
            checked={recipe.includeInShoppingList}
            onChange={(value) => updateRecipe({ includeInShoppingList: value })}
            label="Include ingredients in generated shopping lists"
          />
          <ToggleRow
            checked={recipe.showNutrition}
            onChange={(value) => updateRecipe({ showNutrition: value })}
            label="Show nutrition information"
          />
          <ToggleRow
            checked={recipe.allowSubstitutions}
            onChange={(value) => updateRecipe({ allowSubstitutions: value })}
            label="Allow ingredient substitutions"
          />
          <div className="measurement-choice">
            <span>
              <strong>Measurement system</strong>
              <small>These choices are mutually exclusive.</small>
            </span>
            <div className="choice-group">
              <ChoicePill
                active={recipe.measurementSystem === 'us'}
                onClick={() => updateRecipe({ measurementSystem: 'us' })}
              >
                US customary
              </ChoicePill>
              <ChoicePill
                active={recipe.measurementSystem === 'metric'}
                onClick={() => updateRecipe({ measurementSystem: 'metric' })}
              >
                Metric
              </ChoicePill>
            </div>
          </div>
        </div>
      </section>

      <div className="form-footer">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-button" type="submit">
          Save recipe
        </button>
      </div>
    </form>
  )
}
