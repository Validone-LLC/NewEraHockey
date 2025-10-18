import { HiExclamation } from 'react-icons/hi';

const SoldOutBadge = ({ large = false }) => {
  if (large) {
    return (
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold text-lg rounded-lg shadow-lg">
        <HiExclamation className="w-6 h-6" />
        <span>SOLD OUT</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold text-sm rounded-md">
      <HiExclamation className="w-4 h-4" />
      <span>SOLD OUT</span>
    </div>
  );
};

export default SoldOutBadge;
