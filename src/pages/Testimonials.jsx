import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { testimonials } from '@data/testimonials';
import TestimonialCard from '@components/testimonials/TestimonialCard/TestimonialCard';
import Button from '@components/common/Button/Button';

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselTestimonials = testimonials.slice(0, 5);
  const otherTestimonials = testimonials.slice(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % carouselTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselTestimonials.length]);

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex(
          prev => (prev - 1 + carouselTestimonials.length) % carouselTestimonials.length
        );
      } else if (e.key === 'ArrowRight') {
        setActiveIndex(prev => (prev + 1) % carouselTestimonials.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carouselTestimonials.length]);

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
              Parent and Player <span className="gradient-text">Testimonies</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              See what parents and players have to say about New Era Hockey
            </p>
          </motion.div>
        </div>
      </section>

      {/* Carousel Testimonials */}
      <section className="section-container">
        <motion.h2
          className="text-3xl font-display font-bold text-white mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Featured Stories
        </motion.h2>

        {/* Carousel Container */}
        <div className="max-w-4xl mx-auto">
          {/* ARIA live region for screen reader announcements */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            Showing testimonial {activeIndex + 1} of {carouselTestimonials.length}
          </div>

          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <TestimonialCard testimonial={carouselTestimonials[activeIndex]} index={0} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot Navigation */}
          <div
            className="flex justify-center gap-3 mt-8"
            role="group"
            aria-label="Testimonial navigation"
          >
            {carouselTestimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? 'bg-teal-500 w-8' : 'bg-neutral-dark hover:bg-neutral-text'
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
                aria-current={idx === activeIndex ? 'true' : 'false'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Other Testimonials */}
      {otherTestimonials.length > 0 && (
        <section className="section-container bg-primary/30">
          <motion.h2
            className="text-3xl font-display font-bold text-white mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            More Success Stories
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {otherTestimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section-container text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold text-white mb-6">
            Have something to add? Leave a review of your own!
          </h2>
          <Button to="/contact" variant="primary">
            Submit Review
          </Button>
          <p className="text-neutral-light mt-8 text-lg">Your feedback is appreciated</p>
        </motion.div>
      </section>
    </div>
  );
};

export default Testimonials;
