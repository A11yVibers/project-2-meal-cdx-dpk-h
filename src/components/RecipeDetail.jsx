import { LOOKUPS, PLACEHOLDER_IMAGE } from '../data.js'
import { recipeCover, formatMinutes } from '../utils.js'

function groupIngredients(ingredients) {
  const groups = []
  const indexes = new Map()
  for (const item of ingredients || []) {
    const key = item.section?.trim() || 'Ingredients'
    if (!indexes.has(key)) {
      indexes.set(key, groups.length)
      groups.push({ section: key, items: [] })
    }
    groups[indexes.get(key)].items.push(item)
  }
  return groups
}

export default function RecipeDetail({ recipe, onBack, onAddToPlan, onEdit, onDelete }) {
  const cuisine = LOOKUPS.cuisines[recipe.cuisineId] || 'Other'
  const mealType = LOOKUPS.mealTypes[recipe.mealTypeId] || ''
  const dietaryTags = (recipe.dietaryTagIds || []).map((id) => LOOKUPS.dietaryTags[id]).filter(Boolean)
  const categories = (recipe.categoryIds || []).map((id) => LOOKUPS.categories[id]).filter(Boolean)
  const groupedIngredients = groupIngredients(recipe.ingredients)

  return (
    <div className="detail-page page">
      <button className="back-button" type="button" onClick={onBack}>← Back to recipes</button>

      <div className="detail-hero" style={{ '--detail-accent': recipe.accentColor || '#D97757' }}>
        <img className="detail-hero__image" src={recipeCover(recipe, PLACEHOLDER_IMAGE)} alt={recipe.title} />
        <div className="detail-hero__content">
          <div className="detail-hero__kickers">
            {mealType && <span className="tag tag--meal">{mealType}</span>}
            {cuisine && <span className="tag tag--cuisine">{cuisine}</span>}
          </div>
          <h1>{recipe.title}</h1>
          {recipe.shortDescription && <p className="detail-hero__description">{recipe.shortDescription}</p>}
          <div className="detail-facts">
            <div><strong>{formatMinutes(recipe.totalTimeMinutes)}</strong><span>Total time</span></div>
            <div><strong>{formatMinutes(recipe.prepTimeMinutes)}</strong><span>Prep</span></div>
            <div><strong>{formatMinutes(recipe.cookTimeMinutes)}</strong><span>Cook</span></div>
            <div><strong>{recipe.servings}</strong><span>Servings</span></div>
            <div><strong>{recipe.spiceLevel}/5</strong><span>Spice</span></div>
          </div>
          <div className="detail-actions">
            <button className="button button--primary" type="button" onClick={() => onAddToPlan(recipe)}>
              + Add to meal plan
            </button>
            {recipe.source === 'user' && (
              <>
                <button className="button button--ghost" type="button" onClick={() => onEdit(recipe)}>Edit recipe</button>
                <button className="button button--danger-ghost" type="button" onClick={() => onDelete(recipe)}>Delete</button>
              </>
            )}
          </div>
        </div>
      </div>

      {(dietaryTags.length > 0 || categories.length > 0) && (
        <section className="detail-section">
          <h2>At a glance</h2>
          <div className="detail-tags">
            {dietaryTags.map((tag) => <span key={tag} className="tag tag--dietary">{tag}</span>)}
            {categories.map((category) => <span key={category} className="tag tag--category">{category}</span>)}
          </div>
        </section>
      )}

      <div className="detail-grid">
        <section className="detail-section detail-section--ingredients">
          <h2>Ingredients</h2>
          {groupedIngredients.length === 0 && <p className="muted">No ingredients recorded.</p>}
          {groupedIngredients.map((group) => (
            <div className="ingredient-group" key={group.section}>
              <h3>{group.section}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.id} className={item.optional ? 'is-optional' : ''}>
                    <span className="ingredient-name">
                      {item.name}
                      {item.notes ? <em> · {item.notes}</em> : null}
                    </span>
                    <span className="ingredient-amount">
                      {item.quantity || '—'} {item.unit}
                      {item.optional && <span className="optional-badge">optional</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="detail-section detail-section--method">
          <h2>Method</h2>
          {(!recipe.steps || recipe.steps.length === 0) && <p className="muted">No steps recorded.</p>}
          <ol className="method-list">
            {(recipe.steps || []).map((step, index) => (
              <li key={step.id || index}>
                <div className="method-list__number">{index + 1}</div>
                <div>
                  <p>{step.instruction}</p>
                  {Number(step.timerMinutes) > 0 && (
                    <span className="timer-chip">⏱ {formatMinutes(step.timerMinutes)}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {(recipe.sourceUrl || recipe.sourceName || recipe.showNutrition) && (
        <section className="detail-section">
          <h2>More</h2>
          <div className="more-grid">
            {recipe.sourceUrl ? (
              <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                View original recipe{recipe.sourceName ? ` · ${recipe.sourceName}` : ''} ↗
              </a>
            ) : recipe.sourceName ? (
              <span className="source-link source-link--plain">{recipe.sourceName}</span>
            ) : null}
            {recipe.showNutrition && (
              <div className="notice">
                <strong>Nutrition display enabled.</strong> Nutrition values are not provided in the source recipe data.
              </div>
            )}
          </div>
        </section>
      )}

      <section className="detail-section">
        <h2>Recipe options</h2>
        <div className="recipe-options-readonly">
          <span className={recipe.includeInShoppingList ? 'option-pill option-pill--on' : 'option-pill'}>Shopping list: {recipe.includeInShoppingList ? 'On' : 'Off'}</span>
          <span className={recipe.showNutrition ? 'option-pill option-pill--on' : 'option-pill'}>Nutrition: {recipe.showNutrition ? 'On' : 'Off'}</span>
          <span className={recipe.allowSubstitutions ? 'option-pill option-pill--on' : 'option-pill'}>Substitutions: {recipe.allowSubstitutions ? 'Allowed' : 'Off'}</span>
          <span className="option-pill">{recipe.measurementSystem === 'metric' ? 'Metric' : 'US customary'}</span>
        </div>
      </section>
    </div>
  )
}
