import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { HiPaperAirplane } from 'react-icons/hi';
import Button from '@components/common/Button/Button';

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      message: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      phone: Yup.string(),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      message: Yup.string().max(1000, 'Message must be 1000 characters or less'),
    }),
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true);

      // Simulate API call
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success("Message sent successfully! We'll get back to you soon.");
        resetForm();
      } catch (error) {
        toast.error('Failed to send message. Please try again or contact us directly.');
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
          className={`w-full px-4 py-3 bg-primary border ${
            formik.touched.name && formik.errors.name ? 'border-teal-500' : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
        />
        {formik.touched.name && formik.errors.name && (
          <p className="mt-1 text-sm text-teal-500">{formik.errors.name}</p>
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
          {...formik.getFieldProps('phone')}
          className="w-full px-4 py-3 bg-primary border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
        />
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
          className={`w-full px-4 py-3 bg-primary border ${
            formik.touched.email && formik.errors.email ? 'border-teal-500' : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
        />
        {formik.touched.email && formik.errors.email && (
          <p className="mt-1 text-sm text-teal-500">{formik.errors.email}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-neutral-light mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          {...formik.getFieldProps('message')}
          className={`w-full px-4 py-3 bg-primary border ${
            formik.touched.message && formik.errors.message
              ? 'border-teal-500'
              : 'border-neutral-dark'
          } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors resize-none`}
        />
        {formik.touched.message && formik.errors.message && (
          <p className="mt-1 text-sm text-teal-500">{formik.errors.message}</p>
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
