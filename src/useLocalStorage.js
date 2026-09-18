import { useEffect, useState } from 'react'
import { loadLocal, saveLocal } from './data.js'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => loadLocal(key, initialValue))

  useEffect(() => {
    saveLocal(key, value)
  }, [key, value])

  return [value, setValue]
}

export function useRecipeState() {
  const [userRecipes, setUserRecipes] = useLocalStorage('meal-app-user-recipes', [])
  const [mealPlan, setMealPlan] = useLocalStorage('meal-app-meal-plan', {})
  const [shoppingState, setShoppingState] = useLocalStorage('meal-app-shopping-state', {
    checked: {},
    pantry: {},
    hidePantry: false,
    editedItems: {}
  })
  const [recipeSettings, setRecipeSettings] = useLocalStorage('meal-app-recipe-settings', {})

  return {
    userRecipes,
    setUserRecipes,
    mealPlan,
    setMealPlan,
    shoppingState,
    setShoppingState,
    recipeSettings,
    setRecipeSettings
  }
}
