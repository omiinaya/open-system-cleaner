import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  id?: string;
  className?: string;
  label?: string;
  description?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      checked,
      onChange,
      onCheckedChange,
      size = 'md',
      disabled = false,
      id,
      className,
      label,
      description,
    },
    ref
  ) => {
    const switchId = id || React.useId();

    const sizeConfig = {
      sm: {
        track: 'w-10 h-6',
        thumb: 'w-4 h-4',
        translateX: 'translate-x-4',
        padding: 4,
      },
      md: {
        track: 'w-12 h-7',
        thumb: 'w-5 h-5',
        translateX: 'translate-x-5',
        padding: 4,
      },
      lg: {
        track: 'w-16 h-9',
        thumb: 'w-7 h-7',
        translateX: 'translate-x-7',
        padding: 4,
      },
    };

    const config = sizeConfig[size];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      onChange?.(isChecked);
      onCheckedChange?.(isChecked);
    };

  const getTranslateClass = () => {
    switch (size) {
      case 'sm':
        return 'peer-checked:translate-x-5';
      case 'lg':
        return 'peer-checked:translate-x-8';
      default:
        return 'peer-checked:translate-x-6';
    }
  };

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="relative inline-flex shrink-0">
        <input
          ref={ref}
          type="checkbox"
          id={switchId}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="peer sr-only"
          aria-checked={checked}
          role="switch"
        />
        <label
          htmlFor={switchId}
          className={cn(
            config.track,
            'relative flex items-center shrink-0 cursor-pointer rounded-full',
            'transition-colors duration-200 ease-in-out',
            'bg-gray-300 dark:bg-gray-600',
            'peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500',
            'hover:bg-gray-400 dark:hover:bg-gray-500',
            'peer-checked:hover:bg-blue-700 dark:peer-checked:hover:bg-blue-600',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
            'dark:focus-within:ring-offset-gray-900'
          )}
        />
        <span
          className={cn(
            config.thumb,
            'absolute top-1 left-1 pointer-events-none rounded-full bg-white shadow-lg',
            'transition-transform duration-200 ease-in-out',
            getTranslateClass()
          )}
        />
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
  }
);

Switch.displayName = 'Switch';

export default Switch;
