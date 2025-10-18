import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiUser, HiMail, HiPhone } from 'react-icons/hi';
import Card from '@components/common/Card/Card';
import { getFormattedPrice } from '@/services/calendarService';

const RegistrationForm = ({ event }) => {
  const [formData, setFormData] = useState({
    // Player Information
    playerFirstName: '',
    playerLastName: '',
    playerDateOfBirth: '',
    playerAge: '',

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
  const [submitting, setSubmitting] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
    } else if (!/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/.test(formData.guardianPhone)) {
      newErrors.guardianPhone = 'Invalid phone format (e.g., 555-123-4567)';
    }

    // Emergency contact validation
    if (!formData.emergencyName.trim()) {
      newErrors.emergencyName = 'Emergency contact name is required';
    }
    if (!formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency contact phone is required';
    } else if (!/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/.test(formData.emergencyPhone)) {
      newErrors.emergencyPhone = 'Invalid phone format (e.g., 555-123-4567)';
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
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  errors.playerFirstName ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="John"
              />
              {errors.playerFirstName && (
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
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  errors.playerLastName ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Doe"
              />
              {errors.playerLastName && (
                <p className="text-red-400 text-sm mt-1">{errors.playerLastName}</p>
              )}
            </div>

            <div className="md:col-span-2">
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
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  errors.playerDateOfBirth ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
              />
              {errors.playerDateOfBirth && (
                <p className="text-red-400 text-sm mt-1">{errors.playerDateOfBirth}</p>
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
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  errors.guardianFirstName ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Jane"
              />
              {errors.guardianFirstName && (
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
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  errors.guardianLastName ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Doe"
              />
              {errors.guardianLastName && (
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
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    errors.guardianEmail ? 'border-red-500' : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="jane@example.com"
                />
              </div>
              {errors.guardianEmail && (
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
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 bg-neutral-bg border ${
                    errors.guardianPhone ? 'border-red-500' : 'border-neutral-dark'
                  } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                  placeholder="555-123-4567"
                />
              </div>
              {errors.guardianPhone && (
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
              <select
                id="guardianRelationship"
                name="guardianRelationship"
                value={formData.guardianRelationship}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-neutral-bg border border-neutral-dark rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="Parent">Parent</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </select>
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
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  errors.emergencyName ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="Emergency Contact Name"
              />
              {errors.emergencyName && (
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
              <input
                type="tel"
                id="emergencyPhone"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  errors.emergencyPhone ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="555-123-4567"
              />
              {errors.emergencyPhone && (
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
                className={`w-full px-4 py-2 bg-neutral-bg border ${
                  errors.emergencyRelationship ? 'border-red-500' : 'border-neutral-dark'
                } rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors`}
                placeholder="e.g., Aunt, Uncle, Family Friend"
              />
              {errors.emergencyRelationship && (
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
          {errors.waiverAccepted && (
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
