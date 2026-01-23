/**
 * Medical Notes Section Component
 *
 * Optional medical notes/allergies textarea.
 * Used across all event types.
 */

const MedicalNotesSection = ({ formik }) => {
  return (
    <div className="border-t border-neutral-dark pt-6">
      <label htmlFor="medicalNotes" className="block text-sm font-medium text-neutral-light mb-2">
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
  );
};

export default MedicalNotesSection;
