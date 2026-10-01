import cuisinesCsv from '../../project-assets/cuisines.csv?raw'
import dietaryTagsCsv from '../../project-assets/dietary_tags.csv?raw'
import ingredientsCsv from '../../project-assets/ingredients.csv?raw'
import mealTypesCsv from '../../project-assets/meal_types.csv?raw'
import recipeCategoriesCsv from '../../project-assets/recipe_categories.csv?raw'
import recipeIngredientsCsv from '../../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../../project-assets/recipe_steps.csv?raw'
import recipesCsv from '../../project-assets/recipes.csv?raw'
import unitsCsv from '../../project-assets/units.csv?raw'
import { parseCsv, splitIds, boolFromText } from './csv.js'

const toNumber = (value) => {
  const number = Number.parseFloat(value)
  return Number.isFinite(number) ? number : 0
}

const asTextArray = (rows, idField, labelField) =>
  rows.map((row) => ({ id: row[idField], name: row[labelField] }))

export const LOOKUPS = {
  cuisines: asTextArray(parseCsv(cuisinesCsv), 'cuisine_id', 'cuisine_name'),
  dietaryTags: asTextArray(parseCsv(dietaryTagsCsv), 'dietary_tag_id', 'dietary_tag_name'),
  mealTypes: asTextArray(parseCsv(mealTypesCsv), 'meal_type_id', 'meal_type_name'),
  categories: asTextArray(parseCsv(recipeCategoriesCsv), 'category_id', 'category_name'),
  units: asTextArray(parseCsv(unitsCsv), 'unit_id', 'unit_name'),
}

export const INGREDIENTS = parseCsv(ingredientsCsv).map((row) => ({
  id: row.ingredient_id,
  name: row.ingredient_name,
  shoppingCategory: row.shopping_category,
}))

export const PLANNER_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
]

export function loadSeedRecipes() {
  const recipeRows = parseCsv(recipesCsv)
  const ingredientRows = parseCsv(recipeIngredientsCsv)
  const stepRows = parseCsv(recipeStepsCsv)

  const ingredientsByRecipe = new Map()
  ingredientRows.forEach((row) => {
    if (!ingredientsByRecipe.has(row.recipe_id)) ingredientsByRecipe.set(row.recipe_id, [])
    ingredientsByRecipe.get(row.recipe_id).push({
      sectionName: row.section_name || 'Main',
      ingredientId: row.ingredient_id || null,
      ingredientName: row.ingredient_name,
      quantity: row.quantity ? Number.parseFloat(row.quantity) : 0,
      quantityText: row.quantity || '',
      unit: row.unit || '',
      notes: row.notes || '',
      optional: boolFromText(row.optional),
    })
  })

  const stepsByRecipe = new Map()
  stepRows.forEach((row) => {
    if (!stepsByRecipe.has(row.recipe_id)) stepsByRecipe.set(row.recipe_id, [])
    stepsByRecipe.get(row.recipe_id).push({
      instruction: row.instruction,
      timerMinutes: toNumber(row.timer_minutes),
    })
  })

  return recipeRows.map((row) => ({
    id: row.recipe_id,
    userCreated: false,
    title: row.title,
    shortDescription: row.short_description,
    sourceName: row.source_name || '',
    sourceUrl: row.source_url || '',
    servings: toNumber(row.servings),
    prepTimeMinutes: toNumber(row.prep_time_minutes),
    cookTimeMinutes: toNumber(row.cook_time_minutes),
    totalTimeMinutes: toNumber(row.total_time_minutes),
    cuisineId: row.cuisine_id || '',
    mealTypeId: row.meal_type_id || '',
    dietaryTagIds: splitIds(row.dietary_tag_ids),
    categoryIds: splitIds(row.category_ids),
    difficulty: toNumber(row.difficulty_1_to_5),
    spiceLevel: toNumber(row.spice_level_0_to_5),
    accentColor: row.accent_color || '#8A9A5B',
    coverImageUrl: row.cover_image_url || '',
    includeInMealSuggestions: boolFromText(row.include_in_meal_suggestions),
    ingredients: (ingredientsByRecipe.get(row.recipe_id) || []).sort(
      (a, b) => toNumber(a.displayOrder || 0) - toNumber(b.displayOrder || 0),
    ),
    steps: (stepsByRecipe.get(row.recipe_id) || []).sort(
      (a, b) => toNumber(a.stepNumber || 0) - toNumber(b.stepNumber || 0),
    ),
    options: {
      includeInShoppingList: true,
      showNutrition: true,
      allowSubstitutions: false,
      measurementSystem: 'us',
    },
  }))
}

export function formatDecimal(value) {
  if (value === '' || value === null || value === undefined) return ''
  const number = Number.parseFloat(value)
  if (!Number.isFinite(number)) return String(value)
  return String(number).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

export function landmarksForLookup(name, lookups) {
  const record = lookups.find((item) => item.id === name)
  return record ? record.name : name || '—'
}
