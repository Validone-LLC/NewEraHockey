import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import Button from '@components/common/Button/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-9xl font-display font-bold gradient-text mb-8">404</div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-xl text-neutral-light mb-12">
            Looks like you've taken a wrong turn on the ice. Let's get you back to the game!
          </p>
          <Button to="/" variant="primary" icon={Home}>
            Return to Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
