import { useState } from 'react'
import {
  MEASURE_SYSTEMS,
  defaultOptions,
  displayQuantity,
  formatTotalTime,
  getCuisine,
  getDietaryTag,
  getMealType,
  getRecipeCategory,
  spiceLabel,
  PLACEHOLDER_IMAGE
} from '../data.js'
import RecipeOptionsMenu from './RecipeOptionsMenu.jsx'

export default function RecipeDetail({ recipe, options, onOptionsChange, onBack, onAddToPlan }) {
  const [activeSection, setActiveSection] = useState(null)

  const cuisine = getCuisine(recipe.cuisineId)
  const mealType = getMealType(recipe.mealTypeId)
  const activeOptions = options || recipe.options || defaultOptions()
  const displayOptions = { ...recipe.options, ...activeOptions }

  const jumpToIngredient = () => setActiveSection('ingredients')
  const jumpToMethod = () => setActiveSection('method')

  return (
    <div className="detail-layout">
      <div className="detail-topbar">
        <button className="secondary-button" type="button" onClick={onBack}>← Recipes</button>
        <button className="primary-button" type="button" onClick={onAddToPlan}>Plan this recipe</button>
      </div>

      <article className="detail-hero">
        <div className="detail-image-wrap">
          <img src={displayOptions.coverImageUrl || recipe.coverImageUrl || PLACEHOLDER_IMAGE} alt={recipe.title} />
        </div>
        <div className="detail-heading">
          {mealType && <span className="tag tag-accent">{mealType.meal_type_name}</span>}
          <h1>{recipe.title}</h1>
          {recipe.shortDescription && <p className="detail-description">{recipe.shortDescription}</p>}
          <div className="detail-facts">
            <div><strong>{recipe.servings}</strong><span>servings</span></div>
            <div><strong>{formatTotalTime(recipe.totalTimeMinutes)}</strong><span>total time</span></div>
            <div><strong>{formatTotalTime(recipe.prepTimeMinutes)}</strong><span>prep</span></div>
            <div><strong>{formatTotalTime(recipe.cookTimeMinutes)}</strong><span>cook</span></div>
            <div><strong>{spiceLabel(recipe.spiceLevel)}</strong><span>spice</span></div>
          </div>
          <div className="tag-row">
            {cuisine && <span className="tag">{cuisine.cuisine_name}</span>}
            {recipe.dietaryTagIds.map((id) => {
              const tag = getDietaryTag(id)
              return tag ? <span className="tag tag-neutral" key={id}>{tag.dietary_tag_name}</span> : null
            })}
            {recipe.categoryIds.map((id) => {
              const category = getRecipeCategory(id)
              return category ? <span className="tag tag-neutral" key={id}>{category.category_name}</span> : null
            })}
          </div>
          {recipe.sourceUrl ? (
            <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              Source: {recipe.sourceName || 'Open original'}
            </a>
          ) : recipe.sourceName ? (
            <span className="source-link muted">Source: {recipe.sourceName}</span>
          ) : null}
          <div className="detail-jump-links">
            <button type="button" onClick={jumpToIngredient}>↓ Ingredients</button>
            <button type="button" onClick={jumpToMethod}>↓ Method</button>
          </div>
        </div>
      </article>

      <div className="detail-columns">
        <div className="detail-main-column">
          <section className={`detail-section${activeSection === 'ingredients' ? ' highlighted' : ''}`}>
            <h2>Ingredients</h2>
            {displayOptions.measurementSystem === 'METRIC' && (
              <p className="measurement-note">Showing metric measurements.</p>
            )}
            {recipe.ingredientSections.map((section, sectionIndex) => (
              <div className="ingredient-section" key={`${section.name}-${sectionIndex}`}>
                <h3>{section.name || 'Ingredients'}</h3>
                <ul className="ingredient-list">
                  {section.ingredients.map((ingredient) => (
                    <li key={ingredient.key || `${ingredient.name}-${ingredient.quantity}`} className={ingredient.optional ? 'optional' : ''}>
                      <span className="ingredient-quantity">{displayQuantity({ ...recipe, options: displayOptions }, ingredient)}</span>
                      <span>{ingredient.name}</span>
                      {ingredient.notes && <span className="ingredient-note">{ingredient.notes}</span>}
                      {ingredient.optional && <span className="optional-label">optional</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className={`detail-section${activeSection === 'method' ? ' highlighted' : ''}`}>
            <h2>Method</h2>
            <ol className="steps-list">
              {recipe.steps.map((step) => (
                <li key={step.key || step.number}>
                  <div className="step-text">{step.instruction}</div>
                  {step.timerMinutes > 0 && (
                    <button className="timer-chip" type="button" onClick={() => alert(`${formatTotalTime(step.timerMinutes)} timer for this step`)}>
                      ⏱ {formatTotalTime(step.timerMinutes)}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {displayOptions.showNutrition !== false && (
            <section className="detail-section nutrition-placeholder">
              <h2>Nutrition</h2>
              <p>Nutrition data is not included with this recipe. The “Show nutrition information” option is enabled.</p>
            </section>
          )}
        </div>

        <aside className="detail-aside">
          <RecipeOptionsMenu options={displayOptions} onChange={onOptionsChange} />
          {displayOptions.allowSubstitutions && (
            <div className="aside-card">
              <h3>Substitutions allowed</h3>
              <p>Swap ingredients that share a similar role or availability in your kitchen.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
