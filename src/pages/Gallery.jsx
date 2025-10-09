import { useState } from 'react';
import { motion } from 'framer-motion';
import { galleryImages, galleryCategories } from '@data/galleryImages';

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredImages =
    selectedCategory === 'all'
      ? galleryImages
      : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="min-h-screen">
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
          Images:
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-primary-light group cursor-pointer"
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
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-white font-semibold">{image.alt}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Videos Coming Soon */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold text-white mb-4">
            Videos <span className="gradient-text">(Coming Soon!)</span>
          </h2>
          <p className="text-neutral-light">Check back soon for training videos and highlights</p>
        </motion.div>
      </section>
    </div>
  );
};

const FilterButton = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
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
