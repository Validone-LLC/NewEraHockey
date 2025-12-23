import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { User, Mail, Phone } from 'lucide-react';
import Card from '@components/common/Card/Card';
import Select from '@components/common/Select';
import { getFormattedPrice } from '@/services/calendarService';
import { formatPhoneNumber } from '@/utils/formatters';
import { PLAYER_LEVEL_OPTIONS } from '@/config/constants';

// Yup validation schema - single source of truth for all validation rules
const validationSchema = Yup.object({
  // Player Information
  playerFirstName: Yup.string().trim().required('Player first name is required'),
  playerLastName: Yup.string().trim().required('Player last name is required'),
  playerDateOfBirth: Yup.date().required('Date of birth is required'),
  playerLevelOfPlay: Yup.string().trim().required('Level of play is required'),

  // Parent/Guardian Information
  guardianFirstName: Yup.string().trim().required('Guardian first name is required'),
  guardianLastName: Yup.string().trim().required('Guardian last name is required'),
  guardianEmail: Yup.string().trim().email('Invalid email format').required('Email is required'),
  guardianPhone: Yup.string()
    .required('Phone number is required')
    .test('valid-phone', 'Invalid phone format (e.g., (555) 555-5555)', value => {
      if (!value) return false;
      const phoneDigits = value.replace(/[^\d]/g, '');
      return phoneDigits.length === 10;
    }),
  guardianRelationship: Yup.string().default('Parent'),

  // Emergency Contact
  emergencyName: Yup.string().trim().required('Emergency contact name is required'),
  emergencyPhone: Yup.string()
    .required('Emergency contact phone is required')
    .test('valid-phone', 'Invalid phone format (e.g., (555) 555-5555)', value => {
      if (!value) return false;
      const phoneDigits = value.replace(/[^\d]/g, '');
      return phoneDigits.length === 10;
    }),
  emergencyRelationship: Yup.string().trim().required('Emergency contact relationship is required'),

  // Additional
  medicalNotes: Yup.string(),
  waiverAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the waiver to continue')
    .required('You must accept the waiver to continue'),
});

const RegistrationForm = ({ event }) => {
  const [submitError, setSubmitError] = useState(null);

  const formik = useFormik({
    initialValues: {
      // Player Information
      playerFirstName: '',
      playerLastName: '',
      playerDateOfBirth: '',
      playerAge: '',
      playerLevelOfPlay: '',

      // Parent/Guardian Information
      guardianFirstName: '',
      guardianLastName: '',
      guardianEmail: '',
      guardianPhone: '',
      guardianRelationship: 'Parent',

      // Emergency Contact
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelationship: '',

      // Additional
      medicalNotes: '',
      waiverAccepted: false,
    },
    validationSchema,
    onSubmit: async values => {
      setSubmitError(null);

      try {
        // Determine event type from title or color
        const eventTitle = (event.summary || '').toLowerCase();
        const eventType = eventTitle.includes('camp')
          ? 'camp'
          : eventTitle.includes('lesson') || eventTitle.includes('training')
            ? 'lesson'
            : 'other';

        // Create Stripe Checkout session
        const response = await fetch('/.netlify/functions/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: {
              id: event.id,
              summary: event.summary,
              price: event.registrationData?.price,
              eventType, // Include event type for capacity defaults
              start: event.start,
              end: event.end,
              location: event.location,
            },
            formData: values,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create checkout session');
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } catch (error) {
        console.error('Registration error:', error);
        setSubmitError(error.message || 'Failed to process registration. Please try again.');
      }
    },
  });

  // Helper to get field error state
  const getFieldError = fieldName =>
    formik.touched[fieldName] && formik.errors[fieldName] ? formik.errors[fieldName] : null;

  // Helper for phone field change with formatting
  const handlePhoneChange = fieldName => e => {
    const formatted = formatPhoneNumber(e.target.value);
    formik.setFieldValue(fieldName, formatted);
  };

  return (
    <Card>
      <form onSubmit={formik.handleSubmit} className="space-y-8">
        {/* Player Information */}
        <div>
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-teal-500" />
            Player Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="playerFirstName"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                First Name *
              </label>
              <input
                type="text"
                id="playerFirstName"
                name="playerFirstName"
                {...formik.getFieldProps('playerFirstName')}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  getFieldError('playerFirstName') ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="John"
              />
              {getFieldError('playerFirstName') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('playerFirstName')}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="playerLastName"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Last Name *
              </label>
              <input
                type="text"
                id="playerLastName"
                name="playerLastName"
                {...formik.getFieldProps('playerLastName')}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  getFieldError('playerLastName') ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Doe"
              />
              {getFieldError('playerLastName') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('playerLastName')}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="playerDateOfBirth"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Date of Birth *
              </label>
              <input
                type="date"
                id="playerDateOfBirth"
                name="playerDateOfBirth"
                {...formik.getFieldProps('playerDateOfBirth')}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  getFieldError('playerDateOfBirth') ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
              />
              {getFieldError('playerDateOfBirth') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('playerDateOfBirth')}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="playerLevelOfPlay"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Level of Play *
              </label>
              <Select
                id="playerLevelOfPlay"
                name="playerLevelOfPlay"
                value={formik.values.playerLevelOfPlay}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('playerLevelOfPlay')}
                placeholder="Select level of play"
                options={PLAYER_LEVEL_OPTIONS}
              />
              {getFieldError('playerLevelOfPlay') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('playerLevelOfPlay')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div className="border-t border-neutral-dark pt-6">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-teal-500" />
            Parent/Guardian Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="guardianFirstName"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                First Name *
              </label>
              <input
                type="text"
                id="guardianFirstName"
                name="guardianFirstName"
                {...formik.getFieldProps('guardianFirstName')}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  getFieldError('guardianFirstName') ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Jane"
              />
              {getFieldError('guardianFirstName') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('guardianFirstName')}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guardianLastName"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Last Name *
              </label>
              <input
                type="text"
                id="guardianLastName"
                name="guardianLastName"
                {...formik.getFieldProps('guardianLastName')}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  getFieldError('guardianLastName') ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Doe"
              />
              {getFieldError('guardianLastName') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('guardianLastName')}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guardianEmail"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
                <input
                  type="email"
                  id="guardianEmail"
                  name="guardianEmail"
                  {...formik.getFieldProps('guardianEmail')}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    getFieldError('guardianEmail') ? 'border-red-500' : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="jane@example.com"
                />
              </div>
              {getFieldError('guardianEmail') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('guardianEmail')}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guardianPhone"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
                <input
                  type="tel"
                  id="guardianPhone"
                  name="guardianPhone"
                  value={formik.values.guardianPhone}
                  onChange={handlePhoneChange('guardianPhone')}
                  onBlur={formik.handleBlur}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    getFieldError('guardianPhone') ? 'border-red-500' : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="(555) 555-5555"
                />
              </div>
              {getFieldError('guardianPhone') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('guardianPhone')}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guardianRelationship"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Relationship to Player *
              </label>
              <Select
                id="guardianRelationship"
                name="guardianRelationship"
                value={formik.values.guardianRelationship}
                onChange={formik.handleChange}
                placeholder="Select relationship"
                options={[
                  { value: 'Parent', label: 'Parent' },
                  { value: 'Guardian', label: 'Guardian' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="border-t border-neutral-dark pt-6">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-teal-500" />
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="emergencyName"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="emergencyName"
                name="emergencyName"
                {...formik.getFieldProps('emergencyName')}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  getFieldError('emergencyName') ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Emergency Contact Name"
              />
              {getFieldError('emergencyName') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('emergencyName')}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="emergencyPhone"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formik.values.emergencyPhone}
                  onChange={handlePhoneChange('emergencyPhone')}
                  onBlur={formik.handleBlur}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    getFieldError('emergencyPhone') ? 'border-red-500' : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="(555) 555-5555"
                />
              </div>
              {getFieldError('emergencyPhone') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('emergencyPhone')}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="emergencyRelationship"
                className="block text-sm font-medium text-neutral-light mb-2"
              >
                Relationship to Player *
              </label>
              <input
                type="text"
                id="emergencyRelationship"
                name="emergencyRelationship"
                {...formik.getFieldProps('emergencyRelationship')}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  getFieldError('emergencyRelationship') ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="e.g., Aunt, Uncle, Family Friend"
              />
              {getFieldError('emergencyRelationship') && (
                <p className="text-red-400 text-sm mt-1">
                  {getFieldError('emergencyRelationship')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Notes */}
        <div className="border-t border-neutral-dark pt-6">
          <label
            htmlFor="medicalNotes"
            className="block text-sm font-medium text-neutral-light mb-2"
          >
            Medical Notes / Allergies (Optional)
          </label>
          <textarea
            id="medicalNotes"
            name="medicalNotes"
            {...formik.getFieldProps('medicalNotes')}
            rows="3"
            className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
            placeholder="Any medical conditions, allergies, or special considerations we should know about..."
          />
        </div>

        {/* Waiver Agreement */}
        <div className="border-t border-neutral-dark pt-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="waiverAccepted"
              name="waiverAccepted"
              checked={formik.values.waiverAccepted}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="mt-1 w-5 h-5 rounded border-neutral-dark bg-neutral-bg text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
            />
            <label htmlFor="waiverAccepted" className="text-sm text-neutral-light">
              I have read and agree to the{' '}
              <a
                href="/waiver"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline"
              >
                Waiver and Release of Liability
              </a>
              . I understand that hockey is a contact sport with inherent risks. *
            </label>
          </div>
          {getFieldError('waiverAccepted') && (
            <p className="text-red-400 text-sm mt-2">{getFieldError('waiverAccepted')}</p>
          )}
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <div className="border-t border-neutral-dark pt-6">
          <motion.button
            type="submit"
            disabled={formik.isSubmitting}
            whileHover={{ scale: formik.isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: formik.isSubmitting ? 1 : 0.98 }}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
              formik.isSubmitting
                ? 'bg-neutral-dark text-neutral-light cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-teal-700 text-white hover:from-teal-600 hover:to-teal-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {formik.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              <span>Continue to Payment • {getFormattedPrice(event)}</span>
            )}
          </motion.button>
          <p className="text-center text-sm text-neutral-light mt-4">
            Secure payment powered by <span className="font-semibold text-white">Stripe</span>
          </p>
        </div>
      </form>
    </Card>
  );
};

export default RegistrationForm;
