import { Flame, Dumbbell, Trophy } from 'lucide-react';
import coreValuesData from './coreValues.json';

// Icon mapping for CMS-managed data
const iconMap = {
  'Flame': Flame,
  'Dumbbell': Dumbbell,
  'Trophy': Trophy
};

// Transform JSON data to include React components
export const coreValues = coreValuesData.coreValues.map(value => ({
  ...value,
  icon: iconMap[value.icon]
}));
