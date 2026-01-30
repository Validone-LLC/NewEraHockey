/**
 * Video Gallery Data
 *
 * To add a new video:
 * 1. Create a new JSON file in this directory (e.g., my-video.json)
 * 2. Follow the schema below
 * 3. The video will automatically appear in the gallery
 *
 * Schema:
 * {
 *   "id": "unique-id",
 *   "type": "instagram",
 *   "instagramUrl": "https://www.instagram.com/reel/ABC123/",
 *   "title": "Video Title",
 *   "category": "Training Camps" | "Highlights" | "Tutorials",
 *   "featured": true | false,
 *   "order": 1
 * }
 */

// Dynamically import all video JSON files using Vite's import.meta.glob
const videoModules = import.meta.glob('./*.json', { eager: true });

// Extract video data, filter valid entries, and sort by order
export const galleryVideos = Object.values(videoModules)
  .map(module => module.default)
  .filter(video => video && video.instagramUrl && video.type === 'instagram')
  .sort((a, b) => (a.order || 999) - (b.order || 999));

// Video categories for filtering
export const videoCategories = [
  { id: 'all', label: 'All Videos' },
  { id: 'camps', label: 'Training Camps' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'tutorials', label: 'Tutorials' },
];

// Get featured videos
export const featuredVideos = galleryVideos.filter(video => video.featured);

// Get videos by category
export function getVideosByCategory(category) {
  if (!category || category === 'all') {
    return galleryVideos;
  }
  return galleryVideos.filter(video => video.category === category);
}
