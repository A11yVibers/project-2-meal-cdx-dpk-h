import { useEffect, useMemo, useRef, useState } from 'react'
import { APPROVED_IMAGES } from '../approved-images.js'
import { INGREDIENTS, LOOKUPS, PLANNER_SLOTS, formatDecimal } from '../lib/data.js'
import { getWeekDays, toDateKey } from '../lib/dates.js'
import { SectionCard, Pill, IconButton } from './ui.jsx'
import Icon from './Icon.jsx'

const DEFAULT_PALETTE = ['#D97757', '#8A9A5B', '#C17767', '#5B7B8A', '#7B6A8A', '#B87333', '#3F6C6F', '#8C5A75']
const SPICE_MARKS = ['Mild', '', '', '', '', 'Very spicy']

let ingredientUid = 0
let stepUid = 0

function newIngredient(sectionName = 'Main') {
  return {
    uid: `ing-${Date.now()}-${ingredientUid += 1}`,
    sectionName,
    ingredientName: '',
    quantity: '',
    unit: '',
    optional: false,
  }
}

function newStep() {
  return {
    uid: `step-${Date.now()}-${stepUid += 1}`,
    instruction: '',
    timerMinutes: '',
  }
}

function getTodayKey() {
  return toDateKey(new Date())
}

function slotForMealType(mealTypeId) {
  const mealType = LOOKUPS.mealTypes.find((entry) => entry.id === mealTypeId)
  return PLANNER_SLOTS.includes(mealType?.name) ? mealType.name : 'Dinner'
}

function ToggleOption({ checked, onChange, label, description, icon }) {
  return (
    <button
      type="button"
      className={`toggle-option ${checked ? 'is-selected' : ''}`}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-check">{checked ? <Icon name="check" size={14} /> : null}</span>
      <span className="toggle-copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
    </button>
  )
}

function SegmentedOption({ value, checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`segmented-option ${checked ? 'is-selected' : ''}`}
      aria-pressed={checked}
      onClick={() => onChange(value)}
    >
      {label}
    </button>
  )
}

export default function RecipeForm({ onCancel, onSave }) {
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [cuisineId, setCuisineId] = useState('')
  const [mealTypeId, setMealTypeId] = useState('')
  const [dietaryTagIds, setDietaryTagIds] = useState([])
  const [categoryIds, setCategoryIds] = useState([])

  const [servings, setServings] = useState(2)
  const [prepTime, setPrepTime] = useState(10)
  const [cookTime, setCookTime] = useState(20)
  const [spiceLevel, setSpiceLevel] = useState(1)

  const [accentColor, setAccentColor] = useState(DEFAULT_PALETTE[0])
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [imageError, setImageError] = useState('')
  const imageInputRef = useRef(null)

  const [ingredients, setIngredients] = useState([newIngredient()])
  const [newSectionName, setNewSectionName] = useState('')
  const [steps, setSteps] = useState([newStep()])

  const [includeSuggestions, setIncludeSuggestions] = useState(true)
  const [addToPlanNow, setAddToPlanNow] = useState(false)
  const [planningWeekOffset, setPlanningWeekOffset] = useState(0)
  const [plannedDate, setPlannedDate] = useState(getTodayKey())
  const [plannedTime, setPlannedTime] = useState('18:00')
  const [plannedSlot, setPlannedSlot] = useState('Dinner')

  const [includeShoppingList, setIncludeShoppingList] = useState(true)
  const [showNutrition, setShowNutrition] = useState(true)
  const [allowSubstitutions, setAllowSubstitutions] = useState(false)
  const [measurementSystem, setMeasurementSystem] = useState('us')

  const [formError, setFormError] = useState('')

  const totalTime = useMemo(
    () => Math.max(0, (Number(prepTime) || 0) + (Number(cookTime) || 0)),
    [prepTime, cookTime],
  )

  useEffect(() => {
    if (mealTypeId) setPlannedSlot(slotForMealType(mealTypeId))
  }, [mealTypeId])

  function toggleArrayId(setter, id, checked) {
    setter((current) =>
      checked ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    setImageError('')
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setImageError('Choose an image file.')
      event.target.value = ''
      return
    }

    if (file.size > 3.5 * 1024 * 1024) {
      setImageError('Use an image smaller than 3.5 MB so it can be stored in this browser.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => setCoverImageUrl(reader.result)
    reader.onerror = () => setImageError('That image could not be read.')
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function updateIngredient(index, patch) {
    setIngredients((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    )
  }

  function addIngredient(sectionName) {
    setIngredients((current) => [...current, newIngredient(sectionName)])
  }

  function removeIngredient(index) {
    if (ingredients.length === 1) {
      updateIngredient(0, { ingredientName: '', quantity: '', unit: '' })
      return
    }
    setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function moveIngredient(index, direction) {
    const target = index + direction
    setIngredients((current) => {
      if (target < 0 || target >= current.length) return current
      const copy = [...current]
      const moving = copy[index]
      copy[index] = copy[target]
      copy[target] = moving
      return copy
    })
  }

  function addIngredientSection() {
    const sectionName = newSectionName.trim() || 'New section'
    addIngredient(sectionName)
    setNewSectionName('')
  }

  function updateStep(index, patch) {
    setSteps((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    )
  }

  function addStep() {
    setSteps((current) => [...current, newStep()])
  }

  function removeStep(index) {
    if (steps.length === 1) {
      updateStep(0, { instruction: '', timerMinutes: '' })
      return
    }
    setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function moveStep(index, direction) {
    const target = index + direction
    setSteps((current) => {
      if (target < 0 || target >= current.length) return current
      const copy = [...current]
      const moving = copy[index]
      copy[index] = copy[target]
      copy[target] = moving
      return copy
    })
  }

  function submit(event) {
    event.preventDefault()
    const cleanedIngredients = ingredients
      .filter((item) => item.ingredientName.trim())
      .map((item) => {
        const name = item.ingredientName.trim()
        const catalogMatch = INGREDIENTS.find(
          (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
        )
        return {
          sectionName: item.sectionName.trim() || 'Main',
          ingredientId: catalogMatch ? catalogMatch.id : null,
          ingredientName: name,
          quantity: item.quantity === '' ? 0 : Number.parseFloat(item.quantity) || 0,
          quantityText: item.quantity,
          unit: item.unit.trim(),
          notes: '',
          optional: Boolean(item.optional),
        }
      })

    const cleanedSteps = steps
      .filter((item) => item.instruction.trim())
      .map((item) => ({
        instruction: item.instruction.trim(),
        timerMinutes: Number(item.timerMinutes) || 0,
      }))

    if (!title.trim()) return setFormError('Add a recipe title.')
    if (!cuisineId) return setFormError('Choose a cuisine.')
    if (!mealTypeId) return setFormError('Choose a primary meal type.')
    if (!cleanedIngredients.length) return setFormError('Add at least one ingredient.')
    if (!cleanedSteps.length) return setFormError('Add at least one method step.')

    const recipe = {
      id: `user-${Date.now()}`,
      userCreated: true,
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      sourceName: sourceName.trim(),
      sourceUrl: sourceUrl.trim(),
      servings: Number(servings) || 0,
      prepTimeMinutes: Number(prepTime) || 0,
      cookTimeMinutes: Number(cookTime) || 0,
      totalTimeMinutes: totalTime,
      cuisineId,
      mealTypeId,
      dietaryTagIds,
      categoryIds,
      difficulty: 1,
      spiceLevel: Number(spiceLevel) || 0,
      accentColor,
      coverImageUrl,
      includeInMealSuggestions: includeSuggestions,
      ingredients: cleanedIngredients,
      steps: cleanedSteps,
      options: {
        includeShoppingList,
        showNutrition,
        allowSubstitutions,
        measurementSystem,
      },
      dietaryTagsLabel: dietaryTagIds.join(','),
      categoriesLabel: categoryIds.join(','),
    }

    const planning = addToPlanNow
      ? {
          recipeId: recipe.id,
          dateKey: plannedDate || getTodayKey(),
          slot: plannedSlot,
          time: plannedTime || '18:00',
          weekOffset: planningWeekOffset,
        }
      : null

    onSave(recipe, planning)
  }

  return (
    <form className="recipe-form" onSubmit={submit} style={{ '--form-accent': accentColor }}>
      <div className="form-page-head">
        <div>
          <button type="button" className="button button-ghost" onClick={onCancel}>
            <Icon name="left" size={16} /> Cancel
          </button>
          <h1>New recipe</h1>
          <p>Build the recipe detail, then choose where it should appear next.</p>
        </div>
        <div className="form-head-actions">
          <button type="submit" className="button button-primary button-large">
            <Icon name="check" size={17} /> Save recipe
          </button>
        </div>
      </div>

      {formError ? (
        <div className="form-alert" role="alert">
          <Icon name="x" size={16} />
          {formError}
          <IconButton label="Dismiss" icon="x" onClick={() => setFormError('')} />
        </div>
      ) : null}

      <SectionCard title="Recipe details" icon="menu">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Recipe title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Weeknight tofu stir-fry" />
          </label>

          <label className="field field-wide">
            <span>Short description</span>
            <textarea
              rows="2"
              value={shortDescription}
              onChange={(event) => setShortDescription(event.target.value)}
              placeholder="A short summary shown on the recipe card."
            />
          </label>

          <label className="field">
            <span>Source link</span>
            <input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/recipe" />
          </label>

          <label className="field">
            <span>Source name</span>
            <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="Cookbook, blog, or family" />
          </label>

          <label className="field">
            <span>Cuisine</span>
            <select value={cuisineId} onChange={(event) => setCuisineId(event.target.value)}>
              <option value="">Choose a cuisine</option>
              {LOOKUPS.cuisines.map((cuisine) => (
                <option key={cuisine.id} value={cuisine.id}>{cuisine.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Primary meal type</span>
            <select value={mealTypeId} onChange={(event) => setMealTypeId(event.target.value)}>
              <option value="">Choose a meal type</option>
              {LOOKUPS.mealTypes.map((mealType) => (
                <option key={mealType.id} value={mealType.id}>{mealType.name}</option>
              ))}
            </select>
          </label>

          <fieldset className="field field-wide">
            <legend>Dietary suitability</legend>
            <div className="check-grid">
              {LOOKUPS.dietaryTags.map((tag) => (
                <label className="check-card" key={tag.id}>
                  <input
                    type="checkbox"
                    checked={dietaryTagIds.includes(tag.id)}
                    onChange={(event) => toggleArrayId(setDietaryTagIds, tag.id, event.target.checked)}
                  />
                  <span>{tag.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="field field-wide">
            <legend>Recipe categories</legend>
            <div className="check-grid">
              {LOOKUPS.categories.map((category) => (
                <label className="check-card" key={category.id}>
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(category.id)}
                    onChange={(event) => toggleArrayId(setCategoryIds, category.id, event.target.checked)}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </SectionCard>

      <SectionCard title="Timing and yield" icon="clock">
        <div className="form-grid timing-grid">
          <div className="field">
            <span>Servings</span>
            <div className="stepper">
              <button type="button" className="stepper-button" onClick={() => setServings(Math.max(0, servings - 1))}>
                <Icon name="minus" size={16} />
              </button>
              <input
                type="number"
                min="0"
                step="1"
                value={servings}
                onChange={(event) => setServings(Math.max(0, Number(event.target.value) || 0))}
              />
              <button type="button" className="stepper-button" onClick={() => setServings(servings + 1)}>
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>

          <label className="field">
            <span>Prep time (minutes)</span>
            <input type="number" min="0" step="1" value={prepTime} onChange={(event) => setPrepTime(Math.max(0, Number(event.target.value) || 0))} />
          </label>

          <label className="field">
            <span>Cook time (minutes)</span>
            <input type="number" min="0" step="1" value={cookTime} onChange={(event) => setCookTime(Math.max(0, Number(event.target.value) || 0))} />
          </label>

          <div className="field">
            <span>Total time</span>
            <output className="total-time-output">{formatDecimal(totalTime)} min</output>
          </div>

          <div className="field field-wide">
            <span>Spice level</span>
            <div className="spice-control">
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={spiceLevel}
                onChange={(event) => setSpiceLevel(Number(event.target.value))}
                className="spice-range"
              />
              <div className="spice-scale">
                <span>Mild</span>
                <span>Very spicy</span>
              </div>
            </div>
            <Pill tone={spiceLevel >= 4 ? 'danger' : 'accent'}>
              {['Mild', 'Gentle', 'Medium', 'Spicy', 'Hot', 'Very spicy'][spiceLevel]}
            </Pill>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Image and appearance" icon="image">
        <div className="image-appearance">
          <div className="image-upload-column">
            <span className="field-label">Cover image</span>
            <div className="image-preview-wrap">
              <img
                src={coverImageUrl || APPROVED_IMAGES.placeholder}
                alt="Cover preview"
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = APPROVED_IMAGES.placeholder
                }}
              />
              {coverImageUrl ? <span className="image-preview-backdrop">{coverImageUrl.startsWith('data:') ? 'Uploaded image' : 'Image ready'}</span> : null}
            </div>
            <div className="image-upload-actions">
              <label className="button button-secondary">
                <Icon name="image" size={16} /> Upload image
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="visually-hidden"
                />
              </label>
              {coverImageUrl ? (
                <button type="button" className="button button-ghost" onClick={() => setCoverImageUrl('')}>
                  <Icon name="x" size={15} /> Remove image
                </button>
              ) : null}
            </div>
            {imageError ? <p className="field-error">{imageError}</p> : null}
            <p className="field-hint">Uploads stay in this browser. If left empty, the placeholder image is used.</p>
          </div>

          <div className="accent-column">
            <span className="field-label">Recipe card accent</span>
            <div className="swatch-row">
              {DEFAULT_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`swatch ${accentColor === color ? 'is-selected' : ''}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Use ${color}`}
                  onClick={() => setAccentColor(color)}
                />
              ))}
            </div>
            <label className="color-field">
              <span>Custom color</span>
              <input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} />
            </label>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Ingredients"
        icon="cart"
        action={
          <div className="section-action-row">
            <input
              className="section-name-input"
              value={newSectionName}
              onChange={(event) => setNewSectionName(event.target.value)}
              placeholder="New section name"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addIngredientSection()
                }
              }}
            />
            <button type="button" className="button button-secondary" onClick={addIngredientSection}>
              <Icon name="plus" size={16} /> Add section
            </button>
          </div>
        }
      >
        <datalist id="ingredient-options">
          {INGREDIENTS.map((ingredient) => (
            <option key={ingredient.id} value={ingredient.name} />
          ))}
        </datalist>
        <datalist id="unit-options">
          {LOOKUPS.units.map((unit) => (
            <option key={unit.id} value={unit.name} />
          ))}
        </datalist>

        <div className="ingredient-editor-list">
          {ingredients.map((ingredient, index) => (
            <div className="ingredient-editor-row" key={ingredient.uid}>
              <div className="row-handle">
                <IconButton label="Move ingredient up" icon="up" onClick={() => moveIngredient(index, -1)} disabled={index === 0} />
                <IconButton label="Move ingredient down" icon="down" onClick={() => moveIngredient(index, 1)} disabled={index === ingredients.length - 1} />
              </div>

              <label className="compact-field ingredient-section-input">
                <span>Section</span>
                <input
                  value={ingredient.sectionName}
                  onChange={(event) => updateIngredient(index, { sectionName: event.target.value })}
                  placeholder="Main"
                />
              </label>

              <label className="compact-field ingredient-name-input">
                <span>Ingredient</span>
                <input
                  list="ingredient-options"
                  value={ingredient.ingredientName}
                  onChange={(event) => updateIngredient(index, { ingredientName: event.target.value })}
                  placeholder="Search ingredient"
                />
              </label>

              <label className="compact-field ingredient-qty-input">
                <span>Quantity</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={ingredient.quantity}
                  onChange={(event) => updateIngredient(index, { quantity: event.target.value })}
                  placeholder="1"
                />
              </label>

              <label className="compact-field ingredient-unit-input">
                <span>Unit</span>
                <input
                  list="unit-options"
                  value={ingredient.unit}
                  onChange={(event) => updateIngredient(index, { unit: event.target.value })}
                  placeholder="cup"
                />
              </label>

              <label className="optional-control">
                <input
                  type="checkbox"
                  checked={ingredient.optional}
                  onChange={(event) => updateIngredient(index, { optional: event.target.checked })}
                />
                <span>Optional</span>
              </label>

              <IconButton label="Remove ingredient" icon="x" onClick={() => removeIngredient(index)} className="row-remove" />
            </div>
          ))}
        </div>

        <button type="button" className="button button-secondary add-row-button" onClick={() => addIngredient(ingredients[ingredients.length - 1]?.sectionName || 'Main')}>
          <Icon name="plus" size={16} /> Add ingredient
        </button>
      </SectionCard>

      <SectionCard title="Method" icon="flame">
        <div className="step-editor-list">
          {steps.map((step, index) => (
            <div className="step-editor-row" key={step.uid}>
              <span className="step-editor-number">{index + 1}</span>
              <div className="step-editor-main">
                <textarea
                  rows="2"
                  value={step.instruction}
                  onChange={(event) => updateStep(index, { instruction: event.target.value })}
                  placeholder="Describe this cooking step."
                />
                <label className="compact-field timer-field">
                  <span><Icon name="clock" size={13} /> Optional timer (minutes)</span>
                  <input
                    type="number"
                    min="0"
                    value={step.timerMinutes}
                    onChange={(event) => updateStep(index, { timerMinutes: event.target.value })}
                  />
                </label>
              </div>
              <div className="row-handle step-editor-handle">
                <IconButton label="Move step up" icon="up" onClick={() => moveStep(index, -1)} disabled={index === 0} />
                <IconButton label="Move step down" icon="down" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} />
                <IconButton label="Remove step" icon="x" onClick={() => removeStep(index)} className="row-remove" />
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="button button-secondary add-row-button" onClick={addStep}>
          <Icon name="plus" size={16} /> Add step
        </button>
      </SectionCard>

      <SectionCard title="Meal-planning options" icon="calendar">
        <div className="planning-option-grid">
          <ToggleOption
            checked={includeSuggestions}
            onChange={setIncludeSuggestions}
            label="Available in meal-plan suggestions"
            description="This recipe can be picked when filling a weekly slot."
            icon="calendar"
          />
          <ToggleOption
            checked={addToPlanNow}
            onChange={setAddToPlanNow}
            label="Add to the meal plan now"
            description="Immediately place this recipe in a weekly slot after saving."
            icon="plus"
          />
        </div>

        {addToPlanNow ? (
          <div className="planning-schedule-panel">
            <label className="field">
              <span>Meal-planning week</span>
              <select value={planningWeekOffset} onChange={(event) => { const offset = Number(event.target.value); setPlanningWeekOffset(offset); setPlannedDate(toDateKey(getWeekDays(offset)[0].date)); }}>
                <option value="-1">Last week</option>
                <option value="0">This week</option>
                <option value="1">Next week</option>
                <option value="2">Two weeks out</option>
              </select>
            </label>
            <label className="field">
              <span>Planned cooking date</span>
              <input type="date" value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)} />
            </label>
            <label className="field">
              <span>Planned serving time</span>
              <input type="time" value={plannedTime} onChange={(event) => setPlannedTime(event.target.value)} />
            </label>
            <label className="field">
              <span>Meal slot</span>
              <select value={plannedSlot} onChange={(event) => setPlannedSlot(event.target.value)}>
                {PLANNER_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Recipe options" icon="menu">
        <div className="recipe-options-layout">
          <div className="independent-options">
            <ToggleOption
              checked={includeShoppingList}
              onChange={setIncludeShoppingList}
              label="Include ingredients in shopping lists"
              description="Planned recipes contribute to the auto-generated list."
            />
            <ToggleOption
              checked={showNutrition}
              onChange={setShowNutrition}
              label="Show nutrition information"
              description="Display the nutrition panel in recipe details."
            />
            <ToggleOption
              checked={allowSubstitutions}
              onChange={setAllowSubstitutions}
              label="Allow ingredient substitutions"
              description="Mark this recipe as flexible about ingredient swaps."
            />
          </div>

          <fieldset className="measurement-choice">
            <legend>Measurements</legend>
            <div className="segmented-control">
              <SegmentedOption
                value="us"
                checked={measurementSystem === 'us'}
                onChange={setMeasurementSystem}
                label="US customary"
              />
              <SegmentedOption
                value="metric"
                checked={measurementSystem === 'metric'}
                onChange={setMeasurementSystem}
                label="Metric"
              />
            </div>
          </fieldset>
        </div>
      </SectionCard>

      <div className="form-footer">
        <button type="button" className="button button-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary button-large">
          <Icon name="check" size={17} /> Save recipe
        </button>
      </div>
    </form>
  )
}
