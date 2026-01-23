/**
 * Guardian Section Component
 *
 * Parent/Guardian information fields with validation.
 * Used across all event types.
 */

import { User, Mail, Phone } from 'lucide-react';
import Select from '@components/common/Select';
import { GUARDIAN_RELATIONSHIP_OPTIONS } from '@/config/constants';
import { formatPhoneNumber } from '@/utils/formatters';

const GuardianSection = ({ formik }) => {
  const getFieldError = fieldName =>
    formik.touched[fieldName] && formik.errors[fieldName] ? formik.errors[fieldName] : null;

  const handlePhoneChange = e => {
    const formatted = formatPhoneNumber(e.target.value);
    formik.setFieldValue('guardianPhone', formatted);
  };

  return (
    <div className="border-t border-neutral-dark pt-6">
      <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
        <User className="w-5 h-5 text-teal-500" />
        Parent/Guardian Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
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

        {/* Last Name */}
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

        {/* Email */}
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

        {/* Phone */}
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
              onChange={handlePhoneChange}
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

        {/* Relationship */}
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
            options={GUARDIAN_RELATIONSHIP_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
};

export default GuardianSection;
