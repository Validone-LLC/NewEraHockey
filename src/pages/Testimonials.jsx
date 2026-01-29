import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Pause, Play } from 'lucide-react';
import SEO from '@components/common/SEO/SEO';
import { testimonials } from '@data/testimonials';
import TestimonialCard from '@components/testimonials/TestimonialCard/TestimonialCard';
import Button from '@components/common/Button/Button';

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const carouselRef = useRef(null);
  const carouselTestimonials = testimonials.slice(0, 5);
  const otherTestimonials = testimonials.slice(5);

  // Respect prefers-reduced-motion — auto-pause if user prefers reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Auto-rotation stops when manually paused, hover-paused, or reduced-motion preferred
  const isAutoPlaying = !isManuallyPaused && !isHoverPaused && !prefersReducedMotion;

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % carouselTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselTestimonials.length, isAutoPlaying]);

  // Keyboard navigation for carousel (only when carousel is focused)
  const handleCarouselKeyDown = useCallback(
    e => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex(
          prev => (prev - 1 + carouselTestimonials.length) % carouselTestimonials.length
        );
      } else if (e.key === 'ArrowRight') {
        setActiveIndex(prev => (prev + 1) % carouselTestimonials.length);
      }
    },
    [carouselTestimonials.length]
  );

  return (
    <div className="min-h-screen">
      <SEO pageKey="testimonials" />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsOrganization',
            name: 'New Era Hockey',
            url: 'https://newerahockeytraining.com',
            review: testimonials.map(t => ({
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: t.name,
              },
              reviewBody: t.text,
              itemReviewed: {
                '@type': 'SportsOrganization',
                name: 'New Era Hockey',
              },
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

        {/* Carousel Container - tabIndex needed for keyboard navigation per ARIA carousel pattern */}
        {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
        <div
          ref={carouselRef}
          role="region"
          tabIndex={0}
          className="max-w-4xl mx-auto"
          onMouseEnter={() => setIsHoverPaused(true)}
          onMouseLeave={() => setIsHoverPaused(false)}
          onFocus={() => setIsHoverPaused(true)}
          onBlur={e => {
            // Only unpause if focus leaves the carousel entirely
            if (!carouselRef.current?.contains(e.relatedTarget)) {
              setIsHoverPaused(false);
            }
          }}
          onKeyDown={handleCarouselKeyDown}
          aria-roledescription="carousel"
          aria-label="Featured testimonials"
        >
          {/* ARIA live region for screen reader announcements */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            Showing testimonial {activeIndex + 1} of {carouselTestimonials.length}
          </div>

          <div className="relative min-h-[400px]" aria-live="off">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
                role="group"
                aria-roledescription="slide"
                aria-label={`Testimonial ${activeIndex + 1} of ${carouselTestimonials.length}`}
              >
                <TestimonialCard testimonial={carouselTestimonials[activeIndex]} index={0} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls: Play/Pause + Dot Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setIsManuallyPaused(prev => !prev)}
              className="p-2 rounded-full bg-neutral-dark/50 text-neutral-light hover:text-white hover:bg-neutral-dark transition-colors"
              aria-label={
                isManuallyPaused || prefersReducedMotion ? 'Play carousel' : 'Pause carousel'
              }
            >
              {isManuallyPaused || prefersReducedMotion ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>
            <div
              className="flex gap-3 items-center"
              role="group"
              aria-label="Testimonial navigation"
            >
              {carouselTestimonials.map((_, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative h-3 rounded-full transition-all duration-300 overflow-hidden ${
                      isActive ? 'w-8 bg-neutral-dark' : 'w-3 bg-neutral-dark hover:bg-neutral-text'
                    }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                    aria-current={isActive ? 'true' : 'false'}
                  >
                    {isActive && (
                      <span
                        key={activeIndex}
                        className="absolute inset-0 rounded-full bg-teal-500"
                        style={{
                          animation: isAutoPlaying ? 'dot-fill 5s linear forwards' : 'none',
                          width: isAutoPlaying ? undefined : '100%',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
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
          <Button to="/testimonials/submit-review" variant="primary">
            Submit Review
          </Button>
          <p className="text-neutral-light mt-8 text-lg">Your feedback is appreciated</p>
        </motion.div>
      </section>
    </div>
  );
};

export default Testimonials;
