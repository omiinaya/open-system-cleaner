import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      size = 'md',
      label,
      description,
      checked,
      defaultChecked,
      onCheckedChange,
      className,
      disabled,
      onChange,
      id,
      ...props
    },
    ref
  ) => {
    const switchId = id || React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    const sizeClasses = {
      sm: {
        track: 'w-8 h-4',
        thumb: 'w-3 h-3',
        translate: 'translate-x-4',
      },
      md: {
        track: 'w-11 h-6',
        thumb: 'w-5 h-5',
        translate: 'translate-x-5',
      },
      lg: {
        track: 'w-14 h-7',
        thumb: 'w-6 h-6',
        translate: 'translate-x-7',
      },
    };

    const { track, thumb, translate } = sizeClasses[size];

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={switchId}
            className={cn(
              track,
              'rounded-full cursor-pointer transition-colors duration-200 ease-in-out',
              'bg-bg-tertiary border border-border',
              'peer-checked:bg-primary-500 peer-checked:border-primary-500',
              'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'dark:focus:ring-offset-bg-primary'
            )}
          >
            <span
              className={cn(
                thumb,
                'absolute top-0.5 left-0.5',
                'bg-white rounded-full shadow-sm',
                'transition-transform duration-200 ease-in-out',
                'peer-checked:' + translate
              )}
              style={{
                marginTop: size === 'sm' ? '2px' : size === 'md' ? '2px' : '2px',
                marginLeft: '2px',
              }}
            />
          </label>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  'text-sm font-medium text-text-primary cursor-pointer',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-text-secondary mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
