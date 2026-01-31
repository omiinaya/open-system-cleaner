import React from 'react';
import { cn } from '../../utils/cn';
import { LucideIcon } from 'lucide-react';
import Button from '../ui/Button';

export interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  title,
  description,
  buttonText,
  onAction,
  variant = 'primary',
  loading = false,
  disabled = false,
  className,
}) => {
  const variantClasses = {
    primary: {
      icon: 'bg-primary-500/10 text-primary-500',
      button: 'primary' as const,
      glow: 'group-hover:shadow-primary-500/20',
    },
    success: {
      icon: 'bg-success-500/10 text-success-500',
      button: 'success' as const,
      glow: 'group-hover:shadow-success-500/20',
    },
    warning: {
      icon: 'bg-warning-500/10 text-warning-500',
      button: 'warning' as const,
      glow: 'group-hover:shadow-warning-500/20',
    },
    danger: {
      icon: 'bg-danger-500/10 text-danger-500',
      button: 'danger' as const,
      glow: 'group-hover:shadow-danger-500/20',
    },
    info: {
      icon: 'bg-blue-500/10 text-blue-500',
      button: 'primary' as const,
      glow: 'group-hover:shadow-blue-500/20',
    },
  };
  
  const styles = variantClasses[variant];
  
  return (
    <div
      className={cn(
        'group relative bg-bg-secondary border border-border rounded-lg p-5',
        'transition-all duration-300 ease-out',
        'hover:border-border-hover hover:shadow-theme hover:-translate-y-0.5',
        !disabled && styles.glow,
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      {/* Glow effect on hover */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100',
          'transition-opacity duration-300 pointer-events-none',
          variant === 'primary' && 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
          variant === 'success' && 'shadow-[0_0_30px_rgba(34,197,94,0.15)]',
          variant === 'warning' && 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
          variant === 'danger' && 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
          variant === 'info' && 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
        )}
      />
      
      <div className="relative">
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
            'transition-transform duration-300 group-hover:scale-110',
            styles.icon
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        
        {/* Content */}
        <h3 className="text-base font-semibold text-text-primary mb-1">
          {title}
        </h3>
        <p className="text-sm text-text-secondary mb-4 line-clamp-2">
          {description}
        </p>
        
        {/* Action Button */}
        <Button
          variant={styles.button}
          size="sm"
          fullWidth
          onClick={onAction}
          loading={loading}
          disabled={disabled}
          leftIcon={<Icon className="w-4 h-4" />}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default QuickActionCard;
