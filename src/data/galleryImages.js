// Gallery categories
export const galleryCategories = [
  {
    id: 1,
    title: 'Training Camps',
    description: 'High-intensity training camps across the DMV area',
  },
  {
    id: 2,
    title: 'Inside Look at Lessons and Camps',
    description: 'Behind the scenes of our coaching sessions',
  },
  {
    id: 3,
    title: 'Trained Players',
    description: 'Players who have elevated their game with New Era Hockey',
  },
];

// Import all gallery JSON files
import kuzy from './gallery/kuzy.json';
import ashton from './gallery/ashton.json';
import ovechkin from './gallery/ovechkin.json';
import matt from './gallery/matt.json';
import domenic from './gallery/domenic.json';
import pacioretty from './gallery/pacioretty.json';
import future from './gallery/future.json';
import sully from './gallery/sully.json';
import restonCamp from './gallery/reston-camp-2023.json';
import coaches from './gallery/coaches.json';
import dmvTryout from './gallery/dmv-2024-tryout.json';
import camp1 from './gallery/camp-1.json';
import camp2 from './gallery/camp-2.json';
import camp3 from './gallery/camp-3.json';
import camp4 from './gallery/camp-4.json';
import camp5 from './gallery/camp-5.json';
import camp6 from './gallery/camp-6.json';
import camp7 from './gallery/camp-7.json';

// Combine all gallery images
export const galleryImages = [
  kuzy,
  ashton,
  ovechkin,
  matt,
  domenic,
  pacioretty,
  future,
  sully,
  restonCamp,
  coaches,
  dmvTryout,
  camp1,
  camp2,
  camp3,
  camp4,
  camp5,
  camp6,
  camp7,
];

// Dynamically import all camp photos JSON files using Vite's import.meta.glob
// This automatically picks up new photos added via CMS without requiring code changes
const campPhotoModules = import.meta.glob('./camp-photos/*.json', { eager: true });

// Extract photo data, sort by order, and map to src URLs
export const campPhotos = Object.values(campPhotoModules)
  .map(module => module.default)
  .filter(photo => photo && photo.src) // Filter out invalid entries
  .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort by order field
  .map(photo => photo.src);
