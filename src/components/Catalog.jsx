import { useMemo, useState } from 'react'
import { CUISINES, DIETARY_TAGS, MEAL_TYPES } from '../data.js'
import RecipeCard from './RecipeCard.jsx'

export default function Catalog({ recipes, onOpen, onNew }) {
  const [query, setQuery] = useState('')
  const [mealType, setMealType] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [dietary, setDietary] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return recipes.filter((recipe) => {
      const matchesQuery = !term || recipe.title.toLowerCase().includes(term) || (recipe.shortDescription || '').toLowerCase().includes(term)
      const matchesMeal = !mealType || recipe.mealTypeId === mealType
      const matchesCuisine = !cuisine || recipe.cuisineId === cuisine
      const matchesDietary = !dietary || (recipe.dietaryTagIds || []).includes(dietary)
      return matchesQuery && matchesMeal && matchesCuisine && matchesDietary
    })
  }, [recipes, query, mealType, cuisine, dietary])

  return (
    <div className="catalog page">
      <div className="page-heading">
        <div>
          <h1>Recipe catalog</h1>
          <p className="page-heading__subtitle">{recipes.length} recipes, including the seeded collection and your own.</p>
        </div>
        <button className="button button--primary" type="button" onClick={onNew}>+ New recipe</button>
      </div>

      <div className="catalog-toolbar">
        <label className="catalog-search">
          <span className="sr-only">Search recipes</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes…" />
        </label>
        <label>
          <span className="sr-only">Meal type</span>
          <select value={mealType} onChange={(event) => setMealType(event.target.value)}>
            <option value="">All meal types</option>
            {MEAL_TYPES.map((meal) => <option key={meal.id} value={meal.id}>{meal.name}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Cuisine</span>
          <select value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
            <option value="">All cuisines</option>
            {CUISINES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Dietary suitability</span>
          <select value={dietary} onChange={(event) => setDietary(event.target.value)}>
            <option value="">All diets</option>
            {DIETARY_TAGS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h2>No recipes found</h2>
          <p>Try clearing the filters or create a new recipe.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  )
}
