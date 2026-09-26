import recipesCsv from '../project-assets/recipes.csv?raw'
import recipeIngredientsCsv from '../project-assets/recipe_ingredients.csv?raw'
import recipeStepsCsv from '../project-assets/recipe_steps.csv?raw'
import cuisinesCsv from '../project-assets/cuisines.csv?raw'
import dietaryTagsCsv from '../project-assets/dietary_tags.csv?raw'
import ingredientsCsv from '../project-assets/ingredients.csv?raw'
import mealTypesCsv from '../project-assets/meal_types.csv?raw'
import recipeCategoriesCsv from '../project-assets/recipe_categories.csv?raw'
import unitsCsv from '../project-assets/units.csv?raw'
import { APPROVED_IMAGES } from './approved-images.js'

export const PLACEHOLDER_IMAGE = APPROVED_IMAGES.placeholder

export function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  const input = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      field = ''
      if (row.some((cell) => cell.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += char
    }
  }

  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((cell) => cell.trim() !== '')) rows.push(row)
  }

  if (!rows.length) return []
  const headers = rows[0].map((header) => header.trim())
  return rows.slice(1).map((cells) => {
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = (cells[index] ?? '').trim()
    })
    return obj
  })
}

const rows = {
  cuisines: parseCSV(cuisinesCsv),
  dietaryTags: parseCSV(dietaryTagsCsv),
  ingredients: parseCSV(ingredientsCsv),
  mealTypes: parseCSV(mealTypesCsv),
  recipeCategories: parseCSV(recipeCategoriesCsv),
  units: parseCSV(unitsCsv),
  ingredientLinks: parseCSV(recipeIngredientsCsv),
  stepLinks: parseCSV(recipeStepsCsv),
  recipes: parseCSV(recipesCsv),
}

const listToMap = (list, idKey, nameKey) =>
  Object.fromEntries(list.map((item) => [item[idKey], item[nameKey]]))

export const lookups = {
  cuisines: listToMap(rows.cuisines, 'cuisine_id', 'cuisine_name'),
  dietaryTags: listToMap(rows.dietaryTags, 'dietary_tag_id', 'dietary_tag_name'),
  mealTypes: listToMap(rows.mealTypes, 'meal_type_id', 'meal_type_name'),
  categories: listToMap(rows.recipeCategories, 'category_id', 'category_name'),
}

export const cuisineOptions = rows.cuisines
export const dietaryTagOptions = rows.dietaryTags
export const mealTypeOptions = rows.mealTypes
export const categoryOptions = rows.recipeCategories
export const ingredientOptions = rows.ingredients.map((item) => ({
  id: item.ingredient_id,
  name: item.ingredient_name,
  category: item.shopping_category || 'Other',
}))
export const unitOptions = rows.units.map((item) => item.unit_name)
export const ingredientCategoryMap = Object.fromEntries(
  rows.ingredients.map((item) => [item.ingredient_name.toLowerCase(), item.shopping_category || 'Other']),
)

export const SHOPPING_CATEGORY_ORDER = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Grains & pantry',
  'Oils & condiments',
  'Canned & jarred',
  'Spices',
  'Other',
]

const getCsvFlag = (value, fallback = true) => {
  if (typeof value === 'boolean') return value
  const normalized = String(value || '').toLowerCase()
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true
  return fallback
}

const getNumber = (value, fallback = 0) => {
  const num = Number.parseFloat(value)
  return Number.isFinite(num) ? num : fallback
}

const getImageUrl = (url) => (String(url || '').trim() ? String(url).trim() : PLACEHOLDER_IMAGE)

function buildSeedRecipes() {
  const ingredientByRecipe = {}
  rows.ingredientLinks.forEach((link) => {
    const key = link.recipe_id
    if (!ingredientByRecipe[key]) ingredientByRecipe[key] = []
    ingredientByRecipe[key].push({
      displayOrder: getNumber(link.display_order, 0),
      sectionName: link.section_name || 'Main',
      ingredientId: link.ingredient_id || '',
      name: link.ingredient_name || '',
      quantity: link.quantity || '',
      unit: link.unit || '',
      notes: link.notes || '',
      optional: getCsvFlag(link.optional, false),
    })
  })

  const stepsByRecipe = {}
  rows.stepLinks.forEach((link) => {
    const key = link.recipe_id
    if (!stepsByRecipe[key]) stepsByRecipe[key] = []
    stepsByRecipe[key].push({
      stepNumber: getNumber(link.step_number, 1),
      instruction: link.instruction || '',
      timerMinutes: getNumber(link.timer_minutes, 0),
    })
  })

  return rows.recipes.map((recipe) => {
    const ingredientLinks = (ingredientByRecipe[recipe.recipe_id] || []).slice()
    ingredientLinks.sort((a, b) => a.displayOrder - b.displayOrder)

    const sections = []
    const sectionIndices = {}
    ingredientLinks.forEach((ingredient) => {
      const sectionKey = ingredient.sectionName
      if (!(sectionKey in sectionIndices)) {
        sectionIndices[sectionKey] = sections.length
        sections.push({ id: `${recipe.recipe_id}-${sectionKey}`, name: sectionKey, ingredients: [] })
      }
      sections[sectionIndices[sectionKey]].ingredients.push({
        id: `${recipe.recipe_id}-${sectionIndices[sectionKey]}-${ingredient.ingredientId || ingredient.name}`,
        ingredientId: ingredient.ingredientId,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        optional: ingredient.optional,
      })
    })

    const steps = (stepsByRecipe[recipe.recipe_id] || []).slice()
    steps.sort((a, b) => a.stepNumber - b.stepNumber)

    return {
      id: recipe.recipe_id,
      title: recipe.title || 'Untitled recipe',
      shortDescription: recipe.short_description || '',
      sourceName: recipe.source_name || '',
      sourceUrl: recipe.source_url || '',
      servings: getNumber(recipe.servings, 1),
      prepTimeMinutes: getNumber(recipe.prep_time_minutes, 0),
      cookTimeMinutes: getNumber(recipe.cook_time_minutes, 0),
      totalTimeMinutes: getNumber(recipe.total_time_minutes, recipe.prep_time_minutes || 0),
      cuisineId: recipe.cuisine_id || '',
      mealTypeId: recipe.meal_type_id || '',
      dietaryTagIds: (recipe.dietary_tag_ids || '').split(',').map((id) => id.trim()).filter(Boolean),
      categoryIds: (recipe.category_ids || '').split(',').map((id) => id.trim()).filter(Boolean),
      difficulty: getNumber(recipe.difficulty_1_to_5, 1),
      spiceLevel: getNumber(recipe.spice_level_0_to_5, 0),
      accentColor: recipe.accent_color || '#D97757',
      coverImageUrl: getImageUrl(recipe.cover_image_url),
      includeInMealSuggestions: getCsvFlag(recipe.include_in_meal_suggestions, true),
      sections,
      steps,
      options: {
        includeInShoppingList: true,
        showNutrition: false,
        allowSubstitutions: false,
        measurement: 'us',
      },
      isSeed: true,
    }
  })
}

export const seedRecipes = buildSeedRecipes()

export const approvedImageOptions = Object.freeze(
  Array.from(
    new Map(
      [
        PLACEHOLDER_IMAGE,
        ...seedRecipes.map((recipe) => recipe.coverImageUrl).filter(Boolean),
      ]
        .map((url) => [url, url]),
    ).values(),
  ),
)
