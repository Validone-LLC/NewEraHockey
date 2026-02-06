import { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import SEO from '@components/common/SEO/SEO';
import { galleryImages, galleryCategories } from '@data/galleryImages';
import { galleryVideos } from '@data/videos';
import { VideoGallery } from '@components/gallery';
import { isFeatureEnabled } from '@/config/featureFlags';

const BASE_URL = 'https://newerahockeytraining.com';

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredImages =
    selectedCategory === 'all'
      ? galleryImages
      : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="min-h-screen">
      <SEO pageKey="gallery" />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ImageGallery',
            name: 'New Era Hockey Photo Gallery',
            url: `${BASE_URL}/gallery`,
            description: 'Photos from New Era Hockey camps, training sessions, and events.',
            about: {
              '@type': 'SportsOrganization',
              name: 'New Era Hockey',
            },
            image: galleryImages.map(img => ({
              '@type': 'ImageObject',
              contentUrl: `${BASE_URL}${img.src}`,
              name: img.alt,
              description: img.alt,
            })),
          })}
        </script>
      </Helmet>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
              <span className="gradient-text">GALLERY</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              Explore What New Era Hockey Has to Offer
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {galleryCategories.map((category, index) => (
            <motion.div
              key={category.id}
              className="card text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <h3 className="text-2xl font-display font-bold text-white mb-2">{category.title}</h3>
              <p className="text-neutral-light">{category.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter Buttons */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <FilterButton
            label="All"
            active={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          />
          <FilterButton
            label="Training Camps"
            active={selectedCategory === 'camps'}
            onClick={() => setSelectedCategory('camps')}
          />
          <FilterButton
            label="Players"
            active={selectedCategory === 'players'}
            onClick={() => setSelectedCategory('players')}
          />
          <FilterButton
            label="Behind the Scenes"
            active={selectedCategory === 'behind-scenes'}
            onClick={() => setSelectedCategory('behind-scenes')}
          />
        </motion.div>

        {/* Images Grid */}
        <motion.h2
          className="text-3xl font-display font-bold text-white mb-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Photos
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              tabIndex={0}
              role="figure"
              aria-label={image.alt}
              className="relative aspect-square rounded-lg overflow-hidden bg-primary-light group cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              layout
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
                width={600}
                height={600}
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
              />
              {/* Title overlay: always visible on mobile, hover/focus on desktop */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-white font-semibold">{image.alt}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Videos Section - controlled by feature flag */}
        {isFeatureEnabled('instagramVideos') && galleryVideos.length > 0 && (
          <VideoGallery
            videos={galleryVideos}
            title={
              <>
                Videos <span className="gradient-text">from Instagram</span>
              </>
            }
          />
        )}
      </section>
    </div>
  );
};

const FilterButton = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-primary ${
        active
          ? 'bg-gradient-to-r from-teal-500 to-teal-700 text-white'
          : 'bg-primary border border-neutral-dark text-neutral-light hover:border-teal-500'
      }`}
    >
      {label}
    </button>
  );
};

export default Gallery;
