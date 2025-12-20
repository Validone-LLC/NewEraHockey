import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChevronDown, HiCheck } from 'react-icons/hi';

/**
 * Custom styled Select component with dark theme
 * Provides better UX than native select with smooth animations
 */
const Select = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Select an option',
  error = false,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef(null);

  // Find the selected option label
  useEffect(() => {
    const selected = options.find(opt => opt.value === value);
    setSelectedLabel(selected ? selected.label : '');
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle option selection
  const handleSelect = option => {
    onChange({
      target: {
        name,
        value: option.value,
        type: 'select',
      },
    });
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = event => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* Hidden native select for form submission */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Custom select button */}
      <button
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
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate pr-2 ${value ? 'text-white' : 'text-neutral-light'}`}>
          {selectedLabel || placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-neutral-light"
        >
          <HiChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Dropdown options */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-neutral-dark border border-neutral-dark rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto"
            role="listbox"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <motion.li
                  key={option.value}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  onClick={() => handleSelect(option)}
                  className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'text-white hover:bg-teal-500/10 hover:text-teal-300'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="text-sm">{option.label}</span>
                  {isSelected && <HiCheck className="w-5 h-5 text-teal-400" />}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Select;
