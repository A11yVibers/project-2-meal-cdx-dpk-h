import { APPROVED_IMAGES } from '../approved-images.js'
import { PLANNER_SLOTS } from '../lib/data.js'
import { cuisineName, mealTypeName, minuteLabel, spiceLabel } from '../lib/lookups.js'
import { Card, Pill } from './ui.jsx'
import Icon from './Icon.jsx'

export default function RecipeCard({ recipe, onClick, compact = false }) {
  const mealType = mealTypeName(recipe.mealTypeId)
  const slot = PLANNER_SLOTS.includes(mealType) ? mealType : null

  return (
    <Card
      className={`recipe-card ${compact ? 'recipe-card-compact' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{ '--recipe-accent': recipe.accentColor || '#8A9A5B' }}
    >
      <div className="recipe-media">
        <img
          src={recipe.coverImageUrl || APPROVED_IMAGES.placeholder}
          alt={recipe.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = APPROVED_IMAGES.placeholder
          }}
        />
        {recipe.userCreated ? <span className="recipe-local-badge">My recipe</span> : null}
        {slot ? <span className="recipe-slot-badge">{slot}</span> : null}
      </div>

      <div className="recipe-card-body">
        <div className="recipe-card-topline">
          <h3>{recipe.title}</h3>
        </div>
        {!compact && recipe.shortDescription ? (
          <p className="recipe-description">{recipe.shortDescription}</p>
        ) : null}

        <div className="recipe-meta">
          <span title="Servings">
            <Icon name="users" size={15} /> {recipe.servings || '—'}
          </span>
          <span title="Total time">
            <Icon name="clock" size={15} /> {minuteLabel(recipe.totalTimeMinutes)}
          </span>
          <span title="Spice level">
            <Icon name="flame" size={15} /> {spiceLabel(recipe.spiceLevel)}
          </span>
        </div>

        <div className="recipe-pills">
          <Pill tone="accent">{cuisineName(recipe.cuisineId)}</Pill>
          <Pill>{mealType}</Pill>
        </div>
      </div>
    </Card>
  )
}
