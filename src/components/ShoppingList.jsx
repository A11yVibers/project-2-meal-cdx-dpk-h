const CATEGORY_ORDER = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
]

export default function ShoppingList({
  groups,
  checkedKeys,
  pantryKeys,
  excludePantry,
  scope,
  onScopeChange,
  onToggleItem,
  onTogglePantry,
  onToggleExcludePantry,
  onClearChecked,
}) {
  const visibleGroups = CATEGORY_ORDER.map((category) => ({
    category,
    items: (groups[category] || []).filter((item) => !excludePantry || !pantryKeys.has(item.key)),
  })).filter((group) => group.items.length > 0)

  const allItems = visibleGroups.flatMap((group) => group.items)
  const checkedCount = allItems.filter((item) => checkedKeys.has(item.key)).length
  const pantryCount = Object.values(groups)
    .flat()
    .filter((item) => pantryKeys.has(item.key)).length

  return (
    <section className="shopping-list">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Generated from the plan</p>
          <h2>Shopping List</h2>
          <p>Ingredients are combined across planned recipes and grouped by store category.</p>
        </div>
        <div className="shopping-actions">
          <div className="scope-toggle">
            <button
              className={scope === 'current' ? 'active' : ''}
              type="button"
              onClick={() => onScopeChange('current')}
            >
              Current week
            </button>
            <button
              className={scope === 'all' ? 'active' : ''}
              type="button"
              onClick={() => onScopeChange('all')}
            >
              All weeks
            </button>
          </div>
          <label className="toggle-row compact">
            <span>Hide pantry items</span>
            <input
              type="checkbox"
              checked={excludePantry}
              onChange={(event) => onToggleExcludePantry(event.target.checked)}
            />
            <span className="toggle-ui" aria-hidden="true" />
          </label>
          <button className="secondary-button" type="button" onClick={onClearChecked} disabled={checkedCount === 0}>
            Clear checked
          </button>
        </div>
      </div>

      <div className="shopping-progress">
        <div className="progress-bar">
          <span style={{ width: `${allItems.length ? (checkedCount / allItems.length) * 100 : 0}%` }} />
        </div>
        <p>
          {checkedCount} of {allItems.length} items checked{pantryCount ? ` · ${pantryCount} in pantry` : ''}
        </p>
      </div>

      {visibleGroups.length ? (
        <div className="shopping-groups">
          {visibleGroups.map((group) => (
            <div className="shopping-group" key={group.category}>
              <h3>{group.category}</h3>
              <ul>
                {group.items.map((item) => (
                  <li className={checkedKeys.has(item.key) ? 'shopping-item checked' : 'shopping-item'} key={item.key}>
                    <label className="shopping-item__check">
                      <input
                        type="checkbox"
                        checked={checkedKeys.has(item.key)}
                        onChange={() => onToggleItem(item.key)}
                      />
                      <span className="checkmark" aria-hidden="true" />
                    </label>
                    <div className="shopping-item__main">
                      <strong>{item.name}</strong>
                      <span>{item.quantityText}</span>
                      {item.optional ? <em>Optional</em> : null}
                      {item.recipeTitles?.length ? <small>Used in: {item.recipeTitles.join(', ')}</small> : null}
                    </div>
                    <button
                      className={pantryKeys.has(item.key) ? 'pantry-button active' : 'pantry-button'}
                      type="button"
                      onClick={() => onTogglePantry(item.key)}
                      title="Mark as already in pantry"
                    >
                      {pantryKeys.has(item.key) ? 'In pantry' : 'Have it'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">🛒</div>
          <h3>Nothing to shop for</h3>
          <p>Assign recipes to the weekly plan to generate a shopping list.</p>
        </div>
      )}
    </section>
  )
}
