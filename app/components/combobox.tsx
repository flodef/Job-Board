'use client';

import { clsx } from 'clsx/lite';
import { useEffect, useRef, useState } from 'react';
import { IconChevronDown, IconSearch } from '@tabler/icons-react';

type ComboboxProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  borderColor?: string;
};

export default function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder = 'Sélectionner une option',
  className = '',
  error = false,
  disabled = false,
  borderColor,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0) {
          const selectedOption = filteredOptions[highlightedIndex];
          onChange(selectedOption);
          setSearchTerm('');
          setIsOpen(false);
        } else if (filteredOptions.length > 0) {
          // Select the first option if none is highlighted
          onChange(filteredOptions[0]);
          setSearchTerm('');
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, filteredOptions, onChange]);

  // Scroll to highlighted option
  useEffect(() => {
    if (highlightedIndex < 0 || !optionsRef.current) return;

    const highlightedOption = optionsRef.current.children[highlightedIndex] as HTMLElement;
    if (highlightedOption) {
      highlightedOption.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
    setIsFocused(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
      // Select the first option when opening the dropdown
      if (filteredOptions.length > 0) {
        setHighlightedIndex(0);
      }
    }
  };

  return (
    <div className={clsx('relative w-full', className)} ref={comboboxRef}>
      <div
        className={clsx(
          'w-full p-2 border-2 rounded-lg bg-background text-foreground flex items-center',
          'focus-within:outline-none',
          error && 'border-red-500',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        style={isFocused && borderColor ? { borderColor } : { borderColor: 'rgba(0, 0, 0, 0.1)' }}
      >
        <IconSearch size={18} className="text-foreground/50 mr-2" />
        <input
          id={id}
          ref={inputRef}
          type="text"
          className={clsx('flex-grow bg-transparent outline-none', value ? 'text-foreground' : 'text-foreground/50')}
          placeholder={value || placeholder}
          value={isOpen ? searchTerm : value}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
            // Select the first option when focusing
            if (filteredOptions.length > 0) {
              setHighlightedIndex(0);
            }
          }}
          autoComplete="off"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="focus:outline-none"
          tabIndex={-1}
        >
          <IconChevronDown
            size={18}
            className={clsx('transition-transform duration-200', isOpen && 'transform rotate-180')}
          />
        </button>
      </div>

      {isOpen && !disabled && (
        <div
          ref={optionsRef}
          className="absolute z-50 w-full mt-1 bg-background border border-foreground/20 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-foreground/50 text-center">Aucun résultat</div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option}
                className={clsx(
                  'p-2 cursor-pointer hover:bg-primary/10',
                  highlightedIndex === index && 'bg-primary/10',
                  option === value && 'font-medium text-primary bg-primary/10',
                )}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
