import { useEffect, useMemo, useState } from 'react'
import RecipeCatalog from './components/RecipeCatalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import RecipePicker from './components/RecipePicker.jsx'
import WeeklyPlanner from './components/WeeklyPlanner.jsx'
import ShoppingList from './components/ShoppingList.jsx'
import { SEED_RECIPES, getMealTypeName } from './data.js'
import { readJson, writeJson, STORAGE_KEYS } from './storage.js'
import { getWeekDays } from './dates.js'
import { buildShoppingGroups } from './shopping.js'

const EMPTY_SHOPPING_STATE = { checked: [], pantry: [], excludePantry: false }

function readUserRecipes() {
  const value = readJson(STORAGE_KEYS.recipes, [])
  return Array.isArray(value) ? value : []
}

function readPlan() {
  const value = readJson(STORAGE_KEYS.plan, {})
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, slot]) => slot && slot.recipeId)
      .map(([key, slot]) => [key, { recipeId: slot.recipeId, plannedTime: slot.plannedTime || '' }]),
  )
}

function readShoppingState() {
  const value = readJson(STORAGE_KEYS.shopping, EMPTY_SHOPPING_STATE)
  return {
    checked: Array.isArray(value.checked) ? value.checked : [],
    pantry: Array.isArray(value.pantry) ? value.pantry : [],
    excludePantry: Boolean(value.excludePantry),
  }
}

export default function App() {
  const [userRecipes, setUserRecipes] = useState(readUserRecipes)
  const [activeView, setActiveView] = useState('catalog')
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [showRecipeForm, setShowRecipeForm] = useState(false)
  const [weekOffset, setWeekOffset] = useState(() => {
    const stored = readJson(STORAGE_KEYS.weekOffset, 0)
    return Number.isFinite(Number(stored)) ? Number(stored) : 0
  })
  const [plan, setPlan] = useState(readPlan)
  const [shopping, setShopping] = useState(readShoppingState)
  const [shoppingScope, setShoppingScope] = useState('current')
  const [pickerSlot, setPickerSlot] = useState(null)
  const [toast, setToast] = useState('')

  const recipes = useMemo(() => [...SEED_RECIPES, ...userRecipes], [userRecipes])
  const recipesById = useMemo(
    () => Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe])),
    [recipes],
  )

  useEffect(() => {
    writeJson(STORAGE_KEYS.recipes, userRecipes)
  }, [userRecipes])

  useEffect(() => {
    writeJson(STORAGE_KEYS.weekOffset, weekOffset)
  }, [weekOffset])

  useEffect(() => {
    writeJson(STORAGE_KEYS.plan, plan)
  }, [plan])

  useEffect(() => {
    writeJson(STORAGE_KEYS.shopping, shopping)
  }, [shopping])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function goTo(view) {
    setActiveView(view)
    setSelectedRecipeId('')
    setShowRecipeForm(false)
    setPickerSlot(null)
  }

  function openRecipe(recipeId) {
    setSelectedRecipeId(recipeId)
    setActiveView('detail')
  }

  function addRecipe() {
    setShowRecipeForm(true)
    setSelectedRecipeId('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowRecipeForm(false)
    setActiveView('catalog')
  }

  function handleRecipeSubmit(newRecipe, mealPlanOptions) {
    setUserRecipes((current) => [newRecipe, ...current])

    if (mealPlanOptions.addToMealPlan) {
      const key = `${mealPlanOptions.plannedDateKey}::${mealPlanOptions.plannedMealTypeId}`
      setPlan((current) => ({
        ...current,
        [key]: {
          recipeId: newRecipe.id,
          plannedTime: mealPlanOptions.plannedTime || '',
        },
      }))
      setToast(`Saved "${newRecipe.title}" and added it to the meal plan.`)
    } else {
      setToast(`Saved "${newRecipe.title}" to the recipe catalog.`)
    }

    setShowRecipeForm(false)
    setSelectedRecipeId('')
    setActiveView('catalog')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function deleteUserRecipe(recipeId) {
    const recipe = recipesById[recipeId]
    if (!recipe || recipe.isSeed) return
    setUserRecipes((current) => current.filter((item) => item.id !== recipeId))
    setPlan((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([, slot]) => slot.recipeId !== recipeId),
      ),
    )
    setActiveView('catalog')
    setSelectedRecipeId('')
    setToast(`Deleted "${recipe.title}".`)
  }

  function selectPickerSlot(dateKey, mealTypeId) {
    setPickerSlot({ dateKey, mealTypeId })
  }

  function replacePickerSlot(dateKey, mealTypeId) {
    setPickerSlot({ dateKey, mealTypeId, replacing: true })
  }

  function assignRecipeToPicker(recipeId, plannedTime) {
    if (!pickerSlot) return
    const key = `${pickerSlot.dateKey}::${pickerSlot.mealTypeId}`
    setPlan((current) => ({
      ...current,
      [key]: { recipeId, plannedTime: plannedTime || '' },
    }))
    const recipe = recipesById[recipeId]
    setToast(
      recipe
        ? `Assigned "${recipe.title}" to ${getMealTypeName(pickerSlot.mealTypeId)} ${pickerSlot.dateKey}.`
        : 'Recipe assigned.',
    )
    setPickerSlot(null)
  }

  function removePlanSlot(dateKey, mealTypeId) {
    const key = `${dateKey}::${mealTypeId}`
    setPlan((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
    setToast(`Removed ${getMealTypeName(mealTypeId)} on ${dateKey}.`)
  }

  function changeWeekOffset(nextOffset) {
    setWeekOffset(nextOffset)
  }

  const currentWeekKeys = useMemo(
    () => new Set(getWeekDays(weekOffset).map((day) => day.dateKey)),
    [weekOffset],
  )

  const scopedPlan = useMemo(() => {
    if (shoppingScope === 'all') return plan
    return Object.fromEntries(
      Object.entries(plan).filter(([key]) => currentWeekKeys.has(key.split('::')[0])),
    )
  }, [plan, shoppingScope, currentWeekKeys])

  const shoppingGroups = useMemo(
    () => buildShoppingGroups(scopedPlan, recipesById),
    [scopedPlan, recipesById],
  )

  const checkedKeys = useMemo(() => new Set(shopping.checked), [shopping.checked])
  const pantryKeys = useMemo(() => new Set(shopping.pantry), [shopping.pantry])

  function toggleShoppingItem(key) {
    setShopping((current) => {
      const checked = new Set(current.checked)
      if (checked.has(key)) checked.delete(key)
      else checked.add(key)
      return { ...current, checked: Array.from(checked) }
    })
  }

  function togglePantryItem(key) {
    setShopping((current) => {
      const pantry = new Set(current.pantry)
      if (pantry.has(key)) pantry.delete(key)
      else pantry.add(key)
      return { ...current, pantry: Array.from(pantry) }
    })
  }

  function setExcludePantry(value) {
    setShopping((current) => ({ ...current, excludePantry: value }))
  }

  function clearCheckedItems() {
    setShopping((current) => ({ ...current, checked: [] }))
  }

  const plannerRecipes = useMemo(() => {
    const suggested = recipes.filter((recipe) => recipe.includeInMealSuggestions !== false)
    return suggested.length ? suggested : recipes
  }, [recipes])

  const selectedRecipe = selectedRecipeId ? recipesById[selectedRecipeId] : null

  let content = null
  if (showRecipeForm) {
    content = <RecipeForm onSubmit={handleRecipeSubmit} onCancel={cancelForm} />
  } else if (activeView === 'detail' && selectedRecipe) {
    content = (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={() => goTo('catalog')}
        onPlanRecipe={() => {
          goTo('planner')
          setToast(`Choose a slot for "${selectedRecipe.title}".`)
        }}
        onDelete={selectedRecipe.isSeed ? undefined : () => deleteUserRecipe(selectedRecipe.id)}
      />
    )
  } else if (activeView === 'planner') {
    content = (
      <WeeklyPlanner
        weekOffset={weekOffset}
        onWeekOffsetChange={changeWeekOffset}
        plan={plan}
        recipesById={recipesById}
        onSelectSlot={selectPickerSlot}
        onReplaceSlot={replacePickerSlot}
        onRemoveSlot={removePlanSlot}
        onOpenRecipe={openRecipe}
      />
    )
  } else if (activeView === 'shopping') {
    content = (
      <ShoppingList
        groups={shoppingGroups}
        checkedKeys={checkedKeys}
        pantryKeys={pantryKeys}
        excludePantry={shopping.excludePantry}
        scope={shoppingScope}
        onScopeChange={setShoppingScope}
        onToggleItem={toggleShoppingItem}
        onTogglePantry={togglePantryItem}
        onToggleExcludePantry={setExcludePantry}
        onClearChecked={clearCheckedItems}
      />
    )
  } else {
    content = (
      <RecipeCatalog
        recipes={recipes}
        onOpen={openRecipe}
        onAdd={addRecipe}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={() => goTo('catalog')}>
          <span className="brand__mark">🍽️</span>
          <span>
            <strong>Meal Planner</strong>
            <small>Recipes · Schedule · Shopping</small>
          </span>
        </button>
        <nav className="app-nav" aria-label="Primary navigation">
          <button className={activeView === 'catalog' ? 'active' : ''} type="button" onClick={() => goTo('catalog')}>
            Recipes
          </button>
          <button className={activeView === 'planner' ? 'active' : ''} type="button" onClick={() => goTo('planner')}>
            Weekly Plan
          </button>
          <button className={activeView === 'shopping' ? 'active' : ''} type="button" onClick={() => goTo('shopping')}>
            Shopping List
          </button>
        </nav>
        <button className="primary-button header-add" type="button" onClick={addRecipe}>
          + Add recipe
        </button>
      </header>

      <main className="app-main">{content}</main>

      {pickerSlot ? (
        <RecipePicker
          recipes={plannerRecipes}
          onClose={() => setPickerSlot(null)}
          onSelect={assignRecipeToPicker}
          slotLabel={
            pickerSlot.dateKey
              ? `${getMealTypeName(pickerSlot.mealTypeId)} · ${pickerSlot.dateKey}`
              : getMealTypeName(pickerSlot.mealTypeId)
          }
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
