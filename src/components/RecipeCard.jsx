import { formatTotalTime, getCuisine, getMealType, spiceLabel, PLACEHOLDER_IMAGE } from '../data.js'

function SpiceDots({ level }) {
  return (
    <span className="spice-dots" aria-label={`Spice level: ${spiceLabel(level)}`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={`spice-dot${index < Number(level) ? ' active' : ''}`}>▮</span>
      ))}
    </span>
  )
}

export default function RecipeCard({ recipe, onClick }) {
  const cuisine = getCuisine(recipe.cuisineId)
  const mealType = getMealType(recipe.mealTypeId)

  return (
    <button
      type="button"
      className="recipe-card"
      style={{ '--recipe-accent': recipe.accentColor || '#D9A441' }}
      onClick={onClick}
    >
      <span className="recipe-card-image-wrap">
        <img className="recipe-card-image" src={recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt="" />
        <span className="recipe-card-meal">{mealType?.meal_type_name || 'Recipe'}</span>
      </span>
      <span className="recipe-card-body">
        <span className="recipe-card-title">{recipe.title}</span>
        <span className="recipe-card-description">{recipe.shortDescription}</span>
        <span className="recipe-card-meta">
          <span>{cuisine?.cuisine_name || 'Other'}</span>
          <span>{recipe.servings} servings</span>
          <span>{formatTotalTime(recipe.totalTimeMinutes)}</span>
          <SpiceDots level={recipe.spiceLevel} />
        </span>
      </span>
    </button>
  )
}
