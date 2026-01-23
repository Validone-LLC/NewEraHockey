/**
 * Unified Registration Form Component
 *
 * Config-driven registration form that adapts to different event types.
 * Replaces AtHomeTrainingForm and RegistrationForm with a single component.
 */

import { motion } from 'framer-motion';
import Card from '@components/common/Card/Card';
import useRegistrationForm from './hooks/useRegistrationForm';
import {
  PlayerSection,
  GuardianSection,
  AddressSection,
  EmergencySection,
  MedicalNotesSection,
  WaiverSection,
} from './sections';

const UnifiedRegistrationForm = ({ event }) => {
  const { formik, config, submitError, formattedTotalPrice, playerCount } =
    useRegistrationForm(event);

  return (
    <Card>
      <form onSubmit={formik.handleSubmit} className="space-y-8">
        {/* Player Information */}
        <PlayerSection formik={formik} config={config} />

        {/* Parent/Guardian Information */}
        <GuardianSection formik={formik} />

        {/* Address Information (conditional) */}
        {config.features.showAddress && <AddressSection formik={formik} config={config} />}

        {/* Emergency Contact */}
        <EmergencySection formik={formik} config={config} />

        {/* Medical Notes */}
        <MedicalNotesSection formik={formik} />

        {/* Waiver Agreement */}
        <WaiverSection formik={formik} />

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
              <span>
                Continue to Payment • {formattedTotalPrice}
                {config.features.multiPlayer && playerCount > 1 && (
                  <span className="text-sm opacity-80"> ({playerCount} players)</span>
                )}
              </span>
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

export default UnifiedRegistrationForm;
