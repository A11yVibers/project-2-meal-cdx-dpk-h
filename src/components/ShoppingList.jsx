import { useMemo } from 'react'
import { buildShoppingList } from '../lib/shopping.js'
import { formatWeekRange } from '../lib/dates.js'
import { EmptyState, Pill } from './ui.jsx'
import Icon from './Icon.jsx'

export default function ShoppingList({
  days,
  mealPlan,
  recipes,
  checkedItems,
  onToggleChecked,
  pantryItems,
  onTogglePantry,
  hidePantry,
  onToggleHidePantry,
  onClearChecked,
  onGoPlanner,
}) {
  const groups = useMemo(
    () => buildShoppingList(days, mealPlan, recipes),
    [days, mealPlan, recipes],
  )

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !hidePantry || !pantryItems[item.key]),
    }))
    .filter((group) => group.items.length > 0)

  const totalItems = visibleGroups.reduce((total, group) => total + group.items.length, 0)
  const totalChecked = visibleGroups.reduce((total, group) => (
    total + group.items.filter((item) => checkedItems[item.key]).length
  ), 0)
  const hiddenPantryCount = groups.reduce((total, group) => (
    total + group.items.filter((item) => pantryItems[item.key]).length
  ), 0)

  return (
    <div className="shopping-page">
      <div className="shopping-toolbar">
        <div>
          <h1>Shopping list</h1>
          <p className="shopping-week-range">Auto-generated from the week of {formatWeekRange(days)}</p>
        </div>
        <div className="shopping-toolbar-actions">
          <button type="button" className="button button-ghost" onClick={onGoPlanner}>
            <Icon name="calendar" size={16} /> Edit plan
          </button>
          {totalChecked > 0 ? (
            <button type="button" className="button button-ghost" onClick={onClearChecked}>
              Clear checked items
            </button>
          ) : null}
        </div>
      </div>

      <div className="shopping-summary">
        <div><strong>{totalItems}</strong><span>items to shop</span></div>
        <div><strong>{totalChecked}</strong><span>checked off</span></div>
        <div><strong>{groups.reduce((sum, group) => sum + group.items.length, 0)}</strong><span>total needed</span></div>
        <Pill tone="neutral">
          <Icon name="cart" size={14} /> Pantry items are excluded when hidden
        </Pill>
      </div>

      <div className="shopping-controls">
        <label className="master-control toggle-master">
          <span className="switch-control">
            <input type="checkbox" checked={hidePantry} onChange={onToggleHidePantry} />
            <span className="switch-track"><span className="switch-thumb" /></span>
          </span>
          <span>
            <strong>Hide pantry items</strong>
            <small>{hiddenPantryCount} marked as already in pantry</small>
          </span>
        </label>
      </div>

      {visibleGroups.length ? (
        <div className="shopping-groups">
          {visibleGroups.map((group) => (
            <section className="shopping-group" key={group.category}>
              <header className="shopping-group-header">
                <h2>{group.category}</h2>
                <span>{group.items.length} item{group.items.length === 1 ? '' : 's'}</span>
              </header>
              <ul className="shopping-item-list">
                {group.items.map((item) => {
                  const checked = Boolean(checkedItems[item.key])
                  const inPantry = Boolean(pantryItems[item.key])
                  return (
                    <li className={`shopping-item ${checked ? 'is-checked' : ''}`} key={item.key}>
                      <label className="shopping-check">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleChecked(item.key)}
                        />
                        <span className="custom-check"><Icon name="check" size={14} /></span>
                      </label>
                      <span className="shopping-item-amount">{item.amount}</span>
                      <span className="shopping-item-name">{item.displayName}</span>
                      <button
                        type="button"
                        className={`pantry-button ${inPantry ? 'is-active' : ''}`}
                        aria-pressed={inPantry}
                        onClick={() => onTogglePantry(item.key)}
                        title={inPantry ? 'Already in pantry' : 'Mark as already in pantry'}
                      >
                        <Icon name={inPantry ? 'check' : 'menu'} size={14} /> {inPantry ? 'In pantry' : 'Pantry'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="cart"
          title="Nothing to shop for yet"
          action={<button type="button" className="button button-primary" onClick={onGoPlanner}>Plan a meal</button>}
        >
          Fill a weekly meal slot and the ingredients will appear here automatically.
        </EmptyState>
      )}
    </div>
  )
}
