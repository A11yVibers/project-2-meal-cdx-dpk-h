import recipesCsv from '../project-assets/recipes.csv?raw'
import recipeIngredientsCsv from '../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../project-assets/recipe_steps.csv?raw'
import cuisinesCsv from '../project-assets/cuisines.csv?raw'
import dietaryTagsCsv from '../project-assets/dietary_tags.csv?raw'
import mealTypesCsv from '../project-assets/meal_types.csv?raw'
import recipeCategoriesCsv from '../project-assets/recipe_categories.csv?raw'
import ingredientsCsv from '../project-assets/ingredients.csv?raw'
import unitsCsv from '../project-assets/units.csv?raw'
import { APPROVED_IMAGES } from './approved-images.js'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(cell)
      if (row.some((value) => value.trim() !== '')) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    if (row.some((value) => value.trim() !== '')) rows.push(row)
  }

  return rows
}

function toObjects(text) {
  const rows = parseCsv(text)
  if (!rows.length) return []
  const headers = rows[0].map((header) => header.trim())
  return rows.slice(1).map((values) =>
    headers.reduce((object, header, index) => {
      object[header] = (values[index] ?? '').trim()
      return object
    }, {}),
  )
}

function toMap(text, idKey, valueKey) {
  return Object.fromEntries(
    toObjects(text).map((row) => [row[idKey], row[valueKey]]),
  )
}

function boolValue(value) {
  if (typeof value === 'boolean') return value
  return String(value ?? '').trim().toLowerCase() === 'true'
}

function numberValue(value, fallback = 0) {
  const number = Number.parseFloat(value)
  return Number.isFinite(number) ? number : fallback
}

function splitIds(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const cuisineRows = toObjects(cuisinesCsv)
const mealTypeRows = toObjects(mealTypesCsv)
const dietaryTagRows = toObjects(dietaryTagsCsv)
const categoryRows = toObjects(recipeCategoriesCsv)
const ingredientRows = toObjects(ingredientsCsv)
const unitRows = toObjects(unitsCsv)

export const LOOKUPS = Object.freeze({
  cuisines: Object.fromEntries(cuisineRows.map((row) => [row.cuisine_id, row.cuisine_name])),
  mealTypes: Object.fromEntries(mealTypeRows.map((row) => [row.meal_type_id, row.meal_type_name])),
  dietaryTags: Object.fromEntries(dietaryTagRows.map((row) => [row.dietary_tag_id, row.dietary_tag_name])),
  categories: Object.fromEntries(categoryRows.map((row) => [row.category_id, row.category_name])),
  units: Object.fromEntries(unitRows.map((row) => [row.unit_id, row.unit_name])),
  ingredients: Object.fromEntries(
    ingredientRows.map((row) => [
      row.ingredient_id,
      {
        id: row.ingredient_id,
        name: row.ingredient_name,
        category: row.shopping_category,
      },
    ]),
  ),
})

export const CUISINES = cuisineRows.map((row) => ({ id: row.cuisine_id, name: row.cuisine_name }))
export const MEAL_TYPES = mealTypeRows.map((row) => ({ id: row.meal_type_id, name: row.meal_type_name }))
export const DIETARY_TAGS = dietaryTagRows.map((row) => ({ id: row.dietary_tag_id, name: row.dietary_tag_name }))
export const CATEGORIES = categoryRows.map((row) => ({ id: row.category_id, name: row.category_name }))
export const UNITS = unitRows.map((row) => ({ id: row.unit_id, name: row.unit_name }))
export const INGREDIENTS = ingredientRows.map((row) => ({
  id: row.ingredient_id,
  name: row.ingredient_name,
  category: row.shopping_category,
}))

export const SHOPPING_CATEGORY_ORDER = Object.freeze([
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
])

export const RECIPE_OPTION_DEFAULTS = Object.freeze({
  includeInShoppingList: true,
  showNutrition: false,
  allowSubstitutions: false,
  measurementSystem: 'us',
})

export function findIngredientByName(name) {
  const normalized = String(name ?? '').trim().toLowerCase()
  if (!normalized) return null
  const match = INGREDIENTS.find((item) => item.name.toLowerCase() === normalized)
  if (match) return match
  return { id: null, name: String(name).trim(), category: 'Grains & pantry' }
}

export function ingredientShoppingCategory(name, fallback = 'Grains & pantry') {
  return findIngredientByName(name)?.category || fallback
}

export function getSeedRecipes() {
  const ingredientsByRecipe = new Map()
  toObjects(recipeIngredientsCsv).forEach((row) => {
    const list = ingredientsByRecipe.get(row.recipe_id) || []
    list.push({
      id: `${row.recipe_id}-${row.display_order}`,
      section: row.section_name,
      ingredientId: row.ingredient_id,
      name: row.ingredient_name,
      quantity: row.quantity,
      unit: row.unit,
      notes: row.notes,
      optional: boolValue(row.optional),
    })
    ingredientsByRecipe.set(row.recipe_id, list)
  })

  const stepsByRecipe = new Map()
  toObjects(recipeStepsCsv).forEach((row) => {
    const list = stepsByRecipe.get(row.recipe_id) || []
    list.push({
      id: `${row.recipe_id}-${row.step_number}`,
      instruction: row.instruction,
      timerMinutes: numberValue(row.timer_minutes),
    })
    stepsByRecipe.set(row.recipe_id, list)
  })

  return toObjects(recipesCsv).map((row) => {
    const recipeId = row.recipe_id
    return {
      id: recipeId,
      source: 'seed',
      title: row.title,
      shortDescription: row.short_description,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      servings: numberValue(row.servings, 1),
      prepTimeMinutes: numberValue(row.prep_time_minutes),
      cookTimeMinutes: numberValue(row.cook_time_minutes),
      totalTimeMinutes: numberValue(row.total_time_minutes),
      cuisineId: row.cuisine_id,
      mealTypeId: row.meal_type_id,
      dietaryTagIds: splitIds(row.dietary_tag_ids),
      categoryIds: splitIds(row.category_ids),
      difficulty: numberValue(row.difficulty_1_to_5, 1),
      spiceLevel: numberValue(row.spice_level_0_to_5),
      accentColor: row.accent_color || '#D97757',
      coverImageUrl: row.cover_image_url,
      includeInMealSuggestions: boolValue(row.include_in_meal_suggestions),
      ...RECIPE_OPTION_DEFAULTS,
      ingredients: ingredientsByRecipe.get(recipeId) || [],
      steps: stepsByRecipe.get(recipeId) || [],
    }
  })
}

export function createEmptyRecipe() {
  return {
    id: `user-${Date.now()}`,
    source: 'user',
    title: '',
    shortDescription: '',
    sourceName: '',
    sourceUrl: '',
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    totalTimeMinutes: 30,
    cuisineId: 'CU15',
    mealTypeId: 'MT03',
    dietaryTagIds: [],
    categoryIds: [],
    difficulty: 2,
    spiceLevel: 2,
    accentColor: '#D97757',
    coverImageUrl: '',
    includeInMealSuggestions: true,
    ...RECIPE_OPTION_DEFAULTS,
    ingredients: [
      {
        id: `ing-${Date.now()}-1`,
        section: 'Main',
        ingredientId: null,
        name: '',
        quantity: '1',
        unit: 'cup',
        notes: '',
        optional: false,
      },
    ],
    steps: [{ id: `step-${Date.now()}-1`, instruction: '', timerMinutes: 0 }],
  }
}
