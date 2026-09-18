import { useMemo, useState, useEffect } from 'react'
import {
  CUISINES,
  DIETARY_TAGS,
  INGREDIENTS,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  SEED_RECIPES,
  UNITS,
  defaultOptions,
  dateKey,
  findIngredient,
  lookupIngredientByName,
  makeKey,
  normalizeIngredient,
  parseDateKey,
  startOfWeek,
  weekDates,
  PLACEHOLDER_IMAGE,
  MEASURE_SYSTEMS,
  formatDateLong
} from '../data.js'

const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function makeIngredient() {
  return {
    key: makeKey('ing'),
    ingredientId: '',
    name: '',
    quantity: '',
    unit: '',
    optional: false
  }
}

function makeSection() {
  return {
    key: makeKey('section'),
    name: 'Main',
    ingredients: [makeIngredient()]
  }
}

function IngredientPicker({ value, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [focused, setFocused] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!focused) setQuery(value || '')
  }, [value, focused])

  const matches = useMemo(() => {
    const q = normalizeIngredient(query)
    if (!q) return INGREDIENTS.slice(0, 8)
    return INGREDIENTS
      .filter((item) => normalizeIngredient(item.ingredient_name).includes(q))
      .slice(0, 8)
  }, [query])

  const choose = (item) => {
    setSelected(item)
    setQuery(item.ingredient_name)
    setFocused(false)
    onSelect({
      ingredientId: item.ingredient_id,
      name: item.ingredient_name,
      shoppingCategory: item.shopping_category
    })
  }

  return (
    <div className="ingredient-picker">
      <input
        className="text-input"
        value={query}
        placeholder="Search or type ingredient"
        onChange={(event) => {
          setQuery(event.target.value)
          setFocused(true)
          onSelect({
            ingredientId: lookupIngredientByName(event.target.value)?.ingredient_id || '',
            name: event.target.value,
            shoppingCategory: lookupIngredientByName(event.target.value)?.shopping_category || ''
          })
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          window.setTimeout(() => setFocused(false), 120)
          if (!query.trim()) return
          const exact = lookupIngredientByName(query)
          onSelect({
            ingredientId: exact?.ingredient_id || '',
            name: exact?.ingredient_name || query,
            shoppingCategory: exact?.shopping_category || ''
          })
        }}
        list="ingredient-options"
      />
      <datalist id="ingredient-options">
        {matches.map((item) => <option key={item.ingredient_id} value={item.ingredient_name} />)}
      </datalist>
      {focused && matches.length > 0 && (
        <div className="ingredient-picker-menu">
          {matches.map((item) => (
            <button
              key={item.ingredient_id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(item)}
            >
              <strong>{item.ingredient_name}</strong>
              <span>{item.shopping_category}</span>
            </button>
          ))}
        </div>
      )}
      {selected && <small className="field-hint">{selected.shopping_category}</small>}
    </div>
  )
}

function ImagePicker({ value, onChange }) {
  const choices = useMemo(() => {
    const values = new Set([PLACEHOLDER_IMAGE])
    SEED_RECIPES.forEach((recipe) => {
      if (recipe.coverImageUrl) values.add(recipe.coverImageUrl)
    })
    return Array.from(values)
  }, [])

  return (
    <div className="image-picker">
      <div className="image-picker-preview">
        <img src={value || PLACEHOLDER_IMAGE} alt="Recipe cover preview" />
      </div>
      <div className="image-picker-actions">
        <select className="text-input" value={value || PLACEHOLDER_IMAGE} onChange={(event) => onChange(event.target.value)}>
          {choices.map((url) => (
            <option key={url} value={url}>{url === PLACEHOLDER_IMAGE ? 'Placeholder image' : 'Approved recipe photo'}</option>
          ))}
        </select>
      </div>
      <p className="field-hint">Choose a cover from the approved image set. If none is selected, the placeholder is used.</p>
    </div>
  )
}

function CheckChip({ checked, children, onToggle, tone = '' }) {
  return (
    <button
      type="button"
      className={`choice-chip${checked ? ' selected' : ''}${tone ? ` chip-${tone}` : ''}`}
      aria-pressed={checked}
      onClick={() => onToggle(!checked)}
    >
      <span className="chip-mark">{checked ? '✓' : '+'}</span>
      {children}
    </button>
  )
}

export default function RecipeForm({ onCancel, onSave }) {
  const currentWeekStart = startOfWeek(new Date())
  const currentWeekDates = weekDates(currentWeekStart)
  const currentDayIndex = Math.max(0, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(
    new Date().toLocaleDateString('en-US', { weekday: 'long' })
  ))

  const [form, setForm] = useState(() => ({
    title: '',
    sourceUrl: '',
    cuisineId: CUISINES[0]?.cuisine_id || '',
    mealTypeId: MEAL_TYPES[2]?.meal_type_id || '',
    dietaryTagIds: [],
    categoryIds: [],
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    spiceLevel: 2,
    coverImageUrl: PLACEHOLDER_IMAGE,
    includeInMealSuggestions: true,
    options: defaultOptions()
  }))

  const [sections, setSections] = useState([makeSection()])
  const [steps, setSteps] = useState([{ key: makeKey('step'), instruction: '', timerMinutes: '' }])
  const [addToMealPlan, setAddToMealPlan] = useState(false)
  const [planWeekOffset, setPlanWeekOffset] = useState(0)
  const [planDayIndex, setPlanDayIndex] = useState(currentDayIndex)
  const [planMealType, setPlanMealType] = useState(MEAL_TYPES[2]?.meal_type_id || '')
  const [useCustomDate, setUseCustomDate] = useState(false)
  const [customDate, setCustomDate] = useState(dateKey(currentWeekDates[currentDayIndex]))
  const [customTime, setCustomTime] = useState('18:00')
  const [errors, setErrors] = useState({})

  const totalTimeMinutes = (Number(form.prepTimeMinutes) || 0) + (Number(form.cookTimeMinutes) || 0)

  const update = (patch) => setForm((current) => ({ ...current, ...patch }))
  const updateOptions = (patch) => setForm((current) => ({ ...current, options: { ...current.options, ...patch } }))

  const updateSection = (sectionKey, patch) => {
    setSections((current) => current.map((section) => section.key === sectionKey ? { ...section, ...patch } : section))
  }

  const updateIngredient = (sectionKey, ingredientKey, patch) => {
    setSections((current) => current.map((section) => {
      if (section.key !== sectionKey) return section
      return {
        ...section,
        ingredients: section.ingredients.map((ingredient) => ingredient.key === ingredientKey ? { ...ingredient, ...patch } : ingredient)
      }
    }))
  }

  const addSection = () => setSections((current) => [...current, makeSection()])
  const removeSection = (sectionKey) => setSections((current) => current.length <= 1 ? current : current.filter((section) => section.key !== sectionKey))
  const moveSection = (index, delta) => {
    setSections((current) => {
      const next = [...current]
      const target = index + delta
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const addIngredient = (sectionKey) => {
    setSections((current) => current.map((section) => section.key === sectionKey
      ? { ...section, ingredients: [...section.ingredients, makeIngredient()] }
      : section))
  }

  const removeIngredient = (sectionKey, ingredientKey) => {
    setSections((current) => current.map((section) => {
      if (section.key !== sectionKey) return section
      const ingredients = section.ingredients.length <= 1 ? section.ingredients : section.ingredients.filter((ingredient) => ingredient.key !== ingredientKey)
      return { ...section, ingredients }
    }))
  }

  const moveIngredient = (sectionKey, index, delta) => {
    setSections((current) => current.map((section) => {
      if (section.key !== sectionKey) return section
      const ingredients = [...section.ingredients]
      const target = index + delta
      if (target < 0 || target >= ingredients.length) return section
      ;[ingredients[index], ingredients[target]] = [ingredients[target], ingredients[index]]
      return { ...section, ingredients }
    }))
  }

  const addStep = () => setSteps((current) => [...current, { key: makeKey('step'), instruction: '', timerMinutes: '' }])
  const removeStep = (key) => setSteps((current) => current.length <= 1 ? current : current.filter((step) => step.key !== key))
  const moveStep = (index, delta) => {
    setSteps((current) => {
      const next = [...current]
      const target = index + delta
      if (target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  useEffect(() => {
    const date = weekDates(new Date(startOfWeek(new Date()).getTime() + planWeekOffset * 7 * 86400000))[planDayIndex]
    setCustomDate(dateKey(date))
  }, [planWeekOffset, planDayIndex])

  const plannedDateKey = useCustomDate ? customDate : dateKey(weekDates(new Date(startOfWeek(new Date()).getTime() + planWeekOffset * 7 * 86400000))[planDayIndex])

  const toggleArrayValue = (array, value) => array.includes(value) ? array.filter((item) => item !== value) : [...array, value]

  const validate = () => {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Recipe title is required.'
    if (sections.length === 1 && sections[0].ingredients.length === 0) nextErrors.ingredients = 'Add at least one ingredient.'
    if (!steps.some((step) => step.instruction.trim())) nextErrors.steps = 'Add at least one method step.'
    const ingredients = sections.flatMap((section) => section.ingredients)
    if (ingredients.some((item) => !item.name.trim())) nextErrors.ingredientNames = 'Give every ingredient a name.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return

    const ingredientSections = sections.map((section) => ({
      name: section.name.trim() || 'Main',
      ingredients: section.ingredients
        .filter((ingredient) => ingredient.name.trim())
        .map((ingredient) => {
          const matched = lookupIngredientByName(ingredient.name)
          return {
            key: ingredient.key,
            ingredientId: matched?.ingredient_id || ingredient.ingredientId || '',
            name: matched?.ingredient_name || ingredient.name.trim(),
            shoppingCategory: matched?.shopping_category || findIngredient(ingredient.ingredientId)?.shopping_category || 'Other',
            quantity: ingredient.quantity.trim(),
            unit: ingredient.unit,
            optional: Boolean(ingredient.optional)
          }
        })
    })).filter((section) => section.ingredients.length > 0)

    const recipe = {
      id: makeKey('user'),
      title: form.title.trim(),
      shortDescription: '',
      sourceName: '',
      sourceUrl: form.sourceUrl.trim(),
      servings: Math.max(1, Number(form.servings) || 1),
      prepTimeMinutes: Math.max(0, Number(form.prepTimeMinutes) || 0),
      cookTimeMinutes: Math.max(0, Number(form.cookTimeMinutes) || 0),
      totalTimeMinutes: Math.max(0, totalTimeMinutes),
      cuisineId: form.cuisineId,
      mealTypeId: form.mealTypeId,
      dietaryTagIds: form.dietaryTagIds,
      categoryIds: form.categoryIds,
      difficulty: 0,
      spiceLevel: Math.min(5, Math.max(0, Number(form.spiceLevel) || 0)),
      accentColor: form.accentColor,
      coverImageUrl: form.coverImageUrl || PLACEHOLDER_IMAGE,
      includeInMealSuggestions: Boolean(form.includeInMealSuggestions),
      ingredientSections,
      steps: steps
        .map((step, index) => ({ ...step, number: index + 1 }))
        .filter((step) => step.instruction.trim()),
      isUser: true,
      options: form.options
    }

    const planAssignment = addToMealPlan ? {
      date: plannedDateKey,
      mealTypeId: planMealType,
      time: useCustomDate ? customTime : ''
    } : null

    onSave(recipe, planAssignment)
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <header className="form-header">
        <h1>New recipe</h1>
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
      </header>

      <fieldset className="form-section">
        <legend>Recipe details</legend>
        <div className="form-grid">
          <label className="field span-2">
            <span>Recipe title</span>
            <input className="text-input" value={form.title} onChange={(event) => update({ title: event.target.value })} placeholder="e.g. Lemon Herb Chicken" />
            {errors.title && <small className="error-text">{errors.title}</small>}
          </label>
          <label className="field span-2">
            <span>Source link</span>
            <input className="text-input" type="url" value={form.sourceUrl} onChange={(event) => update({ sourceUrl: event.target.value })} placeholder="https://example.com/recipe" />
          </label>
          <label className="field">
            <span>Cuisine</span>
            <select className="text-input" value={form.cuisineId} onChange={(event) => update({ cuisineId: event.target.value })}>
              {CUISINES.map((item) => <option key={item.cuisine_id} value={item.cuisine_id}>{item.cuisine_name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Primary meal type</span>
            <select className="text-input" value={form.mealTypeId} onChange={(event) => update({ mealTypeId: event.target.value })}>
              {MEAL_TYPES.map((item) => <option key={item.meal_type_id} value={item.meal_type_id}>{item.meal_type_name}</option>)}
            </select>
          </label>
        </div>

        <div className="form-subsection">
          <span className="form-label">Dietary suitability</span>
          <div className="chip-grid">
            {DIETARY_TAGS.map((item) => (
              <CheckChip key={item.dietary_tag_id} checked={form.dietaryTagIds.includes(item.dietary_tag_id)} onToggle={(checked) => update({ dietaryTagIds: toggleArrayValue(form.dietaryTagIds, item.dietary_tag_id) })}>
                {item.dietary_tag_name}
              </CheckChip>
            ))}
          </div>
        </div>

        <div className="form-subsection">
          <span className="form-label">Recipe categories</span>
          <div className="chip-grid">
            {RECIPE_CATEGORIES.map((item) => (
              <CheckChip key={item.category_id} checked={form.categoryIds.includes(item.category_id)} onToggle={(checked) => update({ categoryIds: toggleArrayValue(form.categoryIds, item.category_id) })}>
                {item.category_name}
              </CheckChip>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Timing and yield</legend>
        <div className="form-grid compact">
          <label className="field">
            <span>Servings</span>
            <input className="text-input" type="number" min="1" max="99" value={form.servings} onChange={(event) => update({ servings: event.target.value })} />
          </label>
          <label className="field">
            <span>Prep time (minutes)</span>
            <input className="text-input" type="number" min="0" value={form.prepTimeMinutes} onChange={(event) => update({ prepTimeMinutes: event.target.value })} />
          </label>
          <label className="field">
            <span>Cook time (minutes)</span>
            <input className="text-input" type="number" min="0" value={form.cookTimeMinutes} onChange={(event) => update({ cookTimeMinutes: event.target.value })} />
          </label>
          <label className="field">
            <span>Total time</span>
            <input className="text-input read-only" value={`${totalTimeMinutes} min`} readOnly />
          </label>
        </div>
        <label className="field spice-field">
          <span>Spice level: {['Mild', 'Mild', 'Medium', 'Medium hot', 'Hot', 'Very spicy'][Number(form.spiceLevel) || 0]}</span>
          <input type="range" min="0" max="5" step="1" value={form.spiceLevel} onChange={(event) => update({ spiceLevel: Number(event.target.value) })} />
          <span className="range-labels"><span>Mild</span><span>Very spicy</span></span>
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend>Image and appearance</legend>
        <div className="form-grid compact">
          <div className="field span-2">
            <span>Cover image</span>
            <ImagePicker value={form.coverImageUrl} onChange={(url) => update({ coverImageUrl: url })} />
          </div>
          <label className="field">
            <span>Recipe card accent color</span>
            <input className="color-input" type="color" value={form.accentColor || '#D9A441'} onChange={(event) => update({ accentColor: event.target.value })} />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Ingredients</legend>
        {errors.ingredientNames && <small className="error-text">{errors.ingredientNames}</small>}
        {sections.map((section, sectionIndex) => (
          <div className="ingredient-form-section" key={section.key}>
            <div className="section-heading-row">
              <label className="section-name-field">
                <span>Section name</span>
                <input className="text-input section-name-input" value={section.name} onChange={(event) => updateSection(section.key, { name: event.target.value })} />
              </label>
              <div className="section-row-actions">
                <button type="button" className="mini-button" disabled={sectionIndex === 0} onClick={() => moveSection(sectionIndex, -1)} title="Move section up">↑</button>
                <button type="button" className="mini-button" disabled={sectionIndex === sections.length - 1} onClick={() => moveSection(sectionIndex, 1)} title="Move section down">↓</button>
                <button type="button" className="mini-button danger" disabled={sections.length <= 1} onClick={() => removeSection(section.key)}>Remove section</button>
              </div>
            </div>
            <div className="ingredient-form-rows">
              {section.ingredients.map((ingredient, ingredientIndex) => (
                <div className="ingredient-form-row" key={ingredient.key}>
                  <div className="ingredient-name-cell">
                    <span className="cell-label">Ingredient</span>
                    <IngredientPicker
                      value={ingredient.name}
                      onSelect={(match) => updateIngredient(section.key, ingredient.key, {
                        ingredientId: match.ingredientId || '',
                        name: match.name,
                        shoppingCategory: match.shoppingCategory || ''
                      })}
                    />
                  </div>
                  <label className="ingredient-quantity-cell">
                    <span className="cell-label">Quantity</span>
                    <input className="text-input" value={ingredient.quantity} onChange={(event) => updateIngredient(section.key, ingredient.key, { quantity: event.target.value })} placeholder="1, 1.5, to taste" />
                  </label>
                  <label className="ingredient-unit-cell">
                    <span className="cell-label">Unit</span>
                    <select className="text-input" value={ingredient.unit} onChange={(event) => updateIngredient(section.key, ingredient.key, { unit: event.target.value })}>
                      <option value="">—</option>
                      {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </label>
                  <label className="ingredient-optional-cell">
                    <input type="checkbox" checked={ingredient.optional} onChange={(event) => updateIngredient(section.key, ingredient.key, { optional: event.target.checked })} />
                    <span>Optional</span>
                  </label>
                  <div className="ingredient-row-actions">
                    <button type="button" className="mini-button" disabled={ingredientIndex === 0} onClick={() => moveIngredient(section.key, ingredientIndex, -1)} title="Move ingredient up">↑</button>
                    <button type="button" className="mini-button" disabled={ingredientIndex === section.ingredients.length - 1} onClick={() => moveIngredient(section.key, ingredientIndex, 1)} title="Move ingredient down">↓</button>
                    <button type="button" className="mini-button danger" disabled={section.ingredients.length <= 1} onClick={() => removeIngredient(section.key, ingredient.key)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="text-button" onClick={() => addIngredient(section.key)}>+ Add another ingredient</button>
          </div>
        ))}
        <button type="button" className="secondary-button" onClick={addSection}>+ Add another ingredient section</button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Method</legend>
        {errors.steps && <small className="error-text">{errors.steps}</small>}
        <div className="method-form-rows">
          {steps.map((step, index) => (
            <div className="method-form-row" key={step.key}>
              <span className="step-number">{index + 1}</span>
              <label className="method-instruction-cell">
                <span className="cell-label">Instruction</span>
                <textarea className="text-input" rows="2" value={step.instruction} onChange={(event) => setSteps((current) => current.map((item) => item.key === step.key ? { ...item, instruction: event.target.value } : item))} placeholder="Describe this cooking step" />
              </label>
              <label className="method-timer-cell">
                <span className="cell-label">Timer / duration (min)</span>
                <input className="text-input" type="number" min="0" value={step.timerMinutes} onChange={(event) => setSteps((current) => current.map((item) => item.key === step.key ? { ...item, timerMinutes: event.target.value } : item))} placeholder="Optional" />
              </label>
              <div className="method-row-actions">
                <button type="button" className="mini-button" disabled={index === 0} onClick={() => moveStep(index, -1)} title="Move step up">↑</button>
                <button type="button" className="mini-button" disabled={index === steps.length - 1} onClick={() => moveStep(index, 1)} title="Move step down">↓</button>
                <button type="button" className="mini-button danger" disabled={steps.length <= 1} onClick={() => removeStep(step.key)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="text-button" onClick={addStep}>+ Add another step</button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Meal-planning options</legend>
        <label className="toggle-sentence">
          <input type="checkbox" checked={form.includeInMealSuggestions} onChange={(event) => update({ includeInMealSuggestions: event.target.checked })} />
          <span>Make this recipe available in meal-plan suggestions</span>
        </label>
        <label className="toggle-sentence">
          <input type="checkbox" checked={addToMealPlan} onChange={(event) => setAddToMealPlan(event.target.checked)} />
          <span>Immediately add this recipe to the meal plan</span>
        </label>
        {addToMealPlan && (
          <div className="planning-fields">
            <label className="field">
              <span>Meal-planning week</span>
              <select className="text-input" value={planWeekOffset} onChange={(event) => setPlanWeekOffset(Number(event.target.value))}>
                <option value="0">This week</option>
                <option value="1">Next week</option>
              </select>
            </label>
            <label className="field">
              <span>Planned cooking date</span>
              {useCustomDate ? (
                <input className="text-input" type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} />
              ) : (
                <select className="text-input" value={planDayIndex} onChange={(event) => setPlanDayIndex(Number(event.target.value))}>
                  {WEEKDAY_LABELS.map((label, index) => (
                    <option key={label} value={index}>{label} · {dateKey(weekDates(new Date(startOfWeek(new Date()).getTime() + planWeekOffset * 7 * 86400000))[index])}</option>
                  ))}
                </select>
              )}
            </label>
            <label className="field">
              <span>Planned serving time</span>
              <select className="text-input" value={planMealType} onChange={(event) => setPlanMealType(event.target.value)}>
                {MEAL_TYPES.slice(0, 4).map((item) => <option key={item.meal_type_id} value={item.meal_type_id}>{item.meal_type_name}</option>)}
              </select>
            </label>
            <label className="toggle-sentence">
              <input type="checkbox" checked={useCustomDate} onChange={(event) => setUseCustomDate(event.target.checked)} />
              <span>Choose a specific date and time</span>
            </label>
            {useCustomDate && (
              <label className="field">
                <span>Specific time</span>
                <input className="text-input" type="time" value={customTime} onChange={(event) => setCustomTime(event.target.value)} />
              </label>
            )}
            <p className="field-hint">Planned date: {useCustomDate ? formatDateLong(parseDateKey(customDate)) : formatDateLong(parseDateKey(plannedDateKey))}</p>
          </div>
        )}
      </fieldset>

      <fieldset className="form-section">
        <legend>Recipe options menu</legend>
        <div className="compact-options">
          <label className="toggle-row">
            <span>Include ingredients in generated shopping lists</span>
            <input type="checkbox" checked={form.options.includeInShoppingList} onChange={(event) => updateOptions({ includeInShoppingList: event.target.checked })} />
          </label>
          <label className="toggle-row">
            <span>Show nutrition information</span>
            <input type="checkbox" checked={form.options.showNutrition} onChange={(event) => updateOptions({ showNutrition: event.target.checked })} />
          </label>
          <label className="toggle-row">
            <span>Allow ingredient substitutions</span>
            <input type="checkbox" checked={form.options.allowSubstitutions} onChange={(event) => updateOptions({ allowSubstitutions: event.target.checked })} />
          </label>
          <fieldset className="measurement-fieldset">
            <legend>Measurements</legend>
            <label className={`radio-card${form.options.measurementSystem === 'US' ? ' selected' : ''}`}>
              <input type="radio" name="form-measurement" value="US" checked={form.options.measurementSystem === 'US'} onChange={() => updateOptions({ measurementSystem: 'US' })} />
              <span>{MEASURE_SYSTEMS.US}</span>
            </label>
            <label className={`radio-card${form.options.measurementSystem === 'METRIC' ? ' selected' : ''}`}>
              <input type="radio" name="form-measurement" value="METRIC" checked={form.options.measurementSystem === 'METRIC'} onChange={() => updateOptions({ measurementSystem: 'METRIC' })} />
              <span>{MEASURE_SYSTEMS.METRIC}</span>
            </label>
          </fieldset>
        </div>
      </fieldset>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" type="submit">Save recipe</button>
      </div>
    </form>
  )
}
