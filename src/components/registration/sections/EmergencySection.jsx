/**
 * Emergency Section Component
 *
 * Emergency contact information.
 * Fields are required or optional based on form configuration.
 */

import { Phone } from 'lucide-react';
import { formatPhoneNumber } from '@/utils/formatters';

const EmergencySection = ({ formik, config }) => {
  const { emergencyRequired } = config.features;

  const getFieldError = fieldName =>
    formik.touched[fieldName] && formik.errors[fieldName] ? formik.errors[fieldName] : null;

  const handlePhoneChange = e => {
    const formatted = formatPhoneNumber(e.target.value);
    formik.setFieldValue('emergencyPhone', formatted);
  };

  return (
    <div className="border-t border-neutral-dark pt-6">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <Phone className="w-5 h-5 text-teal-500" />
        Emergency Contact{' '}
        {!emergencyRequired && (
          <span className="text-sm text-neutral-light font-normal">(Optional)</span>
        )}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="emergencyName"
            className="block text-sm font-medium text-neutral-light mb-2"
          >
            Full Name {emergencyRequired && '*'}
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

        {/* Phone */}
        <div>
          <label
            htmlFor="emergencyPhone"
            className="block text-sm font-medium text-neutral-light mb-2"
          >
            Phone Number {emergencyRequired && '*'}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-light" />
            <input
              type="tel"
              id="emergencyPhone"
              name="emergencyPhone"
              value={formik.values.emergencyPhone}
              onChange={handlePhoneChange}
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

        {/* Relationship */}
        <div className="md:col-span-2">
          <label
            htmlFor="emergencyRelationship"
            className="block text-sm font-medium text-neutral-light mb-2"
          >
            Relationship to Player {emergencyRequired && '*'}
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
            <p className="text-red-400 text-sm mt-1">{getFieldError('emergencyRelationship')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencySection;
