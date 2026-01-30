import { memo } from 'react';
import { motion } from 'framer-motion';
import VideoCard from './VideoCard';

/**
 * VideoGallery - Grid display of Instagram video embeds
 */
const VideoGallery = memo(function VideoGallery({ videos, title = 'Videos' }) {
  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-light">No videos available yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <motion.h2
        className="text-3xl font-display font-bold text-white mb-8 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {title}
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => (
          <VideoCard key={video.id} video={video} index={index} />
        ))}
      </div>
    </div>
  );
});

export default VideoGallery;
