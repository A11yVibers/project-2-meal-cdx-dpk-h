import { LOOKUPS, PLACEHOLDER_IMAGE } from '../data.js'
import { recipeCover, formatMinutes } from '../utils.js'

export default function RecipeCard({ recipe, onOpen, compact = false }) {
  const cuisine = LOOKUPS.cuisines[recipe.cuisineId] || 'Other'
  const mealType = LOOKUPS.mealTypes[recipe.mealTypeId] || ''
  const dietary = (recipe.dietaryTagIds || [])
    .map((id) => LOOKUPS.dietaryTags[id])
    .filter(Boolean)
    .slice(0, 3)

  return (
    <article
      className={`recipe-card${compact ? ' recipe-card--compact' : ''}`}
      style={{ '--card-accent': recipe.accentColor || '#D97757' }}
    >
      <button className="recipe-card__media-button" type="button" aria-label={`View ${recipe.title}`} onClick={() => onOpen(recipe)}>
        <img
          className="recipe-card__image"
          src={recipeCover(recipe, PLACEHOLDER_IMAGE)}
          alt={recipe.title}
          loading="lazy"
        />
      </button>
      <div className="recipe-card__body">
        <div className="recipe-card__meta">
          {mealType && <span className="tag tag--meal">{mealType}</span>}
          {cuisine && <span className="tag tag--cuisine">{cuisine}</span>}
        </div>
        <h3 className="recipe-card__title">
          <button type="button" onClick={() => onOpen(recipe)}>{recipe.title}</button>
        </h3>
        {recipe.shortDescription && <p className="recipe-card__description">{recipe.shortDescription}</p>}
        <div className="recipe-card__footer">
          <span className="recipe-card__time">{formatMinutes(recipe.totalTimeMinutes)}</span>
          <span className="recipe-card__servings">{recipe.servings} servings</span>
          {recipe.spiceLevel > 0 && (
            <span className="spice-dots" aria-label={`Spice level ${recipe.spiceLevel}`}>
              {Array.from({ length: recipe.spiceLevel }, (_, index) => (
                <i key={index}>🌶</i>
              ))}
            </span>
          )}
        </div>
        {!compact && dietary.length > 0 && (
          <div className="recipe-card__tags">
            {dietary.map((tag) => <span key={tag} className="tag tag--dietary">{tag}</span>)}
          </div>
        )}
      </div>
    </article>
  )
}
