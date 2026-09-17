import recipesCsv from '../project-assets/recipes.csv?raw'
import recipeIngredientsCsv from '../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../project-assets/recipe_steps.csv?raw'
import ingredientsCsv from '../project-assets/ingredients.csv?raw'
import cuisinesCsv from '../project-assets/cuisines.csv?raw'
import dietaryTagsCsv from '../project-assets/dietary_tags.csv?raw'
import mealTypesCsv from '../project-assets/meal_types.csv?raw'
import recipeCategoriesCsv from '../project-assets/recipe_categories.csv?raw'
import unitsCsv from '../project-assets/units.csv?raw'
import { APPROVED_IMAGES } from './approved-images.js'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

function parseCsv(source) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    const next = source[index + 1]

    if (char === '"' && quoted && next === '"') {
      field += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(field)
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  row.push(field)
  if (row.some((cell) => cell.trim() !== '')) rows.push(row)

  const [header, ...body] = rows
  return body.map((cells) =>
    Object.fromEntries(header.map((key, columnIndex) => [key.trim(), (cells[columnIndex] ?? '').trim()])),
  )
}

function splitIdList(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toBoolean(value) {
  return String(value).toLowerCase() === 'true' || value === true
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const cuisines = parseCsv(cuisinesCsv)
const dietaryTags = parseCsv(dietaryTagsCsv)
const mealTypes = parseCsv(mealTypesCsv)
const recipeCategories = parseCsv(recipeCategoriesCsv)
const units = parseCsv(unitsCsv)
const ingredients = parseCsv(ingredientsCsv)

export const CUISINES = cuisines
export const DIETARY_TAGS = dietaryTags
export const MEAL_TYPES = mealTypes
export const RECIPE_CATEGORIES = recipeCategories
export const UNITS = units
export const INGREDIENTS = ingredients
export const PLANNER_MEAL_TYPES = mealTypes.slice(0, 4)

export function getCuisineName(id) {
  return cuisines.find((cuisine) => cuisine.cuisine_id === id)?.cuisine_name || 'Uncategorized'
}

export function getDietaryTagName(id) {
  return dietaryTags.find((tag) => tag.dietary_tag_id === id)?.dietary_tag_name || id
}

export function getMealTypeName(id) {
  return mealTypes.find((type) => type.meal_type_id === id)?.meal_type_name || 'Uncategorized'
}

export function getCategoryName(id) {
  return recipeCategories.find((category) => category.category_id === id)?.category_name || id
}

export function getUnitName(idOrName) {
  if (!idOrName) return ''
  const match = units.find((unit) => unit.unit_id === idOrName || unit.unit_name === idOrName)
  return match?.unit_name || idOrName
}

export function getIngredientCategory(name) {
  const normalized = String(name || '').trim().toLowerCase()
  const match = ingredients.find(
    (ingredient) => ingredient.ingredient_name.trim().toLowerCase() === normalized,
  )
  return match?.shopping_category || 'Other'
}

export function getIngredientSuggestion(name) {
  const normalized = String(name || '').trim().toLowerCase()
  return ingredients.find((ingredient) => ingredient.ingredient_name.trim().toLowerCase() === normalized) || null
}

function groupRecipeIngredients(rows) {
  const sections = []
  const sectionMap = new Map()

  rows.forEach((row) => {
    const sectionName = row.section_name || 'Main'
    if (!sectionMap.has(sectionName)) {
      const section = { id: `${sectionName}-${sectionMap.size}`, name: sectionName, ingredients: [] }
      sectionMap.set(sectionName, section)
      sections.push(section)
    }

    const section = sectionMap.get(sectionName)
    section.ingredients.push({
      id: `${row.recipe_id}-${row.display_order}`,
      ingredientId: row.ingredient_id || '',
      name: row.ingredient_name || '',
      quantity: row.quantity || '',
      unit: row.unit || '',
      notes: row.notes || '',
      optional: toBoolean(row.optional),
    })
  })

  return sections
}

function buildSeedRecipes() {
  const recipeRows = parseCsv(recipesCsv)
  const recipeIngredientRows = parseCsv(recipeIngredientsCsv)
  const recipeStepRows = parseCsv(recipeStepsCsv)

  return recipeRows.map((row) => {
    const prep = toNumber(row.prep_time_minutes)
    const cook = toNumber(row.cook_time_minutes)
    const total = toNumber(row.total_time_minutes, prep + cook)

    return {
      id: row.recipe_id,
      isSeed: true,
      title: row.title || 'Untitled recipe',
      shortDescription: row.short_description || '',
      sourceName: row.source_name || '',
      sourceUrl: row.source_url || '',
      servings: toNumber(row.servings, 1),
      prepTimeMinutes: prep,
      cookTimeMinutes: cook,
      totalTimeMinutes: total,
      cuisineId: row.cuisine_id || '',
      mealTypeId: row.meal_type_id || '',
      dietaryTagIds: splitIdList(row.dietary_tag_ids),
      categoryIds: splitIdList(row.category_ids),
      difficulty: toNumber(row.difficulty_1_to_5, 1),
      spiceLevel: toNumber(row.spice_level_0_to_5, 0),
      accentColor: row.accent_color || '#7A9E7E',
      coverImageUrl: row.cover_image_url || PLACEHOLDER_IMAGE,
      includeInMealSuggestions: toBoolean(row.include_in_meal_suggestions),
      includeInShoppingList: true,
      showNutrition: false,
      allowSubstitutions: false,
      measurementSystem: 'us',
      ingredients: groupRecipeIngredients(
        recipeIngredientRows.filter((ingredient) => ingredient.recipe_id === row.recipe_id),
      ),
      steps: recipeStepRows
        .filter((step) => step.recipe_id === row.recipe_id)
        .sort((a, b) => toNumber(a.step_number) - toNumber(b.step_number))
        .map((step, index) => ({
          id: `${row.recipe_id}-step-${index + 1}`,
          instruction: step.instruction || '',
          timerMinutes: toNumber(step.timer_minutes),
        })),
    }
  })
}

export const SEED_RECIPES = buildSeedRecipes()

export const APPROVED_COVER_OPTIONS = [
  { label: 'Placeholder', value: PLACEHOLDER_IMAGE },
  ...SEED_RECIPES.filter((recipe) => recipe.coverImageUrl !== PLACEHOLDER_IMAGE).map((recipe) => ({
    label: recipe.title,
    value: recipe.coverImageUrl,
  })),
]

export function formatMinutes(minutes) {
  const value = Number(minutes) || 0
  if (value < 60) return `${value} min`
  const hours = Math.floor(value / 60)
  const remainder = value % 60
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`
}

export function createEmptyRecipe() {
  return {
    id: '',
    isSeed: false,
    title: '',
    shortDescription: '',
    sourceName: '',
    sourceUrl: '',
    servings: 4,
    prepTimeMinutes: 0,
    cookTimeMinutes: 0,
    totalTimeMinutes: 0,
    cuisineId: '',
    mealTypeId: '',
    dietaryTagIds: [],
    categoryIds: [],
    difficulty: 2,
    spiceLevel: 2,
    accentColor: '#7A9E7E',
    coverImageUrl: '',
    includeInMealSuggestions: true,
    includeInShoppingList: true,
    showNutrition: false,
    allowSubstitutions: false,
    measurementSystem: 'us',
    ingredients: [],
    steps: [],
  }
}
