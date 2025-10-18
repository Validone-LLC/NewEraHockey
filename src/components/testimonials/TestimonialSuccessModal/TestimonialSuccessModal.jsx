import { HiX, HiCheckCircle } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@components/common/Button/Button';

const TestimonialSuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-primary border border-teal-900/30 rounded-xl shadow-2xl max-w-md w-full p-8 relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-neutral-light hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <HiX className="w-6 h-6" />
              </button>

              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-teal-500/20 rounded-full p-4">
                  <HiCheckCircle className="w-16 h-16 text-teal-400" />
                </div>
              </div>

              {/* Content */}
              <h2 className="text-2xl font-display font-bold text-white text-center mb-4">
                Thank You for Your Review!
              </h2>
              <p className="text-neutral-light text-center mb-8">
                Your testimonial has been submitted successfully. The Coach Will team will review it
                and post it on the testimonials page.
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button to="/testimonials" variant="primary" className="w-full">
                  Back to Testimonials
                </Button>
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 border-2 border-neutral-dark text-neutral-light font-semibold rounded-lg hover:bg-neutral-dark hover:text-white transition-all duration-300"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TestimonialSuccessModal;
