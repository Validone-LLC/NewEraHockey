import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  type = 'success', // 'success' or 'error'
  title,
  message,
  autoCloseDelay = 5000, // 5 seconds default
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    // Auto-close timer
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);

    // Progress bar animation
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoCloseDelay) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(progressInterval);
      }
    }, 16); // ~60fps

    return () => {
      clearTimeout(autoCloseTimer);
      clearInterval(progressInterval);
    };
  }, [isOpen, onClose, autoCloseDelay]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const icon = type === 'success' ? CheckCircle : AlertCircle;
  const iconColor = type === 'success' ? 'text-teal-500' : 'text-orange-500';
  const progressColor = type === 'success' ? 'bg-teal-500' : 'bg-orange-500';
  const Icon = icon;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-primary border border-neutral-dark rounded-xl shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-neutral-text hover:text-white transition-colors p-1 rounded-lg hover:bg-primary-light"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Content */}
              <div className="p-8">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <Icon className={`w-16 h-16 ${iconColor}`} />
                </div>

                {/* Title */}
                <h2
                  id="modal-title"
                  className="text-2xl font-display font-bold text-white text-center mb-3"
                >
                  {title}
                </h2>

                {/* Message */}
                <p
                  id="modal-description"
                  className="text-neutral-light text-center leading-relaxed"
                >
                  {message}
                </p>
              </div>

              {/* Timer Progress Bar */}
              <div className="h-1 bg-neutral-dark">
                <motion.div
                  className={`h-full ${progressColor}`}
                  style={{ width: `${progress}%` }}
                  initial={{ width: '100%' }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
