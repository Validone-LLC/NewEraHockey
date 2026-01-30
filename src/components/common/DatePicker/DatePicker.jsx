import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isSameDay,
  isSameMonth,
  isAfter,
  isBefore,
  parse,
  isValid,
} from 'date-fns';

/**
 * Custom styled DatePicker component with dark theme
 * Provides better UX than native date input with smooth animations
 * Optimized for selecting birth dates (year navigation)
 */
const DatePicker = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = 'Select date',
  error = false,
  className = '',
  disabled = false,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parsed = parse(value, 'yyyy-MM-dd', new Date());
      return isValid(parsed) ? parsed : new Date();
    }
    // Default to 10 years ago for birth date selection
    return subYears(new Date(), 10);
  });
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const pickerRef = useRef(null);
  const inputRef = useRef(null);

  // Parse the value to a Date object
  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Update viewDate when value changes
  useEffect(() => {
    if (value) {
      const parsed = parse(value, 'yyyy-MM-dd', new Date());
      if (isValid(parsed)) {
        setViewDate(parsed);
      }
    }
  }, [value]);

  // Handle date selection
  const handleDateSelect = useCallback(
    date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onChange({
        target: {
          name,
          value: formattedDate,
          type: 'date',
        },
      });
      setIsOpen(false);
      setShowYearPicker(false);
      setShowMonthPicker(false);
    },
    [name, onChange]
  );

  // Handle year selection
  const handleYearSelect = year => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setShowYearPicker(false);
  };

  // Handle month selection
  const handleMonthSelect = month => {
    const newDate = new Date(viewDate);
    newDate.setMonth(month);
    setViewDate(newDate);
    setShowMonthPicker(false);
  };

  // Check if date is selectable
  const isDateDisabled = date => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  // Generate year options (100 years range)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 100; year--) {
      years.push(year);
    }
    return years;
  };

  // Month names
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Weekday names
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Format display value
  const displayValue =
    selectedDate && isValid(selectedDate) ? format(selectedDate, 'MM/dd/yyyy') : '';

  // Handle keyboard navigation
  const handleKeyDown = event => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setShowYearPicker(false);
        setShowMonthPicker(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {/* Hidden native input for form submission */}
      <input type="hidden" id={id} name={name} value={value || ''} />

      {/* Custom input button */}
      <button
        ref={inputRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full px-4 py-2 bg-neutral-bg border ${
          error ? 'border-red-500' : 'border-neutral-dark'
        } rounded-lg text-left focus:outline-none focus:border-teal-500 transition-colors flex items-center justify-between min-h-[42px] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-teal-500/50'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={`truncate pr-2 ${value ? 'text-white' : 'text-neutral-light'}`}>
          {displayValue || placeholder}
        </span>
        <Calendar className="w-5 h-5 text-neutral-light flex-shrink-0" />
      </button>

      {/* Calendar dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 bg-neutral-dark border border-neutral-dark rounded-xl shadow-2xl overflow-hidden w-[300px]"
            role="dialog"
            aria-label="Choose date"
          >
            {/* Header with month/year navigation */}
            <div className="bg-primary p-3 border-b border-neutral-dark">
              <div className="flex items-center justify-between">
                {/* Previous month button */}
                <button
                  type="button"
                  onClick={() => setViewDate(subMonths(viewDate, 1))}
                  className="p-2 rounded-lg hover:bg-teal-500/20 text-neutral-light hover:text-teal-400 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Month/Year selectors */}
                <div className="flex items-center gap-1">
                  {/* Month selector */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMonthPicker(!showMonthPicker);
                      setShowYearPicker(false);
                    }}
                    className="px-3 py-1.5 rounded-lg hover:bg-teal-500/20 text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    {format(viewDate, 'MMMM')}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Year selector */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowYearPicker(!showYearPicker);
                      setShowMonthPicker(false);
                    }}
                    className="px-3 py-1.5 rounded-lg hover:bg-teal-500/20 text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    {format(viewDate, 'yyyy')}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showYearPicker ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {/* Next month button */}
                <button
                  type="button"
                  onClick={() => setViewDate(addMonths(viewDate, 1))}
                  className="p-2 rounded-lg hover:bg-teal-500/20 text-neutral-light hover:text-teal-400 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Quick year navigation for birth dates */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setViewDate(subYears(viewDate, 10))}
                  className="px-2 py-1 text-xs rounded bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                >
                  -10 yrs
                </button>
                <button
                  type="button"
                  onClick={() => setViewDate(subYears(viewDate, 1))}
                  className="px-2 py-1 text-xs rounded bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                >
                  -1 yr
                </button>
                <button
                  type="button"
                  onClick={() => setViewDate(addYears(viewDate, 1))}
                  className="px-2 py-1 text-xs rounded bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                >
                  +1 yr
                </button>
                <button
                  type="button"
                  onClick={() => setViewDate(addYears(viewDate, 10))}
                  className="px-2 py-1 text-xs rounded bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
                >
                  +10 yrs
                </button>
              </div>
            </div>

            {/* Month picker overlay */}
            <AnimatePresence>
              {showMonthPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-[100px] bottom-0 bg-[#1a2332] z-20 p-4 border-t border-teal-500/30"
                  style={{ backgroundColor: '#1a2332' }}
                >
                  <h4 className="text-sm font-semibold text-teal-400 mb-3 text-center">
                    Select Month
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => handleMonthSelect(index)}
                        className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                          viewDate.getMonth() === index
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                            : 'text-neutral-light hover:bg-teal-500/20 hover:text-white bg-neutral-dark/50'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Year picker overlay */}
            <AnimatePresence>
              {showYearPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-[100px] bottom-0 bg-[#1a2332] z-20 p-4 overflow-y-auto border-t border-teal-500/30"
                  style={{ backgroundColor: '#1a2332' }}
                >
                  <h4 className="text-sm font-semibold text-teal-400 mb-3 text-center sticky top-0 bg-[#1a2332] py-1">
                    Select Year
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {generateYears().map(year => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => handleYearSelect(year)}
                        className={`py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
                          viewDate.getFullYear() === year
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                            : 'text-neutral-light hover:bg-teal-500/20 hover:text-white bg-neutral-dark/50'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Calendar grid */}
            <div className="p-3">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map(day => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-neutral-light py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) => {
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, viewDate);
                  const isDisabled = isDateDisabled(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() => !isDisabled && handleDateSelect(day)}
                      disabled={isDisabled}
                      whileHover={!isDisabled ? { scale: 1.1 } : {}}
                      whileTap={!isDisabled ? { scale: 0.95 } : {}}
                      className={`
                        w-9 h-9 rounded-lg text-sm font-medium transition-colors relative
                        ${isSelected ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : ''}
                        ${!isSelected && isToday ? 'ring-2 ring-teal-500/50' : ''}
                        ${!isSelected && isCurrentMonth && !isDisabled ? 'text-white hover:bg-teal-500/20' : ''}
                        ${!isCurrentMonth ? 'text-neutral-light/40' : ''}
                        ${isDisabled ? 'text-neutral-light/20 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {format(day, 'd')}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer with today button */}
            <div className="p-3 border-t border-neutral-dark/50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setViewDate(new Date());
                }}
                className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                Go to Today
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      target: {
                        name,
                        value: '',
                        type: 'date',
                      },
                    });
                    setIsOpen(false);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatePicker;
