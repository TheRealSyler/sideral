import { MapCellName } from './map';
import placeholder from './assets/cellPlaceholderIcon.png'
import water from './assets/cellWaterIcon.png'

export const cellIcons: { [key in MapCellName]: string } = {
  'gras': placeholder,
  'forest': placeholder,
  'stone': placeholder,
  'clay': placeholder,
  'bush': placeholder,
  'berries': placeholder,
  'tin': placeholder,
  'copper': placeholder,
  'gold': placeholder,
  'iron': placeholder,
  'water': water,
  'water coast': placeholder,
  'water coast 2': placeholder,
  'water coast 3': placeholder,
  'water coast 4': placeholder,
  'water pond': placeholder,
  'placeholder_0': placeholder,
  'placeholder_1': placeholder,
  'placeholder_2': placeholder,
  'placeholder_3': placeholder,
  'placeholder_4': placeholder,
  'placeholder_5': placeholder,
  'placeholder_6': placeholder,
  'placeholder_7': placeholder,
}