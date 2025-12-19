import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiUser, HiMail, HiPhone } from 'react-icons/hi';
import Card from '@components/common/Card/Card';
import Select from '@components/common/Select';
import { getFormattedPrice } from '@/services/calendarService';

const RegistrationForm = ({ event }) => {
  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field in real-time
    validateField(name, type === 'checkbox' ? checked : value);
  };

  const handleBlur = e => {
    const { name } = e.target;
    // Mark field as touched on blur
    setTouched(prev => ({ ...prev, [name]: true }));
    // Validate field on blur
    validateField(name, formData[name]);
  };

  const validateField = (fieldName, value) => {
    let error = '';

    switch (fieldName) {
      case 'playerFirstName':
        if (!value.trim()) error = 'Player first name is required';
        break;
      case 'playerLastName':
        if (!value.trim()) error = 'Player last name is required';
        break;
      case 'playerDateOfBirth':
        if (!value) error = 'Date of birth is required';
        break;
      case 'playerLevelOfPlay':
        if (!value.trim()) error = 'Level of play is required';
        break;
      case 'guardianFirstName':
        if (!value.trim()) error = 'Guardian first name is required';
        break;
      case 'guardianLastName':
        if (!value.trim()) error = 'Guardian last name is required';
        break;
      case 'guardianEmail':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format';
        }
        break;
      case 'guardianPhone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else {
          const phoneDigits = value.replace(/[^\d]/g, '');
          if (phoneDigits.length !== 10) {
            error = 'Invalid phone format (e.g., (555) 555-5555)';
          }
        }
        break;
      case 'emergencyName':
        if (!value.trim()) error = 'Emergency contact name is required';
        break;
      case 'emergencyPhone':
        if (!value.trim()) {
          error = 'Emergency contact phone is required';
        } else {
          const phoneDigits = value.replace(/[^\d]/g, '');
          if (phoneDigits.length !== 10) {
            error = 'Invalid phone format (e.g., (555) 555-5555)';
          }
        }
        break;
      case 'emergencyRelationship':
        if (!value.trim()) error = 'Emergency contact relationship is required';
        break;
      case 'waiverAccepted':
        if (!value) error = 'You must accept the waiver to continue';
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Player validation
    if (!formData.playerFirstName.trim()) {
      newErrors.playerFirstName = 'Player first name is required';
    }
    if (!formData.playerLastName.trim()) {
      newErrors.playerLastName = 'Player last name is required';
    }
    if (!formData.playerDateOfBirth) {
      newErrors.playerDateOfBirth = 'Date of birth is required';
    }
    if (!formData.playerLevelOfPlay.trim()) {
      newErrors.playerLevelOfPlay = 'Level of play is required';
    }

    // Guardian validation
    if (!formData.guardianFirstName.trim()) {
      newErrors.guardianFirstName = 'Guardian first name is required';
    }
    if (!formData.guardianLastName.trim()) {
      newErrors.guardianLastName = 'Guardian last name is required';
    }
    if (!formData.guardianEmail.trim()) {
      newErrors.guardianEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)) {
      newErrors.guardianEmail = 'Invalid email format';
    }
    if (!formData.guardianPhone.trim()) {
      newErrors.guardianPhone = 'Phone number is required';
    } else {
      const phoneDigits = formData.guardianPhone.replace(/[^\d]/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.guardianPhone = 'Invalid phone format (e.g., (555) 555-5555)';
      }
    }

    // Emergency contact validation
    if (!formData.emergencyName.trim()) {
      newErrors.emergencyName = 'Emergency contact name is required';
    }
    if (!formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency contact phone is required';
    } else {
      const phoneDigits = formData.emergencyPhone.replace(/[^\d]/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.emergencyPhone = 'Invalid phone format (e.g., (555) 555-5555)';
      }
    }
    if (!formData.emergencyRelationship.trim()) {
      newErrors.emergencyRelationship = 'Emergency contact relationship is required';
    }

    // Waiver validation
    if (!formData.waiverAccepted) {
      newErrors.waiverAccepted = 'You must accept the waiver to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Mark all fields as touched on submit
    setTouched({
      playerFirstName: true,
      playerLastName: true,
      playerDateOfBirth: true,
      playerLevelOfPlay: true,
      guardianFirstName: true,
      guardianLastName: true,
      guardianEmail: true,
      guardianPhone: true,
      emergencyName: true,
      emergencyPhone: true,
      emergencyRelationship: true,
      waiverAccepted: true,
    });

    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('.text-red-400');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);

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
          formData,
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
      setErrors({ submit: error.message || 'Failed to process registration. Please try again.' });
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Player Information */}
        <div>
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <HiUser className="text-teal-500" />
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
                value={formData.playerFirstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.playerFirstName && errors.playerFirstName
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="John"
              />
              {touched.playerFirstName && errors.playerFirstName && (
                <p className="text-red-400 text-sm mt-1">{errors.playerFirstName}</p>
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
                value={formData.playerLastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.playerLastName && errors.playerLastName
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Doe"
              />
              {touched.playerLastName && errors.playerLastName && (
                <p className="text-red-400 text-sm mt-1">{errors.playerLastName}</p>
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
                value={formData.playerDateOfBirth}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.playerDateOfBirth && errors.playerDateOfBirth
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
              />
              {touched.playerDateOfBirth && errors.playerDateOfBirth && (
                <p className="text-red-400 text-sm mt-1">{errors.playerDateOfBirth}</p>
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
                value={formData.playerLevelOfPlay}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.playerLevelOfPlay && errors.playerLevelOfPlay}
                placeholder="Select level of play"
                options={[
                  { value: 'Mini Mite/U6: Ages 5-6', label: 'Mini Mite/U6: Ages 5-6' },
                  { value: 'Mite/U8: Ages 7-8', label: 'Mite/U8: Ages 7-8' },
                  { value: 'Squirt/U10: Ages 9-10', label: 'Squirt/U10: Ages 9-10' },
                  { value: 'PeeWee/U12: Ages 11-12', label: 'PeeWee/U12: Ages 11-12' },
                  { value: 'Bantam/U14: Ages 13-14', label: 'Bantam/U14: Ages 13-14' },
                  {
                    value: 'Midget U16 (Minor Midget): Ages 15-16',
                    label: 'Midget U16 (Minor Midget): Ages 15-16',
                  },
                  {
                    value: 'Midget U18 (Major Midget): Ages 15-18',
                    label: 'Midget U18 (Major Midget): Ages 15-18',
                  },
                ]}
              />
              {touched.playerLevelOfPlay && errors.playerLevelOfPlay && (
                <p className="text-red-400 text-sm mt-1">{errors.playerLevelOfPlay}</p>
              )}
            </div>
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div className="border-t border-neutral-dark pt-6">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <HiUser className="text-teal-500" />
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
                value={formData.guardianFirstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.guardianFirstName && errors.guardianFirstName
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Jane"
              />
              {touched.guardianFirstName && errors.guardianFirstName && (
                <p className="text-red-400 text-sm mt-1">{errors.guardianFirstName}</p>
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
                value={formData.guardianLastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.guardianLastName && errors.guardianLastName
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Doe"
              />
              {touched.guardianLastName && errors.guardianLastName && (
                <p className="text-red-400 text-sm mt-1">{errors.guardianLastName}</p>
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
                <HiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
                <input
                  type="email"
                  id="guardianEmail"
                  name="guardianEmail"
                  value={formData.guardianEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    touched.guardianEmail && errors.guardianEmail
                      ? 'border-red-500'
                      : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="jane@example.com"
                />
              </div>
              {touched.guardianEmail && errors.guardianEmail && (
                <p className="text-red-400 text-sm mt-1">{errors.guardianEmail}</p>
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
                <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
                <input
                  type="tel"
                  id="guardianPhone"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={e => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData(prev => ({ ...prev, guardianPhone: formatted }));
                    setTouched(prev => ({ ...prev, guardianPhone: true }));
                    validateField('guardianPhone', formatted);
                  }}
                  onBlur={e => {
                    setTouched(prev => ({ ...prev, guardianPhone: true }));
                    validateField('guardianPhone', e.target.value);
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    touched.guardianPhone && errors.guardianPhone
                      ? 'border-red-500'
                      : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="(555) 555-5555"
                />
              </div>
              {touched.guardianPhone && errors.guardianPhone && (
                <p className="text-red-400 text-sm mt-1">{errors.guardianPhone}</p>
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
                value={formData.guardianRelationship}
                onChange={handleChange}
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
            <HiPhone className="text-teal-500" />
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
                value={formData.emergencyName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.emergencyName && errors.emergencyName
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Emergency Contact Name"
              />
              {touched.emergencyName && errors.emergencyName && (
                <p className="text-red-400 text-sm mt-1">{errors.emergencyName}</p>
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
                <HiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={e => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData(prev => ({ ...prev, emergencyPhone: formatted }));
                    setTouched(prev => ({ ...prev, emergencyPhone: true }));
                    validateField('emergencyPhone', formatted);
                  }}
                  onBlur={e => {
                    setTouched(prev => ({ ...prev, emergencyPhone: true }));
                    validateField('emergencyPhone', e.target.value);
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    touched.emergencyPhone && errors.emergencyPhone
                      ? 'border-red-500'
                      : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="(555) 555-5555"
                />
              </div>
              {touched.emergencyPhone && errors.emergencyPhone && (
                <p className="text-red-400 text-sm mt-1">{errors.emergencyPhone}</p>
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
                value={formData.emergencyRelationship}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  touched.emergencyRelationship && errors.emergencyRelationship
                    ? 'border-red-500'
                    : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="e.g., Aunt, Uncle, Family Friend"
              />
              {touched.emergencyRelationship && errors.emergencyRelationship && (
                <p className="text-red-400 text-sm mt-1">{errors.emergencyRelationship}</p>
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
            value={formData.medicalNotes}
            onChange={handleChange}
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
              checked={formData.waiverAccepted}
              onChange={handleChange}
              onBlur={handleBlur}
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
          {touched.waiverAccepted && errors.waiverAccepted && (
            <p className="text-red-400 text-sm mt-2">{errors.waiverAccepted}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <div className="border-t border-neutral-dark pt-6">
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
              submitting
                ? 'bg-neutral-dark text-neutral-light cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-teal-700 text-white hover:from-teal-600 hover:to-teal-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {submitting ? (
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
