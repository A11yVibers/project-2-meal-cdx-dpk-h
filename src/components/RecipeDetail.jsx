import {
  PLACEHOLDER_IMAGE,
  getCuisineName,
  getDietaryTagName,
  getMealTypeName,
  getCategoryName,
  getUnitName,
  formatMinutes,
} from '../data.js'

function RecipeImage({ src, alt }) {
  return (
    <img
      className="detail-hero__image"
      src={src || PLACEHOLDER_IMAGE}
      alt={alt}
      onError={(event) => {
        if (event.currentTarget.src !== PLACEHOLDER_IMAGE) event.currentTarget.src = PLACEHOLDER_IMAGE
      }}
    />
  )
}

function SpiceMeter({ level }) {
  const safeLevel = Math.max(0, Math.min(Number(level) || 0, 5))
  return (
    <span className="spice-meter" aria-label={`Spice level ${safeLevel} of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < safeLevel ? 'active' : ''}>
          🌶
        </span>
      ))}
    </span>
  )
}

export default function RecipeDetail({ recipe, onBack, onPlanRecipe, onDelete }) {
  return (
    <article className="recipe-detail" style={{ '--recipe-accent': recipe.accentColor }}>
      <button className="back-button" type="button" onClick={onBack}>
        ← Back to recipes
      </button>

      <header className="detail-hero">
        <RecipeImage src={recipe.coverImageUrl} alt={recipe.title} />
        <div className="detail-hero__content">
          <div className="chip-row">
            <span className="chip chip--strong">{getMealTypeName(recipe.mealTypeId)}</span>
            <span className="chip">{getCuisineName(recipe.cuisineId)}</span>
            {recipe.dietaryTagIds.map((id) => (
              <span className="chip chip--dietary" key={id}>
                {getDietaryTagName(id)}
              </span>
            ))}
          </div>
          <h1>{recipe.title}</h1>
          <p className="detail-description">{recipe.shortDescription || 'No description provided.'}</p>
          {recipe.sourceUrl || recipe.sourceName ? (
            <p className="source-link">
              Source:{' '}
              {recipe.sourceUrl ? (
                <a href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                  {recipe.sourceName || recipe.sourceUrl}
                </a>
              ) : (
                <span>{recipe.sourceName}</span>
              )}
            </p>
          ) : null}
          <div className="detail-stats">
            <div><strong>{recipe.servings}</strong><span>Servings</span></div>
            <div><strong>{formatMinutes(recipe.prepTimeMinutes)}</strong><span>Prep</span></div>
            <div><strong>{formatMinutes(recipe.cookTimeMinutes)}</strong><span>Cook</span></div>
            <div><strong>{formatMinutes(recipe.totalTimeMinutes)}</strong><span>Total</span></div>
            <div><SpiceMeter level={recipe.spiceLevel} /><span>Spice</span></div>
          </div>
          <div className="detail-actions">
            <button className="primary-button" type="button" onClick={() => onPlanRecipe(recipe.id)}>
              + Add to meal plan
            </button>
            {onDelete && (
              <button className="text-button danger" type="button" onClick={onDelete}>
                Delete recipe
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="detail-columns">
        <div className="detail-main">
          <section className="detail-section">
            <h2>Ingredients</h2>
            {recipe.ingredients?.length ? (
              <div className="ingredient-sections">
                {recipe.ingredients.map((section) => (
                  <div className="ingredient-section" key={section.id}>
                    <h3>{section.name}</h3>
                    <ul>
                      {section.ingredients.map((ingredient) => (
                        <li key={ingredient.id}>
                          <span className="ingredient-quantity">
                            {ingredient.quantity || ''} {getUnitName(ingredient.unit)}
                          </span>
                          <span className="ingredient-name">
                            {ingredient.name}
                            {ingredient.optional ? <em className="optional"> optional</em> : null}
                          </span>
                          {ingredient.notes ? (
                            <span className="ingredient-notes">{ingredient.notes}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No ingredients have been added.</p>
            )}
          </section>

          <section className="detail-section">
            <h2>Method</h2>
            {recipe.steps?.length ? (
              <ol className="method-list">
                {recipe.steps.map((step, index) => (
                  <li key={step.id}>
                    <span className="step-number">{index + 1}</span>
                    <p>{step.instruction || 'No instruction provided.'}</p>
                    {step.timerMinutes > 0 ? (
                      <span className="step-timer">⏱ {formatMinutes(step.timerMinutes)}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No cooking steps have been added.</p>
            )}
          </section>
        </div>

        <aside className="detail-sidebar">
          <section className="detail-section">
            <h2>Recipe options</h2>
            <div className="option-list">
              <div className={recipe.includeInShoppingList ? 'option active' : 'option'}>
                <span className="option-indicator">{recipe.includeInShoppingList ? '✓' : ''}</span>
                Include in shopping lists
              </div>
              <div className={recipe.showNutrition ? 'option active' : 'option'}>
                <span className="option-indicator">{recipe.showNutrition ? '✓' : ''}</span>
                Show nutrition information
              </div>
              <div className={recipe.allowSubstitutions ? 'option active' : 'option'}>
                <span className="option-indicator">{recipe.allowSubstitutions ? '✓' : ''}</span>
                Allow ingredient substitutions
              </div>
              <div className="option">
                <span className="option-indicator">⚖</span>
                {recipe.measurementSystem === 'metric' ? 'Metric measurements' : 'US customary measurements'}
              </div>
            </div>
          </section>

          {recipe.showNutrition && (
            <section className="detail-section nutrition-panel">
              <h2>Nutrition</h2>
              <p className="muted">Nutrition information has not been added for this recipe.</p>
            </section>
          )}

          <section className="detail-section">
            <h2>Categories</h2>
            {recipe.categoryIds.length ? (
              <div className="chip-row">
                {recipe.categoryIds.map((id) => (
                  <span className="chip" key={id}>{getCategoryName(id)}</span>
                ))}
              </div>
            ) : (
              <p className="muted">No categories selected.</p>
            )}
          </section>

          {recipe.allowSubstitutions && (
            <section className="detail-section note-panel">
              <h2>Substitutions</h2>
              <p>This recipe can be prepared with reasonable ingredient substitutions.</p>
            </section>
          )}
        </aside>
      </div>
    </article>
  )
}
