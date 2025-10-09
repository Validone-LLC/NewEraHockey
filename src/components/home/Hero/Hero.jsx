import { motion } from 'framer-motion';
import Button from '@components/common/Button/Button';

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-neutral-bg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,16,46,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,48,135,0.1),transparent_50%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold mb-6">
            <span className="block text-white mb-2">Welcome to</span>
            <span className="gradient-text text-6xl sm:text-7xl lg:text-8xl">
              New Era Hockey
            </span>
          </h1>
        </motion.div>

        <motion.p
          className="text-xl sm:text-2xl text-neutral-light max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Premier hockey training in the DMV area. Transforming players through{' '}
          <span className="text-accent-red font-semibold">passion</span>,{' '}
          <span className="text-accent-blue font-semibold">discipline</span>, and{' '}
          <span className="text-accent-gold font-semibold">results</span>.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Button to="/register" variant="primary">
            Register for Training
          </Button>
          <Button to="/contact" variant="secondary">
            Contact Coach Will
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
