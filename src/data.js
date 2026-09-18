import recipesCsv from '../project-assets/recipes.csv?raw'
import recipeIngredientsCsv from '../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../project-assets/recipe_steps.csv?raw'
import ingredientsCsv from '../project-assets/ingredients.csv?raw'
import unitsCsv from '../project-assets/units.csv?raw'
import cuisinesCsv from '../project-assets/cuisines.csv?raw'
import mealTypesCsv from '../project-assets/meal_types.csv?raw'
import dietaryTagsCsv from '../project-assets/dietary_tags.csv?raw'
import recipeCategoriesCsv from '../project-assets/recipe_categories.csv?raw'
import { APPROVED_IMAGES } from './approved-images.js'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder
export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices'
]

export const MEASURE_SYSTEMS = {
  US: 'US customary measurements',
  METRIC: 'Metric measurements'
}

const TRUE_LIKE = new Set(['true', '1', 'yes', 'y', 'falsefalse'])
export const defaultOptions = () => ({
  includeInShoppingList: true,
  showNutrition: true,
  allowSubstitutions: false,
  measurementSystem: 'US'
})

export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') {
      field += ch
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function recordsFromCsv(text) {
  const rows = parseCsv(text.trim())
  if (!rows.length) return []
  const headers = rows[0]
  return rows.slice(1).filter((row) => row.some((cell) => cell.trim())).map((row) => {
    const record = {}
    headers.forEach((header, index) => {
      record[header] = row[index] === undefined ? '' : row[index].trim()
    })
    return record
  })
}

const rawIngredients = recordsFromCsv(ingredientsCsv)
const rawUnits = recordsFromCsv(unitsCsv)
const rawCuisines = recordsFromCsv(cuisinesCsv)
const rawMealTypes = recordsFromCsv(mealTypesCsv)
const rawDietaryTags = recordsFromCsv(dietaryTagsCsv)
const rawCategories = recordsFromCsv(recipeCategoriesCsv)

export const INGREDIENTS = rawIngredients
export const UNITS = rawUnits.map((item) => item.unit_name)
export const CUISINES = rawCuisines
export const MEAL_TYPES = rawMealTypes
export const DIETARY_TAGS = rawDietaryTags
export const RECIPE_CATEGORIES = rawCategories

const ingredientById = new Map(rawIngredients.map((item) => [item.ingredient_id, item]))
const ingredientByName = new Map(rawIngredients.map((item) => [normalizeIngredient(item.ingredient_name), item]))

export function normalizeIngredient(name = '') {
  return String(name).trim().toLowerCase().replace(/\s+/g, ' ')
}

export function findIngredient(ingredientId = '') {
  if (ingredientId) return ingredientById.get(ingredientId) || null
  return null
}

export function lookupIngredientByName(name = '') {
  return ingredientByName.get(normalizeIngredient(name)) || null
}

export function getCuisine(cuisineId = '') {
  return rawCuisines.find((item) => item.cuisine_id === cuisineId)
}

export function getMealType(mealTypeId = '') {
  return rawMealTypes.find((item) => item.meal_type_id === mealTypeId)
}

export function getDietaryTag(dietaryTagId = '') {
  return rawDietaryTags.find((item) => item.dietary_tag_id === dietaryTagId)
}

export function getRecipeCategory(categoryId = '') {
  return rawCategories.find((item) => item.category_id === categoryId)
}

function splitIds(value = '') {
  return String(value).split(',').map((part) => part.trim()).filter(Boolean)
}

function buildSeedRecipes() {
  const recipeIngredientRows = recordsFromCsv(recipeIngredientsCsv)
  const stepRows = recordsFromCsv(recipeStepsCsv)
  const recipes = recordsFromCsv(recipesCsv)

  return recipes.map((recipe) => {
    const ingredientRows = recipeIngredientRows
      .filter((row) => row.recipe_id === recipe.recipe_id)
      .sort((a, b) => Number(a.display_order) - Number(b.display_order))

    const sections = []
    ingredientRows.forEach((row) => {
      let section = sections.find((item) => item.name === row.section_name)
      if (!section) {
        section = { name: row.section_name || 'Main', ingredients: [] }
        sections.push(section)
      }
      const matched = findIngredient(row.ingredient_id)
      section.ingredients.push({
        key: `${row.recipe_id}-${row.display_order}`,
        ingredientId: row.ingredient_id || '',
        name: row.ingredient_name || matched?.ingredient_name || '',
        shoppingCategory: matched?.shopping_category || 'Other',
        quantity: row.quantity || '',
        unit: row.unit || '',
        notes: row.notes || '',
        optional: String(row.optional).toLowerCase() === 'true'
      })
    })

    const steps = stepRows
      .filter((row) => row.recipe_id === recipe.recipe_id)
      .sort((a, b) => Number(a.step_number) - Number(b.step_number))
      .map((row, index) => ({
        key: `${recipe.recipe_id}-${row.step_number}`,
        number: index + 1,
        instruction: row.instruction || '',
        timerMinutes: Math.max(0, Number(row.timer_minutes) || 0)
      }))

    return normalizeRecipe({
      id: recipe.recipe_id,
      title: recipe.title,
      shortDescription: recipe.short_description || '',
      sourceName: recipe.source_name || '',
      sourceUrl: recipe.source_url || '',
      servings: Number(recipe.servings) || 1,
      prepTimeMinutes: Number(recipe.prep_time_minutes) || 0,
      cookTimeMinutes: Number(recipe.cook_time_minutes) || 0,
      totalTimeMinutes: Number(recipe.total_time_minutes) || 0,
      cuisineId: recipe.cuisine_id || '',
      mealTypeId: recipe.meal_type_id || '',
      dietaryTagIds: splitIds(recipe.dietary_tag_ids),
      categoryIds: splitIds(recipe.category_ids),
      difficulty: Number(recipe.difficulty_1_to_5) || 0,
      spiceLevel: Number(recipe.spice_level_0_to_5) || 0,
      accentColor: recipe.accent_color || '#D9A441',
      coverImageUrl: recipe.cover_image_url || PLACEHOLDER_IMAGE,
      includeInMealSuggestions: String(recipe.include_in_meal_suggestions).toLowerCase() === 'true',
      ingredientSections: sections,
      steps,
      isUser: false,
      options: defaultOptions()
    })
  })
}

export const SEED_RECIPES = buildSeedRecipes()

export function normalizeRecipe(recipe) {
  const options = { ...defaultOptions(), ...(recipe.options || {}) }
  return {
    ...recipe,
    servings: Number(recipe.servings) || 1,
    prepTimeMinutes: Number(recipe.prepTimeMinutes) || 0,
    cookTimeMinutes: Number(recipe.cookTimeMinutes) || 0,
    totalTimeMinutes: Number(recipe.totalTimeMinutes) || (Number(recipe.prepTimeMinutes) || 0) + (Number(recipe.cookTimeMinutes) || 0),
    dietaryTagIds: recipe.dietaryTagIds || [],
    categoryIds: recipe.categoryIds || [],
    ingredientSections: (recipe.ingredientSections || []).map((section) => ({
      ...section,
      ingredients: (section.ingredients || []).map((ingredient) => ({
        ...ingredient,
        optional: Boolean(ingredient.optional)
      }))
    })),
    steps: (recipe.steps || []).map((step, index) => ({
      ...step,
      number: index + 1,
      timerMinutes: Math.max(0, Number(step.timerMinutes) || 0)
    })),
    options
  }
}

export function formatTotalTime(minutes) {
  const total = Math.max(0, Number(minutes) || 0)
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const mins = total % 60
  return mins ? `${hours}h ${mins}m` : `${hours}h`
}

export function spiceLabel(level) {
  const spice = Math.min(5, Math.max(0, Number(level) || 0))
  return ['Mild', 'Mild', 'Medium', 'Medium hot', 'Hot', 'Very spicy'][spice]
}

export function displayQuantity(recipe, ingredient) {
  const quantity = ingredient.quantity || ''
  const unit = ingredient.unit || ''
  const metric = recipe.options?.measurementSystem === 'METRIC'

  if (!quantity) return ''

  if (metric) {
    const converted = convertToMetric(quantity, unit)
    if (converted) return converted
  }
  return [quantity, unit].filter(Boolean).join(' ').trim()
}

const IMPERIAL_TO_METRIC = {
  oz: 28.35,
  lb: 453.592,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  fl_oz: 29.5735,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,
  inch: 2.54,
  piece: null,
  clove: null,
  can: null,
  package: null,
  pinch: null,
  'to taste': null
}

function numberFromQuantity(value) {
  const parsed = Number(value)
  if (Number.isFinite(parsed)) return parsed
  const range = String(value).split('-')
  if (range.length === 2) {
    const first = Number(range[0])
    if (Number.isFinite(first)) return first
  }
  return null
}

function convertToMetric(quantity, unit) {
  const factor = IMPERIAL_TO_METRIC[String(unit).toLowerCase()]
  if (!factor) return null
  const number = numberFromQuantity(quantity)
  if (number === null) return null
  const metricQuantity = number * factor
  const rounded = metricQuantity < 100 ? Math.round(metricQuantity * 10) / 10 : Math.round(metricQuantity)
  if (unit === 'oz' || unit === 'lb' || unit === 'g') return `${rounded} g`
  if (unit === 'cup' || unit === 'tbsp' || unit === 'tsp' || unit === 'fl_oz' || unit === 'pint' || unit === 'quart') return `${rounded} ml`
  return `${rounded} ${unit}`
}

export function makeKey(prefix = 'item') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function loadLocal(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key)
    if (stored == null) return fallback
    const parsed = JSON.parse(stored)
    return parsed === undefined ? fallback : parsed
  } catch {
    return fallback
  }
}

export function saveLocal(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage errors (private browsing or quota) and keep in-memory state.
  }
}

export function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(key = '') {
  const [year, month, day] = String(key).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function startOfWeek(date = new Date(), startMonday = true) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = result.getDay()
  const daysToStart = startMonday ? (day === 0 ? 6 : day - 1) : day
  result.setDate(result.getDate() - daysToStart)
  result.setHours(0, 0, 0, 0)
  return result
}

export function weekDates(startDate) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + index)
    return date
  })
}

export function formatDateLabel(date) {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function formatDateLong(date) {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
