import { useEffect, useMemo, useState } from 'react'
import { getSeedRecipes } from './data.js'
import Catalog from './components/Catalog.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import MealPlanner from './components/MealPlanner.jsx'
import ShoppingList from './components/ShoppingList.jsx'
import AddToPlanModal from './components/AddToPlanModal.jsx'

const STORAGE_KEY = 'meal-planner-app-v1'
const SEED_RECIPES = getSeedRecipes()

function defaultStoredState() {
  return {
    userRecipes: [],
    plan: {},
    pantryKeys: [],
    checkedKeys: [],
    hidePantry: false,
  }
}

function loadStoredState() {
  const fallback = defaultStoredState()
  if (typeof window === 'undefined') return fallback
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    if (!parsed) return fallback
    return {
      userRecipes: Array.isArray(parsed.userRecipes) ? parsed.userRecipes : [],
      plan: parsed.plan && typeof parsed.plan === 'object' && !Array.isArray(parsed.plan) ? parsed.plan : {},
      pantryKeys: Array.isArray(parsed.pantryKeys) ? parsed.pantryKeys : [],
      checkedKeys: Array.isArray(parsed.checkedKeys) ? parsed.checkedKeys : [],
      hidePantry: Boolean(parsed.hidePantry),
    }
  } catch {
    return fallback
  }
}

export default function App() {
  const [stored, setStored] = useState(loadStoredState)
  const [view, setView] = useState('catalog')
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)
  const [formState, setFormState] = useState(null)
  const [planModalRecipeId, setPlanModalRecipeId] = useState(null)
  const [toast, setToast] = useState('')

  const allRecipes = useMemo(() => [...SEED_RECIPES, ...stored.userRecipes], [stored.userRecipes])
  const selectedRecipe = allRecipes.find((recipe) => recipe.id === selectedRecipeId) || null
  const planModalRecipe = allRecipes.find((recipe) => recipe.id === planModalRecipeId) || null

  useEffect(() => {
    const state = {
      userRecipes: stored.userRecipes,
      plan: stored.plan,
      pantryKeys: stored.pantryKeys,
      checkedKeys: stored.checkedKeys,
      hidePantry: stored.hidePantry,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [stored])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const showToast = (message) => setToast(message)

  const goTo = (nextView) => {
    setView(nextView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openRecipe = (recipe) => {
    setSelectedRecipeId(recipe.id)
    setView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openNewRecipe = () => {
    setFormState({ recipe: null })
    setView('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEditRecipe = (recipe) => {
    setFormState({ recipe })
    setView('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const assignToPlan = (dateKey, slot, recipeId, time) => {
    setStored((current) => ({
      ...current,
      plan: {
        ...current.plan,
        [dateKey]: {
          ...(current.plan[dateKey] || {}),
          [slot]: { recipeId, time: time || '' },
        },
      },
    }))
  }

  const removeFromPlan = (dateKey, slot) => {
    setStored((current) => {
      const day = { ...(current.plan[dateKey] || {}) }
      delete day[slot]
      const plan = { ...current.plan }
      if (Object.keys(day).length === 0) delete plan[dateKey]
      else plan[dateKey] = day
      return { ...current, plan }
    })
  }

  const handleSaveRecipe = ({ recipe, plan }) => {
    setStored((current) => {
      const exists = current.userRecipes.some((item) => item.id === recipe.id)
      const userRecipes = exists
        ? current.userRecipes.map((item) => (item.id === recipe.id ? recipe : item))
        : [recipe, ...current.userRecipes]
      let nextPlan = current.plan
      if (plan) {
        nextPlan = {
          ...current.plan,
          [plan.date]: {
            ...(current.plan[plan.date] || {}),
            [plan.slot]: { recipeId: recipe.id, time: plan.time || '' },
          },
        }
      }
      return { ...current, userRecipes, plan: nextPlan }
    })
    setFormState(null)
    setView('catalog')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showToast(plan ? 'Recipe saved and added to your meal plan.' : 'Recipe saved to your catalog.')
  }

  const handleDeleteRecipe = (recipe) => {
    const confirmed = window.confirm(`Delete "${recipe.title}"? This only removes your local copy.`)
    if (!confirmed) return
    setStored((current) => {
      const plan = { ...current.plan }
      for (const [dateKey, slots] of Object.entries(plan)) {
        const nextSlots = { ...slots }
        for (const [slot, assignment] of Object.entries(nextSlots)) {
          if (assignment?.recipeId === recipe.id) delete nextSlots[slot]
        }
        if (Object.keys(nextSlots).length === 0) delete plan[dateKey]
        else plan[dateKey] = nextSlots
      }
      return {
        ...current,
        userRecipes: current.userRecipes.filter((item) => item.id !== recipe.id),
        plan,
      }
    })
    setSelectedRecipeId(null)
    setView('catalog')
    showToast('Recipe deleted.')
  }

  const handlePlanModalConfirm = ({ date, slot, time }) => {
    if (planModalRecipe) assignToPlan(date, slot, planModalRecipe.id, time)
    setPlanModalRecipeId(null)
    setView('planner')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    showToast('Recipe added to the weekly planner.')
  }

  const toggleKey = (key, setter) => (value) => {
    setStored((current) => {
      const list = current[key] || []
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
      return { ...current, [key]: next }
    })
  }

  const clearChecked = () => {
    setStored((current) => ({ ...current, checkedKeys: [] }))
  }

  const navItems = [
    { id: 'catalog', label: 'Recipes' },
    { id: 'planner', label: 'Planner' },
    { id: 'shopping', label: 'Shopping list' },
  ]

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={() => goTo('catalog')}>
          <span className="brand__mark">🍽</span>
          <span>Meal Plan</span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id ? 'main-nav__item main-nav__item--active' : 'main-nav__item'}
              onClick={() => goTo(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button className="button button--header-add" type="button" onClick={openNewRecipe}>+ New recipe</button>
        </nav>
      </header>

      <main>
        {view === 'catalog' && <Catalog recipes={allRecipes} onOpen={openRecipe} onNew={openNewRecipe} />}
        {view === 'detail' && selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            onBack={() => goTo('catalog')}
            onAddToPlan={(recipe) => setPlanModalRecipeId(recipe.id)}
            onEdit={openEditRecipe}
            onDelete={handleDeleteRecipe}
          />
        )}
        {view === 'form' && (
          <RecipeForm
            key={formState?.recipe?.id || 'new'}
            initialRecipe={formState?.recipe || null}
            onCancel={() => {
              setFormState(null)
              setView('catalog')
            }}
            onSave={handleSaveRecipe}
          />
        )}
        {view === 'planner' && (
          <MealPlanner
            recipes={allRecipes}
            plan={stored.plan}
            onAssign={assignToPlan}
            onRemove={removeFromPlan}
            onOpenRecipe={openRecipe}
          />
        )}
        {view === 'shopping' && (
          <ShoppingList
            recipes={allRecipes}
            plan={stored.plan}
            pantryKeys={stored.pantryKeys}
            checkedKeys={stored.checkedKeys}
            hidePantry={stored.hidePantry}
            onTogglePantry={toggleKey('pantryKeys')}
            onToggleChecked={toggleKey('checkedKeys')}
            onToggleHidePantry={(value) => setStored((current) => ({ ...current, hidePantry: value }))}
            onClearChecked={clearChecked}
            onOpenRecipe={openRecipe}
          />
        )}
      </main>

      {planModalRecipe && (
        <AddToPlanModal
          recipe={planModalRecipe}
          onClose={() => setPlanModalRecipeId(null)}
          onConfirm={handlePlanModalConfirm}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
