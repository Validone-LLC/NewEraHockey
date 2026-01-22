import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import Confetti from 'react-confetti';

const MAIL_SERVICE_API = 'https://eqk81e6nlj.execute-api.us-east-1.amazonaws.com/public/subscribe';
const MASTER_LIST_ID = 'list_7952d451';

/**
 * Email validation regex (RFC 5322 simplified)
 */
const isValidEmail = email => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const EmailSubscription = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Update window dimensions for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stop confetti after 3 seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const handleSubmit = async e => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validation
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      const response = await axios.post(MAIL_SERVICE_API, {
        email: trimmedEmail,
        listId: MASTER_LIST_ID,
      });

      // Handle success (including already subscribed)
      if (response.status === 200 || response.status === 201) {
        setStatus('success');
        setEmail('');
        setShowConfetti(true);
      }
    } catch (err) {
      setStatus('error');
      if (err.response?.status === 429) {
        setErrorMessage('Too many requests. Please try again later.');
      } else if (err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  const handleInputChange = e => {
    setEmail(e.target.value);
    // Clear errors when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
    if (status === 'error') {
      setStatus('idle');
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <>
        {showConfetti && (
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.3}
            colors={['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a']}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
          />
        )}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 text-teal-400"
        >
          <CheckCircle className="w-6 h-6" />
          <span className="text-sm font-medium">Thank you for subscribing!</span>
        </motion.div>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-neutral-text" />
          </div>
          <input
            type="email"
            value={email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            disabled={status === 'loading'}
            aria-label="Email address for newsletter subscription"
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? 'email-error' : undefined}
            className={`
              w-full pl-10 pr-4 py-3
              bg-primary-light border rounded-lg
              text-white placeholder-neutral-text
              focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${errorMessage ? 'border-red-500' : 'border-neutral-dark'}
            `}
          />
        </div>
        <motion.button
          type="submit"
          disabled={status === 'loading'}
          whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
          className={`
            px-6 py-3
            bg-teal-500 hover:bg-teal-600
            text-white font-semibold rounded-lg
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
            min-w-[120px]
          `}
        >
          {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Subscribe'}
        </motion.button>
      </div>
      {errorMessage && (
        <motion.p
          id="email-error"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-400"
          role="alert"
        >
          {errorMessage}
        </motion.p>
      )}
    </form>
  );
};

export default EmailSubscription;
