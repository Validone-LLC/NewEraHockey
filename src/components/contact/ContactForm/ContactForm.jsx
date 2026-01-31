import { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { Send } from 'lucide-react';
import Button from '@components/common/Button/Button';
import Modal from '@components/common/Modal/Modal';
import { formatPhoneNumber } from '@/utils/formatters';

const ContactForm = ({ initialMessage = '' }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [widgetId, setWidgetId] = useState(null);
  const turnstileRef = useRef(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Load Turnstile script and setup callback
  useEffect(() => {
    let currentWidgetId = null;

    // Render widget helper function
    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current) return;

      // Clean up any existing widget first
      if (currentWidgetId !== null) {
        try {
          window.turnstile.remove(currentWidgetId);
        } catch (e) {
          // Widget may not exist, ignore
        }
      }

      // Clear the container to ensure clean state
      if (turnstileRef.current) {
        turnstileRef.current.innerHTML = '';
      }

      // Render fresh widget
      try {
        // Check if widget already rendered in DOM (prevents double-render in Strict Mode)
        if (turnstileRef.current.children.length === 0) {
          const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
          if (!siteKey) {
            console.error('Turnstile: VITE_TURNSTILE_SITE_KEY is not configured');
            return;
          }
          const id = window.turnstile.render(turnstileRef.current, {
            sitekey: siteKey,
            callback: token => setTurnstileToken(token),
            'error-callback': errorCode => {
              console.error('Turnstile challenge error:', errorCode);
              // 300030 = timeout/hung, verify domain is registered in Cloudflare
            },
            'expired-callback': () => {
              setTurnstileToken('');
            },
            theme: 'dark',
          });
          currentWidgetId = id;
          setWidgetId(id);
        }
      } catch (error) {
        console.error('Turnstile render error:', error);
      }
    };

    // Check if Turnstile script already loaded
    const existingScript = document.querySelector('script[src*="turnstile"]');

    if (existingScript) {
      // Script already exists, just render widget if API is ready
      if (window.turnstile) {
        renderWidget();
      } else {
        // Wait for existing script to load
        existingScript.addEventListener('load', renderWidget);
      }
    } else {
      // Load script for first time
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      if (currentWidgetId !== null && window.turnstile) {
        try {
          window.turnstile.remove(currentWidgetId);
        } catch (e) {
          // Widget may already be removed, ignore
        }
      }
    };
  }, []);

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      message: initialMessage,
      website: '', // Honeypot field
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be 100 characters or less')
        .required('Name is required'),
      phone: Yup.string().test('valid-phone', 'Invalid phone number format', function (value) {
        if (!value) return true; // Optional field
        const phoneNumber = value.replace(/[^\d]/g, '');
        return phoneNumber.length === 10; // Must be exactly 10 digits
      }),
      email: Yup.string().trim().email('Invalid email address').required('Email is required'),
      message: Yup.string()
        .trim()
        .min(10, 'Message must be at least 10 characters')
        .max(1000, 'Message must be 1000 characters or less')
        .required('Message is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true);

      try {
        // Validate Turnstile
        if (!turnstileToken) {
          setModalState({
            isOpen: true,
            type: 'error',
            title: 'Verification Required',
            message: 'Please complete the verification challenge.',
          });
          setIsSubmitting(false);
          return;
        }

        // Send form data to Netlify Function
        const response = await fetch('/.netlify/functions/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...values,
            turnstileToken,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send message');
        }

        // Show success modal
        setModalState({
          isOpen: true,
          type: 'success',
          title: 'Contact Request Successfully Sent!',
          message: "Thank you for reaching out! We'll get back to you soon.",
        });
        resetForm();
        setTurnstileToken('');
        // Reset Turnstile widget
        if (window.turnstile && widgetId !== null) {
          window.turnstile.reset(widgetId);
        }
      } catch (error) {
        console.error('Contact form error:', error);
        // Show error modal with phone number
        setModalState({
          isOpen: true,
          type: 'error',
          title: 'Something Went Wrong',
          message: `We're sorry, but we couldn't send your message. Please try again or contact us directly at (571) 274-4691.`,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-light mb-2">
          Your Name <span className="text-teal-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          {...formik.getFieldProps('name')}
          aria-required="true"
          aria-invalid={formik.touched.name && formik.errors.name ? 'true' : 'false'}
          aria-describedby={formik.touched.name && formik.errors.name ? 'name-error' : undefined}
          className={`w-full px-4 py-3 bg-primary border ${
            formik.touched.name && formik.errors.name ? 'border-red-500' : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
        />
        {formik.touched.name && formik.errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-400" role="alert">
            {formik.errors.name}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-light mb-2">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formik.values.phone}
          onChange={e => {
            const formatted = formatPhoneNumber(e.target.value);
            formik.setFieldValue('phone', formatted);
          }}
          onBlur={formik.handleBlur}
          placeholder="(555) 555-5555"
          aria-invalid={formik.touched.phone && formik.errors.phone ? 'true' : 'false'}
          aria-describedby={formik.touched.phone && formik.errors.phone ? 'phone-error' : undefined}
          className={`w-full px-4 py-3 bg-primary border ${
            formik.touched.phone && formik.errors.phone ? 'border-red-500' : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
        />
        {formik.touched.phone && formik.errors.phone && (
          <p id="phone-error" className="mt-1 text-sm text-red-400" role="alert">
            {formik.errors.phone}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-light mb-2">
          Email <span className="text-teal-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          {...formik.getFieldProps('email')}
          aria-required="true"
          aria-invalid={formik.touched.email && formik.errors.email ? 'true' : 'false'}
          aria-describedby={formik.touched.email && formik.errors.email ? 'email-error' : undefined}
          className={`w-full px-4 py-3 bg-primary border ${
            formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
        />
        {formik.touched.email && formik.errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
            {formik.errors.email}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-neutral-light mb-2">
          Message <span className="text-teal-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          {...formik.getFieldProps('message')}
          placeholder="Tell us about your training goals or questions..."
          aria-required="true"
          aria-invalid={formik.touched.message && formik.errors.message ? 'true' : 'false'}
          aria-describedby={
            formik.touched.message && formik.errors.message ? 'message-error' : undefined
          }
          className={`w-full px-4 py-3 bg-primary border ${
            formik.touched.message && formik.errors.message
              ? 'border-red-500'
              : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors resize-none`}
        />
        {formik.touched.message && formik.errors.message && (
          <p id="message-error" className="mt-1 text-sm text-red-400" role="alert">
            {formik.errors.message}
          </p>
        )}
      </div>

      {/* Honeypot - hidden from real users, bots will fill it */}
      <input
        type="text"
        name="website"
        value={formik.values.website}
        onChange={formik.handleChange}
        style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Turnstile CAPTCHA */}
      <div>
        <div ref={turnstileRef} />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        icon={Send}
        className="w-full"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>

      {/* Success/Error Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
      />
    </form>
  );
};

ContactForm.propTypes = {
  initialMessage: PropTypes.string,
};

export default ContactForm;
