import { useMemo, useState } from 'react'
import RecipeCard from './components/RecipeCard.jsx'
import RecipeDetail from './components/RecipeDetail.jsx'
import RecipeForm from './components/RecipeForm.jsx'
import Planner from './components/Planner.jsx'
import ShoppingList from './components/ShoppingList.jsx'
import { useRecipeState } from './useLocalStorage.js'
import {
  CUISINES,
  DIETARY_TAGS,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  SEED_RECIPES,
  defaultOptions,
  normalizeRecipe
} from './data.js'

const VIEWS = {
  CATALOG: 'catalog',
  DETAIL: 'detail',
  FORM: 'form',
  PLANNER: 'planner',
  SHOPPING: 'shopping'
}

function Header({ activeView, onChangeView, onAddRecipe }) {
  const navItems = [
    { id: VIEWS.CATALOG, label: 'Recipes' },
    { id: VIEWS.PLANNER, label: 'Planner' },
    { id: VIEWS.SHOPPING, label: 'Shopping list' }
  ]

  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={() => onChangeView(VIEWS.CATALOG)}>
        <span className="brand-mark">M</span>
        <span>Meal Plan</span>
      </button>
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeView === item.id || (item.id === VIEWS.CATALOG && activeView === VIEWS.DETAIL) ? 'active' : ''}
            onClick={() => onChangeView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button className="header-add primary-button" type="button" onClick={onAddRecipe}>+ New recipe</button>
    </header>
  )
}

function Catalog({ recipes, onOpenRecipe, onAddRecipe }) {
  const [search, setSearch] = useState('')
  const [cuisineId, setCuisineId] = useState('')
  const [mealTypeId, setMealTypeId] = useState('')
  const [dietaryTagId, setDietaryTagId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return recipes.filter((recipe) => {
      if (q) {
        const haystack = [
          recipe.title,
          recipe.shortDescription || '',
          cuisineName(recipe.cuisineId),
          mealTypeName(recipe.mealTypeId)
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (cuisineId && recipe.cuisineId !== cuisineId) return false
      if (mealTypeId && recipe.mealTypeId !== mealTypeId) return false
      if (dietaryTagId && !recipe.dietaryTagIds.includes(dietaryTagId)) return false
      if (categoryId && !recipe.categoryIds.includes(categoryId)) return false
      return true
    })
  }, [recipes, search, cuisineId, mealTypeId, dietaryTagId, categoryId])

  return (
    <div className="catalog">
      <div className="page-header-row">
        <div>
          <h1>Recipe catalog</h1>
          <p className="page-subtitle">{recipes.length} recipes · {filtered.length} shown</p>
        </div>
        <button className="primary-button" type="button" onClick={onAddRecipe}>+ New recipe</button>
      </div>

      <div className="catalog-toolbar">
        <input className="text-input search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipes…" />
        <select className="text-input" value={cuisineId} onChange={(event) => setCuisineId(event.target.value)} aria-label="Filter by cuisine">
          <option value="">All cuisines</option>
          {CUISINES.map((item) => <option key={item.cuisine_id} value={item.cuisine_id}>{item.cuisine_name}</option>)}
        </select>
        <select className="text-input" value={mealTypeId} onChange={(event) => setMealTypeId(event.target.value)} aria-label="Filter by meal type">
          <option value="">All meal types</option>
          {MEAL_TYPES.map((item) => <option key={item.meal_type_id} value={item.meal_type_id}>{item.meal_type_name}</option>)}
        </select>
        <select className="text-input" value={dietaryTagId} onChange={(event) => setDietaryTagId(event.target.value)} aria-label="Filter by dietary tag">
          <option value="">All dietary tags</option>
          {DIETARY_TAGS.map((item) => <option key={item.dietary_tag_id} value={item.dietary_tag_id}>{item.dietary_tag_name}</option>)}
        </select>
        <select className="text-input" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {RECIPE_CATEGORIES.map((item) => <option key={item.category_id} value={item.category_id}>{item.category_name}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="recipe-grid">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onOpenRecipe(recipe.id)} />
          ))}
        </div>
      ) : (
        <div className="empty-state-card">
          <h2>No recipes found</h2>
          <p>Try clearing a filter or create a new recipe.</p>
        </div>
      )}
    </div>
  )
}

function cuisineName(id) {
  return CUISINES.find((item) => item.cuisine_id === id)?.cuisine_name || ''
}

function mealTypeName(id) {
  return MEAL_TYPES.find((item) => item.meal_type_id === id)?.meal_type_name || ''
}

export default function App() {
  const {
    userRecipes,
    setUserRecipes,
    mealPlan,
    setMealPlan,
    shoppingState,
    setShoppingState,
    recipeSettings,
    setRecipeSettings
  } = useRecipeState()

  const [view, setView] = useState(VIEWS.CATALOG)
  const [selectedRecipeId, setSelectedRecipeId] = useState(null)
  const [toast, setToast] = useState('')

  const recipes = useMemo(
    () => [...SEED_RECIPES, ...userRecipes.map(normalizeRecipe)],
    [userRecipes]
  )

  const settingsByRecipe = useMemo(() => {
    const map = {}
    recipes.forEach((recipe) => {
      map[recipe.id] = { ...defaultOptions(), ...recipe.options, ...(recipeSettings[recipe.id] || {}) }
    })
    return map
  }, [recipes, recipeSettings])

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) || null

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(showToast.timer)
    showToast.timer = window.setTimeout(() => setToast(''), 2600)
  }

  const openCatalog = () => {
    setView(VIEWS.CATALOG)
    setSelectedRecipeId(null)
  }

  const openRecipe = (id) => {
    setSelectedRecipeId(id)
    setView(VIEWS.DETAIL)
  }

  const openForm = () => setView(VIEWS.FORM)

  const handleSaveRecipe = (recipe, planAssignment) => {
    const normalized = normalizeRecipe(recipe)
    setUserRecipes((current) => [...current, normalized])

    if (planAssignment) {
      setMealPlan((current) => {
        const day = current[planAssignment.date] || {}
        return {
          ...current,
          [planAssignment.date]: {
            ...day,
            [planAssignment.mealTypeId]: {
              recipeId: normalized.id,
              time: planAssignment.time || ''
            }
          }
        }
      })
    }

    openCatalog()
    showToast(planAssignment ? 'Recipe added to the catalog and meal plan.' : 'Recipe added to the catalog.')
  }

  const handleUpdateSettings = (recipeId, options) => {
    setRecipeSettings((current) => ({ ...current, [recipeId]: { ...options } }))
  }

  const handleAssign = (date, mealTypeId, recipeId, time = '') => {
    setMealPlan((current) => {
      const day = current[date] || {}
      return {
        ...current,
        [date]: {
          ...day,
          [mealTypeId]: { recipeId, time }
        }
      }
    })
    showToast('Recipe added to the weekly plan.')
  }

  const handleRemoveAssignment = (date, mealTypeId) => {
    setMealPlan((current) => {
      const next = { ...current }
      const day = { ...(next[date] || {}) }
      delete day[mealTypeId]
      if (Object.keys(day).length === 0) delete next[date]
      else next[date] = day
      return next
    })
    showToast('Recipe removed from the weekly plan.')
  }

  return (
    <div className="app-shell">
      <Header activeView={view} onChangeView={setView} onAddRecipe={openForm} />
      <main className="app-main">
        {view === VIEWS.CATALOG && (
          <Catalog recipes={recipes} onOpenRecipe={openRecipe} onAddRecipe={openForm} />
        )}

        {view === VIEWS.DETAIL && selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            options={settingsByRecipe[selectedRecipe.id]}
            onOptionsChange={(options) => handleUpdateSettings(selectedRecipe.id, options)}
            onBack={openCatalog}
            onAddToPlan={() => setView(VIEWS.PLANNER)}
          />
        )}

        {view === VIEWS.DETAIL && !selectedRecipe && (
          <div className="empty-state-card"><h2>Recipe not found</h2><button className="primary-button" type="button" onClick={openCatalog}>Back to recipes</button></div>
        )}

        {view === VIEWS.FORM && (
          <RecipeForm onCancel={openCatalog} onSave={handleSaveRecipe} />
        )}

        {view === VIEWS.PLANNER && (
          <Planner
            recipes={recipes}
            mealPlan={mealPlan}
            onAssign={handleAssign}
            onRemove={handleRemoveAssignment}
            onOpenRecipe={openRecipe}
          />
        )}

        {view === VIEWS.SHOPPING && (
          <ShoppingList
            recipes={recipes}
            settingsByRecipe={settingsByRecipe}
            mealPlan={mealPlan}
            shoppingState={shoppingState}
            onChange={setShoppingState}
          />
        )}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
