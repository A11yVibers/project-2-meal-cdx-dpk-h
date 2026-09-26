import { useEffect, useMemo, useRef, useState } from 'react'
import {
  approvedImageOptions,
  categoryOptions,
  cuisineOptions,
  dietaryTagOptions,
  ingredientCategoryMap,
  ingredientOptions,
  lookups,
  mealTypeOptions,
  PLACEHOLDER_IMAGE,
  seedRecipes,
  SHOPPING_CATEGORY_ORDER,
  unitOptions,
} from './data.js'

const STORAGE_KEYS = {
  recipes: 'meal-planner-user-recipes-v1',
  plan: 'meal-planner-plan-v1',
  checked: 'meal-planner-checked-items-v1',
  pantry: 'meal-planner-pantry-v1',
}

function loadPersisted(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => loadPersisted(key, fallback))
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue]
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const MEAL_SLOTS = [
  { id: 'MT01', label: 'Breakfast', defaultTime: '08:00' },
  { id: 'MT02', label: 'Lunch', defaultTime: '12:30' },
  { id: 'MT03', label: 'Dinner', defaultTime: '18:30' },
  { id: 'MT04', label: 'Snack', defaultTime: '15:30' },
]

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function startOfWeek(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return d
}

function addDays(date, amount) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + amount)
  return d
}

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromDateKey(key) {
  const [y, m, d] = String(key).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function todayKey() {
  return toDateKey(new Date())
}

function titleCase(str) {
  return String(str || '').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatNumber(value) {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

function formatQuantity(value) {
  if (value === undefined || value === null || value === '') return ''
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) return String(value).trim()
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 100) / 100)
}

function parseDecimal(value) {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function formatMinutes(minutes) {
  const total = Number.parseInt(minutes, 10)
  if (!Number.isFinite(total) || total <= 0) return '—'
  if (total < 60) return `${total}m`
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return mins ? `${hours}h ${mins}m` : `${hours}h`
}

function formatClock(twentyFour) {
  if (!twentyFour) return ''
  const [h, m] = String(twentyFour).split(':').map(Number)
  if (!Number.isFinite(h)) return String(twentyFour)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${period}`
}

function formatDateLabel(key) {
  const d = fromDateKey(key)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatWeekLabel(start) {
  const end = addDays(start, 6)
  const sameYear = start.getFullYear() === end.getFullYear()
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
  return `${startLabel} – ${endLabel}, ${end.getFullYear()}`
}

function spiceLabel(level) {
  const n = Number(level)
  if (n <= 0) return 'Mild'
  if (n === 1) return 'Mild'
  if (n === 2) return 'Medium'
  if (n === 3) return 'Spicy'
  if (n === 4) return 'Very spicy'
  return 'Hot'
}

function difficultyLabel(level) {
  const n = Number(level)
  if (n <= 1) return 'Easy'
  if (n === 2) return 'Easy'
  if (n === 3) return 'Moderate'
  if (n === 4) return 'Challenging'
  return 'Advanced'
}

function getIngredientCategory(name) {
  const key = String(name || '').toLowerCase().trim()
  return ingredientCategoryMap[key] || 'Other'
}

function newIngredient(sectionId) {
  return {
    id: createId('ing'),
    sectionId,
    ingredientId: '',
    name: '',
    quantity: '',
    unit: '',
    notes: '',
    optional: false,
  }
}

function newSection(name = 'Main') {
  return {
    id: createId('sec'),
    name,
    ingredients: [newIngredient('__parent__')],
  }
}

function newStep() {
  return { id: createId('step'), instruction: '', timerMinutes: '' }
}

function emptyRecipes() {
  return []
}

function baseRecipeForm() {
  const firstSectionId = createId('sec')
  const firstIngredientId = createId('ing')
  const firstStepId = createId('step')
  return {
    title: '',
    shortDescription: '',
    sourceName: '',
    sourceUrl: '',
    cuisineId: cuisineOptions[0]?.cuisine_id || '',
    mealTypeId: 'MT03',
    dietaryTagIds: [],
    categoryIds: [],
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    spiceLevel: 2,
    difficulty: 1,
    accentColor: '#D97757',
    coverImageUrl: PLACEHOLDER_IMAGE,
    sections: [
      { id: firstSectionId, name: 'Main', ingredients: [{ ...newIngredient(firstSectionId), id: firstIngredientId }] },
    ],
    steps: [{ ...newStep(), id: firstStepId }],
    options: {
      includeInShoppingList: true,
      showNutrition: false,
      allowSubstitutions: false,
      measurement: 'us',
    },
    mealPlanning: {
      includeInMealSuggestions: true,
      addToPlanNow: false,
      planningWeek: 'this',
      specificDate: '',
      plannedMealType: 'MT03',
      plannedTime: '18:30',
    },
  }
}

function normalizeRecipeForStorage(recipe) {
  const prep = Math.max(0, Number.parseInt(recipe.prepTimeMinutes, 10) || 0)
  const cook = Math.max(0, Number.parseInt(recipe.cookTimeMinutes, 10) || 0)
  return {
    ...recipe,
    id: recipe.id || createId('recipe'),
    title: recipe.title || 'Untitled recipe',
    servings: Math.max(1, Number.parseInt(recipe.servings, 10) || 1),
    prepTimeMinutes: prep,
    cookTimeMinutes: cook,
    totalTimeMinutes: recipe.totalTimeMinutes || prep + cook,
    spiceLevel: Number(recipe.spiceLevel ?? 0),
    difficulty: Number(recipe.difficulty ?? 1),
    accentColor: recipe.accentColor || '#D97757',
    coverImageUrl: recipe.coverImageUrl || PLACEHOLDER_IMAGE,
    dietaryTagIds: Array.isArray(recipe.dietaryTagIds) ? recipe.dietaryTagIds : [],
    categoryIds: Array.isArray(recipe.categoryIds) ? recipe.categoryIds : [],
    sections: Array.isArray(recipe.sections) ? recipe.sections.map((section) => ({
      ...section,
      name: section.name || 'Main',
      ingredients: (section.ingredients || []).map((ingredient) => ({
        ...ingredient,
        sectionId: section.id,
        name: ingredient.name || '',
        quantity: ingredient.quantity || '',
        unit: ingredient.unit || '',
        notes: ingredient.notes || '',
        optional: Boolean(ingredient.optional),
      })),
    })) : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    options: {
      includeInShoppingList: recipe.options?.includeInShoppingList !== false,
      showNutrition: Boolean(recipe.options?.showNutrition),
      allowSubstitutions: Boolean(recipe.options?.allowSubstitutions),
      measurement: recipe.options?.measurement === 'metric' ? 'metric' : 'us',
    },
    mealPlanning: recipe.mealPlanning || {},
    isSeed: false,
  }
}

function upsert(recipe, addToPlan, planning) {
  const planPayload = { recipeId: recipe.id, time: planning?.plannedTime || '18:30' }
  const key = planning?.planningWeek === 'next' ? toDateKey(addDays(startOfWeek(new Date()), 7)) : (planning?.planningWeek === 'specific' && planning.specificDate ? planning.specificDate : toDateKey(startOfWeek()))
  const meal = planning?.plannedMealType || 'MT03'
  return { key, meal, planPayload }
}

export default function App() {
  const [userRecipes, setUserRecipes] = usePersistentState(STORAGE_KEYS.recipes, emptyRecipes())
  const [plan, setPlan] = usePersistentState(STORAGE_KEYS.plan, {})
  const [checkedItems, setCheckedItems] = usePersistentState(STORAGE_KEYS.checked, {})
  const [pantry, setPantry] = usePersistentState(STORAGE_KEYS.pantry, [])
  const [view, setView] = useState({ name: 'catalog' })

  const allRecipes = useMemo(() => [...seedRecipes, ...userRecipes], [userRecipes])
  const recipeById = useMemo(() => Object.fromEntries(allRecipes.map((recipe) => [recipe.id, recipe])), [allRecipes])

  const navigate = (name, payload = {}) => setView({ name, ...payload })

  const openRecipe = (recipeId) => navigate('detail', { recipeId })
  const closeRecipe = () => navigate('catalog')

  const saveRecipe = (recipe, planning) => {
    const normalized = normalizeRecipeForStorage(recipe)
    setUserRecipes((existing) => [normalized, ...(Array.isArray(existing) ? existing : [])])
    if (planning?.addToPlanNow) {
      const assignment = upsert(normalized, true, planning)
      setPlan((existing) => {
        const next = { ...(existing || {}) }
        next[assignment.key] = { ...(next[assignment.key] || {}), [assignment.meal]: assignment.planPayload }
        return next
      })
    }
    navigate('detail', { recipeId: normalized.id })
  }

  const deleteRecipe = (recipeId) => {
    setUserRecipes((existing) => (existing || []).filter((recipe) => recipe.id !== recipeId))
    setPlan((existing) => {
      const next = {}
      Object.entries(existing || {}).forEach(([date, slots]) => {
        const nextSlots = {}
        Object.entries(slots || {}).forEach(([meal, entry]) => {
          if (entry?.recipeId !== recipeId) nextSlots[meal] = entry
        })
        if (Object.keys(nextSlots).length) next[date] = nextSlots
      })
      return next
    })
    closeRecipe()
  }

  return (
    <div className="app-shell">
      <Header view={view} onNavigate={navigate} />
      <main className="page-wrap">
        {view.name === 'catalog' && (
          <CatalogPage
            recipes={allRecipes}
            onOpenRecipe={openRecipe}
            onAddRecipe={() => navigate('add')}
          />
        )}
        {view.name === 'detail' && (
          <RecipeDetailPage
            recipe={recipeById[view.recipeId]}
            onBack={closeRecipe}
            onNavigate={navigate}
            onDelete={deleteRecipe}
            recipes={allRecipes}
            plan={plan}
            setPlan={setPlan}
          />
        )}
        {view.name === 'add' && (
          <RecipeFormPage
            onCancel={closeRecipe}
            onSave={saveRecipe}
          />
        )}
        {view.name === 'planner' && (
          <PlannerPage
            recipes={allRecipes}
            plan={plan}
            setPlan={setPlan}
            onOpenRecipe={openRecipe}
          />
        )}
        {view.name === 'shopping' && (
          <ShoppingPage
            recipes={allRecipes}
            plan={plan}
            checkedItems={checkedItems}
            setCheckedItems={setCheckedItems}
            pantry={pantry}
            setPantry={setPantry}
            onOpenRecipe={openRecipe}
            onOpenPlanner={() => navigate('planner')}
          />
        )}
      </main>
    </div>
  )
}

function Header({ view, onNavigate }) {
  const navItems = [
    { key: 'catalog', label: 'Recipes' },
    { key: 'planner', label: 'Meal Planner' },
    { key: 'shopping', label: 'Shopping List' },
  ]
  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={() => onNavigate('catalog')}>
        <span className="brand-mark">🍽️</span>
        <span>MealBoard</span>
      </button>
      <nav className="main-nav" aria-label="Primary">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={view.name === item.key ? 'nav-link active' : 'nav-link'}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button className="button button-primary header-add" type="button" onClick={() => onNavigate('add')}>
        + New recipe
      </button>
    </header>
  )
}

/* ----------------------------- Catalog ----------------------------- */

function CatalogPage({ recipes, onOpenRecipe, onAddRecipe }) {
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [meal, setMeal] = useState('')
  const [category, setCategory] = useState('')
  const [diet, setDiet] = useState('')

  const filtered = recipes.filter((recipe) => {
    const haystack = `${recipe.title} ${recipe.shortDescription || ''} ${recipe.sourceName || ''}`.toLowerCase()
    if (query && !haystack.includes(query.toLowerCase())) return false
    if (cuisine && recipe.cuisineId !== cuisine) return false
    if (meal && recipe.mealTypeId !== meal) return false
    if (category && !recipe.categoryIds.includes(category)) return false
    if (diet && !recipe.dietaryTagIds.includes(diet)) return false
    return true
  })

  return (
    <div>
      <section className="page-hero">
        <div>
          <p className="eyebrow">Your kitchen, organized</p>
          <h1>Recipe catalog</h1>
          <p className="lead">Browse seed recipes and your saved creations, then drop them into a week that works.</p>
        </div>
        <button className="button button-primary large" type="button" onClick={onAddRecipe}>+ Add a recipe</button>
      </section>

      <div className="filter-bar">
        <label className="search-field">
          <span className="sr-only">Search recipes</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes…" />
          <span aria-hidden="true">🔍</span>
        </label>
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} aria-label="Filter by cuisine">
          <option value="">All cuisines</option>
          {cuisineOptions.map((option) => <option key={option.cuisine_id} value={option.cuisine_id}>{option.cuisine_name}</option>)}
        </select>
        <select value={meal} onChange={(e) => setMeal(e.target.value)} aria-label="Filter by meal type">
          <option value="">All meal types</option>
          {mealTypeOptions.map((option) => <option key={option.meal_type_id} value={option.meal_type_id}>{option.meal_type_name}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {categoryOptions.map((option) => <option key={option.category_id} value={option.category_id}>{option.category_name}</option>)}
        </select>
        <select value={diet} onChange={(e) => setDiet(e.target.value)} aria-label="Filter by dietary tag">
          <option value="">All dietary tags</option>
          {dietaryTagOptions.map((option) => <option key={option.dietary_tag_id} value={option.dietary_tag_id}>{option.dietary_tag_name}</option>)}
        </select>
      </div>

      <p className="results-count">{filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'}</p>

      {filtered.length ? (
        <div className="recipe-grid">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onOpen={() => onOpenRecipe(recipe.id)} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No recipes match those filters"
          text="Try clearing the search and filters, or add a new recipe."
          actionLabel="Add a recipe"
          onAction={onAddRecipe}
        />
      )}
    </div>
  )
}

function RecipeCard({ recipe, onOpen }) {
  const cuisine = lookups.cuisines[recipe.cuisineId] || 'Other'
  const meal = lookups.mealTypes[recipe.mealTypeId] || ''
  return (
    <article className="recipe-card" style={{ '--recipe-accent': recipe.accentColor || '#D97757' }}>
      <button type="button" className="recipe-card-image" onClick={onOpen} aria-label={`Open ${recipe.title}`}>
        <img src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt={recipe.title} loading="lazy" />
        <span className="meal-badge">{meal || 'Dish'}</span>
        {recipe.isSeed && <span className="seed-badge">Seed</span>}
      </button>
      <div className="recipe-card-body">
        <div className="recipe-card-meta">
          <span>{cuisine}</span>
          <span aria-hidden="true">·</span>
          <span>{formatMinutes(recipe.totalTimeMinutes)}</span>
          <span aria-hidden="true">·</span>
          <span>{recipe.servings} servings</span>
        </div>
        <h2>{recipe.title}</h2>
        <p>{recipe.shortDescription || 'A MealBoard recipe ready for your weekly plan.'}</p>
        <div className="tag-row">
          {recipe.dietaryTagIds.slice(0, 2).map((tagId) => (
            <span className="tag" key={tagId}>{lookups.dietaryTags[tagId]}</span>
          ))}
          {recipe.categoryIds.slice(0, 2).map((categoryId) => (
            <span className="tag tag-soft" key={categoryId}>{lookups.categories[categoryId]}</span>
          ))}
        </div>
        <div className="card-actions">
          <button className="button button-ghost" type="button" onClick={onOpen}>View details</button>
          <span className="spice-dots" aria-label={`Spice: ${spiceLabel(recipe.spiceLevel)}`}>
            <SpiceMeter level={recipe.spiceLevel} />
          </span>
        </div>
      </div>
    </article>
  )
}

function SpiceMeter({ level, showLabel = false }) {
  const n = Number(level || 0)
  return (
    <span className="spice-meter" title={`Spice level: ${spiceLabel(n)}`}>
      <span aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < n ? 'chili on' : 'chili'} aria-hidden="true">🌶</span>
        ))}
      </span>
      {showLabel && <span className="spice-text">{spiceLabel(n)}</span>}
    </span>
  )
}

/* ----------------------------- Detail ----------------------------- */

function RecipeDetailPage({ recipe, onBack, onNavigate, onDelete, recipes, plan, setPlan }) {
  const [showPlanModal, setShowPlanModal] = useState(false)
  if (!recipe) {
    return (
      <div className="page-pad">
        <button className="text-button" type="button" onClick={onBack}>← Back to recipes</button>
        <EmptyState title="Recipe not found" text="It may have been removed." />
      </div>
    )
  }

  const cuisine = lookups.cuisines[recipe.cuisineId] || 'Other'
  const meal = lookups.mealTypes[recipe.mealTypeId] || ''

  return (
    <div className="page-pad">
      <button className="text-button" type="button" onClick={onBack}>← Back to recipes</button>

      <div className="detail-hero" style={{ '--recipe-accent': recipe.accentColor || '#D97757' }}>
        <div className="detail-image">
          <img src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt={recipe.title} />
        </div>
        <div className="detail-summary">
          <div className="detail-kicker">
            <span>{cuisine}</span>
            {meal && <span>· {meal}</span>}
            {recipe.isSeed && <span className="seed-badge">Seed recipe</span>}
          </div>
          <h1>{recipe.title}</h1>
          <p>{recipe.shortDescription || 'A homemade recipe ready to cook.'}</p>
          {recipe.sourceUrl ? (
            <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              {recipe.sourceName || 'Source link'} ↗
            </a>
          ) : recipe.sourceName ? (
            <span className="source-link muted">Source: {recipe.sourceName}</span>
          ) : null}

          <dl className="stats-grid">
            <Stat label="Servings" value={recipe.servings} />
            <Stat label="Prep" value={formatMinutes(recipe.prepTimeMinutes)} />
            <Stat label="Cook" value={formatMinutes(recipe.cookTimeMinutes)} />
            <Stat label="Total" value={formatMinutes(recipe.totalTimeMinutes)} />
          </dl>

          <div className="detail-options">
            <div className="option-line"><span>Difficulty</span><strong>{difficultyLabel(recipe.difficulty)}</strong></div>
            <div className="option-line"><span>Spice</span><SpiceMeter level={recipe.spiceLevel} showLabel /></div>
            {recipe.options?.includeInShoppingList === false && (
              <div className="option-line"><span>Shopping list</span><strong>Excluded</strong></div>
            )}
          </div>

          <div className="tag-row detail-tags">
            {recipe.dietaryTagIds.map((tagId) => (
              <span className="tag" key={tagId}>{lookups.dietaryTags[tagId]}</span>
            ))}
            {recipe.categoryIds.map((categoryId) => (
              <span className="tag tag-soft" key={categoryId}>{lookups.categories[categoryId]}</span>
            ))}
          </div>

          <div className="button-row">
            <button className="button button-primary" type="button" onClick={() => setShowPlanModal(true)}>+ Add to meal plan</button>
            {!recipe.isSeed && (
              <button className="button button-danger-outline" type="button" onClick={() => {
                if (window.confirm('Delete this recipe from your saved recipes?')) onDelete(recipe.id)
              }}>Delete</button>
            )}
          </div>
        </div>
      </div>

      {recipe.options?.showNutrition && (
        <section className="detail-section nutrition-note">
          <h2>Nutrition</h2>
          <p>Nutrition information is shown for recipes when you enable it in Recipe Options.</p>
          <div className="nutrition-placeholder">Calories, protein, carbs, and fat will appear here when available.</div>
        </section>
      )}

      <div className="detail-two-col">
        <section className="detail-section">
          <h2>Ingredients</h2>
          {recipe.sections?.length ? (
            recipe.sections.map((section) => (
              <div className="ingredient-section" key={section.id}>
                <h3>{section.name || 'Ingredients'}</h3>
                <ul className="ingredient-list">
                  {section.ingredients.map((ingredient) => (
                    <li key={ingredient.id} className={ingredient.optional ? 'optional' : ''}>
                      <span className="ingredient-quantity">
                        {ingredient.quantity ? `${formatQuantity(ingredient.quantity)} ${ingredient.unit || ''}`.trim() : ingredient.unit || ''}
                      </span>
                      <span className="ingredient-name">{ingredient.name || 'Ingredient'}</span>
                      {ingredient.notes && <span className="ingredient-notes">({ingredient.notes})</span>}
                      {ingredient.optional && <span className="optional-badge">optional</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="muted">No ingredients recorded yet.</p>
          )}
        </section>

        <section className="detail-section">
          <h2>Method</h2>
          {recipe.steps?.length ? (
            <ol className="step-list">
              {recipe.steps.map((step, index) => (
                <li key={step.id}>
                  <span className="step-number">{index + 1}</span>
                  <div>
                    <p>{step.instruction || 'Step details'}</p>
                    {step.timerMinutes > 0 && <span className="timer-badge">⏱ {formatMinutes(step.timerMinutes)}</span>}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No cooking steps recorded yet.</p>
          )}
        </section>
      </div>

      {showPlanModal && (
        <AddToPlanModal
          recipes={recipes}
          plan={plan}
          setPlan={setPlan}
          lockedRecipeId={recipe.id}
          onClose={() => setShowPlanModal(false)}
          onDone={() => {
            setShowPlanModal(false)
            onNavigate('planner')
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

/* ----------------------------- Form ----------------------------- */

function RecipeFormPage({ onCancel, onSave }) {
  const [form, setForm] = useState(baseRecipeForm)
  const [uploadNotice, setUploadNotice] = useState('')

  const totalTime = (Number.parseInt(form.prepTimeMinutes, 10) || 0) + (Number.parseInt(form.cookTimeMinutes, 10) || 0)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const updateOption = (field, value) => setForm((current) => ({ ...current, options: { ...current.options, [field]: value } }))
  const updatePlanning = (field, value) => setForm((current) => ({ ...current, mealPlanning: { ...current.mealPlanning, [field]: value } }))

  const addSection = () => {
    const section = newSection('Sauce')
    setForm((current) => ({ ...current, sections: [...current.sections, section] }))
  }

  const removeSection = (sectionId) => {
    setForm((current) => ({ ...current, sections: current.sections.filter((section) => section.id !== sectionId) }))
  }

  const moveSection = (index, delta) => {
    setForm((current) => {
      const sections = [...current.sections]
      const target = index + delta
      if (target < 0 || target >= sections.length) return current
      ;[sections[index], sections[target]] = [sections[target], sections[index]]
      return { ...current, sections }
    })
  }

  const updateSectionName = (sectionId, name) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? { ...section, name } : section),
    }))
  }

  const updateIngredient = (sectionId, ingredientId, patch) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? {
        ...section,
        ingredients: section.ingredients.map((ingredient) => ingredient.id === ingredientId ? { ...ingredient, ...patch } : ingredient),
      } : section),
    }))
  }

  const addIngredient = (sectionId) => {
    const ingredient = newIngredient(sectionId)
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? { ...section, ingredients: [...section.ingredients, ingredient] } : section),
    }))
  }

  const removeIngredient = (sectionId, ingredientId) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? {
        ...section,
        ingredients: section.ingredients.filter((ingredient) => ingredient.id !== ingredientId),
      } : section),
    }))
  }

  const moveIngredient = (sectionId, index, delta) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section
        const ingredients = [...section.ingredients]
        const target = index + delta
        if (target < 0 || target >= ingredients.length) return section
        ;[ingredients[index], ingredients[target]] = [ingredients[target], ingredients[index]]
        return { ...section, ingredients }
      }),
    }))
  }

  const addStep = () => setForm((current) => ({ ...current, steps: [...current.steps, newStep()] }))
  const removeStep = (stepId) => setForm((current) => ({ ...current, steps: current.steps.filter((step) => step.id !== stepId) }))
  const updateStep = (stepId, patch) => setForm((current) => ({
    ...current,
    steps: current.steps.map((step) => step.id === stepId ? { ...step, ...patch } : step),
  }))
  const moveStep = (index, delta) => setForm((current) => {
    const steps = [...current.steps]
    const target = index + delta
    if (target < 0 || target >= steps.length) return current
    ;[steps[index], steps[target]] = [steps[target], steps[index]]
    return { ...current, steps }
  })

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadNotice(`“${file.name}” was read, but this project stores remote image URLs only. Pick an approved image below for local persistence.`)
  }

  const toggleArray = (list, value) => list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

  const canSave = form.title.trim().length > 0 && form.sections.some((section) => section.ingredients.some((ingredient) => ingredient.name.trim()))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSave) return
    const recipe = {
      ...form,
      totalTimeMinutes: totalTime,
      coverImageUrl: form.coverImageUrl || PLACEHOLDER_IMAGE,
      sections: form.sections.filter((section) => section.name.trim() || section.ingredients.some((ingredient) => ingredient.name.trim())),
      steps: form.steps.filter((step) => step.instruction.trim() || step.timerMinutes),
    }
    onSave(recipe, form.mealPlanning)
  }

  return (
    <form className="recipe-form page-pad" onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <button className="text-button" type="button" onClick={onCancel}>← Cancel</button>
          <h1>Add a recipe</h1>
          <p className="lead">Divide the details into sections and finish with your meal-planning preferences.</p>
        </div>
        <button className="button button-primary" type="submit" disabled={!canSave}>Save recipe</button>
      </div>

      <FormSection number="1" title="Recipe details" icon="📋">
        <div className="field-grid two">
          <label className="field">
            <span>Recipe title <strong aria-hidden="true">*</strong></span>
            <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Miso Butter Salmon" required />
          </label>
          <label className="field">
            <span>Source link</span>
            <input value={form.sourceUrl} onChange={(e) => update('sourceUrl', e.target.value)} type="url" placeholder="https://…" />
          </label>
          <label className="field">
            <span>Source name</span>
            <input value={form.sourceName} onChange={(e) => update('sourceName', e.target.value)} placeholder="Cookbook, site, or author" />
          </label>
          <label className="field">
            <span>Short description</span>
            <input value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} placeholder="One or two sentence summary" />
          </label>
          <label className="field">
            <span>Cuisine</span>
            <select value={form.cuisineId} onChange={(e) => update('cuisineId', e.target.value)}>
              {cuisineOptions.map((option) => <option key={option.cuisine_id} value={option.cuisine_id}>{option.cuisine_name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Primary meal type</span>
            <select value={form.mealTypeId} onChange={(e) => update('mealTypeId', e.target.value)}>
              {mealTypeOptions.map((option) => <option key={option.meal_type_id} value={option.meal_type_id}>{option.meal_type_name}</option>)}
            </select>
          </label>
        </div>

        <fieldset className="choice-group">
          <legend>Dietary suitability</legend>
          <div className="choice-pills">
            {dietaryTagOptions.map((option) => (
              <ToggleChip
                key={option.dietary_tag_id}
                label={option.dietary_tag_name}
                checked={form.dietaryTagIds.includes(option.dietary_tag_id)}
                onChange={() => update('dietaryTagIds', toggleArray(form.dietaryTagIds, option.dietary_tag_id))}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="choice-group">
          <legend>Recipe categories</legend>
          <div className="choice-pills">
            {categoryOptions.map((option) => (
              <ToggleChip
                key={option.category_id}
                label={option.category_name}
                checked={form.categoryIds.includes(option.category_id)}
                onChange={() => update('categoryIds', toggleArray(form.categoryIds, option.category_id))}
              />
            ))}
          </div>
        </fieldset>
      </FormSection>

      <FormSection number="2" title="Timing and yield" icon="⏱️">
        <div className="field-grid four">
          <label className="field">
            <span>Servings</span>
            <div className="stepper">
              <button type="button" onClick={() => update('servings', Math.max(1, form.servings - 1))} aria-label="Decrease servings">−</button>
              <input type="number" min="1" value={form.servings} onChange={(e) => update('servings', e.target.value)} />
              <button type="button" onClick={() => update('servings', (Number(form.servings) || 1) + 1)} aria-label="Increase servings">+</button>
            </div>
          </label>
          <label className="field">
            <span>Prep time (minutes)</span>
            <input type="number" min="0" value={form.prepTimeMinutes} onChange={(e) => update('prepTimeMinutes', e.target.value)} />
          </label>
          <label className="field">
            <span>Cook time (minutes)</span>
            <input type="number" min="0" value={form.cookTimeMinutes} onChange={(e) => update('cookTimeMinutes', e.target.value)} />
          </label>
          <label className="field field-readonly">
            <span>Total time (auto)</span>
            <input readOnly value={`${totalTime} min · ${formatMinutes(totalTime)}`} tabIndex="-1" />
          </label>
        </div>

        <div className="field-grid two">
          <label className="field">
            <span>Difficulty</span>
            <select value={form.difficulty} onChange={(e) => update('difficulty', Number(e.target.value))}>
              <option value="1">Easy</option>
              <option value="2">Easy +</option>
              <option value="3">Moderate</option>
              <option value="4">Challenging</option>
              <option value="5">Advanced</option>
            </select>
          </label>
          <label className="field">
            <span>Spice level · <strong>{spiceLabel(form.spiceLevel)}</strong></span>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={form.spiceLevel}
              onChange={(e) => update('spiceLevel', Number(e.target.value))}
              aria-label="Spice level from mild to very spicy"
            />
            <div className="range-labels"><span>Mild</span><span>Very spicy</span></div>
          </label>
        </div>
      </FormSection>

      <FormSection number="3" title="Image and appearance" icon="🎨">
        <label className="field">
          <span>Cover image upload</span>
          <div className="upload-row">
            <label className="file-picker">
              <input type="file" accept="image/*" onChange={handleFile} />
              <span>Choose image file…</span>
            </label>
            <span className="field-hint">This app publishes remote URLs only; use an approved image below.</span>
          </div>
          {uploadNotice && <p className="form-notice">{uploadNotice}</p>}
        </label>
        <fieldset className="choice-group">
          <legend>Approved cover image</legend>
          <div className="image-options">
            {approvedImageOptions.map((url) => (
              <button
                type="button"
                key={url}
                className={form.coverImageUrl === url ? 'image-option selected' : 'image-option'}
                onClick={() => {
                  setUploadNotice('')
                  update('coverImageUrl', url)
                }}
                aria-pressed={form.coverImageUrl === url}
              >
                <img src={url} alt="" loading="lazy" />
                <span>{url === PLACEHOLDER_IMAGE ? 'Placeholder' : 'Approved image'}</span>
              </button>
            ))}
            <button
              type="button"
              className={form.coverImageUrl === PLACEHOLDER_IMAGE ? 'image-option selected' : 'image-option'}
              onClick={() => {
                setUploadNotice('')
                update('coverImageUrl', PLACEHOLDER_IMAGE)
              }}
            >
              <span className="image-option-empty">No image</span>
            </button>
          </div>
        </fieldset>
        <label className="field">
          <span>Recipe card accent color</span>
          <div className="color-row">
            <input type="color" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} />
            <code>{form.accentColor}</code>
            <div className="color-swatches">
              {['#D97757', '#8A9A5B', '#4F7CAC', '#B45F6E', '#6E5C8E', '#C08A3A'].map((color) => (
                <button
                  key={color}
                  type="button"
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                  onClick={() => update('accentColor', color)}
                  aria-label={`Use accent color ${color}`}
                />
              ))}
            </div>
          </div>
        </label>
      </FormSection>

      <FormSection number="4" title="Ingredients" icon="🥕">
        <p className="section-hint">Add sections like Main, Sauce, or Garnish. Search the provided ingredient data or type your own.</p>
        {form.sections.map((section, sectionIndex) => (
          <div className="ingredient-form-section" key={section.id}>
            <div className="ingredient-section-head">
              <input
                className="section-name-input"
                value={section.name}
                onChange={(e) => updateSectionName(section.id, e.target.value)}
                placeholder="Section name"
                aria-label="Ingredient section name"
              />
              <div className="mini-actions">
                <button type="button" className="icon-button" onClick={() => moveSection(sectionIndex, -1)} disabled={sectionIndex === 0} aria-label="Move section up">↑</button>
                <button type="button" className="icon-button" onClick={() => moveSection(sectionIndex, 1)} disabled={sectionIndex === form.sections.length - 1} aria-label="Move section down">↓</button>
                {form.sections.length > 1 && (
                  <button type="button" className="icon-button danger" onClick={() => removeSection(section.id)} aria-label="Remove section">✕</button>
                )}
              </div>
            </div>

            <div className="ingredient-rows">
              {section.ingredients.length ? section.ingredients.map((ingredient, ingredientIndex) => (
                <div className="ingredient-row" key={ingredient.id}>
                  <div className="drag-cells">
                    <span className="row-grip" aria-hidden="true">⠿</span>
                    <button type="button" className="icon-button compact" onClick={() => moveIngredient(section.id, ingredientIndex, -1)} disabled={ingredientIndex === 0} aria-label="Move ingredient up">↑</button>
                    <button type="button" className="icon-button compact" onClick={() => moveIngredient(section.id, ingredientIndex, 1)} disabled={ingredientIndex === section.ingredients.length - 1} aria-label="Move ingredient down">↓</button>
                  </div>
                  <label className="ingredient-input wide">
                    <span className="sr-only">Ingredient</span>
                    <input
                      list="meal-ingredient-options"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(section.id, ingredient.id, { name: e.target.value })}
                      placeholder="Search ingredient…"
                    />
                  </label>
                  <datalist id="meal-ingredient-options">
                    {ingredientOptions.map((option) => <option key={option.id} value={option.name} />)}
                  </datalist>
                  <label className="ingredient-input quantity">
                    <span className="sr-only">Quantity</span>
                    <input value={ingredient.quantity} onChange={(e) => updateIngredient(section.id, ingredient.id, { quantity: e.target.value })} placeholder="Qty" />
                  </label>
                  <label className="ingredient-input unit">
                    <span className="sr-only">Unit</span>
                    <select value={ingredient.unit} onChange={(e) => updateIngredient(section.id, ingredient.id, { unit: e.target.value })}>
                      <option value="">Unit</option>
                      {unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </label>
                  <label className="ingredient-input notes">
                    <span className="sr-only">Notes</span>
                    <input value={ingredient.notes} onChange={(e) => updateIngredient(section.id, ingredient.id, { notes: e.target.value })} placeholder="Notes" />
                  </label>
                  <label className="optional-toggle" title="Mark optional">
                    <input type="checkbox" checked={ingredient.optional} onChange={(e) => updateIngredient(section.id, ingredient.id, { optional: e.target.checked })} />
                    <span>Optional</span>
                  </label>
                  <button type="button" className="icon-button danger" onClick={() => removeIngredient(section.id, ingredient.id)} aria-label="Remove ingredient">🗑</button>
                </div>
              )) : (
                <p className="muted">No ingredients in this section yet.</p>
              )}
            </div>

            <button className="button button-ghost small" type="button" onClick={() => addIngredient(section.id)}>+ Add ingredient</button>
          </div>
        ))}
        <button className="button button-secondary" type="button" onClick={addSection}>+ Add ingredient section</button>
      </FormSection>

      <FormSection number="5" title="Method" icon="👩‍🍳">
        {form.steps.map((step, index) => (
          <div className="method-row" key={step.id}>
            <span className="method-number">{index + 1}</span>
            <div className="method-controls">
              <textarea
                value={step.instruction}
                onChange={(e) => updateStep(step.id, { instruction: e.target.value })}
                placeholder="Describe this cooking step…"
                rows="2"
              />
              <div className="method-aside">
                <label className="ingredient-input timer">
                  <span>Timer</span>
                  <input
                    type="number"
                    min="0"
                    value={step.timerMinutes}
                    onChange={(e) => updateStep(step.id, { timerMinutes: e.target.value })}
                    placeholder="Minutes"
                  />
                </label>
                <div className="mini-actions">
                  <button type="button" className="icon-button" onClick={() => moveStep(index, -1)} disabled={index === 0} aria-label="Move step up">↑</button>
                  <button type="button" className="icon-button" onClick={() => moveStep(index, 1)} disabled={index === form.steps.length - 1} aria-label="Move step down">↓</button>
                  <button type="button" className="icon-button danger" onClick={() => removeStep(step.id)} aria-label="Remove step">🗑</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button className="button button-secondary" type="button" onClick={addStep}>+ Add step</button>
      </FormSection>

      <FormSection number="6" title="Meal-planning options" icon="🗓️">
        <div className="checkbox-stack">
          <CheckboxField label="Make this recipe available in meal-plan suggestions" checked={form.mealPlanning.includeInMealSuggestions} onChange={(checked) => updatePlanning('includeInMealSuggestions', checked)} />
          <CheckboxField label="Immediately add this recipe to the meal plan" checked={form.mealPlanning.addToPlanNow} onChange={(checked) => updatePlanning('addToPlanNow', checked)} />
        </div>

        {form.mealPlanning.addToPlanNow && (
          <div className="nested-panel">
            <label className="field">
              <span>Meal-planning week</span>
              <select value={form.mealPlanning.planningWeek} onChange={(e) => updatePlanning('planningWeek', e.target.value)}>
                <option value="this">This week</option>
                <option value="next">Next week</option>
                <option value="specific">Specific date</option>
              </select>
            </label>
            {form.mealPlanning.planningWeek === 'specific' ? (
              <label className="field">
                <span>Planned cooking date</span>
                <input type="date" value={form.mealPlanning.specificDate} onChange={(e) => updatePlanning('specificDate', e.target.value)} />
              </label>
            ) : (
              <div className="readonly-planning">
                Planned date: <strong>{formatDateLabel(form.mealPlanning.planningWeek === 'next' ? toDateKey(addDays(startOfWeek(), 7)) : toDateKey(startOfWeek()))}</strong>
              </div>
            )}
            <div className="field-grid two">
              <label className="field">
                <span>Meal slot</span>
                <select value={form.mealPlanning.plannedMealType} onChange={(e) => updatePlanning('plannedMealType', e.target.value)}>
                  {MEAL_SLOTS.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Planned serving time</span>
                <input type="time" value={form.mealPlanning.plannedTime} onChange={(e) => updatePlanning('plannedTime', e.target.value)} />
              </label>
            </div>
          </div>
        )}
      </FormSection>

      <FormSection number="7" title="Recipe options menu" icon="⚙️">
        <div className="option-menu">
          <div className="option-menu-column">
            <CheckboxField label="Include ingredients in generated shopping lists" checked={form.options.includeInShoppingList} onChange={(checked) => updateOption('includeInShoppingList', checked)} />
            <CheckboxField label="Show nutrition information" checked={form.options.showNutrition} onChange={(checked) => updateOption('showNutrition', checked)} />
            <CheckboxField label="Allow ingredient substitutions" checked={form.options.allowSubstitutions} onChange={(checked) => updateOption('allowSubstitutions', checked)} />
          </div>
          <fieldset className="choice-group inline">
            <legend>Measurement system</legend>
            <div className="segmented">
              <button type="button" className={form.options.measurement === 'us' ? 'segment selected' : 'segment'} onClick={() => updateOption('measurement', 'us')} aria-pressed={form.options.measurement === 'us'}>US customary</button>
              <button type="button" className={form.options.measurement === 'metric' ? 'segment selected' : 'segment'} onClick={() => updateOption('measurement', 'metric')} aria-pressed={form.options.measurement === 'metric'}>Metric</button>
            </div>
          </fieldset>
        </div>
        <p className="section-hint">Independent options can be toggled separately; measurement choices are mutually exclusive.</p>
      </FormSection>

      <div className="form-foot">
        <button className="button button-ghost" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button-primary" type="submit" disabled={!canSave}>Save recipe</button>
      </div>
    </form>
  )
}

function FormSection({ number, title, icon, children }) {
  return (
    <section className="form-section">
      <header className="form-section-head">
        <span className="form-section-number">{number}</span>
        <h2>{icon && <span aria-hidden="true">{icon}</span>} {title}</h2>
      </header>
      <div className="form-section-body">{children}</div>
    </section>
  )
}

function ToggleChip({ label, checked, onChange }) {
  return (
    <button type="button" className={checked ? 'choice-chip selected' : 'choice-chip'} onClick={onChange} aria-pressed={checked}>
      {checked && <span aria-hidden="true">✓ </span>}{label}
    </button>
  )
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="checkbox-field">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="checkbox-ui" aria-hidden="true">{checked ? '✓' : ''}</span>
      <span>{label}</span>
    </label>
  )
}

/* ----------------------------- Planner ----------------------------- */

function PlannerPage({ recipes, plan, setPlan, onOpenRecipe }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [modalSlot, setModalSlot] = useState(null)

  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7)
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const today = todayKey()
  const canGoToday = weekOffset !== 0

  const assignRecipe = (dateKey, mealId, recipeId, time) => {
    setPlan((existing) => {
      const next = { ...(existing || {}) }
      next[dateKey] = {
        ...(next[dateKey] || {}),
        [mealId]: { recipeId, time: time || MEAL_SLOTS.find((slot) => slot.id === mealId)?.defaultTime },
      }
      return next
    })
  }

  const removeSlot = (dateKey, mealId) => {
    setPlan((existing) => {
      const next = { ...(existing || {}) }
      const day = { ...(next[dateKey] || {}) }
      delete day[mealId]
      if (Object.keys(day).length) next[dateKey] = day
      else delete next[dateKey]
      return next
    })
  }

  return (
    <div className="page-pad">
      <div className="page-hero planner-hero">
        <div>
          <p className="eyebrow">Seven-day rhythm</p>
          <h1>Weekly meal planner</h1>
          <p className="lead">Assign recipes to breakfast, lunch, dinner, and snack slots. Choose any date and serving time.</p>
        </div>
        <div className="week-controls">
          <button className="button button-ghost" type="button" onClick={() => setWeekOffset((value) => value - 1)} aria-label="Previous week">←</button>
          <span className="week-label">{formatWeekLabel(weekStart)}</span>
          <button className="button button-ghost" type="button" onClick={() => setWeekOffset((value) => value + 1)} aria-label="Next week">→</button>
          {canGoToday && (
            <button className="button button-secondary" type="button" onClick={() => setWeekOffset(0)}>Today</button>
          )}
        </div>
      </div>

      <div className="planner-table" role="grid" aria-label="Weekly meal plan">
        <div className="planner-corner" />
        {DAY_LABELS.map((label, index) => {
          const key = toDateKey(days[index])
          return (
            <div key={label} className={`planner-day-head ${key === today ? 'is-today' : ''}`}>
              <strong>{label}</strong>
              <span>{formatDateLabel(key)}</span>
            </div>
          )
        })}
        {MEAL_SLOTS.map((slot) => (
          <FragmentRow
            key={slot.id}
            slot={slot}
            days={days}
            plan={plan}
            recipes={recipes}
            onOpenRecipe={onOpenRecipe}
            onChoose={(dateKey) => setModalSlot({ dateKey, mealId: slot.id })}
            onRemove={removeSlot}
          />
        ))}
      </div>

      {modalSlot && (
        <ChooseRecipeModal
          recipes={recipes}
          mealLabel={MEAL_SLOTS.find((slot) => slot.id === modalSlot.mealId)?.label}
          dateKey={modalSlot.dateKey}
          onClose={() => setModalSlot(null)}
          onChoose={(recipeId, time) => {
            assignRecipe(modalSlot.dateKey, modalSlot.mealId, recipeId, time)
            setModalSlot(null)
          }}
        />
      )}

      <div className="planner-legend">
        <span><strong>Tip:</strong> click an empty slot to add a recipe, or use the card action to replace or remove one.</span>
      </div>
    </div>
  )
}

function FragmentRow({ slot, days, plan, recipes, onOpenRecipe, onChoose, onRemove }) {
  return (
    <>
      <div className="planner-meal-label">
        <strong>{slot.label}</strong>
        <span>{slot.defaultTime}</span>
      </div>
      {days.map((day) => {
        const dateKey = toDateKey(day)
        const entry = plan[dateKey]?.[slot.id]
        const recipe = entry?.recipeId ? recipes.find((item) => item.id === entry.recipeId) : null
        return (
          <div key={dateKey} className={`planner-slot ${dateKey === todayKey() ? 'is-today' : ''}`}>
            {recipe ? (
              <div className="planned-card" style={{ '--recipe-accent': recipe.accentColor || '#D97757' }}>
                <img src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt="" />
                <div className="planned-card-body">
                  <button type="button" className="planned-title" onClick={() => onOpenRecipe(recipe.id)}>{recipe.title}</button>
                  <span className="planned-time">🍽 {formatClock(entry?.time)}</span>
                </div>
                <div className="planned-actions">
                  <button className="mini-link" type="button" onClick={() => onChoose(dateKey)}>Replace</button>
                  <button className="mini-link danger" type="button" onClick={() => onRemove(dateKey, slot.id)}>Remove</button>
                </div>
              </div>
            ) : (
              <button className="empty-slot" type="button" onClick={() => onChoose(dateKey)}>
                <span aria-hidden="true">+</span> Add recipe
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}

function ChooseRecipeModal({ recipes, mealLabel, dateKey, onClose, onChoose }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('')
  const [time, setTime] = useState(MEAL_SLOTS.find((slot) => slot.label === mealLabel)?.defaultTime || '18:00')

  const available = recipes.filter((recipe) => {
    if (!recipe.includeInMealSuggestions && recipe.mealPlanning?.includeInMealSuggestions === false) return false
    return true
  })
  const filtered = available.filter((recipe) => `${recipe.title} ${recipe.shortDescription || ''}`.toLowerCase().includes(query.toLowerCase()))
  const canConfirm = Boolean(selected)

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <Modal onClose={onClose} title={`Choose a recipe for ${mealLabel}`} subtitle={formatDateLabel(dateKey)}>
      <div className="modal-search">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes…" autoFocus />
      </div>
      <div className="modal-recipe-list">
        {filtered.length ? filtered.map((recipe) => (
          <button
            key={recipe.id}
            type="button"
            className={selected === recipe.id ? 'recipe-pick selected' : 'recipe-pick'}
            onClick={() => setSelected(recipe.id)}
          >
            <img src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt="" />
            <span className="recipe-pick-info">
              <strong>{recipe.title}</strong>
              <small>{lookups.cuisines[recipe.cuisineId] || 'Other'} · {formatMinutes(recipe.totalTimeMinutes)}</small>
            </span>
            <span className="radio-ui" aria-hidden="true">{selected === recipe.id ? '●' : '○'}</span>
          </button>
        )) : (
          <p className="muted">No recipes match “{query}”.</p>
        )}
      </div>
      <div className="modal-footer">
        <label className="field inline-field">
          <span>Serving time</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <div className="modal-footer-actions">
          <button className="button button-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="button" disabled={!canConfirm} onClick={() => onChoose(selected, time)}>Add to plan</button>
        </div>
      </div>
    </Modal>
  )
}

function AddToPlanModal({ recipes, plan, setPlan, lockedRecipeId, onClose, onDone }) {
  const [recipeId, setRecipeId] = useState(lockedRecipeId || '')
  const [dateKey, setDateKey] = useState(toDateKey(startOfWeek()))
  const [mealId, setMealId] = useState('MT03')
  const [time, setTime] = useState('18:30')
  const recipesList = recipes

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const save = () => {
    setPlan((existing) => {
      const next = { ...(existing || {}) }
      next[dateKey] = { ...(next[dateKey] || {}), [mealId]: { recipeId, time } }
      return next
    })
    onDone()
  }

  return (
    <Modal onClose={onClose} title="Add to meal plan">
      {lockedRecipeId ? (
        <p className="muted">Adding recipe to your weekly schedule.</p>
      ) : (
        <label className="field">
          <span>Recipe</span>
          <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
            <option value="">Choose a recipe…</option>
            {recipesList.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}
          </select>
        </label>
      )}
      <div className="field-grid two">
        <label className="field">
          <span>Planned cooking date</span>
          <input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
        </label>
        <label className="field">
          <span>Meal slot</span>
          <select value={mealId} onChange={(e) => setMealId(e.target.value)}>
            {MEAL_SLOTS.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Planned serving time</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <div className="modal-footer">
        <span />
        <div className="modal-footer-actions">
          <button className="button button-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="button button-primary" type="button" disabled={!recipeId} onClick={save}>Add to plan</button>
        </div>
      </div>
    </Modal>
  )
}

/* ----------------------------- Shopping ----------------------------- */

function ShoppingPage({ recipes, plan, checkedItems, setCheckedItems, pantry, setPantry, onOpenRecipe, onOpenPlanner }) {
  const [showPantry, setShowPantry] = useState(false)
  const lines = useMemo(() => generateShoppingLines(recipes, plan), [recipes, plan])
  const shoppingLines = lines.filter((line) => !pantry.includes(line.pantryKey))
  const pantryLines = lines.filter((line) => pantry.includes(line.pantryKey))
  const uniquePantryCount = new Set(lines.map((line) => line.pantryKey)).size

  const toggleChecked = (lineKey) => {
    setCheckedItems((existing) => ({ ...(existing || {}), [lineKey]: !(existing || {})[lineKey] }))
  }

  const togglePantry = (pantryKey, currentlyHave) => {
    setPantry((existing) => currentlyHave
      ? (existing || []).filter((key) => key !== pantryKey)
      : Array.from(new Set([...(existing || []), pantryKey])),
    )
  }

  const grouped = SHOPPING_CATEGORY_ORDER.map((category) => ({
    category,
    items: shoppingLines.filter((line) => line.category === category),
  })).filter((group) => group.items.length)

  const checkedCount = lines.filter((line) => checkedItems?.[line.key]).length

  return (
    <div className="page-pad">
      <div className="page-hero shopping-hero">
        <div>
          <p className="eyebrow">From plan to pantry</p>
          <h1>Shopping list</h1>
          <p className="lead">Generated automatically from everything currently in your weekly meal plan.</p>
        </div>
        <div className="shopping-toolbar">
          <button className="button button-primary" type="button" onClick={() => onPrintShoppingList()}>Print list</button>
          <button className="button button-ghost" type="button" onClick={() => setShowPantry((value) => !value)}>
            {showPantry ? 'Hide' : 'Show'} pantry items
          </button>
        </div>
      </div>

      {lines.length === 0 ? (
        <EmptyState
          title="Your shopping list is empty"
          text="Add recipes to the weekly meal planner and their ingredients will appear here automatically."
          actionLabel="Open meal planner"
          onAction={onOpenPlanner}
        />
      ) : (
        <>
          <div className="shopping-summary">
            <span>{shoppingLines.length} items to buy</span>
            <span>{checkedCount} checked off</span>
            <span>{uniquePantryCount} pantry ingredients available</span>
          </div>

          {showPantry && (pantryLines.length ? (
            <section className="shopping-section pantry-section">
              <h2>Already in your pantry</h2>
              <p className="muted">These items are excluded from the main list.</p>
              <ul className="shopping-items">
                {pantryLines.map((line) => (
                  <li key={`pantry-${line.key}`}>
                    <button className="shopping-name" type="button">{line.quantityText} {line.displayName}</button>
                    {line.recipeTitles.length > 1 && <small>Used in {line.recipeTitles.length} recipes</small>}
                    <button className="mini-link" type="button" onClick={() => togglePantry(line.pantryKey, true)}>Put back on list</button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="muted">No ingredients are currently marked as already in your pantry.</p>
          ))}

          <div className="shopping-categories">
            {grouped.map((group) => (
              <section className="shopping-section" key={group.category}>
                <header className="shopping-category-head">
                  <h2>{group.category}</h2>
                  <span>{group.items.length} item{group.items.length === 1 ? '' : 's'}</span>
                </header>
                <ul className="shopping-items">
                  {group.items.map((line) => (
                    <li key={line.key} className={checkedItems?.[line.key] ? 'checked-off' : ''}>
                      <label className="shopping-check">
                        <input
                          type="checkbox"
                          checked={Boolean(checkedItems?.[line.key])}
                          onChange={() => toggleChecked(line.key)}
                        />
                        <span className="checkbox-ui" aria-hidden="true">{checkedItems?.[line.key] ? '✓' : ''}</span>
                        <span className="shopping-name">
                          <strong>{line.quantityText}</strong> {line.displayName}
                          {line.optional && <span className="optional-badge">optional</span>}
                        </span>
                      </label>
                      <small>{line.recipeTitles.join(', ')}</small>
                      <button className="mini-link" type="button" onClick={() => togglePantry(line.pantryKey, false)} title="Mark as already in my pantry">Already have</button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {!grouped.length && <p className="muted">Nothing left to buy — enjoy your stocked pantry!</p>}
          </div>
        </>
      )}
    </div>
  )
}

function onPrintShoppingList() {
  window.print()
}

function generateShoppingLines(recipes, plan) {
  const aggregated = {}
  const recipeById = Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe]))

  Object.entries(plan || {}).forEach(([dateKey, slots]) => {
    Object.values(slots || {}).forEach((entry) => {
      if (!entry?.recipeId) return
      const recipe = recipeById[entry.recipeId]
      if (!recipe) return
      if (recipe.options?.includeInShoppingList === false) return
      recipe.sections?.forEach((section) => {
        section.ingredients?.forEach((ingredient) => {
          const name = String(ingredient.name || '').trim()
          if (!name) return
          const displayName = name
          const unit = String(ingredient.unit || '').trim()
          const category = getIngredientCategory(name)
          const optional = Boolean(ingredient.optional)
          const aggregateKey = `${name.toLowerCase()}|${unit.toLowerCase()}|${category}|${optional ? 'optional' : 'required'}`
          if (!aggregated[aggregateKey]) {
            aggregated[aggregateKey] = {
              quantity: 0,
              hasMeasure: false,
              displayName,
              unit,
              category,
              optional,
              recipeTitles: [],
            }
          }
          const quantity = parseDecimal(ingredient.quantity)
          if (Number.isFinite(quantity) && ingredient.quantity !== '' && quantity !== 0) {
            aggregated[aggregateKey].quantity += quantity
            aggregated[aggregateKey].hasMeasure = true
          } else if (!aggregated[aggregateKey].hasMeasure && ingredient.quantity) {
            aggregated[aggregateKey].quantity = ingredient.quantity
          }
          if (!aggregated[aggregateKey].recipeTitles.includes(recipe.title)) {
            aggregated[aggregateKey].recipeTitles.push(recipe.title)
          }
        })
      })
    })
  })

  return Object.values(aggregated).map((line) => {
    const quantityText = line.hasMeasure
      ? `${formatQuantity(line.quantity)}${line.unit ? ` ${line.unit}` : ''}`.trim()
      : typeof line.quantity === 'string' ? `${line.quantity}${line.unit ? ` ${line.unit}` : ''}`.trim() : (line.unit || 'to taste')
    return {
      ...line,
      key: `${line.displayName.toLowerCase()}|${line.unit.toLowerCase()}|${line.category}`,
      pantryKey: line.displayName.toLowerCase(),
      quantityText: quantityText || line.unit || 'to taste',
    }
  }).sort((a, b) => {
    if (a.category !== b.category) {
      return SHOPPING_CATEGORY_ORDER.indexOf(a.category) - SHOPPING_CATEGORY_ORDER.indexOf(b.category)
    }
    return a.displayName.localeCompare(b.displayName)
  })
}

/* ----------------------------- Shared ----------------------------- */

function Modal({ title, subtitle, children, onClose }) {
  const panelRef = useRef(null)
  useEffect(() => {
    const handler = (event) => {
      if (event.target === panelRef.current) onClose()
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="modal-backdrop" ref={panelRef} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-panel">
        <header className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">🥗</span>
      <h2>{title}</h2>
      <p>{text}</p>
      {actionLabel && <button className="button button-primary" type="button" onClick={onAction}>{actionLabel}</button>}
    </div>
  )
}
