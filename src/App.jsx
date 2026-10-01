import { useEffect, useMemo, useState } from 'react'
import Catalog from './components/Catalog.jsx'
import MealPlanner from './components/MealPlanner.jsx'
import PlanRecipeModal from './components/PlanRecipeModal.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import RecipePickerModal from './components/RecipePickerModal.jsx'
import ShoppingList from './components/ShoppingList.jsx'
import Icon from './components/Icon.jsx'
import { loadSeedRecipes } from './lib/data.js'
import { fromDateKey, getWeekDays, readableDate } from './lib/dates.js'
import {
  loadCheckedItems,
  loadMealPlan,
  loadPantryItems,
  loadUserRecipes,
  loadWeekOffset,
  saveCheckedItems,
  saveMealPlan,
  savePantryItems,
  saveUserRecipes,
  saveWeekOffset,
} from './lib/storage.js'

const VIEWS = {
  catalog: 'catalog',
  detail: 'detail',
  newRecipe: 'new-recipe',
  planner: 'planner',
  shopping: 'shopping',
}

const NAV_ITEMS = [
  { id: VIEWS.catalog, label: 'Recipes', icon: 'menu' },
  { id: VIEWS.planner, label: 'Planner', icon: 'calendar' },
  { id: VIEWS.shopping, label: 'Shopping', icon: 'cart' },
]

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(onClose, 3600)
    return () => window.clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null
  return (
    <div className={`toast toast-${toast.tone || 'success'}`} role="status">
      <Icon name={toast.tone === 'error' ? 'x' : 'check'} size={17} />
      <span>{toast.message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss">
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}

export default function App() {
  const seedRecipes = useMemo(() => loadSeedRecipes(), [])
  const [userRecipes, setUserRecipes] = useState(loadUserRecipes)
  const recipes = useMemo(() => [...seedRecipes, ...userRecipes], [seedRecipes, userRecipes])

  const [mealPlan, setMealPlan] = useState(loadMealPlan)
  const [checkedItems, setCheckedItems] = useState(loadCheckedItems)
  const [pantryItems, setPantryItems] = useState(loadPantryItems)
  const [hidePantry, setHidePantry] = useState(false)
  const [weekOffset, setWeekOffset] = useState(loadWeekOffset)

  const [view, setView] = useState(VIEWS.catalog)
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)
  const [pickerTarget, setPickerTarget] = useState(null)
  const [detailPlanRecipeId, setDetailPlanRecipeId] = useState(null)
  const [toast, setToast] = useState(null)

  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset])

  useEffect(() => {
    saveUserRecipes(userRecipes)
  }, [userRecipes])

  useEffect(() => {
    saveMealPlan(mealPlan)
  }, [mealPlan])

  useEffect(() => {
    saveCheckedItems(checkedItems)
  }, [checkedItems])

  useEffect(() => {
    savePantryItems(pantryItems)
  }, [pantryItems])

  useEffect(() => {
    saveWeekOffset(weekOffset)
  }, [weekOffset])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view, selectedRecipeId])

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) || null
  const detailPlanRecipe = recipes.find((recipe) => recipe.id === detailPlanRecipeId) || null

  function showToast(message, tone = 'success') {
    setToast({ message, tone })
  }

  function openRecipe(recipeId) {
    setSelectedRecipeId(recipeId)
    setView(VIEWS.detail)
  }

  function navigate(viewName) {
    if (viewName === VIEWS.detail) {
      if (selectedRecipeId) return
      setView(VIEWS.catalog)
      return
    }
    setView(viewName)
  }

  function changeWeek(delta) {
    setWeekOffset((current) => current + delta)
  }

  function offsetForDate(dateKey) {
    const currentWeekStart = fromDateKey(getWeekDays(0)[0].key)
    const target = fromDateKey(dateKey)
    const millisecondDay = 24 * 60 * 60 * 1000
    return Math.round((target.getTime() - currentWeekStart.getTime()) / (7 * millisecondDay))
  }

  function assignRecipe(dateKey, slot, recipeId) {
    const nextPlan = {
      ...mealPlan,
      [dateKey]: { ...(mealPlan[dateKey] || {}), [slot]: recipeId },
    }
    setMealPlan(nextPlan)
    const stored = saveMealPlan(nextPlan)
    return stored
  }

  function removeRecipeFromSlot(dateKey, slot) {
    const day = { ...(mealPlan[dateKey] || {}) }
    delete day[slot]
    const nextPlan = { ...mealPlan }
    if (Object.keys(day).length) nextPlan[dateKey] = day
    else delete nextPlan[dateKey]
    setMealPlan(nextPlan)
    saveMealPlan(nextPlan)
  }

  function handleRecipeSave(recipe, planning) {
    const nextUserRecipes = [...userRecipes, recipe]
    const userRecipesStored = saveUserRecipes(nextUserRecipes)
    setUserRecipes(nextUserRecipes)

    let planStored = true
    if (planning) {
      const nextPlan = {
        ...mealPlan,
        [planning.dateKey]: {
          ...(mealPlan[planning.dateKey] || {}),
          [planning.slot]: recipe.id,
        },
      }
      setMealPlan(nextPlan)
      planStored = saveMealPlan(nextPlan)
      setWeekOffset(planning.weekOffset)
    }

    setView(planning ? VIEWS.planner : VIEWS.catalog)
    setSelectedRecipeId(recipe.id)

    if (!userRecipesStored || !planStored) {
      showToast('Recipe created, but browser storage was full. The cover image may not persist.', 'error')
    } else if (planning) {
      showToast(`${recipe.title} was added to the recipe catalog and meal plan.`)
    } else {
      showToast(`${recipe.title} was added to the recipe catalog.`)
    }
  }

  function handlePickerAssign(recipeId) {
    if (!pickerTarget) return
    const target = pickerTarget
    assignRecipe(target.dateKey, target.slot, recipeId)
    setPickerTarget(null)
    const recipe = recipes.find((item) => item.id === recipeId)
    showToast(`${recipe?.title || 'Recipe'} added to ${target.slot}.`)
  }

  function handlePickerRemove() {
    if (!pickerTarget) return
    removeRecipeFromSlot(pickerTarget.dateKey, pickerTarget.slot)
    setPickerTarget(null)
    showToast('Recipe removed from the meal plan.')
  }

  function handleDetailPlanSave(dateKey, slot) {
    if (!detailPlanRecipeId) return
    assignRecipe(dateKey, slot, detailPlanRecipeId)
    setDetailPlanRecipeId(null)
    setWeekOffset(offsetForDate(dateKey))
    setView(VIEWS.planner)
    showToast(`${detailPlanRecipe?.title || 'Recipe'} added to ${slot}.`)
  }

  function toggleShoppingItem(key) {
    setCheckedItems((current) => ({ ...current, [key]: !current[key] }))
  }

  function togglePantryItem(key) {
    setPantryItems((current) => ({ ...current, [key]: !current[key] }))
  }

  function clearCheckedItems() {
    setCheckedItems({})
    showToast('Checked items cleared.')
  }

  let content
  if (view === VIEWS.newRecipe) {
    content = (
      <RecipeForm
        onCancel={() => setView(VIEWS.catalog)}
        onSave={handleRecipeSave}
      />
    )
  } else if (view === VIEWS.detail) {
    content = (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={() => setView(VIEWS.catalog)}
        onPlan={() => selectedRecipe && setDetailPlanRecipeId(selectedRecipe.id)}
      />
    )
  } else if (view === VIEWS.planner) {
    content = (
      <MealPlanner
        days={days}
        weekOffset={weekOffset}
        mealPlan={mealPlan}
        recipes={recipes}
        onSelectSlot={(dateKey, slot, currentRecipeId) => setPickerTarget({ dateKey, slot, currentRecipeId })}
        onPreviousWeek={() => changeWeek(-1)}
        onNextWeek={() => changeWeek(1)}
        onResetWeek={() => setWeekOffset(0)}
        onCreateRecipe={() => setView(VIEWS.newRecipe)}
      />
    )
  } else if (view === VIEWS.shopping) {
    content = (
      <ShoppingList
        days={days}
        mealPlan={mealPlan}
        recipes={recipes}
        checkedItems={checkedItems}
        onToggleChecked={toggleShoppingItem}
        pantryItems={pantryItems}
        onTogglePantry={togglePantryItem}
        hidePantry={hidePantry}
        onToggleHidePantry={() => setHidePantry((current) => !current)}
        onClearChecked={clearCheckedItems}
        onGoPlanner={() => setView(VIEWS.planner)}
      />
    )
  } else {
    content = (
      <Catalog
        recipes={recipes}
        onOpenRecipe={openRecipe}
        onNewRecipe={() => setView(VIEWS.newRecipe)}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button type="button" className="brand" onClick={() => setView(VIEWS.catalog)}>
          <span className="brand-mark"><Icon name="flame" size={19} /></span>
          <span className="brand-copy">
            <strong>Meal Planner</strong>
            <small>Plan, cook, shop</small>
          </span>
        </button>

        <nav className="app-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-link ${view === item.id ? 'is-active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button type="button" className="button button-primary header-new-recipe" onClick={() => setView(VIEWS.newRecipe)}>
          <Icon name="plus" size={17} /> New recipe
        </button>
      </header>

      <main className="app-main">{content}</main>

      <footer className="app-footer">
        <span>Meal Planner · Recipe data seeds from project-assets/CSV files</span>
        <span>Your recipes and plans stay in this browser.</span>
      </footer>

      <RecipePickerModal
        open={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        recipes={recipes}
        currentRecipeId={pickerTarget?.currentRecipeId || null}
        dateLabel={pickerTarget ? readableDate(pickerTarget.dateKey) : ''}
        slot={pickerTarget?.slot || ''}
        onAssign={handlePickerAssign}
        onRemove={handlePickerRemove}
      />

      <PlanRecipeModal
        open={Boolean(detailPlanRecipeId)}
        recipe={detailPlanRecipe}
        onClose={() => setDetailPlanRecipeId(null)}
        onSave={handleDetailPlanSave}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
