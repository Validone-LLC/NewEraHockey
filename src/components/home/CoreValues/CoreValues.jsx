import { motion } from 'framer-motion';
import { coreValues } from '@data/coreValues';
import ValueCard from './ValueCard';

const CoreValues = () => {
  return (
    <section id="core-values" className="section-container">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
          Our Core <span className="gradient-text">Values</span>
        </h2>
        <p className="text-lg text-neutral-light max-w-2xl mx-auto">
          The foundation of excellence in hockey and life
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {coreValues.map((value, index) => (
          <ValueCard key={value.id} value={value} index={index} />
        ))}
      </div>
    </section>
  );
};

export default CoreValues;
