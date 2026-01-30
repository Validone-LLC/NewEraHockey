import { memo } from 'react';
import { motion } from 'framer-motion';
import InstagramEmbed from './InstagramEmbed';

/**
 * VideoCard - Displays an Instagram video embed
 */
const VideoCard = memo(function VideoCard({ video, index = 0 }) {
  return (
    <motion.div
      className="relative rounded-lg overflow-hidden bg-primary-light"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="w-full">
        <InstagramEmbed url={video.instagramUrl} />
        {video.title && (
          <div className="p-4 bg-primary">
            <h3 className="text-white font-semibold text-sm">{video.title}</h3>
            {video.category && (
              <span className="text-xs text-neutral-light capitalize">{video.category}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default VideoCard;
