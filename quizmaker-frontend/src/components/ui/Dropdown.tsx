import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  placement?: 'bottom' | 'top';
  className?: string;
}

interface DropdownFieldIds {
  control: string;
  label: string;
  helper: string;
  error: string;
  listbox: string;
  optionPrefix: string;
}

interface OptionEntry {
  option: DropdownOption;
  originalIndex: number;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const getControlClasses = ({
  error,
  fullWidth,
  size,
  className,
}: Pick<DropdownProps, 'error' | 'fullWidth' | 'size' | 'className'>) => [
  'block w-full border border-theme-border-primary bg-theme-bg-primary text-theme-text-primary shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary disabled:bg-theme-bg-secondary disabled:text-theme-text-tertiary disabled:cursor-not-allowed rounded-md',
  sizeClasses[size ?? 'md'],
  error
    ? 'border-theme-border-danger focus:ring-theme-interactive-danger focus:border-theme-border-danger'
    : '',
  fullWidth ? 'w-full' : '',
  className ?? '',
].filter(Boolean).join(' ');

const getSelectedValues = (value: DropdownProps['value'], multiple: boolean): string[] => {
  if (multiple) return Array.isArray(value) ? value : [];
  return typeof value === 'string' ? [value] : [];
};

const findEnabledIndex = (
  entries: OptionEntry[],
  startIndex: number,
  direction: 1 | -1,
): number => {
  if (entries.length === 0) return -1;

  for (let offset = 1; offset <= entries.length; offset += 1) {
    const candidate = (startIndex + (offset * direction) + entries.length) % entries.length;
    if (!entries[candidate].option.disabled) return candidate;
  }

  return -1;
};

const findBoundaryEnabledIndex = (entries: OptionEntry[], fromEnd = false): number => {
  const startIndex = fromEnd ? entries.length : -1;
  return findEnabledIndex(entries, startIndex, fromEnd ? -1 : 1);
};

const getInitialActiveIndex = (entries: OptionEntry[], selectedValues: string[]): number => {
  const selectedIndex = entries.findIndex(({ option }) => (
    !option.disabled && selectedValues.includes(option.value)
  ));
  return selectedIndex >= 0 ? selectedIndex : findBoundaryEnabledIndex(entries);
};

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  id,
  name,
  placeholder = 'Select an option',
  label,
  ariaLabel,
  ariaLabelledBy,
  error,
  helperText,
  disabled = false,
  required = false,
  multiple = false,
  searchable = false,
  size = 'md',
  fullWidth = false,
  placement = 'bottom',
  className = '',
}) => {
  const generatedId = useId();
  const idBase = id ?? `dropdown-${generatedId}`;
  const ids: DropdownFieldIds = {
    control: idBase,
    label: `${idBase}-label`,
    helper: `${idBase}-helper`,
    error: `${idBase}-error`,
    listbox: `${idBase}-listbox`,
    optionPrefix: `${idBase}-option`,
  };
  const describedBy = [helperText ? ids.helper : '', error ? ids.error : '']
    .filter(Boolean)
    .join(' ') || undefined;
  const controlClasses = getControlClasses({ error, fullWidth, size, className });

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          id={ids.label}
          htmlFor={ids.control}
          className="block text-sm font-medium text-theme-text-secondary mb-1"
        >
          {label}
        </label>
      )}

      <CustomDropdown
        options={options}
        value={value}
        onChange={onChange}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        multiple={multiple}
        searchable={searchable}
        placement={placement}
        ids={ids}
        label={label}
        ariaLabel={ariaLabel}
        ariaLabelledBy={ariaLabelledBy}
        error={error}
        describedBy={describedBy}
        controlClasses={controlClasses}
      />

      {helperText && (
        <p id={ids.helper} className="mt-1 text-sm text-theme-text-tertiary">
          {helperText}
        </p>
      )}
      {error && (
        <p id={ids.error} className="mt-1 text-sm text-theme-interactive-danger">
          {error}
        </p>
      )}
    </div>
  );
};

interface CustomDropdownProps {
  options: DropdownOption[];
  value: DropdownProps['value'];
  onChange: DropdownProps['onChange'];
  name?: string;
  placeholder: string;
  disabled: boolean;
  required: boolean;
  multiple: boolean;
  searchable: boolean;
  placement: NonNullable<DropdownProps['placement']>;
  ids: DropdownFieldIds;
  label?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  error?: string;
  describedBy?: string;
  controlClasses: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  name,
  placeholder,
  disabled,
  required,
  multiple,
  searchable,
  placement,
  ids,
  label,
  ariaLabel,
  ariaLabelledBy,
  error,
  describedBy,
  controlClasses,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLInputElement | HTMLButtonElement>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedValues = useMemo(() => getSelectedValues(value, multiple), [multiple, value]);
  const filteredEntries = useMemo<OptionEntry[]>(() => (
    options
      .map((option, originalIndex) => ({ option, originalIndex }))
      .filter(({ option }) => (
        !searchable || option.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
      ))
  ), [options, searchable, searchTerm]);

  const getDisplayText = () => {
    if (multiple) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        return options.find((option) => option.value === selectedValues[0])?.label ?? placeholder;
      }
      return `${selectedValues.length} items selected`;
    }

    return options.find((option) => option.value === selectedValues[0])?.label ?? placeholder;
  };

  const closeListbox = () => {
    setIsOpen(false);
    setSearchTerm('');
    setActiveIndex(-1);
  };

  const openListbox = (boundary?: 'first' | 'last') => {
    if (disabled) return;

    setActiveIndex(
      boundary
        ? findBoundaryEnabledIndex(filteredEntries, boundary === 'last')
        : getInitialActiveIndex(filteredEntries, selectedValues),
    );
    setIsOpen(true);
  };

  const selectOption = (entry: OptionEntry | undefined) => {
    if (!entry || entry.option.disabled) return;

    if (multiple) {
      const nextValues = selectedValues.includes(entry.option.value)
        ? selectedValues.filter((selectedValue) => selectedValue !== entry.option.value)
        : [...selectedValues, entry.option.value];
      onChange(nextValues);
      return;
    }

    if (selectedValues[0] !== entry.option.value) onChange(entry.option.value);
    closeListbox();
    controlRef.current?.focus();
  };

  const moveActiveOption = (direction: 1 | -1) => {
    const nextIndex = findEnabledIndex(filteredEntries, activeIndex, direction);
    if (nextIndex >= 0) setActiveIndex(nextIndex);
  };

  const handleTypeahead = (key: string) => {
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
    typeaheadRef.current += key.toLowerCase();

    const findMatch = (term: string) => {
      const startIndex = activeIndex >= 0 ? activeIndex : -1;
      for (let offset = 1; offset <= filteredEntries.length; offset += 1) {
        const candidate = (startIndex + offset) % filteredEntries.length;
        const entry = filteredEntries[candidate];
        if (!entry.option.disabled && entry.option.label.toLowerCase().startsWith(term)) {
          return candidate;
        }
      }
      return -1;
    };

    let matchIndex = findMatch(typeaheadRef.current);
    if (matchIndex < 0 && typeaheadRef.current.length > 1) {
      typeaheadRef.current = key.toLowerCase();
      matchIndex = findMatch(typeaheadRef.current);
    }
    if (matchIndex >= 0) setActiveIndex(matchIndex);

    typeaheadTimerRef.current = setTimeout(() => {
      typeaheadRef.current = '';
      typeaheadTimerRef.current = null;
    }, 500);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>,
  ) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (isOpen) moveActiveOption(1);
        else openListbox('first');
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) moveActiveOption(-1);
        else openListbox('last');
        return;
      case 'Home':
        if (!isOpen) return;
        event.preventDefault();
        setActiveIndex(findBoundaryEnabledIndex(filteredEntries));
        return;
      case 'End':
        if (!isOpen) return;
        event.preventDefault();
        setActiveIndex(findBoundaryEnabledIndex(filteredEntries, true));
        return;
      case 'Enter':
        event.preventDefault();
        if (isOpen) selectOption(filteredEntries[activeIndex]);
        else openListbox();
        return;
      case ' ':
        if (searchable && isOpen) return;
        event.preventDefault();
        if (isOpen) selectOption(filteredEntries[activeIndex]);
        else openListbox();
        return;
      case 'Escape':
        if (!isOpen) return;
        event.preventDefault();
        closeListbox();
        return;
      case 'Tab':
        closeListbox();
        return;
      default:
        break;
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

    if (searchable) {
      if (!isOpen) {
        event.preventDefault();
        setSearchTerm(event.key);
        const matchingEntries = options
          .map((option, originalIndex) => ({ option, originalIndex }))
          .filter(({ option }) => option.label.toLowerCase().includes(event.key.toLowerCase()));
        setActiveIndex(findBoundaryEnabledIndex(matchingEntries));
        setIsOpen(true);
      }
      return;
    }

    event.preventDefault();
    if (!isOpen) setIsOpen(true);
    handleTypeahead(event.key);
  };

  useEffect(() => {
    if (!isOpen) return;

    setActiveIndex((currentIndex) => {
      if (currentIndex >= 0 && !filteredEntries[currentIndex]?.option.disabled) {
        return currentIndex;
      }
      return getInitialActiveIndex(filteredEntries, selectedValues);
    });
  }, [filteredEntries, isOpen, selectedValues]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) closeListbox();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => () => {
    if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
  }, []);

  const activeEntry = filteredEntries[activeIndex];
  const activeDescendant = isOpen && activeEntry
    ? `${ids.optionPrefix}-${activeEntry.originalIndex}`
    : undefined;
  const inputValue = searchable && isOpen ? searchTerm : getDisplayText();
  const accessibleName = label || ariaLabelledBy ? undefined : (ariaLabel ?? placeholder);
  const labelledBy = label ? ids.label : ariaLabelledBy;
  const handleBlur = (event: React.FocusEvent<HTMLInputElement | HTMLButtonElement>) => {
    if (!containerRef.current?.contains(event.relatedTarget as Node | null)) closeListbox();
  };

  return (
    <div ref={containerRef} className="relative">
      {name && (multiple ? (
        selectedValues.map((selectedValue) => (
          <input key={selectedValue} type="hidden" name={name} value={selectedValue} />
        ))
      ) : (
        <input type="hidden" name={name} value={selectedValues[0] ?? ''} />
      ))}
      <div className="relative">
        {searchable ? (
          <input
            ref={(node) => { controlRef.current = node; }}
            id={ids.control}
            type="text"
            role="combobox"
            value={inputValue}
            readOnly={!isOpen}
            disabled={disabled}
            autoComplete="off"
            aria-label={accessibleName}
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            aria-required={required}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={ids.listbox}
            aria-activedescendant={activeDescendant}
            aria-autocomplete="list"
            placeholder={isOpen ? 'Search...' : placeholder}
            className={`${controlClasses} block cursor-pointer pr-10`}
            onClick={() => {
              if (!isOpen) openListbox();
            }}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        ) : (
          <button
            ref={(node) => { controlRef.current = node; }}
            id={ids.control}
            type="button"
            role="combobox"
            disabled={disabled}
            aria-label={accessibleName}
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            aria-required={required}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={ids.listbox}
            aria-activedescendant={activeDescendant}
            className={`${controlClasses} flex cursor-pointer items-center justify-between pr-10 text-left`}
            onClick={() => {
              if (isOpen) closeListbox();
              else openListbox();
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          >
            <span className="truncate">{getDisplayText()}</span>
          </button>
        )}
        <ChevronDownIcon
          aria-hidden="true"
          className={`pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-theme-text-tertiary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div
          id={ids.listbox}
          role="listbox"
          aria-label={label || ariaLabelledBy ? undefined : `${ariaLabel ?? placeholder} options`}
          aria-labelledby={label ? ids.label : ariaLabelledBy}
          aria-multiselectable={multiple || undefined}
          className={`absolute z-50 w-full max-h-60 overflow-auto rounded-md border border-theme-border-primary bg-theme-bg-primary py-1 text-theme-text-primary shadow-theme-lg ${
            placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {filteredEntries.length === 0 ? (
            <div role="status" className="px-4 py-2 text-sm text-theme-text-tertiary">
              No options found
            </div>
          ) : filteredEntries.map((entry, index) => {
            const { option, originalIndex } = entry;
            const isSelected = selectedValues.includes(option.value);
            const isActive = activeIndex === index;

            return (
              <div
                key={`${option.value}-${originalIndex}`}
                id={`${ids.optionPrefix}-${originalIndex}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                className={`w-full px-4 py-2 text-left text-sm ${
                  isActive ? 'bg-theme-bg-secondary' : ''
                } ${
                  isSelected ? 'bg-theme-bg-tertiary text-theme-interactive-primary' : 'text-theme-text-primary'
                } ${
                  option.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer hover:bg-theme-bg-secondary'
                }`}
                onPointerMove={() => {
                  if (!option.disabled) setActiveIndex(index);
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(entry)}
              >
                <div className="flex items-center">
                  {option.icon && (
                    <span aria-hidden="true" className="mr-2">
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <CheckIcon
                      aria-hidden="true"
                      className="ml-auto h-4 w-4 text-theme-interactive-primary"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
