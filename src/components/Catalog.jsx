import { useMemo, useState } from 'react'
import { LOOKUPS } from '../lib/data.js'
import { cuisineName, mealTypeName } from '../lib/lookups.js'
import RecipeCard from './RecipeCard.jsx'
import { EmptyState } from './ui.jsx'
import Icon from './Icon.jsx'

export default function Catalog({ recipes, onOpenRecipe, onNewRecipe }) {
  const [query, setQuery] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('')
  const [mealTypeFilter, setMealTypeFilter] = useState('')
  const [dietaryFilter, setDietaryFilter] = useState('')

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return recipes.filter((recipe) => {
      if (cuisineFilter && recipe.cuisineId !== cuisineFilter) return false
      if (mealTypeFilter && recipe.mealTypeId !== mealTypeFilter) return false
      if (dietaryFilter && !(recipe.dietaryTagIds || []).includes(dietaryFilter)) return false
      if (!normalizedQuery) return true

      const haystack = [
        recipe.title,
        recipe.shortDescription,
        cuisineName(recipe.cuisineId),
        mealTypeName(recipe.mealTypeId),
      ].join(' ').toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [recipes, query, cuisineFilter, mealTypeFilter, dietaryFilter])

  return (
    <div className="catalog-page">
      <div className="catalog-toolbar">
        <div>
          <h1>Recipe catalog</h1>
          <p>Browse seed recipes and recipes created on this device.</p>
        </div>
        <button type="button" className="button button-primary button-large" onClick={onNewRecipe}>
          <Icon name="plus" size={17} /> New recipe
        </button>
      </div>

      <div className="catalog-filters">
        <label className="search-field catalog-search">
          <Icon name="search" size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes" />
        </label>
        <select value={cuisineFilter} onChange={(event) => setCuisineFilter(event.target.value)} aria-label="Filter by cuisine">
          <option value="">All cuisines</option>
          {LOOKUPS.cuisines.map((cuisine) => (
            <option key={cuisine.id} value={cuisine.id}>{cuisine.name}</option>
          ))}
        </select>
        <select value={mealTypeFilter} onChange={(event) => setMealTypeFilter(event.target.value)} aria-label="Filter by meal type">
          <option value="">All meal types</option>
          {LOOKUPS.mealTypes.map((mealType) => (
            <option key={mealType.id} value={mealType.id}>{mealType.name}</option>
          ))}
        </select>
        <select value={dietaryFilter} onChange={(event) => setDietaryFilter(event.target.value)} aria-label="Filter by dietary tag">
          <option value="">All dietary tags</option>
          {LOOKUPS.dietaryTags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
        {(query || cuisineFilter || mealTypeFilter || dietaryFilter) ? (
          <button
            type="button"
            className="button button-ghost"
            onClick={() => {
              setQuery('')
              setCuisineFilter('')
              setMealTypeFilter('')
              setDietaryFilter('')
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      <p className="catalog-count">
        Showing {filtered.length} of {recipes.length} recipe{recipes.length === 1 ? '' : 's'}
      </p>

      {filtered.length ? (
        <div className="recipe-grid">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onOpenRecipe(recipe.id)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="menu"
          title="No matching recipes"
          action={recipes.length ? null : <button type="button" className="button button-primary" onClick={onNewRecipe}>Create the first recipe</button>}
        >
          Try a different filter or add a new recipe.
        </EmptyState>
      )}
    </div>
  )
}
