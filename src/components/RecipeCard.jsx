import {
  PLACEHOLDER_IMAGE,
  getCuisineName,
  getDietaryTagName,
  getMealTypeName,
  getCategoryName,
  formatMinutes,
} from '../data.js'

function ImageWithFallback({ src, alt, accentColor }) {
  return (
    <img
      className="recipe-card__image"
      src={src || PLACEHOLDER_IMAGE}
      alt={alt}
      loading="lazy"
      style={{ '--recipe-accent': accentColor }}
      onError={(event) => {
        if (event.currentTarget.src !== PLACEHOLDER_IMAGE) event.currentTarget.src = PLACEHOLDER_IMAGE
      }}
    />
  )
}

export default function RecipeCard({ recipe, onOpen }) {
  return (
    <button className="recipe-card" type="button" onClick={() => onOpen(recipe.id)}>
      <div className="recipe-card__media">
        <ImageWithFallback src={recipe.coverImageUrl} alt={recipe.title} accentColor={recipe.accentColor} />
        <span className="recipe-card__meal">{getMealTypeName(recipe.mealTypeId)}</span>
      </div>
      <div className="recipe-card__body">
        <div className="recipe-card__eyebrow">
          <span>{getCuisineName(recipe.cuisineId)}</span>
          {recipe.difficulty ? <span>Difficulty {recipe.difficulty}/5</span> : null}
        </div>
        <h3>{recipe.title}</h3>
        <p className="recipe-card__description">{recipe.shortDescription || 'No description provided.'}</p>
        <div className="recipe-card__meta">
          <span>{recipe.servings} servings</span>
          <span>{formatMinutes(recipe.totalTimeMinutes)}</span>
          <span className="spice">
            Spice <strong>{'🌶'.repeat(Math.max(0, Math.min(recipe.spiceLevel, 5))) || '0'}</strong>
          </span>
        </div>
        {(recipe.dietaryTagIds?.length > 0 || recipe.categoryIds?.length > 0) && (
          <div className="chip-row">
            {recipe.dietaryTagIds?.slice(0, 3).map((id) => (
              <span className="chip chip--dietary" key={id}>
                {getDietaryTagName(id)}
              </span>
            ))}
            {recipe.categoryIds?.slice(0, 3).map((id) => (
              <span className="chip" key={id}>
                {getCategoryName(id)}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
