import { APPROVED_IMAGES } from '../approved-images.js'
import { formatDecimal } from '../lib/data.js'
import {
  categoryNames,
  cuisineName,
  dietaryNames,
  mealTypeName,
  minuteLabel,
  spiceLabel,
} from '../lib/lookups.js'
import { Card, Pill, SectionCard, EmptyState, IconButton } from './ui.jsx'
import Icon from './Icon.jsx'

function GroupedIngredients({ ingredients }) {
  const groups = []
  const positions = new Map()

  ingredients.forEach((ingredient) => {
    const section = ingredient.sectionName || 'Main'
    if (!positions.has(section)) {
      positions.set(section, groups.length)
      groups.push({ name: section, ingredients: [] })
    }
    groups[positions.get(section)].ingredients.push(ingredient)
  })

  return (
    <div className="ingredient-groups">
      {groups.map((group) => (
        <div className="ingredient-group" key={group.name}>
          <h4>{group.name}</h4>
          <ul className="ingredient-list">
            {group.ingredients.map((ingredient, index) => (
              <li key={`${group.name}-${ingredient.ingredientName}-${index}`}>
                <span className="ingredient-check">
                  <Icon name="check" size={14} />
                </span>
                <span className="ingredient-amount">
                  {formatDecimal(ingredient.quantity)}{ingredient.unit ? ` ${ingredient.unit}` : ''}
                </span>
                <span className="ingredient-name">
                  {ingredient.ingredientName}
                  {ingredient.notes ? <em> ({ingredient.notes})</em> : null}
                </span>
                {ingredient.optional ? <Pill tone="soft">optional</Pill> : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function NutritionPanel() {
  return (
    <aside className="nutrition-panel">
      <h4>Nutrition snapshot</h4>
      <p>
        Nutrition values vary by brand and serving size. Use this space as a reminder to log macros
        from the final recipe.
      </p>
      <dl className="nutrition-grid">
        <div><dt>Calories</dt><dd>—</dd></div>
        <div><dt>Protein</dt><dd>—</dd></div>
        <div><dt>Carbs</dt><dd>—</dd></div>
        <div><dt>Fat</dt><dd>—</dd></div>
      </dl>
    </aside>
  )
}

export default function RecipeDetail({ recipe, onBack, onPlan }) {
  if (!recipe) {
    return (
      <EmptyState icon="menu" title="Recipe not found" action={<button className="button button-primary" onClick={onBack}>Back to catalog</button>} />
    )
  }

  const totalTime = recipe.totalTimeMinutes || (recipe.prepTimeMinutes + recipe.cookTimeMinutes)
  const spice = spiceLabel(recipe.spiceLevel)
  const dietNames = dietaryNames(recipe.dietaryTagIds || [])
  const categoryLabels = categoryNames(recipe.categoryIds || [])

  return (
    <div className="detail-page">
      <div className="detail-toolbar">
        <button type="button" className="button button-ghost" onClick={onBack}>
          <Icon name="left" size={16} /> Back to catalog
        </button>
        <button type="button" className="button button-primary" onClick={onPlan}>
          <Icon name="calendar" size={16} /> Plan this recipe
        </button>
      </div>

      <header
        className="detail-hero"
        style={{ '--recipe-accent': recipe.accentColor || '#8A9A5B' }}
      >
        <div className="detail-hero-media">
          <img
            src={recipe.coverImageUrl || APPROVED_IMAGES.placeholder}
            alt={recipe.title}
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = APPROVED_IMAGES.placeholder
            }}
          />
        </div>
        <div className="detail-hero-copy">
          <div className="detail-pills">
            <Pill tone="accent">{cuisineName(recipe.cuisineId)}</Pill>
            <Pill>{mealTypeName(recipe.mealTypeId)}</Pill>
            {recipe.userCreated ? <Pill tone="info">My recipe</Pill> : null}
          </div>
          <h1>{recipe.title}</h1>
          {recipe.shortDescription ? <p>{recipe.shortDescription}</p> : null}
          <dl className="detail-stats">
            <div>
              <dt><Icon name="users" size={15} /> Servings</dt>
              <dd>{recipe.servings || '—'}</dd>
            </div>
            <div>
              <dt><Icon name="clock" size={15} /> Prep</dt>
              <dd>{minuteLabel(recipe.prepTimeMinutes)}</dd>
            </div>
            <div>
              <dt><Icon name="clock" size={15} /> Cook</dt>
              <dd>{minuteLabel(recipe.cookTimeMinutes)}</dd>
            </div>
            <div>
              <dt><Icon name="clock" size={15} /> Total</dt>
              <dd>{minuteLabel(totalTime)}</dd>
            </div>
            <div>
              <dt><Icon name="flame" size={15} /> Spice</dt>
              <dd>{spice}</dd>
            </div>
          </dl>

          {dietNames.length || categoryLabels.length ? (
            <div className="detail-label-groups">
              {dietNames.length ? (
                <div className="label-group">
                  <span className="detail-label-row"><Icon name="check" size={15} /> {dietNames.join(', ')}</span>
                </div>
              ) : null}
              {categoryLabels.length ? (
                <div className="label-group">
                  <span className="detail-label-row"><Icon name="menu" size={15} /> {categoryLabels.join(', ')}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {recipe.sourceUrl ? (
            <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
              <Icon name="link" size={15} /> {recipe.sourceName || 'Recipe source'}
            </a>
          ) : recipe.sourceName ? (
            <span className="source-link source-link-static"><Icon name="link" size={15} /> {recipe.sourceName}</span>
          ) : null}
        </div>
      </header>

      <div className="detail-options-row">
        <span className={`option-state ${recipe.options?.includeInShoppingList === false ? 'option-off' : 'option-on'}`}>
          <Icon name={recipe.options?.includeInShoppingList === false ? 'x' : 'check'} size={14} />
          Shopping list
        </span>
        <span className={`option-state ${recipe.options?.showNutrition === false ? 'option-off' : 'option-on'}`}>
          <Icon name={recipe.options?.showNutrition === false ? 'x' : 'check'} size={14} />
          Nutrition details
        </span>
        <span className={`option-state ${recipe.options?.allowSubstitutions ? 'option-on' : 'option-off'}`}>
          <Icon name={recipe.options?.allowSubstitutions ? 'check' : 'x'} size={14} />
          Substitutions allowed
        </span>
        <span className="option-state option-on">
          {recipe.options?.measurementSystem === 'metric' ? 'Metric' : 'US customary'}
        </span>
      </div>

      <main className="detail-layout">
        <div className="detail-main-column">
          <SectionCard title="Ingredients" icon="cart">
            {recipe.ingredients?.length ? (
              <GroupedIngredients ingredients={recipe.ingredients} />
            ) : (
              <EmptyState icon="cart" title="No ingredients recorded" />
            )}
          </SectionCard>

          <SectionCard title="Method" icon="flame">
            {recipe.steps?.length ? (
              <ol className="method-steps">
                {recipe.steps.map((step, index) => (
                  <li key={`${step.instruction}-${index}`}>
                    <div className="step-number">{index + 1}</div>
                    <div className="step-copy">
                      <p>{step.instruction}</p>
                      {step.timerMinutes > 0 ? (
                        <span className="step-timer"><Icon name="clock" size={14} /> {minuteLabel(step.timerMinutes)}</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState icon="menu" title="No method steps recorded" />
            )}
          </SectionCard>
        </div>

        <aside className="detail-side-column">
          {recipe.options?.showNutrition !== false ? <NutritionPanel /> : null}
          <Card className="detail-note-card">
            <h3>Recipe notes</h3>
            <p>
              {recipe.options?.allowSubstitutions
                ? 'Ingredient substitutions are welcome. Adjust seasonings to your taste.'
                : 'Follow the listed ingredients closely for the intended result.'}
            </p>
          </Card>
        </aside>
      </main>
    </div>
  )
}
