import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { HiPaperAirplane } from 'react-icons/hi';
import Button from '@components/common/Button/Button';

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phone number formatting helper
  const formatPhoneNumber = value => {
    if (!value) return value;

    // Remove all non-numeric characters
    const phoneNumber = value.replace(/[^\d]/g, '');

    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      message: '',
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
        // Send form data to Netlify Function
        const response = await fetch('/.netlify/functions/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send message');
        }

        toast.success(data.message || "Message sent successfully! We'll get back to you soon.");
        resetForm();
      } catch (error) {
        console.error('Contact form error:', error);
        toast.error(
          error.message || 'Failed to send message. Please try again or contact us directly.'
        );
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
            formik.touched.name && formik.errors.name ? 'border-teal-500' : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
        />
        {formik.touched.name && formik.errors.name && (
          <p id="name-error" className="mt-1 text-sm text-teal-500" role="alert">
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
            formik.touched.phone && formik.errors.phone ? 'border-teal-500' : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
        />
        {formik.touched.phone && formik.errors.phone && (
          <p id="phone-error" className="mt-1 text-sm text-teal-500" role="alert">
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
            formik.touched.email && formik.errors.email ? 'border-teal-500' : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
        />
        {formik.touched.email && formik.errors.email && (
          <p id="email-error" className="mt-1 text-sm text-teal-500" role="alert">
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
              ? 'border-teal-500'
              : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors resize-none`}
        />
        {formik.touched.message && formik.errors.message && (
          <p id="message-error" className="mt-1 text-sm text-teal-500" role="alert">
            {formik.errors.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        icon={HiPaperAirplane}
        className="w-full"
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
};

export default ContactForm;
