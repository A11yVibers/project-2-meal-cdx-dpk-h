import { MEASURE_SYSTEMS } from '../data.js'

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="option-toggle-row">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className={`toggle-control${checked ? ' on' : ''}`} aria-hidden="true"><span /></span>
    </label>
  )
}

export default function RecipeOptionsMenu({ options, onChange }) {
  const update = (patch) => onChange({ ...options, ...patch })

  return (
    <div className="recipe-options-menu">
      <h3>Recipe Options</h3>
      <ToggleRow
        label="Shopping list"
        description="Include ingredients in generated shopping lists"
        checked={options.includeInShoppingList !== false}
        onChange={(value) => update({ includeInShoppingList: value })}
      />
      <ToggleRow
        label="Nutrition"
        description="Show nutrition information"
        checked={options.showNutrition !== false}
        onChange={(value) => update({ showNutrition: value })}
      />
      <ToggleRow
        label="Substitutions"
        description="Allow ingredient substitutions"
        checked={options.allowSubstitutions === true}
        onChange={(value) => update({ allowSubstitutions: value })}
      />

      <fieldset className="measurement-fieldset">
        <legend>Measurements</legend>
        {Object.entries(MEASURE_SYSTEMS).map(([value, label]) => (
          <label key={value} className={`radio-card${options.measurementSystem === value ? ' selected' : ''}`}>
            <input
              type="radio"
              name="measurement-system"
              value={value}
              checked={options.measurementSystem === value}
              onChange={() => update({ measurementSystem: value })}
            />
            <span>{label}</span>
            <span className="radio-mark">{options.measurementSystem === value ? '●' : '○'}</span>
          </label>
        ))}
      </fieldset>
    </div>
  )
}
