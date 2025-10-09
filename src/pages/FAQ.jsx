import { motion } from 'framer-motion';
import FAQComponent from '@components/contact/FAQ/FAQ';
import Button from '@components/common/Button/Button';

const FAQ = () => {
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
              Frequently Asked <span className="gradient-text">Questions</span>
            </h1>
            <p className="text-xl text-neutral-light max-w-2xl mx-auto">
              Find answers to common questions about New Era Hockey training programs
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <FAQComponent />
        </div>
      </section>

      {/* CTA */}
      <section className="section-container bg-primary/30 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold text-white mb-6">Still have questions?</h2>
          <p className="text-neutral-light mb-8 text-lg">
            Reach out to us directly and we'll get back to you as soon as possible
          </p>
          <Button to="/contact" variant="primary">
            Contact Us
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default FAQ;
