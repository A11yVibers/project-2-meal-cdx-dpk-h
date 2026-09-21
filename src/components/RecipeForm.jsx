import { useState } from 'react'
import {
  CUISINES,
  CATEGORIES,
  DIETARY_TAGS,
  MEAL_TYPES,
  UNITS,
  INGREDIENTS,
  PLACEHOLDER_IMAGE,
  findIngredientByName,
  createEmptyRecipe,
} from '../data.js'
import { MEAL_SLOTS, recipeCover, recipeMealSlot, toISODate, fromISODate, addDays, startOfWeek } from '../utils.js'

const COLOR_PRESETS = ['#D97757', '#8A9A5B', '#5B7C8A', '#B56576', '#7C6AA8', '#C18A3C', '#4F7C59', '#363F46']

function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`toggle-row ${checked ? 'toggle-row--on' : ''}`}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle">
        <span className="toggle__knob" />
      </span>
      <span>{label}</span>
    </button>
  )
}

function MultiChoice({ options, selected, onChange }) {
  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]
    onChange(next)
  }
  return (
    <div className="choice-grid">
      {options.map((option) => {
        const active = selected.includes(option.id)
        return (
          <button
            key={option.id}
            type="button"
            className={`choice-chip ${active ? 'choice-chip--active' : ''}`}
            aria-pressed={active}
            onClick={() => toggle(option.id)}
          >
            {option.name}
          </button>
        )
      })}
    </div>
  )
}

function defaultPlanDate() {
  return toISODate(new Date())
}

export default function RecipeForm({ initialRecipe, onSave, onCancel }) {
  const [recipe, setRecipe] = useState(() => initialRecipe || createEmptyRecipe())
  const [planNow, setPlanNow] = useState(false)
  const [planSlot, setPlanSlot] = useState(recipeMealSlot(initialRecipe || createEmptyRecipe()))
  const [planWeek, setPlanWeek] = useState('this')
  const [planDate, setPlanDate] = useState(defaultPlanDate)
  const [planTime, setPlanTime] = useState('18:00')
  const [errors, setErrors] = useState({})

  const update = (patch) => setRecipe((current) => ({ ...current, ...patch }))

  const updateIngredient = (id, patch) => {
    setRecipe((current) => ({
      ...current,
      ingredients: current.ingredients.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  const updateStep = (id, patch) => {
    setRecipe((current) => ({
      ...current,
      steps: current.steps.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  const handleIngredientName = (id, value) => {
    const match = findIngredientByName(value)
    updateIngredient(id, {
      name: value,
      ingredientId: match?.id || null,
    })
  }

  const addIngredient = () => {
    const last = recipe.ingredients[recipe.ingredients.length - 1]
    setRecipe((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        {
          id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          section: last?.section || 'Main',
          ingredientId: null,
          name: '',
          quantity: '1',
          unit: 'cup',
          notes: '',
          optional: false,
        },
      ],
    }))
  }

  const addIngredientSection = () => {
    setRecipe((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        {
          id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          section: '',
          ingredientId: null,
          name: '',
          quantity: '1',
          unit: 'cup',
          notes: '',
          optional: false,
        },
      ],
    }))
  }

  const moveIngredient = (index, direction) => {
    setRecipe((current) => {
      const next = [...current.ingredients]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return { ...current, ingredients: next }
    })
  }

  const removeIngredient = (id) => {
    setRecipe((current) => ({
      ...current,
      ingredients: current.ingredients.filter((item) => item.id !== id),
    }))
  }

  const addStep = () => {
    setRecipe((current) => ({
      ...current,
      steps: [...current.steps, { id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, instruction: '', timerMinutes: 0 }],
    }))
  }

  const moveStep = (index, direction) => {
    setRecipe((current) => {
      const next = [...current.steps]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return { ...current, steps: next }
    })
  }

  const removeStep = (id) => {
    setRecipe((current) => ({
      ...current,
      steps: current.steps.filter((item) => item.id !== id),
    }))
  }

  const resolvePlanDate = () => {
    if (planWeek === 'specific') return planDate || defaultPlanDate()
    const today = new Date()
    const start = startOfWeek(today)
    return toISODate(planWeek === 'this' ? start : addDays(start, 7))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!recipe.title.trim()) nextErrors.title = 'Add a recipe title.'
    if (!recipe.ingredients.some((item) => item.name.trim())) nextErrors.ingredients = 'Add at least one ingredient.'
    if (!recipe.steps.some((step) => step.instruction.trim())) nextErrors.steps = 'Add at least one method step.'
    if (planNow && !resolvePlanDate()) nextErrors.planDate = 'Choose a planning date.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const cleaned = {
      ...recipe,
      title: recipe.title.trim(),
      shortDescription: recipe.shortDescription.trim(),
      sourceName: recipe.sourceName.trim(),
      sourceUrl: recipe.sourceUrl.trim(),
      servings: Number(recipe.servings) || 1,
      prepTimeMinutes: Number(recipe.prepTimeMinutes) || 0,
      cookTimeMinutes: Number(recipe.cookTimeMinutes) || 0,
      totalTimeMinutes: (Number(recipe.prepTimeMinutes) || 0) + (Number(recipe.cookTimeMinutes) || 0),
      dietaryTagIds: recipe.dietaryTagIds,
      categoryIds: recipe.categoryIds,
      ingredients: recipe.ingredients
        .map((item) => {
          const match = findIngredientByName(item.name)
          return {
            ...item,
            name: match?.name || item.name.trim(),
            ingredientId: match?.id || item.ingredientId || null,
            section: item.section.trim() || 'Ingredients',
            quantity: item.quantity || '',
            unit: item.unit || '',
          }
        })
        .filter((item) => item.name.trim()),
      steps: recipe.steps
        .map((step) => ({
          ...step,
          instruction: step.instruction.trim(),
          timerMinutes: Number(step.timerMinutes) || 0,
        }))
        .filter((step) => step.instruction.trim()),
    }

    onSave({
      recipe: cleaned,
      plan: planNow
        ? { date: resolvePlanDate(), slot: planSlot, time: planTime, week: planWeek }
        : null,
    })
  }

  return (
    <form className="recipe-form page" onSubmit={handleSubmit}>
      <div className="form-header">
        <div>
          <button className="back-button" type="button" onClick={onCancel}>← Cancel</button>
          <h1>{initialRecipe ? 'Edit recipe' : 'New recipe'}</h1>
        </div>
        <button className="button button--primary" type="submit">{initialRecipe ? 'Save changes' : 'Create recipe'}</button>
      </div>

      <div className="form-layout">
        <div className="form-main">
          <section className="form-section">
            <div className="form-section__heading"><span>1</span><h2>Recipe details</h2></div>
            <div className="field-grid">
              <Field label="Recipe title" className="field--full">
                <input value={recipe.title} onChange={(event) => update({ title: event.target.value })} placeholder="e.g. Lemon Herb Chicken" />
                {errors.title && <span className="field__error">{errors.title}</span>}
              </Field>
              <Field label="Short description" className="field--full">
                <textarea rows="3" value={recipe.shortDescription} onChange={(event) => update({ shortDescription: event.target.value })} placeholder="A quick one-line summary shown on recipe cards." />
              </Field>
              <Field label="Source link">
                <input type="url" value={recipe.sourceUrl} onChange={(event) => update({ sourceUrl: event.target.value })} placeholder="https://example.com/recipe" />
              </Field>
              <Field label="Source name">
                <input value={recipe.sourceName} onChange={(event) => update({ sourceName: event.target.value })} placeholder="e.g. Family cookbook" />
              </Field>
              <Field label="Cuisine">
                <select value={recipe.cuisineId} onChange={(event) => update({ cuisineId: event.target.value })}>
                  {CUISINES.map((cuisine) => <option key={cuisine.id} value={cuisine.id}>{cuisine.name}</option>)}
                </select>
              </Field>
              <Field label="Primary meal type">
                <select value={recipe.mealTypeId} onChange={(event) => update({ mealTypeId: event.target.value })}>
                  {MEAL_TYPES.map((meal) => <option key={meal.id} value={meal.id}>{meal.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="choice-block">
              <h3>Dietary suitability</h3>
              <MultiChoice options={DIETARY_TAGS} selected={recipe.dietaryTagIds} onChange={(value) => update({ dietaryTagIds: value })} />
            </div>
            <div className="choice-block">
              <h3>Recipe categories</h3>
              <MultiChoice options={CATEGORIES} selected={recipe.categoryIds} onChange={(value) => update({ categoryIds: value })} />
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__heading"><span>2</span><h2>Timing and yield</h2></div>
            <div className="field-grid field-grid--timing">
              <Field label="Servings">
                <div className="stepper">
                  <button type="button" onClick={() => update({ servings: Math.max(1, (Number(recipe.servings) || 1) - 1) })}>−</button>
                  <input inputMode="numeric" value={recipe.servings} onChange={(event) => update({ servings: event.target.value })} />
                  <button type="button" onClick={() => update({ servings: (Number(recipe.servings) || 0) + 1 })}>+</button>
                </div>
              </Field>
              <Field label="Prep time (minutes)">
                <input type="number" min="0" value={recipe.prepTimeMinutes} onChange={(event) => update({ prepTimeMinutes: event.target.value })} />
              </Field>
              <Field label="Cook time (minutes)">
                <input type="number" min="0" value={recipe.cookTimeMinutes} onChange={(event) => update({ cookTimeMinutes: event.target.value })} />
              </Field>
              <Field label="Total time (auto)">
                <input type="text" disabled value={`${(Number(recipe.prepTimeMinutes) || 0) + (Number(recipe.cookTimeMinutes) || 0)} min`} />
              </Field>
            </div>
            <Field label={`Spice level: ${recipe.spiceLevel} / 5`} className="spice-control">
              <input type="range" min="0" max="5" step="1" value={recipe.spiceLevel} onChange={(event) => update({ spiceLevel: Number(event.target.value) })} />
              <div className="range-labels"><span>Mild</span><span>Very spicy</span></div>
            </Field>
          </section>

          <section className="form-section">
            <div className="form-section__heading"><span>3</span><h2>Image and appearance</h2></div>
            <div className="appearance-grid">
              <div className="cover-preview">
                <img src={recipeCover(recipe, PLACEHOLDER_IMAGE)} alt="Recipe preview" />
              </div>
              <div>
                <Field label="Cover image URL" hint="Use a remote image URL. File uploads are disabled to keep project assets immutable.">
                  <input type="url" value={recipe.coverImageUrl} onChange={(event) => update({ coverImageUrl: event.target.value })} placeholder="https://example.com/image.jpg" />
                </Field>
                <Field label="Card accent color">
                  <div className="color-row">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-swatch ${recipe.accentColor.toLowerCase() === color.toLowerCase() ? 'color-swatch--active' : ''}`}
                        style={{ background: color }}
                        aria-label={color}
                        onClick={() => update({ accentColor: color })}
                      />
                    ))}
                    <input type="color" value={recipe.accentColor} onChange={(event) => update({ accentColor: event.target.value })} aria-label="Custom color" />
                  </div>
                </Field>
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__heading"><span>4</span><h2>Ingredients</h2></div>
            {errors.ingredients && <p className="field__error">{errors.ingredients}</p>}
            <div className="ingredient-editor">
              {recipe.ingredients.map((item, index) => (
                <div className="ingredient-editor__row" key={item.id}>
                  <div className="ingredient-editor__grip">
                    <span className="drag-dot">⋮⋮</span>
                  </div>
                  <div className="ingredient-editor__fields">
                    <Field label="Section" className="ingredient-editor__section">
                      <input value={item.section} onChange={(event) => updateIngredient(item.id, { section: event.target.value })} placeholder="Main" />
                    </Field>
                    <Field label="Ingredient" className="ingredient-editor__name">
                      <input list="ingredient-options" value={item.name} onChange={(event) => handleIngredientName(item.id, event.target.value)} placeholder="Search ingredients…" />
                    </Field>
                    <Field label="Quantity" className="ingredient-editor__quantity">
                      <input inputMode="decimal" value={item.quantity} onChange={(event) => updateIngredient(item.id, { quantity: event.target.value })} placeholder="1" />
                    </Field>
                    <Field label="Unit" className="ingredient-editor__unit">
                      <select value={item.unit} onChange={(event) => updateIngredient(item.id, { unit: event.target.value })}>
                        <option value="">—</option>
                        {UNITS.map((unit) => <option key={unit.id} value={unit.name}>{unit.name}</option>)}
                      </select>
                    </Field>
                    <label className="checkbox-inline ingredient-editor__optional">
                      <input type="checkbox" checked={item.optional} onChange={(event) => updateIngredient(item.id, { optional: event.target.checked })} />
                      Optional
                    </label>
                    <div className="row-actions">
                      <button type="button" title="Move up" disabled={index === 0} onClick={() => moveIngredient(index, -1)}>↑</button>
                      <button type="button" title="Move down" disabled={index === recipe.ingredients.length - 1} onClick={() => moveIngredient(index, 1)}>↓</button>
                      <button type="button" title="Remove ingredient" className="row-actions__remove" onClick={() => removeIngredient(item.id)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
              <datalist id="ingredient-options">
                {INGREDIENTS.map((ingredient) => <option key={ingredient.id} value={ingredient.name}>{ingredient.category}</option>)}
              </datalist>
              <div className="editor-controls">
                <button type="button" className="button button--ghost" onClick={addIngredient}>+ Add ingredient</button>
                <button type="button" className="button button--ghost" onClick={addIngredientSection}>+ Add ingredient section</button>
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__heading"><span>5</span><h2>Method</h2></div>
            {errors.steps && <p className="field__error">{errors.steps}</p>}
            <div className="step-editor">
              {recipe.steps.map((step, index) => (
                <div className="step-editor__row" key={step.id}>
                  <div className="step-editor__number">{index + 1}</div>
                  <div className="step-editor__fields">
                    <Field label="Instruction" className="step-editor__text">
                      <textarea rows="2" value={step.instruction} onChange={(event) => updateStep(step.id, { instruction: event.target.value })} placeholder="Describe this step…" />
                    </Field>
                    <Field label="Timer (minutes)" className="step-editor__timer">
                      <input type="number" min="0" value={step.timerMinutes} onChange={(event) => updateStep(step.id, { timerMinutes: event.target.value })} />
                    </Field>
                    <div className="row-actions">
                      <button type="button" title="Move up" disabled={index === 0} onClick={() => moveStep(index, -1)}>↑</button>
                      <button type="button" title="Move down" disabled={index === recipe.steps.length - 1} onClick={() => moveStep(index, 1)}>↓</button>
                      <button type="button" title="Remove step" className="row-actions__remove" onClick={() => removeStep(step.id)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="button button--ghost" onClick={addStep}>+ Add step</button>
            </div>
          </section>
        </div>

        <aside className="form-side">
          <section className="form-section form-section--side">
            <div className="form-section__heading"><span>6</span><h2>Meal planning</h2></div>
            <Toggle checked={recipe.includeInMealSuggestions} onChange={(value) => update({ includeInMealSuggestions: value })} label="Available in meal suggestions" />
            <Toggle checked={planNow} onChange={setPlanNow} label="Add to meal plan after saving" />

            {planNow && (
              <div className="plan-fields">
                <Field label="Meal slot">
                  <select value={planSlot} onChange={(event) => setPlanSlot(event.target.value)}>
                    {MEAL_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </Field>
                <Field label="Planning week">
                  <select value={planWeek} onChange={(event) => setPlanWeek(event.target.value)}>
                    <option value="this">This week</option>
                    <option value="next">Next week</option>
                    <option value="specific">Specific date</option>
                  </select>
                </Field>
                <Field label="Planned cooking date" hint="Shown for Specific date mode; otherwise the selected week is used.">
                  <input type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)} />
                </Field>
                <Field label="Planned serving time">
                  <input type="time" value={planTime} onChange={(event) => setPlanTime(event.target.value)} />
                </Field>
              </div>
            )}
          </section>

          <section className="form-section form-section--side recipe-options-menu">
            <div className="form-section__heading"><span>7</span><h2>Recipe options</h2></div>
            <Toggle checked={recipe.includeInShoppingList} onChange={(value) => update({ includeInShoppingList: value })} label="Include in shopping lists" />
            <Toggle checked={recipe.showNutrition} onChange={(value) => update({ showNutrition: value })} label="Show nutrition information" />
            <Toggle checked={recipe.allowSubstitutions} onChange={(value) => update({ allowSubstitutions: value })} label="Allow ingredient substitutions" />
            <div className="measurement-choice">
              <span className="field__label">Measurement system</span>
              <div className="segmented-control">
                <button type="button" className={recipe.measurementSystem === 'us' ? 'segmented-control__button segmented-control__button--active' : 'segmented-control__button'} onClick={() => update({ measurementSystem: 'us' })}>US customary</button>
                <button type="button" className={recipe.measurementSystem === 'metric' ? 'segmented-control__button segmented-control__button--active' : 'segmented-control__button'} onClick={() => update({ measurementSystem: 'metric' })}>Metric</button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  )
}
