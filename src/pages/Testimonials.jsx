import { motion } from 'framer-motion';
import { testimonials } from '@data/testimonials';
import TestimonialCard from '@components/testimonials/TestimonialCard/TestimonialCard';
import Button from '@components/common/Button/Button';

const Testimonials = () => {
  const featuredTestimonials = testimonials.filter(t => t.featured);
  const otherTestimonials = testimonials.filter(t => !t.featured);

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

      {/* Featured Testimonials */}
      <section className="section-container">
        <motion.h2
          className="text-3xl font-display font-bold text-white mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Featured Stories
        </motion.h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {featuredTestimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {otherTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                index={index}
              />
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
          <p className="text-neutral-light mt-8 text-lg">
            Your feedback is appreciated
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Testimonials;
