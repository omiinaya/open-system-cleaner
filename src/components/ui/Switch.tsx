import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
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
        trackWidth: 'w-8',
        trackHeight: 'h-4',
        thumbSize: 'w-3 h-3',
        thumbTranslate: 'translate-x-4',
        thumbPosition: 'top-0.5 left-0.5',
      },
      md: {
        trackWidth: 'w-11',
        trackHeight: 'h-6',
        thumbSize: 'w-5 h-5',
        thumbTranslate: 'translate-x-5',
        thumbPosition: 'top-0.5 left-0.5',
      },
      lg: {
        trackWidth: 'w-14',
        trackHeight: 'h-8',
        thumbSize: 'w-6 h-6',
        thumbTranslate: 'translate-x-6',
        thumbPosition: 'top-1 left-1',
      },
    };

    const config = sizeConfig[size];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="peer sr-only"
          />
          <label
            htmlFor={switchId}
            className={cn(
              config.trackWidth,
              config.trackHeight,
              'rounded-full cursor-pointer transition-colors duration-200 ease-in-out',
              'bg-gray-300 dark:bg-gray-600',
              'peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500',
              'peer-hover:bg-gray-400 dark:peer-hover:bg-gray-500',
              'peer-checked:peer-hover:bg-blue-700 dark:peer-checked:peer-hover:bg-blue-600',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2',
              'dark:peer-focus-visible:ring-offset-gray-900'
            )}
          />
          <span
            className={cn(
              config.thumbSize,
              'absolute',
              config.thumbPosition,
              'bg-white rounded-full shadow-md',
              'transition-transform duration-200 ease-in-out',
              'translate-x-0',
              'peer-checked:' + config.thumbTranslate,
              'pointer-events-none',
              'peer-disabled:opacity-50'
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
