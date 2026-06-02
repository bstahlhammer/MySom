import { wines as curatedWines } from './mockData.js'
import { generatedWines } from './generatedWines.js'

export const allWines = [...curatedWines, ...generatedWines]
