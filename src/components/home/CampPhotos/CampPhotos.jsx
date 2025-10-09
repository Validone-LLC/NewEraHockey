import { motion } from 'framer-motion';
import { campPhotos } from '@data/galleryImages';
import PhotoGallery from './PhotoGallery';
import Button from '@components/common/Button/Button';

const CampPhotos = () => {
  return (
    <section className="section-container">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
          Camp <span className="gradient-text">Photos!</span>
        </h2>
        <p className="text-lg text-neutral-light max-w-2xl mx-auto">
          Take a look at our recent training camps and sessions
        </p>
      </motion.div>

      <PhotoGallery photos={campPhotos} />

      <motion.div
        className="text-center mt-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-6">Talk to us!</h3>
        <p className="text-neutral-light max-w-2xl mx-auto mb-8">
          <strong>Have any questions?</strong> Not sure what to do from here? Contact us about any
          inquiries today and we will get back to you as soon as possible!
        </p>
        <Button to="/contact" variant="primary">
          Get in touch
        </Button>
      </motion.div>
    </section>
  );
};

export default CampPhotos;
