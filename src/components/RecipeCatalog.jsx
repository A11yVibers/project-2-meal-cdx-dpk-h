import { useMemo, useState } from 'react'
import {
  CUISINES,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  DIETARY_TAGS,
  getMealTypeName,
} from '../data.js'
import RecipeCard from './RecipeCard.jsx'

export default function RecipeCatalog({ recipes, onOpen, onAdd }) {
  const [query, setQuery] = useState('')
  const [mealType, setMealType] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [category, setCategory] = useState('')
  const [dietary, setDietary] = useState('')

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return recipes.filter((recipe) => {
      const haystack = [
        recipe.title,
        recipe.shortDescription,
        recipe.sourceName,
      ]
        .join(' ')
        .toLowerCase()

      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false
      if (mealType && recipe.mealTypeId !== mealType) return false
      if (cuisine && recipe.cuisineId !== cuisine) return false
      if (category && !recipe.categoryIds.includes(category)) return false
      if (dietary && !recipe.dietaryTagIds.includes(dietary)) return false
      return true
    })
  }, [recipes, query, mealType, cuisine, category, dietary])

  return (
    <section className="catalog">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Recipe collection</p>
          <h2>Recipe Catalog</h2>
          <p>Browse seed recipes and your own locally saved recipes.</p>
        </div>
        <button className="primary-button" type="button" onClick={onAdd}>
          + Add recipe
        </button>
      </div>

      <div className="filter-bar">
        <label className="search-field">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, descriptions, sources"
          />
        </label>
        <label>
          <span>Meal</span>
          <select value={mealType} onChange={(event) => setMealType(event.target.value)}>
            <option value="">All meals</option>
            {MEAL_TYPES.map((type) => (
              <option key={type.meal_type_id} value={type.meal_type_id}>
                {type.meal_type_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Cuisine</span>
          <select value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
            <option value="">All cuisines</option>
            {CUISINES.map((item) => (
              <option key={item.cuisine_id} value={item.cuisine_id}>
                {item.cuisine_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {RECIPE_CATEGORIES.map((item) => (
              <option key={item.category_id} value={item.category_id}>
                {item.category_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Diet</span>
          <select value={dietary} onChange={(event) => setDietary(event.target.value)}>
            <option value="">All diets</option>
            {DIETARY_TAGS.map((item) => (
              <option key={item.dietary_tag_id} value={item.dietary_tag_id}>
                {item.dietary_tag_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="results-count">
        Showing {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}
      </p>

      {filteredRecipes.length > 0 ? (
        <div className="recipe-grid">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">🍽️</div>
          <h3>No recipes match</h3>
          <p>Try clearing a filter or create a new recipe.</p>
          <button className="secondary-button" type="button" onClick={onAdd}>
            Add recipe
          </button>
        </div>
      )}
    </section>
  )
}
