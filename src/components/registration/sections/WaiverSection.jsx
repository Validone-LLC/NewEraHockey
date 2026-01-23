/**
 * Waiver Section Component
 *
 * Waiver agreement checkbox and email opt-in.
 * Used across all event types.
 */

const WaiverSection = ({ formik }) => {
  const getFieldError = fieldName =>
    formik.touched[fieldName] && formik.errors[fieldName] ? formik.errors[fieldName] : null;

  return (
    <div className="border-t border-neutral-dark pt-6">
      {/* Waiver Agreement */}
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

      {/* Email Opt-In */}
      <div className="flex items-center gap-3 mt-4">
        <input
          type="checkbox"
          id="emailOptIn"
          name="emailOptIn"
          checked={formik.values.emailOptIn}
          onChange={formik.handleChange}
          className="w-4 h-4 rounded border-neutral-dark bg-neutral-bg text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
        />
        <label htmlFor="emailOptIn" className="text-sm text-neutral-light">
          Opt in to receive emails for future camps and other events
        </label>
      </div>
    </div>
  );
};

export default WaiverSection;
