/**
 * Video Gallery Data
 * Add JSON files to this directory to display Instagram videos in the gallery
 */

const videoModules = import.meta.glob('./*.json', { eager: true });

export const galleryVideos = Object.values(videoModules)
  .map(module => module.default)
  .filter(video => video && video.instagramUrl && video.type === 'instagram')
  .sort((a, b) => (a.order || 999) - (b.order || 999));

export const videoCategories = [
  { id: 'all', label: 'All Videos' },
  { id: 'camps', label: 'Training Camps' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'tutorials', label: 'Tutorials' },
];

export const featuredVideos = galleryVideos.filter(video => video.featured);

export function getVideosByCategory(category) {
  if (!category || category === 'all') return galleryVideos;
  return galleryVideos.filter(video => video.category === category);
}
