// Import all coach JSON files
import willPasko from './coaches/will-pasko.json';
import dennisNayandin from './coaches/dennis-nayandin.json';
import sergioReyes from './coaches/sergio-reyes.json';
import dylan from './coaches/dylan.json';

// Combine and sort coaches by order field
export const coaches = [willPasko, dennisNayandin, sergioReyes, dylan].sort(
  (a, b) => a.order - b.order
);

// Legacy export for backward compatibility (if needed elsewhere)
export const coachInfo = coaches[0];
