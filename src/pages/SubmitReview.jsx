import { motion } from 'framer-motion';
import TestimonialForm from '@components/testimonials/TestimonialForm/TestimonialForm';
import Button from '@components/common/Button/Button';
import SEO from '@components/common/SEO/SEO';

const SubmitReview = () => {
  return (
    <div className="min-h-screen">
      <SEO pageKey="submit-review" />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-neutral-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl sm:text-6xl font-display font-bold mb-4">
              Submit Your <span className="gradient-text">Review</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              Share your experience with New Era Hockey and help others discover what makes our
              training special
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="section-container">
        <div className="max-w-3xl mx-auto">
          <TestimonialForm />

          {/* Back to Testimonials Link */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button to="/testimonials" variant="secondary">
              Back to Testimonials
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SubmitReview;
