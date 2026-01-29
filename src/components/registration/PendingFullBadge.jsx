import { Clock } from 'lucide-react';

const PendingFullBadge = ({ large = false }) => {
  if (large) {
    return (
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold text-lg rounded-lg shadow-lg">
        <Clock className="w-6 h-6" />
        <span>CHECK BACK SOON</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-md">
      <Clock className="w-4 h-4" />
      <span>CHECK BACK</span>
    </div>
  );
};

export default PendingFullBadge;
