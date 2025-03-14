'use client';

import { clsx } from 'clsx/lite';
import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';

type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  id: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  className?: string;
  error?: boolean;
  disabled?: boolean;
  borderColor?: string;
  allOption?: boolean; // Whether to include an "All" option
};

export default function MultiSelect({
  id,
  values,
  onChange,
  options,
  className = '',
  error = false,
  disabled = false,
  borderColor,
  allOption = true,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Add "All" option if enabled and ensure options are properly processed
  const processedOptions = options || [];
  
  const allOptions = allOption
    ? [{ value: 'all', label: 'Tous' }, ...processedOptions]
    : processedOptions;

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOption = (optionValue: string) => {
    if (optionValue === 'all') {
      // If "All" is selected, clear all other selections
      onChange([]);
    } else {
      // If any specific option is selected, remove "All" from the selection
      let newValues = [...values];
      
      if (newValues.includes(optionValue)) {
        // Remove the option if it's already selected
        newValues = newValues.filter(v => v !== optionValue);
      } else {
        // Add the option if it's not selected
        newValues.push(optionValue);
      }
      
      onChange(newValues);
    }
  };

  // Determine the display value based on the selected values
  const displayValue = () => {
    if (values.length === 0) {
      return 'Tous'; // Default to "All" if nothing selected
    }
    
    if (values.length === 1) {
      const option = processedOptions.find(opt => opt.value === values[0]);
      return option ? option.label : values[0];
    }
    
    return `${values.length} sélectionnés`;
  };

  return (
    <div className={clsx('relative w-full', className)} ref={selectRef}>
      <div
        id={id}
        className={clsx(
          'w-full p-2 border-2 rounded-lg bg-background text-foreground flex justify-between items-center cursor-pointer',
          'focus-visible:outline-none',
          error && 'border-red-500',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Remove focus when the component loses focus
          setIsFocused(false);
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-options`}
        style={(isFocused || isOpen) && borderColor 
          ? { borderColor } 
          : { borderColor: 'rgba(0, 0, 0, 0.1)' }}
      >
        <span className={clsx(values.length === 0 && 'text-foreground/50')}>{displayValue()}</span>
        <IconChevronDown
          size={18}
          className={clsx('transition-transform duration-200', isOpen && 'transform rotate-180')}
        />
      </div>

      {isOpen && !disabled && (
        <div
          id={`${id}-options`}
          className="absolute z-50 w-full mt-1 bg-background border border-foreground/20 rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
          aria-multiselectable="true"
        >
          {/* Log options for debugging */}
          {allOptions.length === 0 ? (
            <div className="p-2 text-foreground/50 text-center">Aucune option disponible</div>
          ) : (
            allOptions.map((option) => {
              const isSelected = option.value === 'all' 
                ? values.length === 0 
                : values.includes(option.value);
  
              return (
                <div
                  key={option.value}
                  className={clsx(
                    'p-2 cursor-pointer hover:bg-primary/10 flex items-center justify-between',
                    isSelected && 'bg-primary/10'
                  )}
                  onClick={() => toggleOption(option.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className={clsx(isSelected && 'font-medium text-primary')}>
                    {option.label}
                  </span>
                  {isSelected && (
                    <IconCheck size={18} className="text-primary" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
